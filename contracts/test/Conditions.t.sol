// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {CreatorWriteCondition} from "../src/conditions/CreatorWriteCondition.sol";
import {SubscriptionCondition} from "../src/conditions/SubscriptionCondition.sol";
import {TierGateCondition, ILicenseToken} from "../src/conditions/TierGateCondition.sol";

contract MockRoyaltyModule {
    function isWhitelistedRoyaltyToken(address) external pure returns (bool) {
        return true;
    }

    function payRoyaltyOnBehalf(address, address, address, uint256) external {}
}

contract MockLicenseToken is ILicenseToken {
    struct Meta {
        address owner;
        address ipId;
        address template;
        uint256 termsId;
        bool revoked;
        bool exists;
    }

    mapping(uint256 => Meta) public meta;

    function set(uint256 id, address owner_, address ipId_, address template_, uint256 termsId_, bool revoked_)
        external
    {
        meta[id] = Meta(owner_, ipId_, template_, termsId_, revoked_, true);
    }

    function ownerOf(uint256 id) external view returns (address) {
        require(meta[id].exists, "nonexistent");
        return meta[id].owner;
    }

    function getLicensorIpId(uint256 id) external view returns (address) {
        return meta[id].ipId;
    }

    function getLicenseTemplate(uint256 id) external view returns (address) {
        return meta[id].template;
    }

    function getLicenseTermsId(uint256 id) external view returns (uint256) {
        return meta[id].termsId;
    }

    function isLicenseTokenRevoked(uint256 id) external view returns (bool) {
        return meta[id].revoked;
    }
}

