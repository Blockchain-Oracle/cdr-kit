// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {SubscriptionCondition} from "../src/conditions/SubscriptionCondition.sol";
import {TierGateCondition} from "../src/conditions/TierGateCondition.sol";
import {ComposableCondition} from "../src/conditions/ComposableCondition.sol";
import {CdrKitVault} from "../src/CdrKitVault.sol";

/// @dev PILTerms struct — must match PILicenseTemplate exactly (17 fields, order matters).
struct PILTerms {
    bool transferable;
    address royaltyPolicy;
    uint256 defaultMintingFee;
    uint256 expiration;
    bool commercialUse;
    bool commercialAttribution;
    address commercializerChecker;
    bytes commercializerCheckerData;
    uint32 commercialRevShare;
    uint256 commercialRevCeiling;
    bool derivativesAllowed;
    bool derivativesAttribution;
    bool derivativesApproval;
    bool derivativesReciprocal;
    uint256 derivativeRevCeiling;
    address currency;
    string uri;
}

interface IPILTemplate {
    function registerLicenseTerms(PILTerms calldata terms) external returns (uint256 id);
}

/// @notice Deploy the cdr-kit MVP contracts to Aeneid and bind the conditions to the factory.
/// Run: source contracts/.env && forge script script/Deploy.s.sol:Deploy --rpc-url aeneid --broadcast --private-key $PRIVATE_KEY
contract Deploy is Script {
    address constant CDR = 0xCCCcCC0000000000000000000000000000000005;
    address constant IP_ASSET_REGISTRY = 0x77319B4031e6eF1250907aa00018B8B1c67a244b;
    address constant LICENSING_MODULE = 0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f;
    address constant LICENSE_TOKEN = 0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC;
    address constant PIL_TEMPLATE = 0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316;
    address constant ROYALTY_MODULE = 0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086;
    address constant WIP = 0x1514000000000000000000000000000000000000;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        // 1. Register a default non-commercial, transferable PIL term (matches the demo's default).
        PILTerms memory terms;
        terms.transferable = true;
        uint256 defaultTermsId = IPILTemplate(PIL_TEMPLATE).registerLicenseTerms(terms);

        // 2. Deploy the 3 MVP read conditions.
        SubscriptionCondition sub = new SubscriptionCondition(ROYALTY_MODULE, WIP);
        TierGateCondition tier = new TierGateCondition(LICENSE_TOKEN, PIL_TEMPLATE);
        ComposableCondition comp = new ComposableCondition();

        // 3. Deploy the factory (it deploys + binds its own CreatorWriteCondition internally).
        CdrKitVault vault = new CdrKitVault(CDR, IP_ASSET_REGISTRY, LICENSING_MODULE, PIL_TEMPLATE, defaultTermsId);

        // 4. Bind the read conditions to this factory (deployer-gated; we are the deployer).
        sub.initialize(address(vault));
        tier.initialize(address(vault));
        comp.initialize(address(vault));

        vm.stopBroadcast();

        console.log("defaultTermsId        ", defaultTermsId);
        console.log("CdrKitVault           ", address(vault));
        console.log("CreatorWriteCondition ", address(vault.WRITE_CONDITION()));
        console.log("SubscriptionCondition ", address(sub));
        console.log("TierGateCondition     ", address(tier));
        console.log("ComposableCondition   ", address(comp));
    }
}
