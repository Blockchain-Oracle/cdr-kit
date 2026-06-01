// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {MultiSigCondition} from "../src/conditions/MultiSigCondition.sol";

/// @notice Redeploys MultiSigCondition (2026-06-01 round 2) — adds `expectedEpoch` arg on the
///         on-chain `approve()` path + defensive `threshold==0` guard in `evaluate()`. Bound to
///         the existing CdrKitVault factory at 0xac592f… (factory unchanged; only the condition
///         contract is new). Previous deploys: 0xb22EBF…fB78 (off-chain only) →
///         0x61061CCb…FB87 (dual-path, no epoch arg) → this one.
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
        console.log("MultiSigCondition (prior)  0x61061CCb8BD4C9E0AfF67ed4d2226f0Fc140FB87");
    }
}
