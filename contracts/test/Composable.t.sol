// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {ComposableCondition} from "../src/conditions/ComposableCondition.sol";
import {ICdrCondition} from "../src/interfaces/ICdrCondition.sol";

/// @dev A controllable child condition for composition tests.
contract MockChild is ICdrCondition {
    bool public result;
    bool public doRevert;

    function setResult(bool r) external {
        result = r;
    }

    function setRevert(bool d) external {
        doRevert = d;
    }

    function checkReadCondition(uint32, bytes calldata, bytes calldata, address) external view returns (bool) {
        require(!doRevert, "child revert");
        return result;
    }

    function checkWriteCondition(uint32, bytes calldata, bytes calldata, address) external pure returns (bool) {
        return false;
    }
}

contract ComposableTest is Test {
    address constant FACTORY = address(0xFAC);
    address constant CREATOR = address(0xC0FFEE);
    address constant BUYER = address(0xB0B);

    ComposableCondition comp;
    MockChild a;
    MockChild b;

    function setUp() public {
        comp = new ComposableCondition();
        comp.initialize(FACTORY);
        a = new MockChild();
        b = new MockChild();
    }

    function _cfg(uint8 mode, address c1, address c2) internal pure returns (bytes memory) {
        address[] memory ch = new address[](2);
        ch[0] = c1;
        ch[1] = c2;
        return abi.encode(mode, ch);
    }

    function _aux2() internal pure returns (bytes memory) {
        bytes[] memory perChild = new bytes[](2);
        perChild[0] = "";
        perChild[1] = "";
        return abi.encode(perChild);
    }

    function _configAnd() internal {
        vm.prank(FACTORY);
        comp.setConfigFromFactory(1, CREATOR, _cfg(0, address(a), address(b))); // 0 = AND
    }

    function _configOr() internal {
        vm.prank(FACTORY);
        comp.setConfigFromFactory(1, CREATOR, _cfg(1, address(a), address(b))); // 1 = OR
    }

    function test_and_requires_all() public {
        _configAnd();
        a.setResult(true);
        b.setResult(true);
        assertTrue(comp.checkReadCondition(1, _aux2(), "", BUYER));
        b.setResult(false);
        assertFalse(comp.checkReadCondition(1, _aux2(), "", BUYER));
    }

    function test_or_requires_any() public {
        _configOr();
        a.setResult(false);
        b.setResult(false);
        assertFalse(comp.checkReadCondition(1, _aux2(), "", BUYER));
        b.setResult(true);
        assertTrue(comp.checkReadCondition(1, _aux2(), "", BUYER));
    }

    function test_reverting_child_counts_as_false_not_abort() public {
        _configOr();
        a.setRevert(true); // a reverts
        b.setResult(true); // b passes → OR should still be true
        assertTrue(comp.checkReadCondition(1, _aux2(), "", BUYER));
    }

    function test_bad_aux_returns_false() public {
        _configAnd();
        a.setResult(true);
        b.setResult(true);
        assertFalse(comp.checkReadCondition(1, "", "", BUYER)); // empty aux → decode panic → false
        // wrong length aux (1 instead of 2) → length mismatch → false
        bytes[] memory one = new bytes[](1);
        one[0] = "";
        assertFalse(comp.checkReadCondition(1, abi.encode(one), "", BUYER));
    }

    function test_unconfigured_returns_false() public view {
        assertFalse(comp.checkReadCondition(999, _aux2(), "", BUYER));
    }

    function test_too_many_children_reverts() public {
        address[] memory ch = new address[](9); // > MAX_CHILDREN (8)
        for (uint256 i; i < 9; i++) {
            ch[i] = address(a);
        }
        vm.prank(FACTORY);
        vm.expectRevert(ComposableCondition.TooManyChildren.selector);
        comp.setConfigFromFactory(1, CREATOR, abi.encode(uint8(0), ch));
    }

    function test_no_children_reverts() public {
        address[] memory ch = new address[](0);
        vm.prank(FACTORY);
        vm.expectRevert(ComposableCondition.NoChildren.selector);
        comp.setConfigFromFactory(1, CREATOR, abi.encode(uint8(0), ch));
    }

    function test_nested_composable_rejected() public {
        ComposableCondition inner = new ComposableCondition();
        vm.prank(FACTORY);
        vm.expectRevert(ComposableCondition.NestedComposableNotAllowed.selector);
        comp.setConfigFromFactory(1, CREATOR, _cfg(0, address(inner), address(a)));
    }
}
