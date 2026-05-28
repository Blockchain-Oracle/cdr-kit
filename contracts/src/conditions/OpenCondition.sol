// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title OpenCondition
/// @notice Always-allow condition (4-param interface). Useful for public vaults, tests, and the
///         E0 on-chain interface-verification probe. NOT for gating anything real.
contract OpenCondition is ICdrCondition {
    function checkReadCondition(uint32, bytes calldata, bytes calldata, address) external pure returns (bool) {
        return true;
    }

    function checkWriteCondition(uint32, bytes calldata, bytes calldata, address) external pure returns (bool) {
        return true;
    }
}
