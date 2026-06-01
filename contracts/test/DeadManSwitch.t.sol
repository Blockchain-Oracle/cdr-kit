// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {DeadManSwitchCondition} from "../src/conditions/DeadManSwitchCondition.sol";

contract DeadManSwitchTest is Test {
    address constant FACTORY = address(0xFAC);
    address constant CREATOR = address(0xC0FFEE);
    address constant HEIR1 = address(0xAAAA);
    address constant HEIR2 = address(0xBBBB);
    address constant STRANGER = address(0xDEAD);

    DeadManSwitchCondition cond;

    function setUp() public {
        cond = new DeadManSwitchCondition();
        cond.initialize(FACTORY);
        // Warp to a sane timestamp so `uint64` arithmetic doesn't underflow on the (now + duration) path.
        vm.warp(1_700_000_000);
    }

    function _cfg(
        uint64 duration,
        address[] memory heirs,
        bool blockBased,
        bool creatorRead,
        bool pubAfter
    ) internal pure returns (bytes memory) {
        return abi.encode(duration, heirs, blockBased, creatorRead, pubAfter);
    }

    function _heirs1() internal pure returns (address[] memory a) {
        a = new address[](1);
        a[0] = HEIR1;
    }

    function _heirs2() internal pure returns (address[] memory a) {
        a = new address[](2);
        a[0] = HEIR1;
        a[1] = HEIR2;
    }

    function _empty() internal pure returns (address[] memory a) {
        a = new address[](0);
    }

    // ---------- _store validation ----------

    function test_store_rejects_zero_duration() public {
        vm.prank(FACTORY);
        vm.expectRevert(DeadManSwitchCondition.ZeroDuration.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(0, _heirs1(), false, true, false));
    }

    function test_store_no_heirs_forces_publicAfterUnlock() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _empty(), false, true, false));
        (,,,, bool pubAfter) = cond.cfg(1);
        assertTrue(pubAfter, "no heirs must force public unlock");
    }

    // ---------- pre-unlock access control ----------

    function test_creator_can_read_while_locked_when_enabled() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        assertTrue(cond.checkReadCondition(1, "", "", CREATOR));
    }

    function test_creator_denied_while_locked_when_disabled() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, false, false));
        assertFalse(cond.checkReadCondition(1, "", "", CREATOR));
    }

    function test_heir_denied_pre_unlock() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        assertFalse(cond.checkReadCondition(1, "", "", HEIR1));
    }

    function test_stranger_denied_pre_unlock() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        assertFalse(cond.checkReadCondition(1, "", "", STRANGER));
    }

    // ---------- post-unlock access control ----------

    function test_heir_allowed_after_unlock() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs2(), false, true, false));
        vm.warp(block.timestamp + 101);
        assertTrue(cond.checkReadCondition(1, "", "", HEIR1));
        assertTrue(cond.checkReadCondition(1, "", "", HEIR2));
    }

    function test_stranger_denied_after_unlock_when_not_public() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        vm.warp(block.timestamp + 101);
        assertFalse(cond.checkReadCondition(1, "", "", STRANGER));
    }

    function test_stranger_allowed_after_unlock_when_public() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, true));
        vm.warp(block.timestamp + 101);
        assertTrue(cond.checkReadCondition(1, "", "", STRANGER));
    }

    function test_creator_loses_access_post_unlock_when_not_heir_and_not_public() public {
        // The trapdoor: post-unlock, creator gets no special treatment.
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        vm.warp(block.timestamp + 101);
        assertFalse(cond.checkReadCondition(1, "", "", CREATOR));
    }

    // ---------- poke ----------

    function test_poke_extends_unlockAt() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        (uint64 originalUnlockAt,,,,) = cond.cfg(1);
        vm.warp(block.timestamp + 50);
        vm.prank(CREATOR);
        cond.poke(1);
        (uint64 newUnlockAt,,,,) = cond.cfg(1);
        assertEq(newUnlockAt, uint64(block.timestamp) + 100);
        assertGt(newUnlockAt, originalUnlockAt);
    }

    function test_poke_rejects_non_creator() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        vm.prank(STRANGER);
        vm.expectRevert(DeadManSwitchCondition.NotCreator.selector);
        cond.poke(1);
    }

    function test_poke_rejects_post_unlock() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        vm.warp(block.timestamp + 101);
        vm.prank(CREATOR);
        vm.expectRevert(DeadManSwitchCondition.AlreadyUnlocked.selector);
        cond.poke(1);
    }

    // ---------- block-based ----------

    function test_blockBased_pre_unlock_denies_heir() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), true, true, false));
        assertFalse(cond.checkReadCondition(1, "", "", HEIR1));
    }

    function test_blockBased_post_unlock_allows_heir() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), true, true, false));
        vm.roll(block.number + 101);
        assertTrue(cond.checkReadCondition(1, "", "", HEIR1));
    }

    // ---------- getRemainingTime ----------

    function test_getRemainingTime_counts_down() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        assertEq(cond.getRemainingTime(1), 100);
        vm.warp(block.timestamp + 25);
        assertEq(cond.getRemainingTime(1), 75);
        vm.warp(block.timestamp + 200);
        assertEq(cond.getRemainingTime(1), 0);
    }

    function test_getRemainingTime_unconfigured_returns_zero() public view {
        assertEq(cond.getRemainingTime(999), 0);
    }

    // ---------- writes ----------

    function test_writeCondition_creator_only() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(100, _heirs1(), false, true, false));
        assertTrue(cond.checkWriteCondition(1, "", "", CREATOR));
        assertFalse(cond.checkWriteCondition(1, "", "", HEIR1));
        assertFalse(cond.checkWriteCondition(1, "", "", STRANGER));
    }
}
