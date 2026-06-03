// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {OpenCondition} from "../src/conditions/OpenCondition.sol";

/// @title DeployOpenCondition
/// @notice 0.7.1 standalone redeploy of OpenCondition. The original deployment at
///         0x36fB2e2d10efd1E905b7779A684F34B9c775b62B inherited only `ICdrCondition`
///         (no `setConfigFromFactory`), so the cdr-kit factory's `_configure` step
///         reverted whenever it was used as `readConditionAddr`. The new contract
///         inherits `ConditionBase` and is bound to the existing factory via `initialize`.
///
///         Run:
///           forge script contracts/script/DeployOpenCondition.s.sol \
///             --broadcast --legacy --with-gas-price 60000000000 \
///             --rpc-url $AENEID_RPC --private-key $PRIVATE_KEY
contract DeployOpenCondition is Script {
    /// @notice Existing CdrKitVault factory on Aeneid (unchanged since 0.3).
    address constant FACTORY = 0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C;

    function run() external {
        vm.startBroadcast();

        OpenCondition openCond = new OpenCondition();
        openCond.initialize(FACTORY);

        vm.stopBroadcast();

        console.log("OpenCondition (new) ", address(openCond));
        console.log("Bound to factory    ", FACTORY);
    }
}
