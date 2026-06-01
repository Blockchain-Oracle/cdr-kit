// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title TimeWindowCondition
/// @notice Read access gated by an absolute time (or block) window: `[startTs, endTs]`.
///         Three creator-side presets shipped from the cdr-kit agent package:
///           - release-on-date  → `(start, 0, false)` — open-ended after `start`
///           - available-during → `(start, end, false)` — bounded window
///           - release-after-blocks → `(0, blockNum, true)` — block-based release
///         `endTs == 0` means open-ended (no upper bound). Write is creator-only via the paired
///         `CreatorWriteCondition`; this contract gates reads only.
/// @dev    `block.timestamp` is miner-influenced on Story (~12s blocks); for ICO-grade precision
///         set `blockBased = true`. `block.number` casts to `uint64` only overflow far past the
///         heat-death of the universe.
contract TimeWindowCondition is ConditionBase {
    struct Window {
        uint64 startTs; // start timestamp OR start block (depending on `blockBased`)
        uint64 endTs; // end (0 = open-ended)
        bool blockBased;
    }

    mapping(uint32 => Window) public window;

    error BadWindow();

    /// @dev config = abi.encode(uint64 startTs, uint64 endTs, bool blockBased)
    function _store(uint32 uuid, bytes calldata config) internal override {
        (uint64 startTs, uint64 endTs, bool blockBased) = abi.decode(config, (uint64, uint64, bool));
        if (endTs != 0 && endTs <= startTs) revert BadWindow();
        window[uuid] = Window(startTs, endTs, blockBased);
    }

    /// @inheritdoc ICdrCondition
    function checkReadCondition(uint32 uuid, bytes calldata, bytes calldata, address)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        Window storage w = window[uuid];
        uint256 now_ = w.blockBased ? block.number : block.timestamp;
        if (now_ < w.startTs) return false;
        if (w.endTs != 0 && now_ > w.endTs) return false;
        return true;
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
