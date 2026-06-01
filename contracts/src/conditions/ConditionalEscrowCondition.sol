// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title ConditionalEscrowCondition
/// @notice Payment-gated read with a delivery confirmation step. Three paths to read access:
///         (1) buyer pays via `pay()` then signs off via `confirmDelivery()` — funds release to seller, buyer reads.
///         (2) buyer pays and goes silent — after `timeoutSecs`, seller calls `claimAfterTimeout(buyer)` — seller paid, buyer reads.
///         (3) buyer pays, disputes — arbiter (if configured) calls `arbiterRefund(buyer)` — buyer refunded, no read.
///         Seller can always read their own data (in case they need to inspect what they sold).
/// @dev    INTRINSIC LIMITATION: CDR has no confidential compute. Once a buyer pays + confirms +
///         reads, they hold plaintext forever. The dispute path can revoke FUTURE access but cannot
///         "un-read." Document this in every consumer UI. Don't sell anything to a counterparty whose
///         downstream behavior matters more than the one-shot payment.
contract ConditionalEscrowCondition is ConditionBase {
    struct Listing {
        address seller;
        uint128 price; // wei (native IP)
        uint64 timeoutSecs; // after `paidAt + timeoutSecs`, seller can unilaterally claim
        address arbiter; // address(0) = no arbiter (no refund path)
    }

    mapping(uint32 => Listing) public listing;
    /// @notice uuid => buyer => paidAt timestamp (0 = not paid)
    mapping(uint32 => mapping(address => uint64)) public paidAt;
    /// @notice uuid => buyer => delivery confirmed (grants read access)
    mapping(uint32 => mapping(address => bool)) public delivered;

    // 1 = unlocked, 2 = locked (cheaper than 0/1 toggle; lifted from SubscriptionCondition.sol:60).
    uint256 private _lock = 1;

    error NotConfigured();
    error Underpaid();
    error AlreadyPaid();
    error NotPaid();
    error NotSeller();
    error NotArbiter();
    error NoArbiter();
    error TooEarly();
    error TransferFailed();
    error Reentrancy();

    event Paid(uint32 indexed uuid, address indexed buyer, uint256 amount);
    event Delivered(uint32 indexed uuid, address indexed buyer);
    event TimedOut(uint32 indexed uuid, address indexed buyer);
    event Refunded(uint32 indexed uuid, address indexed buyer);

    modifier nonReentrant() {
        if (_lock == 2) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    /// @dev config = abi.encode(address seller, uint128 price, uint64 timeoutSecs, address arbiter)
    function _store(uint32 uuid, bytes calldata config) internal override {
        (address seller, uint128 price, uint64 timeoutSecs, address arbiter) =
            abi.decode(config, (address, uint128, uint64, address));
        listing[uuid] = Listing(seller, price, timeoutSecs, arbiter);
    }

    /// @notice Buyer escrows the listing price. Excess `msg.value > price` is refunded immediately
    ///         in the same tx (CEI ordering — `paidAt` set before any external call).
    function pay(uint32 uuid) external payable nonReentrant {
        if (!_configured(uuid)) revert NotConfigured();
        Listing storage l = listing[uuid];
        if (msg.value < l.price) revert Underpaid();
        if (paidAt[uuid][msg.sender] != 0) revert AlreadyPaid();

        // Effects first.
        paidAt[uuid][msg.sender] = uint64(block.timestamp);
        emit Paid(uuid, msg.sender, l.price);

        // Interaction: refund excess to buyer. Funds for `price` stay escrowed.
        uint256 excess = msg.value - l.price;
        if (excess > 0) _send(msg.sender, excess);
    }

    /// @notice Buyer confirms delivery → funds release to seller, buyer can now read.
    function confirmDelivery(uint32 uuid) external nonReentrant {
        if (paidAt[uuid][msg.sender] == 0) revert NotPaid();
        // Effects.
        delivered[uuid][msg.sender] = true;
        emit Delivered(uuid, msg.sender);
        // Interaction.
        _send(listing[uuid].seller, listing[uuid].price);
    }

    /// @notice Seller can claim unilaterally after `timeoutSecs` of buyer silence — buyer gets read access too
    ///         (preventing the "I paid, seller went radio silent, I have neither funds nor data" failure mode).
    function claimAfterTimeout(uint32 uuid, address buyer) external nonReentrant {
        Listing storage l = listing[uuid];
        if (msg.sender != l.seller) revert NotSeller();
        uint64 paid = paidAt[uuid][buyer];
        if (paid == 0) revert NotPaid();
        if (block.timestamp < uint256(paid) + l.timeoutSecs) revert TooEarly();
        // Effects.
        delivered[uuid][buyer] = true;
        emit TimedOut(uuid, buyer);
        // Interaction.
        _send(l.seller, l.price);
    }

    /// @notice Arbiter cancels the deal → buyer refunded, never gets read access.
    function arbiterRefund(uint32 uuid, address buyer) external nonReentrant {
        Listing storage l = listing[uuid];
        if (l.arbiter == address(0)) revert NoArbiter();
        if (msg.sender != l.arbiter) revert NotArbiter();
        if (paidAt[uuid][buyer] == 0) revert NotPaid();
        // Effects: reset paid status so the buyer can re-pay later if they want, and so a second
        // arbiterRefund call against the same buyer cannot drain the escrow.
        paidAt[uuid][buyer] = 0;
        emit Refunded(uuid, buyer);
        // Interaction.
        _send(buyer, l.price);
    }

    function _send(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @inheritdoc ICdrCondition
    /// @dev Seller always; buyer iff `delivered`.
    function checkReadCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        if (caller == listing[uuid].seller) return true;
        return delivered[uuid][caller];
    }

    /// @inheritdoc ICdrCondition
    /// @dev Seller-only writes (so they can update the underlying file if needed before delivery).
    function checkWriteCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        return caller == listing[uuid].seller;
    }
}
