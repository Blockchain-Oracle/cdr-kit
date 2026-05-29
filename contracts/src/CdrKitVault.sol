// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICdrConfigurable} from "./interfaces/ICdrCondition.sol";
import {CreatorWriteCondition} from "./conditions/CreatorWriteCondition.sol";

/// @dev Minimal external interfaces (avoid importing the whole Story stack).
interface ICDR {
    function allocate(
        bool updatable,
        address writeConditionAddr,
        address readConditionAddr,
        bytes calldata writeConditionData,
        bytes calldata readConditionData
    ) external payable returns (uint32 newVaultUuid);
    function allocateFee() external view returns (uint256);
}

interface IIPAssetRegistry {
    function register(uint256 chainid, address tokenContract, uint256 tokenId) external returns (address id);
}

interface ILicensingModule {
    function attachLicenseTerms(address ipId, address licenseTemplate, uint256 licenseTermsId) external;
    function mintLicenseTokens(
        address licensorIpId,
        address licenseTemplate,
        uint256 licenseTermsId,
        uint256 amount,
        address receiver,
        bytes calldata royaltyContext,
        uint256 maxMintingFee,
        uint32 maxRevenueShare
    ) external returns (uint256 startLicenseTokenId);
}

/// @title CdrKitVault
/// @notice One-tx factory: mint an NFT, register it as a Story IP asset, allocate a CDR vault with
///         a pluggable read condition + a fixed creator-only write condition (D15), atomically
///         configure the conditions for the new uuid (D8/D13/D14 — closes the front-running window),
///         and attach PIL terms. Holds the NFTs so it remains IP owner (demo pattern). For a
///         Composable read condition, child conditions are configured for the same uuid first.
/// @dev Conditions must have been `initialize`d to trust THIS factory (paired single-factory model;
///      CDR exposes no vaultOwner getter so multi-factory is not safe — see decision D13).
contract CdrKitVault is ERC721Enumerable, ReentrancyGuard {
    ICDR public immutable CDR_CONTRACT;
    IIPAssetRegistry public immutable IP_ASSET_REGISTRY;
    ILicensingModule public immutable LICENSING_MODULE;
    address public immutable PIL_TEMPLATE;
    CreatorWriteCondition public immutable WRITE_CONDITION;

    uint256 public immutable defaultLicenseTermsId;
    uint256 private _nextTokenId;

    mapping(uint256 => uint32) public tokenToVault;
    mapping(uint256 => address) public tokenToIpId;
    mapping(uint256 => address) public tokenCreator;
    mapping(uint256 => uint256) public tokenLicenseTerms;
    mapping(uint32 => uint256) public vaultToToken;
    mapping(address => uint256[]) internal _creatorTokens;

    event VaultCreated(
        uint256 indexed tokenId, uint32 indexed uuid, address indexed ipId, address creator, uint256 licenseTermsId
    );
    event LicenseTokensMinted(uint256 indexed tokenId, address indexed receiver, uint256 amount, uint256 startId);

    error NotCreator();
    error LengthMismatch();

    constructor(
        address cdr,
        address ipAssetRegistry,
        address licensingModule,
        address pilTemplate,
        uint256 defaultLicenseTermsId_
    ) ERC721("CDR Kit Vault", "CDRKV") {
        CDR_CONTRACT = ICDR(cdr);
        IP_ASSET_REGISTRY = IIPAssetRegistry(ipAssetRegistry);
        LICENSING_MODULE = ILicensingModule(licensingModule);
        PIL_TEMPLATE = pilTemplate;
        defaultLicenseTermsId = defaultLicenseTermsId_;
        // The factory deploys + binds its own write condition (it is the deployer → initialize allowed).
        WRITE_CONDITION = new CreatorWriteCondition();
        WRITE_CONDITION.initialize(address(this));
    }

    /// @notice Create a vault, register IP, configure conditions, attach terms — atomically.
    /// @param readConditionAddr A cdr-kit read condition already initialized to trust this factory.
    /// @param readConfig D14 abi-encoded config for that condition.
    /// @param childConditions For a Composable read condition: the child conditions (else empty).
    /// @param childConfigs Per-child D14 configs (same length as childConditions).
    /// @param licenseTermsId PIL terms id to attach (0 = default).
    function createVault(
        address readConditionAddr,
        bytes calldata readConfig,
        address[] calldata childConditions,
        bytes[] calldata childConfigs,
        uint256 licenseTermsId
    ) external payable nonReentrant returns (uint256 tokenId, uint32 uuid, address ipId) {
        if (childConditions.length != childConfigs.length) revert LengthMismatch();

        tokenId = ++_nextTokenId;
        _mint(address(this), tokenId);
        ipId = IP_ASSET_REGISTRY.register(block.chainid, address(this), tokenId);
        uuid = CDR_CONTRACT.allocate{value: msg.value}(false, address(WRITE_CONDITION), readConditionAddr, "", "");

        // Configure conditions for the freshly-allocated uuid, in the same tx (no front-run window).
        _configure(uuid, msg.sender, readConditionAddr, readConfig, childConditions, childConfigs);

        uint256 termsId = licenseTermsId == 0 ? defaultLicenseTermsId : licenseTermsId;
        LICENSING_MODULE.attachLicenseTerms(ipId, PIL_TEMPLATE, termsId);
        _record(tokenId, uuid, ipId, msg.sender, termsId);

        emit VaultCreated(tokenId, uuid, ipId, msg.sender, termsId);
    }

    /// @dev Write gate first, then Composable children (so a Composable parent's children exist), then the read condition.
    function _configure(
        uint32 uuid,
        address creator,
        address readConditionAddr,
        bytes calldata readConfig,
        address[] calldata childConditions,
        bytes[] calldata childConfigs
    ) internal {
        WRITE_CONDITION.setConfigFromFactory(uuid, creator, "");
        for (uint256 i; i < childConditions.length; i++) {
            ICdrConfigurable(childConditions[i]).setConfigFromFactory(uuid, creator, childConfigs[i]);
        }
        ICdrConfigurable(readConditionAddr).setConfigFromFactory(uuid, creator, readConfig);
    }

    function _record(uint256 tokenId, uint32 uuid, address ipId, address creator, uint256 termsId) internal {
        tokenToVault[tokenId] = uuid;
        tokenToIpId[tokenId] = ipId;
        tokenCreator[tokenId] = creator;
        tokenLicenseTerms[tokenId] = termsId;
        vaultToToken[uuid] = tokenId;
        _creatorTokens[creator].push(tokenId);
    }

    /// @notice Mint license tokens for a vault's IP. Only the vault creator may call.
    function mintLicenseTokens(uint256 tokenId, uint256 amount, address receiver) external returns (uint256 startId) {
        if (tokenCreator[tokenId] != msg.sender) revert NotCreator();
        startId = LICENSING_MODULE.mintLicenseTokens(
            tokenToIpId[tokenId], PIL_TEMPLATE, tokenLicenseTerms[tokenId], amount, receiver, "", 0, 0
        );
        emit LicenseTokensMinted(tokenId, receiver, amount, startId);
    }

    function getCreatorVaults(address creator) external view returns (uint256[] memory) {
        return _creatorTokens[creator];
    }

    function getVaultInfo(uint256 tokenId)
        external
        view
        returns (uint32 uuid, address ipId, address creator, uint256 licenseTermsId)
    {
        return (tokenToVault[tokenId], tokenToIpId[tokenId], tokenCreator[tokenId], tokenLicenseTerms[tokenId]);
    }

    function getAllocateFee() external view returns (uint256) {
        return CDR_CONTRACT.allocateFee();
    }
}
