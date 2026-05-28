// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

interface IERC20Min {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IRoyaltyModuleMin {
    function payRoyaltyOnBehalf(address receiverIpId, address payerIpId, address token, uint256 amount) external;
    function isWhitelistedRoyaltyToken(address token) external view returns (bool);
}

/// @title SubscriptionCondition
/// @notice Recurring, auto-expiring read access (the net-new condition the demo's pay-once
///         FixedFeeCondition lacks). Story has no native per-token expiry, so expiry is tracked here
///         in `paidUntil`. Two payment modes (D12): NativeIP (pay $IP to the payee) or WipRoyalty
///         (pull WIP, route through Story's RoyaltyModule to the licensor IP). Read condition only.
contract SubscriptionCondition is ConditionBase {
    enum Mode {
        NativeIP,
        WipRoyalty
    }

    struct Plan {
        uint256 pricePerPeriod;
        uint256 period; // seconds
        address payee; // NativeIP recipient
        Mode mode;
        address licensorIpId; // WipRoyalty receiver IP
    }

    IRoyaltyModuleMin public immutable royaltyModule;
    address public immutable wip;

    mapping(uint32 => Plan) public plan;
    mapping(uint32 => mapping(address => uint256)) public paidUntil;

    uint256 private constant MAX_PERIODS = 1000;
    uint256 private _lock = 1; // 1 = unlocked, 2 = locked (cheaper than 0/1 toggle)

    error NotConfigured();
    error BadPeriods();
    error PriceExceedsMax();
    error InsufficientPayment();
    error TransferFailed();
    error TokenNotWhitelisted();
    error Reentrancy();

    event Subscribed(uint32 indexed uuid, address indexed subscriber, uint256 paidUntil);

    constructor(address royaltyModule_, address wip_) {
        royaltyModule = IRoyaltyModuleMin(royaltyModule_);
        wip = wip_;
    }

    modifier nonReentrant() {
        if (_lock == 2) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    /// @dev config = abi.encode(uint256 pricePerPeriod, uint256 period, address payee, uint8 mode, address licensorIpId)
    function _store(uint32 uuid, bytes calldata config) internal override {
        (uint256 pricePerPeriod, uint256 period, address payee, uint8 mode, address licensorIpId) =
            abi.decode(config, (uint256, uint256, address, uint8, address));
        if (Mode(mode) == Mode.WipRoyalty && !royaltyModule.isWhitelistedRoyaltyToken(wip)) {
            revert TokenNotWhitelisted();
        }
        plan[uuid] = Plan(pricePerPeriod, period, payee, Mode(mode), licensorIpId);
    }

    function subscribe(uint32 uuid, uint256 periods, uint256 maxPricePerPeriod) external payable nonReentrant {
        _subscribe(uuid, periods, maxPricePerPeriod);
    }

    function renew(uint32 uuid, uint256 periods, uint256 maxPricePerPeriod) external payable nonReentrant {
        _subscribe(uuid, periods, maxPricePerPeriod);
    }

    function _subscribe(uint32 uuid, uint256 periods, uint256 maxPricePerPeriod) internal {
        if (!_configured(uuid)) revert NotConfigured();
        if (periods == 0 || periods > MAX_PERIODS) revert BadPeriods();
        Plan storage p = plan[uuid];
        if (p.pricePerPeriod > maxPricePerPeriod) revert PriceExceedsMax();
        uint256 cost = p.pricePerPeriod * periods;

        // ---- effects (CEI): extend expiry from max(now, current) before any external call ----
        uint256 current = paidUntil[uuid][msg.sender];
        uint256 start = current > block.timestamp ? current : block.timestamp;
        uint256 newExpiry = start + p.period * periods;
        paidUntil[uuid][msg.sender] = newExpiry;

        // ---- interactions ----
        if (p.mode == Mode.NativeIP) {
            if (msg.value < cost) revert InsufficientPayment();
            _send(p.payee, cost);
            uint256 excess = msg.value - cost;
            if (excess > 0) _send(msg.sender, excess);
        } else {
            // WipRoyalty: pull WIP from subscriber, route to the licensor IP's royalty vault.
            // payerIpId = address(0): subscriber is an EOA with no payer IP. Verify in OQ8 e2e.
            if (!IERC20Min(wip).transferFrom(msg.sender, address(this), cost)) revert TransferFailed();
            IERC20Min(wip).approve(address(royaltyModule), cost);
            royaltyModule.payRoyaltyOnBehalf(p.licensorIpId, address(0), wip, cost);
        }
        emit Subscribed(uuid, msg.sender, newExpiry);
    }

    function _send(address to, uint256 amount) private {
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @inheritdoc ICdrCondition
    function checkReadCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        return paidUntil[uuid][caller] > block.timestamp;
    }

    /// @inheritdoc ICdrCondition
    function checkWriteCondition(uint32, bytes calldata, bytes calldata, address)
        external
        pure
        override
        returns (bool)
    {
        return false; // read-only gate
    }
}
