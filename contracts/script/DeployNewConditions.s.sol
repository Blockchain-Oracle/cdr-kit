// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {TimeWindowCondition} from "../src/conditions/TimeWindowCondition.sol";
import {DeadManSwitchCondition} from "../src/conditions/DeadManSwitchCondition.sol";
import {ConditionalEscrowCondition} from "../src/conditions/ConditionalEscrowCondition.sol";
import {MultiSigCondition} from "../src/conditions/MultiSigCondition.sol";

/// @notice Deploys the 4 new 0.5.0 condition contracts and binds each to the EXISTING
///         CdrKitVault factory at `0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C` (Aeneid).
///         No factory redeploy — all 4 new conditions implement `ICdrConfigurable` and slot
///         into the existing factory's `createVault(readConditionAddr, readConfig, ...)` path.
///
/// Run:
///   source contracts/.env
///   forge script script/DeployNewConditions.s.sol:DeployNewConditions \
///     --rpc-url $AENEID_RPC --private-key $PRIVATE_KEY            (dry-run)
///   forge script script/DeployNewConditions.s.sol:DeployNewConditions \
///     --rpc-url $AENEID_RPC --private-key $PRIVATE_KEY --broadcast --slow   (broadcast)
contract DeployNewConditions is Script {
    /// @dev Existing CdrKitVault on Aeneid; conditions bind to this via `initialize`.
    address constant EXISTING_VAULT = 0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // Deploy all 4 (stateless constructors — no module addresses needed).
        TimeWindowCondition timeWindow = new TimeWindowCondition();
        DeadManSwitchCondition deadMan = new DeadManSwitchCondition();
        ConditionalEscrowCondition escrow = new ConditionalEscrowCondition();
        MultiSigCondition multiSig = new MultiSigCondition();

        // Bind each to the existing factory (deployer-gated; we are the deployer).
        timeWindow.initialize(EXISTING_VAULT);
        deadMan.initialize(EXISTING_VAULT);
        escrow.initialize(EXISTING_VAULT);
        multiSig.initialize(EXISTING_VAULT);

        vm.stopBroadcast();

        console.log("ExistingCdrKitVault       ", EXISTING_VAULT);
        console.log("TimeWindowCondition       ", address(timeWindow));
        console.log("DeadManSwitchCondition    ", address(deadMan));
        console.log("ConditionalEscrowCondition", address(escrow));
        console.log("MultiSigCondition         ", address(multiSig));
    }
}