contract ConditionsTest is Test {
    address constant FACTORY = address(0xFAC);
    address constant CREATOR = address(0xC0FFEE);
    address constant BUYER = address(0xB0B);
    address constant PIL = address(0x5151);
    address constant IPID = address(0x1D);
    address constant WIP = address(0x4141);

    CreatorWriteCondition writeCond;
    SubscriptionCondition sub;
    TierGateCondition tier;
    MockLicenseToken lt;
    MockRoyaltyModule rm;

    function setUp() public {
        rm = new MockRoyaltyModule();
        lt = new MockLicenseToken();
        writeCond = new CreatorWriteCondition();
        sub = new SubscriptionCondition(address(rm), WIP);
        tier = new TierGateCondition(address(lt), PIL);
        // the test contract is the deployer → it binds the factory
        writeCond.initialize(FACTORY);
        sub.initialize(FACTORY);
        tier.initialize(FACTORY);
    }

    function _subCfg(uint256 price, uint256 period, address payee) internal pure returns (bytes memory) {
        return abi.encode(price, period, payee, uint8(0), address(0)); // mode 0 = NativeIP
    }

    function _tierCfg(address ipId, uint256 termsId) internal pure returns (bytes memory) {
        uint256[] memory t = new uint256[](1);
        t[0] = termsId;
        return abi.encode(ipId, t);
    }

    // ---------- ConditionBase: D8 onlyVault + D13 AlreadyConfigured + deployer-gated init ----------

    function test_onlyVault_reverts_for_nonFactory() public {
        vm.expectRevert(ConditionBase.NotVault.selector);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
    }

    function test_alreadyConfigured_blocks_reconfigure() public {
        vm.startPrank(FACTORY);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
        vm.expectRevert(ConditionBase.AlreadyConfigured.selector);
        sub.setConfigFromFactory(1, address(0xBAD), _subCfg(2 ether, 30 days, address(0xBAD)));
        vm.stopPrank();
    }

    function test_initialize_onlyDeployer_and_once() public {
        SubscriptionCondition s2 = new SubscriptionCondition(address(rm), WIP);
        vm.prank(address(0xBEEF));
        vm.expectRevert(ConditionBase.NotDeployer.selector);
        s2.initialize(FACTORY);
        s2.initialize(FACTORY); // deployer (this) succeeds
        vm.expectRevert(ConditionBase.AlreadyInitialized.selector);
        s2.initialize(FACTORY);
    }

    // ---------- CreatorWriteCondition (D15) ----------

    function test_write_gate() public {
        vm.prank(FACTORY);
        writeCond.setConfigFromFactory(7, CREATOR, "");
        assertTrue(writeCond.checkWriteCondition(7, "", "", CREATOR));
        assertFalse(writeCond.checkWriteCondition(7, "", "", BUYER));
        assertFalse(writeCond.checkWriteCondition(999, "", "", CREATOR)); // unconfigured
        assertFalse(writeCond.checkReadCondition(7, "", "", CREATOR)); // write-only
    }

    function test_write_rejects_nonempty_config() public {
        vm.prank(FACTORY);
        vm.expectRevert(CreatorWriteCondition.NonEmptyConfig.selector);
        writeCond.setConfigFromFactory(7, CREATOR, hex"1234");
    }

    // ---------- SubscriptionCondition (D12) native mode ----------

    function test_subscribe_grants_then_expires() public {
        vm.prank(FACTORY);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
        vm.deal(BUYER, 10 ether);
        vm.prank(BUYER);
        sub.subscribe{value: 1 ether}(1, 1, 1 ether);
        assertTrue(sub.checkReadCondition(1, "", "", BUYER));
        assertEq(sub.paidUntil(1, BUYER), block.timestamp + 30 days);
        vm.warp(block.timestamp + 31 days);
        assertFalse(sub.checkReadCondition(1, "", "", BUYER));
    }

    function test_subscribe_underpayment_reverts() public {
        vm.prank(FACTORY);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
        vm.deal(BUYER, 10 ether);
        vm.prank(BUYER);
        vm.expectRevert(SubscriptionCondition.InsufficientPayment.selector);
        sub.subscribe{value: 0.5 ether}(1, 1, 1 ether);
    }

    function test_subscribe_maxPrice_slippage_reverts() public {
        vm.prank(FACTORY);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
        vm.deal(BUYER, 10 ether);
        vm.prank(BUYER);
        vm.expectRevert(SubscriptionCondition.PriceExceedsMax.selector);
        sub.subscribe{value: 1 ether}(1, 1, 0.9 ether);
    }

    function test_subscribe_pays_payee_and_refunds_excess() public {
        vm.prank(FACTORY);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
        vm.deal(BUYER, 10 ether);
        uint256 payeeBefore = CREATOR.balance;
        vm.prank(BUYER);
        sub.subscribe{value: 1.5 ether}(1, 1, 1 ether);
        assertEq(CREATOR.balance, payeeBefore + 1 ether);
        assertEq(BUYER.balance, 9 ether); // 10 - 1 (0.5 excess refunded)
    }

    function test_renew_extends_from_current_expiry() public {
        vm.prank(FACTORY);
        sub.setConfigFromFactory(1, CREATOR, _subCfg(1 ether, 30 days, CREATOR));
        vm.deal(BUYER, 10 ether);
        vm.startPrank(BUYER);
        sub.subscribe{value: 1 ether}(1, 1, 1 ether);
        uint256 firstExpiry = sub.paidUntil(1, BUYER);
        sub.renew{value: 1 ether}(1, 1, 1 ether);
        assertEq(sub.paidUntil(1, BUYER), firstExpiry + 30 days); // stacked, no lost time
        vm.stopPrank();
    }

    // ---------- TierGateCondition ----------

    function test_tier_correct_tier_passes() public {
        vm.prank(FACTORY);
        tier.setConfigFromFactory(1, CREATOR, _tierCfg(IPID, 42));
        lt.set(100, BUYER, IPID, PIL, 42, false);
        assertTrue(tier.checkReadCondition(1, abi.encode(uint256(100)), "", BUYER));
    }

    function test_tier_wrong_tier_fails() public {
        vm.prank(FACTORY);
        tier.setConfigFromFactory(1, CREATOR, _tierCfg(IPID, 42));
        lt.set(100, BUYER, IPID, PIL, 7, false);
        assertFalse(tier.checkReadCondition(1, abi.encode(uint256(100)), "", BUYER));
    }

    function test_tier_nonowner_fails() public {
        vm.prank(FACTORY);
        tier.setConfigFromFactory(1, CREATOR, _tierCfg(IPID, 42));
        lt.set(100, address(0x999), IPID, PIL, 42, false);
        assertFalse(tier.checkReadCondition(1, abi.encode(uint256(100)), "", BUYER));
    }

    function test_tier_revoked_fails() public {
        vm.prank(FACTORY);
        tier.setConfigFromFactory(1, CREATOR, _tierCfg(IPID, 42));
        lt.set(100, BUYER, IPID, PIL, 42, true);
        assertFalse(tier.checkReadCondition(1, abi.encode(uint256(100)), "", BUYER));
    }

    function test_tier_bad_aux_returns_false_not_revert() public {
        vm.prank(FACTORY);
        tier.setConfigFromFactory(1, CREATOR, _tierCfg(IPID, 42));
        assertFalse(tier.checkReadCondition(1, "", "", BUYER)); // empty aux → decode panic → false
        assertFalse(tier.checkReadCondition(1, abi.encode(uint256(12345)), "", BUYER)); // nonexistent token → false
    }

    function test_tier_unconfigured_returns_false() public view {
        assertFalse(tier.checkReadCondition(999, abi.encode(uint256(1)), "", BUYER));
    }
}
