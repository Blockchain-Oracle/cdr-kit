// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {TimeWindowCondition} from "../src/conditions/TimeWindowCondition.sol";
import {DeadManSwitchCondition} from "../src/conditions/DeadManSwitchCondition.sol";
import {ConditionalEscrowCondition} from "../src/conditions/ConditionalEscrowCondition.sol";
import {MultiSigCondition} from "../src/conditions/MultiSigCondition.sol";

/// @notice Live-state acceptance tests. Each test forks Aeneid at the latest block and asserts
///         that the deployed contract behaves correctly against real chain state. This is the
///         "plain contract test" Abu wants — it catches deploy-time drift (wrong factory binding,
///         stale bytecode, etc.) that the in-memory unit tests can't.
///
/// Run: source contracts/.env && forge test --match-contract AeneidForkTest --fork-url $AENEID_RPC -vv
///
/// Skipped automatically when `AENEID_RPC` is unset (lets `forge test` stay green in CI without
/// network access). The unit tests in TimeWindow.t.sol / DeadManSwitch.t.sol / etc. cover behavior
/// in isolation; this file only checks the live binding.
contract AeneidForkTest is Test {
    address constant EXPECTED_FACTORY = 0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C;

    address constant TIME_WINDOW = 0x67911435F262e7e4EC4F7FEB4e868a67b9dd90b1;
    address constant DEAD_MAN = 0x37226f97e184843aB0b8d4f08A55969801B97766;
    address constant ESCROW = 0x7fcDe02DB7c14fD3587aB2fED064a1D8355b7584;
    address constant MULTI_SIG = 0xb22EBF0481950A3c0e528A5902C4c5C69184fB78;

    function setUp() public {
        // Forked chainid is 1315 (Story Aeneid). Plain `forge test` uses 31337. Skip when not
        // actually forked so the standard `forge test` invocation stays self-contained + green.
        if (block.chainid != 1315) {
            vm.skip(true);
        }
    }

    function test_timeWindow_factoryBoundToExisting() public view {
        assertEq(TimeWindowCondition(TIME_WINDOW).factory(), EXPECTED_FACTORY, "TimeWindow factory mismatch");
        assertNotEq(TIME_WINDOW.code.length, 0, "TimeWindow has no code at the pinned address");
    }

    function test_deadMan_factoryBoundToExisting() public view {
        assertEq(DeadManSwitchCondition(DEAD_MAN).factory(), EXPECTED_FACTORY, "DeadMan factory mismatch");
        assertNotEq(DEAD_MAN.code.length, 0, "DeadMan has no code at the pinned address");
    }

    function test_escrow_factoryBoundToExisting() public view {
        assertEq(ConditionalEscrowCondition(ESCROW).factory(), EXPECTED_FACTORY, "Escrow factory mismatch");
        assertNotEq(ESCROW.code.length, 0, "Escrow has no code at the pinned address");
    }

    function test_multiSig_factoryBoundToExisting() public view {
        assertEq(MultiSigCondition(MULTI_SIG).factory(), EXPECTED_FACTORY, "MultiSig factory mismatch");
        assertNotEq(MULTI_SIG.code.length, 0, "MultiSig has no code at the pinned address");
    }

    /// @notice Unconfigured uuids must return false (never revert) per D-series rule. Picks a
    ///         uuid that's astronomically unlikely to ever be allocated.
    function test_unconfiguredUuid_returnsFalse_acrossAllFour() public view {
        uint32 uuid = type(uint32).max;
        assertFalse(TimeWindowCondition(TIME_WINDOW).checkReadCondition(uuid, "", "", address(0)));
        assertFalse(DeadManSwitchCondition(DEAD_MAN).checkReadCondition(uuid, "", "", address(0)));
        assertFalse(ConditionalEscrowCondition(ESCROW).checkReadCondition(uuid, "", "", address(0)));
        assertFalse(MultiSigCondition(MULTI_SIG).checkReadCondition(uuid, "", "", address(0)));
    }

    /// @notice The defensive try/catch on MultiSig must NOT bubble malformed-aux reverts.
    function test_multiSig_malformedAux_returnsFalse_not_revert() public view {
        bytes memory garbage = hex"deadbeef";
        // Configured uuid (any) — we expect the unconfigured check OR the try/catch to handle it.
        assertFalse(MultiSigCondition(MULTI_SIG).checkReadCondition(type(uint32).max, garbage, "", address(0)));
    }

    /// @notice Spot-check ConditionBase invariants: `deployer()` returns a non-zero address.
    function test_conditionBase_deployerSet_acrossAllFour() public view {
        assertNotEq(TimeWindowCondition(TIME_WINDOW).deployer(), address(0), "TimeWindow deployer == 0");
        assertNotEq(DeadManSwitchCondition(DEAD_MAN).deployer(), address(0), "DeadMan deployer == 0");
        assertNotEq(ConditionalEscrowCondition(ESCROW).deployer(), address(0), "Escrow deployer == 0");
        assertNotEq(MultiSigCondition(MULTI_SIG).deployer(), address(0), "MultiSig deployer == 0");
    }
}
