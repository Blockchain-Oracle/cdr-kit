// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @title ICdrCondition
/// @notice The condition interface the Story CDR precompile calls to gate vault read/write.
/// @dev VERIFIED ON-CHAIN (2026-05-28): the live precompile dispatcher contains selector
///      0x8db3eb17 = checkReadCondition(uint32,bytes,bytes,address) — the 4-param, uuid-first
///      shape. The 3-param shape shown in the docs is dead. Param order: (uuid, accessAuxData,
///      conditionData, caller). Conditions are evaluated at write/read time, NOT at allocate.
interface ICdrCondition {
    function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata conditionData, address caller)
        external
        view
        returns (bool);

    function checkWriteCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata conditionData, address caller)
        external
        view
        returns (bool);
}

/// @title ICdrConfigurable
/// @notice Factory-facing configuration entrypoint (D14). Generic (uuid, creator, bytes) so the
///         CdrKitVault factory can configure ANY condition uniformly. Each condition abi.decodes
///         `config` into its own params; `creator` is always the explicit arg, never inside config.
interface ICdrConfigurable {
    function setConfigFromFactory(uint32 uuid, address creator, bytes calldata config) external;
}
