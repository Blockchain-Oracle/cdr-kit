// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {CdrKitVault} from "../src/CdrKitVault.sol";
import {SubscriptionCondition} from "../src/conditions/SubscriptionCondition.sol";
import {ComposableCondition} from "../src/conditions/ComposableCondition.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";

contract MockCDR {
    uint32 public next = 1000;

    function allocateFee() external pure returns (uint256) {
        return 0;
    }

    function allocate(bool, address, address, bytes calldata, bytes calldata) external payable returns (uint32) {
        return next++;
    }
}

contract MockIPAssetRegistry {
    function register(uint256, address tokenContract, uint256 tokenId) external pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encode(tokenContract, tokenId)))));
    }
}

contract MockLicensingModule {
    function attachLicenseTerms(address, address, uint256) external {}

    function mintLicenseTokens(address, address, uint256, uint256, address, bytes calldata, uint256, uint32)
        external
        pure
        returns (uint256)
    {
        return 555;
    }
}

contract CdrKitVaultTest is Test {
    address constant CREATOR = address(0xC0FFEE);
    address constant BUYER = address(0xB0B);
    address constant PIL = address(0x5151);
    address constant WIP = address(0x4141);

    CdrKitVault vault;
    MockCDR cdr;
    MockIPAssetRegistry reg;
    MockLicensingModule lic;
    SubscriptionCondition sub;

    function setUp() public {
        cdr = new MockCDR();
        reg = new MockIPAssetRegistry();
        lic = new MockLicensingModule();
        vault = new CdrKitVault(address(cdr), address(reg), address(lic), PIL, 1);
        // read condition, bound to trust this factory
        sub = new SubscriptionCondition(address(0xAA), WIP);
        sub.initialize(address(vault));
    }

    function _subCfg() internal pure returns (bytes memory) {
        return abi.encode(uint256(1 ether), uint256(30 days), CREATOR, uint8(0), address(0));
    }

    function test_createVault_wires_everything_atomically() public {
        address[] memory noChildren = new address[](0);
        bytes[] memory noCfgs = new bytes[](0);

        vm.prank(CREATOR);
        (uint256 tokenId, uint32 uuid, address ipId) = vault.createVault(address(sub), _subCfg(), noChildren, noCfgs, 0);

        // NFT minted to the factory (so it stays IP owner)
        assertEq(vault.ownerOf(tokenId), address(vault));
        // mappings recorded
        assertEq(vault.tokenToVault(tokenId), uuid);
        assertEq(vault.tokenCreator(tokenId), CREATOR);
        assertEq(vault.vaultToToken(uuid), tokenId);
        assertTrue(ipId != address(0));
        // both conditions configured for the uuid, creator = CREATOR
        assertEq(sub.creator(uuid), CREATOR);
        assertEq(vault.WRITE_CONDITION().creator(uuid), CREATOR);
        // write gate: only creator may write
        assertTrue(vault.WRITE_CONDITION().checkWriteCondition(uuid, "", "", CREATOR));
        assertFalse(vault.WRITE_CONDITION().checkWriteCondition(uuid, "", "", BUYER));
    }

    function test_createVault_records_creatorVaults_and_defaultTerms() public {
        address[] memory none = new address[](0);
        bytes[] memory noneB = new bytes[](0);
        vm.startPrank(CREATOR);
        (uint256 t1,,) = vault.createVault(address(sub), _subCfg(), none, noneB, 0);
        vm.stopPrank();
        uint256[] memory mine = vault.getCreatorVaults(CREATOR);
        assertEq(mine.length, 1);
        assertEq(mine[0], t1);
        (,,, uint256 terms) = vault.getVaultInfo(t1);
        assertEq(terms, 1); // default (passed 0 -> defaultLicenseTermsId=1)
    }

    function test_directConfig_bypassing_factory_reverts() public {
        // an attacker cannot configure the condition directly (onlyVault)
        vm.prank(address(0xBAD));
        vm.expectRevert(ConditionBase.NotVault.selector);
        sub.setConfigFromFactory(123, address(0xBAD), _subCfg());
    }

    function test_mintLicenseTokens_onlyCreator() public {
        address[] memory none = new address[](0);
        bytes[] memory noneB = new bytes[](0);
        vm.prank(CREATOR);
        (uint256 tokenId,,) = vault.createVault(address(sub), _subCfg(), none, noneB, 0);

        vm.prank(BUYER);
        vm.expectRevert(CdrKitVault.NotCreator.selector);
        vault.mintLicenseTokens(tokenId, 1, BUYER);

        vm.prank(CREATOR);
        uint256 startId = vault.mintLicenseTokens(tokenId, 1, BUYER);
        assertEq(startId, 555);
    }

    function test_createVault_composable_configures_children_first() public {
        // Composable read condition over two subscription children, all bound to this factory.
        ComposableCondition comp = new ComposableCondition();
        comp.initialize(address(vault));
        SubscriptionCondition childA = new SubscriptionCondition(address(0xAA), WIP);
        SubscriptionCondition childB = new SubscriptionCondition(address(0xAA), WIP);
        childA.initialize(address(vault));
        childB.initialize(address(vault));

        address[] memory children = new address[](2);
        children[0] = address(childA);
        children[1] = address(childB);
        bytes[] memory childCfgs = new bytes[](2);
        childCfgs[0] = _subCfg();
        childCfgs[1] = _subCfg();

        address[] memory compChildren = new address[](2);
        compChildren[0] = address(childA);
        compChildren[1] = address(childB);
        bytes memory compCfg = abi.encode(uint8(0), compChildren); // AND

        vm.prank(CREATOR);
        (, uint32 uuid,) = vault.createVault(address(comp), compCfg, children, childCfgs, 0);

        // children configured for the same uuid, then the parent
        assertEq(childA.creator(uuid), CREATOR);
        assertEq(childB.creator(uuid), CREATOR);
        assertEq(comp.creator(uuid), CREATOR);
        (uint8 mode, address[] memory cs) = comp.combo(uuid);
        assertEq(mode, 0);
        assertEq(cs.length, 2);
    }

    function test_length_mismatch_reverts() public {
        address[] memory children = new address[](1);
        children[0] = address(sub);
        bytes[] memory childCfgs = new bytes[](0); // mismatch
        vm.prank(CREATOR);
        vm.expectRevert(CdrKitVault.LengthMismatch.selector);
        vault.createVault(address(sub), _subCfg(), children, childCfgs, 0);
    }
}
