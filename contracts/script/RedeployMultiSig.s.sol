// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {MultiSigCondition} from "../src/conditions/MultiSigCondition.sol";

/// @notice Redeploys MultiSigCondition with the new on-chain `approve()` path added.
///         Replaces the previous 0xb22EBF…fB78 deployment. Bound to the existing
///         CdrKitVault factory at 0xac592f… (same factory; only the condition contract is new).
///
/// Run (live):
///   source contracts/.env
///   forge script script/RedeployMultiSig.s.sol:RedeployMultiSig \
///     --rpc-url $AENEID_RPC --private-key $PRIVATE_KEY \
///     --broadcast --legacy --with-gas-price 60000000000 --slow
contract RedeployMultiSig is Script {
    address constant EXISTING_VAULT = 0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        MultiSigCondition multiSig = new MultiSigCondition();
        multiSig.initialize(EXISTING_VAULT);
        vm.stopBroadcast();
        console.log("ExistingCdrKitVault       ", EXISTING_VAULT);
        console.log("MultiSigCondition (new)   ", address(multiSig));
        console.log("MultiSigCondition (old)    0xb22EBF0481950A3c0e528A5902C4c5C69184fB78");
    }
}
