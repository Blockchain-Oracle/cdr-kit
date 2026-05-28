// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ICdrCondition, ICdrConfigurable} from "../interfaces/ICdrCondition.sol";

/// @title ConditionBase
/// @notice Shared registration + access control for cdr-kit conditions.
/// @dev Anti-spoof model (D8/D13):
///      - layer 1: `AlreadyConfigured` — first-write-wins per uuid (cannot reconfigure).
///      - layer 2: `onlyVault` — only the paired CdrKitVault factory may configure.
///      (layer 3 — asserting CDR.vaultOwner(uuid)==factory — is NOT available: the CDR Vault
///       struct exposes no owner/allocator field. So conditions are deployed paired 1:1 with one
///       factory via `initialize`, which is deployer-gated to prevent a rogue first-initialize.)
///      `creator` is recorded from the explicit `setConfigFromFactory` arg (D14), never from config.
abstract contract ConditionBase is ICdrCondition, ICdrConfigurable {
    /// @notice The deployer, allowed to bind the factory exactly once.
    address public immutable deployer;
    /// @notice The paired CdrKitVault; the only address allowed to configure conditions.
    address public factory;
    /// @notice uuid => configured creator. address(0) means unconfigured.
    mapping(uint32 => address) public creator;

    error NotDeployer();
    error AlreadyInitialized();
    error NotVault();
    error AlreadyConfigured();

    event Configured(uint32 indexed uuid, address indexed creator);

    constructor() {
        deployer = msg.sender;
    }

    /// @notice Bind the paired factory once. Deployer-gated so it cannot be front-run.
    function initialize(address factory_) external {
        if (msg.sender != deployer) revert NotDeployer();
        if (factory != address(0)) revert AlreadyInitialized();
        factory = factory_;
    }

    modifier onlyVault() {
        if (msg.sender != factory) revert NotVault();
        _;
    }

    /// @inheritdoc ICdrConfigurable
    function setConfigFromFactory(uint32 uuid, address creator_, bytes calldata config) external onlyVault {
        if (creator[uuid] != address(0)) revert AlreadyConfigured();
        creator[uuid] = creator_;
        _store(uuid, config);
        emit Configured(uuid, creator_);
    }

    /// @dev Decode `config` and persist condition-specific state for `uuid`.
    function _store(uint32 uuid, bytes calldata config) internal virtual;

    /// @dev True once the uuid has been configured by the factory.
    function _configured(uint32 uuid) internal view returns (bool) {
        return creator[uuid] != address(0);
    }
}
