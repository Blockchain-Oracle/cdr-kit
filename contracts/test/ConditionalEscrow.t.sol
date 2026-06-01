// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {ConditionBase} from "../src/base/ConditionBase.sol";
import {ConditionalEscrowCondition} from "../src/conditions/ConditionalEscrowCondition.sol";

contract ConditionalEscrowTest is Test {
    address constant FACTORY = address(0xFAC);
    address constant CREATOR = address(0xC0FFEE);
    address payable constant SELLER = payable(address(0x5E11E5));
    address payable constant BUYER = payable(address(0xB0B));
    address payable constant ARBITER = payable(address(0xA8B17E5));

    uint128 constant PRICE = 1 ether;
    uint64 constant TIMEOUT = 1 days;

    ConditionalEscrowCondition cond;

    function setUp() public {
        cond = new ConditionalEscrowCondition();
        cond.initialize(FACTORY);
        vm.warp(1_700_000_000);
        vm.deal(BUYER, 10 ether);
        vm.deal(ARBITER, 1 ether);
    }

    function _cfg(address seller, uint128 price, uint64 timeoutSecs, address arbiter)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(seller, price, timeoutSecs, arbiter);
    }

    function _configure(uint32 uuid, address arbiter) internal {
        vm.prank(FACTORY);
        cond.setConfigFromFactory(uuid, CREATOR, _cfg(SELLER, PRICE, TIMEOUT, arbiter));
    }

    // ---------- happy path: pay → confirmDelivery → seller paid + buyer reads ----------

    function test_happy_path() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        assertEq(BUYER.balance, 10 ether - PRICE);
        assertEq(SELLER.balance, 0);

        vm.prank(BUYER);
        cond.confirmDelivery(1);
        assertEq(SELLER.balance, PRICE, "seller paid on delivery confirmation");
        assertTrue(cond.checkReadCondition(1, "", "", BUYER), "buyer reads after delivery");
        assertTrue(cond.checkReadCondition(1, "", "", SELLER), "seller always reads");
    }

    // ---------- pay validation ----------

    function test_pay_refunds_excess() public {
        _configure(1, address(0));
        uint256 balBefore = BUYER.balance;
        vm.prank(BUYER);
        cond.pay{value: PRICE + 0.5 ether}(1);
        // excess refunded same tx → buyer's balance dropped by exactly PRICE.
        assertEq(BUYER.balance, balBefore - PRICE, "excess must be refunded");
    }

    function test_pay_rejects_underpayment() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        vm.expectRevert(ConditionalEscrowCondition.Underpaid.selector);
        cond.pay{value: PRICE - 1}(1);
    }

    function test_pay_rejects_double_pay() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.prank(BUYER);
        vm.expectRevert(ConditionalEscrowCondition.AlreadyPaid.selector);
        cond.pay{value: PRICE}(1);
    }

    function test_pay_rejects_unconfigured() public {
        vm.prank(BUYER);
        vm.expectRevert(ConditionalEscrowCondition.NotConfigured.selector);
        cond.pay{value: PRICE}(999);
    }

    // ---------- pre-confirm access control ----------

    function test_buyer_denied_before_confirm() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        assertFalse(cond.checkReadCondition(1, "", "", BUYER), "buyer cannot read pre-confirm");
    }

    function test_unpaid_buyer_denied() public {
        _configure(1, address(0));
        assertFalse(cond.checkReadCondition(1, "", "", BUYER));
    }

    // ---------- timeout path ----------

    function test_claimAfterTimeout_releases_to_seller_and_grants_buyer_access() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);

        vm.warp(block.timestamp + TIMEOUT + 1);
        vm.prank(SELLER);
        cond.claimAfterTimeout(1, BUYER);

        assertEq(SELLER.balance, PRICE);
        assertTrue(cond.checkReadCondition(1, "", "", BUYER), "buyer reads after timeout claim");
    }

    function test_claimAfterTimeout_rejects_non_seller() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.warp(block.timestamp + TIMEOUT + 1);
        vm.prank(BUYER);
        vm.expectRevert(ConditionalEscrowCondition.NotSeller.selector);
        cond.claimAfterTimeout(1, BUYER);
    }

    function test_claimAfterTimeout_rejects_too_early() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.warp(block.timestamp + TIMEOUT - 1);
        vm.prank(SELLER);
        vm.expectRevert(ConditionalEscrowCondition.TooEarly.selector);
        cond.claimAfterTimeout(1, BUYER);
    }

    function test_claimAfterTimeout_rejects_unpaid_buyer() public {
        _configure(1, address(0));
        vm.warp(block.timestamp + TIMEOUT + 1);
        vm.prank(SELLER);
        vm.expectRevert(ConditionalEscrowCondition.NotPaid.selector);
        cond.claimAfterTimeout(1, BUYER);
    }

    // ---------- arbiter refund ----------

    function test_arbiterRefund_returns_to_buyer_and_blocks_read() public {
        _configure(1, ARBITER);
        uint256 buyerBefore = BUYER.balance;
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);

        vm.prank(ARBITER);
        cond.arbiterRefund(1, BUYER);

        assertEq(BUYER.balance, buyerBefore, "buyer fully refunded");
        assertEq(SELLER.balance, 0, "seller not paid");
        assertFalse(cond.checkReadCondition(1, "", "", BUYER), "buyer cannot read after refund");
    }

    function test_arbiterRefund_rejects_non_arbiter() public {
        _configure(1, ARBITER);
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.prank(BUYER);
        vm.expectRevert(ConditionalEscrowCondition.NotArbiter.selector);
        cond.arbiterRefund(1, BUYER);
    }

    function test_arbiterRefund_rejects_when_no_arbiter_configured() public {
        _configure(1, address(0));
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.prank(ARBITER);
        vm.expectRevert(ConditionalEscrowCondition.NoArbiter.selector);
        cond.arbiterRefund(1, BUYER);
    }

    function test_arbiterRefund_allows_buyer_to_repay() public {
        _configure(1, ARBITER);
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.prank(ARBITER);
        cond.arbiterRefund(1, BUYER);
        // paidAt reset → buyer can pay again.
        vm.prank(BUYER);
        cond.pay{value: PRICE}(1);
        vm.prank(BUYER);
        cond.confirmDelivery(1);
        assertEq(SELLER.balance, PRICE);
    }

    // ---------- write condition ----------

    function test_writeCondition_seller_only() public {
        _configure(1, address(0));
        assertTrue(cond.checkWriteCondition(1, "", "", SELLER));
        assertFalse(cond.checkWriteCondition(1, "", "", BUYER));
        assertFalse(cond.checkWriteCondition(1, "", "", CREATOR));
    }

    // ---------- ConditionBase invariants ----------

    function test_reconfigure_rejected() public {
        _configure(1, address(0));
        vm.prank(FACTORY);
        vm.expectRevert(ConditionBase.AlreadyConfigured.selector);
        cond.setConfigFromFactory(1, CREATOR, _cfg(SELLER, PRICE * 2, TIMEOUT, address(0)));
    }
}
