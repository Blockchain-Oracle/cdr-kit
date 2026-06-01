// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test, Vm} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {MultiSigCondition} from "../src/conditions/MultiSigCondition.sol";

contract MultiSigTest is Test {
    address constant FACTORY = address(0xFAC);
    address constant CREATOR = address(0xC0FFEE);
    address constant BUYER = address(0xB0B);

    MultiSigCondition cond;

    // Three signers derived from deterministic test private keys.
    uint256 constant PK_A = 0xA11CE;
    uint256 constant PK_B = 0xB0B7;
    uint256 constant PK_C = 0xC0FFEE07;
    address signerA;
    address signerB;
    address signerC;

    function setUp() public {
        cond = new MultiSigCondition();
        cond.initialize(FACTORY);
        signerA = vm.addr(PK_A);
        signerB = vm.addr(PK_B);
        signerC = vm.addr(PK_C);
        vm.warp(1_700_000_000);
    }

    // ---------- signer-array helpers (must be sorted strictly ascending) ----------

    function _sortedSigners() internal view returns (address[] memory a) {
        a = new address[](3);
        (a[0], a[1], a[2]) = _sort3(signerA, signerB, signerC);
    }

    function _sort3(address x, address y, address z) internal pure returns (address, address, address) {
        // Sort 3 addresses ascending.
        address[3] memory arr = [x, y, z];
        for (uint256 i; i < 3; i++) {
            for (uint256 j = i + 1; j < 3; j++) {
                if (arr[j] < arr[i]) (arr[i], arr[j]) = (arr[j], arr[i]);
            }
        }
        return (arr[0], arr[1], arr[2]);
    }

    function _cfg(address[] memory signers, uint16 threshold) internal pure returns (bytes memory) {
        return abi.encode(signers, threshold);
    }

    function _configure(uint32 uuid, uint16 threshold) internal {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(uuid, CREATOR, _cfg(_sortedSigners(), threshold));
    }

    // ---------- digest + signature helpers ----------

    function _digest(uint32 uuid, address caller, uint64 epoch, uint64 deadline) internal view returns (bytes32) {
        bytes32 typehash = keccak256("Approval(uint32 uuid,address caller,uint64 epoch,uint64 deadline)");
        return keccak256(
            abi.encodePacked(
                "\x19\x01",
                cond.DOMAIN_SEPARATOR(),
                keccak256(abi.encode(typehash, uuid, caller, epoch, deadline))
            )
        );
    }

    function _sign(uint256 pk, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    /// @dev Returns 2 sigs sorted by recovered signer address ascending (required by the dedupe).
    function _sigs2(uint256 pkX, uint256 pkY, bytes32 digest) internal pure returns (bytes[] memory out) {
        // Build the two sigs first.
        bytes memory sx = _sign(pkX, digest);
        bytes memory sy = _sign(pkY, digest);
        out = new bytes[](2);
        // Order by recovered address: cheapest is to derive addresses via vm.addr.
        address addrX = vm.addr(pkX);
        address addrY = vm.addr(pkY);
        if (addrX < addrY) {
            out[0] = sx;
            out[1] = sy;
        } else {
            out[0] = sy;
            out[1] = sx;
        }
    }

    function _aux(uint64 deadline, bytes[] memory sigs) internal pure returns (bytes memory) {
        return abi.encode(deadline, sigs);
    }

    // ---------- _store validation ----------

    function test_store_rejects_empty_signers() public {
        address[] memory empty = new address[](0);
        vm.prank(FACTORY);
        vm.expectRevert(MultiSigCondition.NoSigners.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(empty, 1));
    }

    function test_store_rejects_threshold_gt_signers() public {
        vm.prank(FACTORY);
        vm.expectRevert(MultiSigCondition.BadThreshold.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(_sortedSigners(), 4));
    }

    function test_store_rejects_zero_threshold() public {
        vm.prank(FACTORY);
        vm.expectRevert(MultiSigCondition.BadThreshold.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(_sortedSigners(), 0));
    }

    function test_store_rejects_unsorted_signers() public {
        address[] memory unsorted = new address[](3);
        (unsorted[2], unsorted[1], unsorted[0]) = _sort3(signerA, signerB, signerC);
        vm.prank(FACTORY);
        vm.expectRevert(MultiSigCondition.SignersNotSorted.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(unsorted, 2));
    }

    function test_store_rejects_duplicate_signers() public {
        address[] memory dup = new address[](2);
        (dup[0], dup[1]) = (signerA, signerA);
        vm.prank(FACTORY);
        vm.expectRevert(MultiSigCondition.SignersNotSorted.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(dup, 1));
    }

    // ---------- happy path ----------

    function test_threshold_met_returns_true() public {
        _configure(1, 2);
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes32 digest = _digest(1, BUYER, 0, deadline);
        bytes[] memory sigs = _sigs2(PK_A, PK_B, digest);
        assertTrue(cond.checkReadCondition(1, _aux(deadline, sigs), "", BUYER));
    }

    function test_below_threshold_returns_false() public {
        _configure(1, 2);
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes32 digest = _digest(1, BUYER, 0, deadline);
        bytes[] memory sigs = new bytes[](1);
        sigs[0] = _sign(PK_A, digest);
        assertFalse(cond.checkReadCondition(1, _aux(deadline, sigs), "", BUYER));
    }

    // ---------- deadline expiry ----------

    function test_expired_deadline_returns_false() public {
        _configure(1, 2);
        uint64 deadline = uint64(block.timestamp - 1);
        bytes32 digest = _digest(1, BUYER, 0, deadline);
        bytes[] memory sigs = _sigs2(PK_A, PK_B, digest);
        assertFalse(cond.checkReadCondition(1, _aux(deadline, sigs), "", BUYER));
    }

    // ---------- caller binding ----------

    function test_sigs_bind_to_caller() public {
        _configure(1, 2);
        uint64 deadline = uint64(block.timestamp + 1 hours);
        // Sigs are over `BUYER` as caller.
        bytes32 digest = _digest(1, BUYER, 0, deadline);
        bytes[] memory sigs = _sigs2(PK_A, PK_B, digest);
        // Submitted by a different caller → digest doesn't match → false.
        assertFalse(cond.checkReadCondition(1, _aux(deadline, sigs), "", address(0xDEADBEEF)));
    }

    // ---------- epoch invalidation on rotation ----------

    function test_rotation_invalidates_old_sigs() public {
        _configure(1, 2);
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes32 oldDigest = _digest(1, BUYER, 0, deadline);
        bytes[] memory sigs = _sigs2(PK_A, PK_B, oldDigest);

        // Rotate the signers (same set + threshold; just bump epoch).
        vm.prank(CREATOR);
        cond.rotateSigners(1, _sortedSigners(), 2);

        assertFalse(cond.checkReadCondition(1, _aux(deadline, sigs), "", BUYER));

        // Re-sign with the new epoch → succeeds.
        bytes32 newDigest = _digest(1, BUYER, 1, deadline);
        bytes[] memory newSigs = _sigs2(PK_A, PK_B, newDigest);
        assertTrue(cond.checkReadCondition(1, _aux(deadline, newSigs), "", BUYER));
    }

    function test_rotation_rejects_non_creator() public {
        _configure(1, 2);
        vm.prank(BUYER);
        vm.expectRevert(MultiSigCondition.NotCreator.selector);
        cond.rotateSigners(1, _sortedSigners(), 2);
    }

    // ---------- defensive eval ----------

    function test_malformed_aux_returns_false_not_revert() public {
        _configure(1, 2);
        // Random garbage that's not abi-encodable as (uint64, bytes[]).
        bytes memory garbage = hex"deadbeef";
        // Should return false, not revert (otherwise CDR precompile would bubble the revert).
        assertFalse(cond.checkReadCondition(1, garbage, "", BUYER));
    }

    function test_non_signer_signature_does_not_count() public {
        _configure(1, 2);
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes32 digest = _digest(1, BUYER, 0, deadline);

        // Sig from signerA (valid) + sig from a non-signer (invalid).
        uint256 PK_OUTSIDER = 0x0DDBEEFD157;
        bytes memory sigA = _sign(PK_A, digest);
        bytes memory sigOut = _sign(PK_OUTSIDER, digest);

        bytes[] memory sigs = new bytes[](2);
        address addrA = signerA;
        address addrOut = vm.addr(PK_OUTSIDER);
        if (addrA < addrOut) {
            sigs[0] = sigA;
            sigs[1] = sigOut;
        } else {
            sigs[0] = sigOut;
            sigs[1] = sigA;
        }

        assertFalse(
            cond.checkReadCondition(1, _aux(deadline, sigs), "", BUYER), "outsider sig must not count toward threshold"
        );
    }

    // ---------- write condition ----------

    function test_writeCondition_creator_only() public {
        _configure(1, 2);
        assertTrue(cond.checkWriteCondition(1, "", "", CREATOR));
        assertFalse(cond.checkWriteCondition(1, "", "", BUYER));
        assertFalse(cond.checkWriteCondition(1, "", "", signerA));
    }

    // ---------- getConfig view ----------

    function test_getConfig_returns_full_state() public {
        _configure(1, 2);
        (address[] memory s, uint16 t, uint64 epoch) = cond.getConfig(1);
        assertEq(s.length, 3);
        assertEq(t, 2);
        assertEq(epoch, 0);

        vm.prank(CREATOR);
        cond.rotateSigners(1, _sortedSigners(), 2);
        (,, uint64 newEpoch) = cond.getConfig(1);
        assertEq(newEpoch, 1);
    }

    // ---------- ConditionBase invariants ----------

    function test_reconfigure_rejected() public {
        _configure(1, 2);
        vm.prank(FACTORY);
        vm.expectRevert(ConditionBase.AlreadyConfigured.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(_sortedSigners(), 2));
    }

    // ============================================================
    // On-chain approve() path (added 2026-06-01 alongside the
    // existing off-chain EIP-712 path).
    // ============================================================

    function test_onchain_approve_records_state_and_emits() public {
        _configure(1, 2);
        // Two configured signers approve; threshold should now be met.
        vm.expectEmit(true, true, true, true, address(cond));
        emit MultiSigCondition.Approved(1, signerA, 0);
        vm.prank(signerA);
        cond.approve(1, 0);
        assertTrue(cond.hasApproved(1, 0, signerA));
        assertEq(cond.currentApprovalsCount(1), 1);

        vm.prank(signerB);
        cond.approve(1, 0);
        assertEq(cond.currentApprovalsCount(1), 2);
    }

    function test_onchain_threshold_met_allows_read_with_empty_aux() public {
        _configure(1, 2);
        vm.prank(signerA);
        cond.approve(1, 0);
        vm.prank(signerB);
        cond.approve(1, 0);
        // Empty aux — should still pass via on-chain path.
        assertTrue(cond.checkReadCondition(1, "", "", BUYER));
    }

    function test_onchain_below_threshold_returns_false() public {
        _configure(1, 2);
        vm.prank(signerA);
        cond.approve(1, 0);
        // Only 1 of 2 — empty aux + insufficient on-chain → false.
        assertFalse(cond.checkReadCondition(1, "", "", BUYER));
    }

    function test_onchain_approve_rejects_non_signer() public {
        _configure(1, 2);
        vm.prank(BUYER);
        vm.expectRevert(MultiSigCondition.NotSigner.selector);
        cond.approve(1, 0);
    }

    function test_onchain_approve_rejects_unconfigured() public {
        vm.prank(signerA);
        vm.expectRevert(MultiSigCondition.NotConfigured.selector);
        cond.approve(999, 0);
    }

    function test_onchain_approve_rejects_double_approve() public {
        _configure(1, 2);
        vm.prank(signerA);
        cond.approve(1, 0);
        vm.prank(signerA);
        vm.expectRevert(MultiSigCondition.AlreadyApproved.selector);
        cond.approve(1, 0);
    }

    function test_onchain_rotation_invalidates_prior_approvals() public {
        _configure(1, 2);
        vm.prank(signerA);
        cond.approve(1, 0);
        vm.prank(signerB);
        cond.approve(1, 0);
        assertEq(cond.currentApprovalsCount(1), 2);
        // Rotation → epoch=1; old approvals at epoch=0 still recorded but no longer count.
        vm.prank(CREATOR);
        cond.rotateSigners(1, _sortedSigners(), 2);
        assertEq(cond.currentApprovalsCount(1), 0, "current epoch fresh");
        assertTrue(cond.hasApproved(1, 0, signerA), "historical record preserved");
        assertFalse(cond.checkReadCondition(1, "", "", BUYER), "empty-aux read no longer passes");
    }

    function test_onchain_AND_offchain_paths_both_work() public {
        _configure(1, 2);
        // On-chain path:
        vm.prank(signerA);
        cond.approve(1, 0);
        vm.prank(signerB);
        cond.approve(1, 0);
        assertTrue(cond.checkReadCondition(1, "", "", BUYER));

        // Off-chain path on a separate vault:
        _configure(2, 2);
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes32 digest = _digest(2, BUYER, 0, deadline);
        bytes[] memory sigs = _sigs2(PK_A, PK_B, digest);
        assertTrue(cond.checkReadCondition(2, _aux(deadline, sigs), "", BUYER));
    }

    function test_onchain_approve_rejects_stale_epoch() public {
        // Signer decided/signed against epoch 0, but a rotation lands first — their tx must revert
        // rather than silently bind their approval to the post-rotation signer set / threshold.
        _configure(1, 2);
        vm.prank(CREATOR);
        cond.rotateSigners(1, _sortedSigners(), 2); // → epoch=1

        vm.prank(signerA);
        vm.expectRevert(abi.encodeWithSelector(MultiSigCondition.EpochChanged.selector, uint64(0), uint64(1)));
        cond.approve(1, 0);

        // Sanity: approving against the correct (new) epoch still works.
        vm.prank(signerA);
        cond.approve(1, 1);
        assertEq(cond.currentApprovalsCount(1), 1);
    }

    function test_evaluate_returns_false_on_unconfigured_uuid() public view {
        // `evaluate` is `external` — the precompile entry is `checkReadCondition` which guards via
        // `_configured`, but direct callers must also be safe. With threshold==0 (unconfigured) the
        // early guard short-circuits before the sig loop, so `hits >= 0` never authorizes a read.
        uint64 deadline = uint64(block.timestamp + 1 hours);
        bytes[] memory emptySigs = new bytes[](0);
        assertFalse(cond.evaluate(42, _aux(deadline, emptySigs), BUYER));
    }
}
