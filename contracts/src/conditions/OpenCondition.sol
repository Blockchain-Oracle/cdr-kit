// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title OpenCondition
/// @notice Always-allow read+write gate. Useful for public vaults, tests, and the on-chain
///         interface-verification probe. For real access control, use any other condition.
/// @dev Inherits {ConditionBase} so the cdr-kit factory can configure it via
///      `setConfigFromFactory`. Pre-0.7.1 OpenCondition implemented only `ICdrCondition`
///      directly, which made `CdrKitVault.createVault` revert when passed as
///      `readConditionAddr` (the factory's `_configure` step calls `setConfigFromFactory`
///      on every condition). config must be empty (no parameters required).
contract OpenCondition is ConditionBase {
    error NonEmptyConfig();

    function _store(uint32, bytes calldata config) internal pure override {
        if (config.length != 0) revert NonEmptyConfig();
    }

    /// @inheritdoc ICdrCondition
    function checkReadCondition(uint32, bytes calldata, bytes calldata, address)
        external
        pure
        override
        returns (bool)
    {
        return true;
    }

    /// @inheritdoc ICdrCondition
    function checkWriteCondition(uint32, bytes calldata, bytes calldata, address)
        external
        pure
        override
        returns (bool)
    {
        return true;
    }
}
