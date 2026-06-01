// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title MultiSigCondition
/// @notice N-of-M EIP-712 multi-sig read condition. Signers approve off-chain; the buyer collects
///         threshold-many signatures and submits them as `accessAuxData` when reading. No on-chain
///         storage of approvals means no `approve()` tx per signer, lower friction for the buyer.
///         An epoch counter invalidates all in-flight sigs on signer rotation.
/// @dev    First-of-kind in the CDR ecosystem (verified 2026-06-01 — no Story-deployed multi-sig
///         condition exists). Replay protection: the signed payload binds `(uuid, caller, epoch,
///         deadline)` so a sig for vault A can't be reused against vault B, and rotating signers
///         bumps `epoch` to invalidate stale sigs. EIP-1271 (contract signers like Safe) is NOT
///         supported in this release — `ecrecover` is EOA-only.
contract MultiSigCondition is ConditionBase {
    struct Cfg {
        address[] signers; // sorted ascending, unique
        uint16 threshold;
        uint64 epoch; // bumps on signer rotation → invalidates in-flight sigs
    }

    mapping(uint32 => Cfg) private _cfg;

    /// @dev EIP-712 domain separator. Set once in constructor since `address(this)` is fixed and
    ///      `block.chainid` doesn't change. Cheaper than rebuilding the digest on every view call.
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @dev keccak256("Approval(uint32 uuid,address caller,uint64 epoch,uint64 deadline)")
    bytes32 private constant APPROVAL_TYPEHASH =
        keccak256("Approval(uint32 uuid,address caller,uint64 epoch,uint64 deadline)");

    error BadThreshold();
    error NoSigners();
    error SignersNotSorted();
    error NotCreator();

    event SignersRotated(uint32 indexed uuid, uint64 epoch);

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("cdr-kit:MultiSigCondition"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    /// @dev config = abi.encode(address[] signers, uint16 threshold)
    ///      Signers MUST be sorted strictly ascending (also enforces uniqueness in one check).
    function _store(uint32 uuid, bytes calldata config) internal override {
        (address[] memory signers, uint16 threshold) = abi.decode(config, (address[], uint16));
        _validate(signers, threshold);
        _cfg[uuid] = Cfg({signers: signers, threshold: threshold, epoch: 0});
    }

    /// @notice Creator-side: swap signers / change threshold. Bumps `epoch` → all in-flight
    ///         signatures are invalidated (they were signed against the old epoch).
    function rotateSigners(uint32 uuid, address[] calldata newSigners, uint16 newThreshold) external {
        if (msg.sender != creator[uuid]) revert NotCreator();
        _validate(newSigners, newThreshold);
        Cfg storage c = _cfg[uuid];
        c.signers = newSigners;
        c.threshold = newThreshold;
        c.epoch += 1;
        emit SignersRotated(uuid, c.epoch);
    }

    function _validate(address[] memory signers, uint16 threshold) private pure {
        if (signers.length == 0) revert NoSigners();
        if (threshold == 0 || threshold > signers.length) revert BadThreshold();
        for (uint256 i = 1; i < signers.length; i++) {
            if (signers[i] <= signers[i - 1]) revert SignersNotSorted();
        }
    }

    /// @notice Read the current config for a uuid. Useful for UIs computing "X of Y approved".
    function getConfig(uint32 uuid) external view returns (address[] memory signers, uint16 threshold, uint64 epoch) {
        Cfg storage c = _cfg[uuid];
        return (c.signers, c.threshold, c.epoch);
    }

    /// @inheritdoc ICdrCondition
    /// @dev Wraps the eval in a try/catch via external `this.evaluate(...)` so malformed `aux`
    ///      (any abi.decode failure) returns `false` instead of reverting the CDR precompile.
    ///      Same defensive pattern as `TierGateCondition.sol:52-57`.
    function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        try this.evaluate(uuid, accessAuxData, caller) returns (bool ok) {
            return ok;
        } catch {
            return false;
        }
    }

    /// @dev External so it can be invoked via `this.` inside a try/catch. View-only.
    ///      Decodes `aux = (uint64 deadline, bytes[] sigs)`, verifies each sig is from a configured
    ///      signer, deduplicates by recovered address (strict ascending), and returns true iff the
    ///      hit count meets the threshold. ECDSA malleability is automatically defeated because
    ///      both `(r, s, v)` and `(r, n-s, v^1)` recover the same address — the second one fails
    ///      the strict-ascending dedupe.
    function evaluate(uint32 uuid, bytes calldata accessAuxData, address caller) external view returns (bool) {
        (uint64 deadline, bytes[] memory sigs) = abi.decode(accessAuxData, (uint64, bytes[]));
        if (block.timestamp > deadline) return false;
        Cfg storage c = _cfg[uuid];
        if (sigs.length < c.threshold) return false;

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(APPROVAL_TYPEHASH, uuid, caller, c.epoch, deadline))
            )
        );

        uint256 hits;
        address last; // strictly-ascending dedupe sentinel
        for (uint256 i; i < sigs.length; i++) {
            address rec = _recover(digest, sigs[i]);
            if (rec == address(0)) return false; // bad sig — fail fast (also ec-recover error)
            if (rec <= last) return false; // unsorted or duplicate
            last = rec;
            if (_isSigner(c.signers, rec)) {
                hits += 1;
                if (hits >= c.threshold) return true;
            }
        }
        return false;
    }

    /// @inheritdoc ICdrCondition
    function checkWriteCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        // Creator can update the underlying secret. The signers gate reads, not writes.
        return caller == creator[uuid];
    }

    function _isSigner(address[] storage signers, address candidate) private view returns (bool) {
        // Linear scan; signers list is small in practice (<=10 typical), so binary search would
        // add code complexity without measurable savings.
        for (uint256 i; i < signers.length; i++) {
            if (signers[i] == candidate) return true;
        }
        return false;
    }

    function _recover(bytes32 digest, bytes memory sig) private pure returns (address) {
        if (sig.length != 65) return address(0);
        bytes32 r;
        bytes32 s;
        uint8 v;
        // Layout for `bytes memory`: 32 bytes length prefix, then r (32), s (32), v (1).
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        return ecrecover(digest, v, r, s);
    }
}
