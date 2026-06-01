// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title MultiSigCondition
/// @notice N-of-M multi-sig read condition with TWO parallel approval paths:
///           1. Off-chain EIP-712 sigs (gas-free, submitted as `accessAuxData` at read time).
///           2. On-chain `approve(uuid)` (Safe-style — signers pay gas, dashboard reads truth from chain).
///         A read passes if EITHER threshold is met. Both paths share the same signer set + threshold.
/// @dev    Epoch invalidates BOTH paths on `rotateSigners` — on-chain approvals are stored at
///         `hasApproved[uuid][epoch][signer]` so a rotation makes the old epoch's approvals
///         logically dead without needing to clear them. `approvalsCount[uuid][epoch]` denormalizes
///         the count for cheap O(1) view reads. EIP-1271 (contract signers like Safe) is NOT
///         supported in this release — `ecrecover` is EOA-only for the off-chain path.
contract MultiSigCondition is ConditionBase {
    struct Cfg {
        address[] signers; // sorted ascending, unique
        uint16 threshold;
        uint64 epoch; // bumps on signer rotation → invalidates BOTH off-chain sigs AND on-chain approvals
    }

    mapping(uint32 => Cfg) private _cfg;

    /// @notice On-chain approvals — epoch-scoped so rotateSigners auto-invalidates stale ones.
    mapping(uint32 => mapping(uint64 => mapping(address => bool))) public hasApproved;
    /// @notice Denormalized count of on-chain approvals for the current epoch.
    mapping(uint32 => mapping(uint64 => uint256)) public approvalsCount;

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
    error NotSigner();
    error AlreadyApproved();
    /// @notice The epoch the signer believed they were approving against has been rotated past.
    /// @dev Returned with `current` so the caller can re-sign / re-approve against the new epoch
    ///      after confirming they still trust the post-rotation signer set + threshold.
    error EpochChanged(uint64 expected, uint64 current);

    event SignersRotated(uint32 indexed uuid, uint64 epoch);
    event Approved(uint32 indexed uuid, address indexed signer, uint64 indexed epoch);

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

    /// @notice On-chain approval path — Safe-style. Signer pays ~50k gas; dashboards then read
    ///         `approvalsCount(uuid, currentEpoch)` for O(1) "X of Y approved" truth.
    ///         Rotation auto-invalidates because the mapping is keyed on epoch.
    /// @param  expectedEpoch The epoch the signer is approving against — must match `c.epoch`. If a
    ///         rotation happens between the signer's decision and tx mining, this reverts so the
    ///         approval never silently binds to a signer set / threshold the signer didn't agree to.
    ///         UIs should read `getConfig(uuid).epoch` immediately before constructing the tx.
    function approve(uint32 uuid, uint64 expectedEpoch) external {
        Cfg storage c = _cfg[uuid];
        if (c.threshold == 0) revert NotConfigured();
        uint64 epoch = c.epoch;
        if (epoch != expectedEpoch) revert EpochChanged(expectedEpoch, epoch);
        if (!_isSigner(c.signers, msg.sender)) revert NotSigner();
        if (hasApproved[uuid][epoch][msg.sender]) revert AlreadyApproved();
        hasApproved[uuid][epoch][msg.sender] = true;
        approvalsCount[uuid][epoch] += 1;
        emit Approved(uuid, msg.sender, epoch);
    }

    /// @notice Current on-chain approval count for the active epoch. Cheap O(1).
    function currentApprovalsCount(uint32 uuid) external view returns (uint256) {
        return approvalsCount[uuid][_cfg[uuid].epoch];
    }

    error NotConfigured();

    /// @inheritdoc ICdrCondition
    /// @dev Two parallel paths, ORed together:
    ///       1. On-chain `approvalsCount[uuid][epoch] >= threshold` — when buyers prefer the
    ///          Safe-style flow (dashboards read chain, signers each pay ~50k gas).
    ///       2. Off-chain EIP-712 sigs in `accessAuxData` — gas-free for signers, buyer collects
    ///          + submits at read time.
    ///      The off-chain path is wrapped in a `try/catch` via external `this.evaluate(...)` so
    ///      malformed `aux` returns `false` (never reverts the CDR precompile). When `aux` is
    ///      empty (length 0), we skip evaluation and rely on the on-chain path alone.
    function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        Cfg storage c = _cfg[uuid];
        // Path 1: on-chain approvals at current epoch.
        if (approvalsCount[uuid][c.epoch] >= c.threshold) return true;
        // Path 2: off-chain sigs in aux. Skip when aux is empty to avoid a doomed decode.
        if (accessAuxData.length == 0) return false;
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
        Cfg storage c = _cfg[uuid];
        // Defensive: `checkReadCondition` already guards unconfigured uuids via `_configured`, but
        // `evaluate` is `external` so direct callers (test harnesses, ill-behaved integrations)
        // could otherwise pass through `hits >= 0` and authorize on an unset config.
        if (c.threshold == 0) return false;
        (uint64 deadline, bytes[] memory sigs) = abi.decode(accessAuxData, (uint64, bytes[]));
        if (block.timestamp > deadline) return false;
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
