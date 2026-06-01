// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {TimeWindowCondition} from "../src/conditions/TimeWindowCondition.sol";

contract TimeWindowTest is Test {
    address constant FACTORY = address(0xFAC);
    address constant CREATOR = address(0xC0FFEE);
    address constant READER = address(0xBABE);

    TimeWindowCondition cond;

    function setUp() public {
        cond = new TimeWindowCondition();
        cond.initialize(FACTORY);
    }

    function _cfg(uint64 start, uint64 end, bool blockBased) internal pure returns (bytes memory) {
        return abi.encode(start, end, blockBased);
    }

    function _configure(uint32 uuid, uint64 start, uint64 end, bool blockBased) internal {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(uuid, CREATOR, _cfg(start, end, blockBased));
    }

    // ---------- unconfigured uuid behavior ----------

    function test_unconfigured_returns_false() public view {
        // Per D-series rule: view returns false on unconfigured uuid, never reverts.
        assertFalse(cond.checkReadCondition(999, "", "", READER));
    }

    function test_writeCondition_always_false() public view {
        assertFalse(cond.checkWriteCondition(1, "", "", CREATOR));
    }

    // ---------- _store validation ----------

    function test_store_rejects_endTs_lte_startTs() public {
        vm.prank(FACTORY);
        vm.expectRevert(TimeWindowCondition.BadWindow.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(1000, 1000, false));
    }

    function test_store_rejects_endTs_lt_startTs() public {
        vm.prank(FACTORY);
        vm.expectRevert(TimeWindowCondition.BadWindow.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(2000, 1000, false));
    }

    function test_store_accepts_endTs_zero_openended() public {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(1, CREATOR, _cfg(1000, 0, false));
        (uint64 s, uint64 e,) = cond.window(1);
        assertEq(s, 1000);
        assertEq(e, 0);
    }

    // ---------- timestamp-based window ----------

    function test_before_window_denied() public {
        _configure(1, 2000, 3000, false);
        vm.warp(1500);
        assertFalse(cond.checkReadCondition(1, "", "", READER));
    }

    function test_inside_window_allowed() public {
        _configure(1, 2000, 3000, false);
        vm.warp(2500);
        assertTrue(cond.checkReadCondition(1, "", "", READER));
    }

    function test_at_startTs_allowed() public {
        _configure(1, 2000, 3000, false);
        vm.warp(2000);
        assertTrue(cond.checkReadCondition(1, "", "", READER));
    }

    function test_at_endTs_allowed() public {
        _configure(1, 2000, 3000, false);
        vm.warp(3000);
        assertTrue(cond.checkReadCondition(1, "", "", READER));
    }

    function test_after_window_denied() public {
        _configure(1, 2000, 3000, false);
        vm.warp(3001);
        assertFalse(cond.checkReadCondition(1, "", "", READER));
    }

    function test_openended_window_allowed_after_start() public {
        _configure(1, 2000, 0, false);
        vm.warp(10_000_000);
        assertTrue(cond.checkReadCondition(1, "", "", READER));
    }

    function test_openended_window_denied_before_start() public {
        _configure(1, 2000, 0, false);
        vm.warp(1999);
        assertFalse(cond.checkReadCondition(1, "", "", READER));
    }

    // ---------- block-based window ----------

    function test_blockBased_before_window_denied() public {
        _configure(1, 100, 200, true);
        vm.roll(50);
        assertFalse(cond.checkReadCondition(1, "", "", READER));
    }

    function test_blockBased_inside_window_allowed() public {
        _configure(1, 100, 200, true);
        vm.roll(150);
        assertTrue(cond.checkReadCondition(1, "", "", READER));
    }

    function test_blockBased_after_window_denied() public {
        _configure(1, 100, 200, true);
        vm.roll(201);
        assertFalse(cond.checkReadCondition(1, "", "", READER));
    }

    function test_blockBased_openended_after_start() public {
        _configure(1, 100, 0, true);
        vm.roll(10_000_000);
        assertTrue(cond.checkReadCondition(1, "", "", READER));
    }

    // ---------- ConditionBase invariants ----------

    function test_reconfigure_rejected() public {
        _configure(1, 2000, 3000, false);
        vm.prank(FACTORY);
        vm.expectRevert(ConditionBase.AlreadyConfigured.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(4000, 5000, false));
    }

    function test_nonFactory_cannot_configure() public {
        vm.prank(address(0xBAD));
        vm.expectRevert(ConditionBase.NotVault.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(2000, 3000, false));
    }
}
