// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title CreatorWriteCondition
/// @notice The fixed MVP write gate (D15): only the configured creator may write to the vault.
///         Generalizes the demo's VaultWriteCondition but with the same anti-spoof rules as the
///         read conditions (onlyVault + AlreadyConfigured + revert-safe-false). config must be empty
///         (creator comes from the explicit arg).
contract CreatorWriteCondition is ConditionBase {
    error NonEmptyConfig();

    function _store(uint32, bytes calldata config) internal pure override {
        if (config.length != 0) revert NonEmptyConfig();
        // creator already recorded by ConditionBase from the explicit arg
    }

    /// @inheritdoc ICdrCondition
    function checkWriteCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        return caller == creator[uuid];
    }

    /// @inheritdoc ICdrCondition
    function checkReadCondition(uint32, bytes calldata, bytes calldata, address)
        external
        pure
        override
        returns (bool)
    {
        return false; // write-only gate
    }
}
