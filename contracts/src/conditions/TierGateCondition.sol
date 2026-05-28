// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @notice Minimal view surface of Story's LicenseToken (ERC-721) used for tier gating.
interface ILicenseToken {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getLicensorIpId(uint256 tokenId) external view returns (address);
    function getLicenseTemplate(uint256 tokenId) external view returns (address);
    function getLicenseTermsId(uint256 tokenId) external view returns (uint256);
    function isLicenseTokenRevoked(uint256 tokenId) external view returns (bool);
}

/// @title TierGateCondition
/// @notice Gates read access by WHICH Story license tier the caller holds — the Story-IP coupling
///         Lit/TACo can't do. Feasible because LicenseToken.getLicenseTermsId(tokenId) is a view.
///         Caller supplies a license tokenId in accessAuxData; the gate verifies ownership, the
///         licensor IP, the PIL template, non-revocation, and tier membership. Read condition only.
contract TierGateCondition is ConditionBase {
    ILicenseToken public immutable licenseToken;
    address public immutable pilTemplate;

    mapping(uint32 => address) public gateIpId; // uuid => expected licensor IP
    mapping(uint32 => mapping(uint256 => bool)) public allowedTerms; // uuid => licenseTermsId => allowed

    constructor(address licenseToken_, address pilTemplate_) {
        licenseToken = ILicenseToken(licenseToken_);
        pilTemplate = pilTemplate_;
    }

    /// @dev config = abi.encode(address ipId, uint256[] allowedTermsIds)
    function _store(uint32 uuid, bytes calldata config) internal override {
        (address ipId, uint256[] memory termsIds) = abi.decode(config, (address, uint256[]));
        gateIpId[uuid] = ipId;
        for (uint256 i; i < termsIds.length; i++) {
            allowedTerms[uuid][termsIds[i]] = true;
        }
    }

    /// @inheritdoc ICdrCondition
    /// @dev Defensive: the whole evaluation runs through an external view wrapped in try/catch, so
    ///      malformed accessAuxData or a non-existent tokenId returns false (never an opaque revert).
    function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        try this.evaluate(uuid, accessAuxData, caller) returns (bool ok) {
            return ok;
        } catch {
            return false;
        }
    }

    /// @dev External so it can be invoked via `this.` inside a try/catch. View-only.
    function evaluate(uint32 uuid, bytes calldata accessAuxData, address caller) external view returns (bool) {
        uint256 tokenId = abi.decode(accessAuxData, (uint256));
        if (licenseToken.ownerOf(tokenId) != caller) return false;
        if (licenseToken.getLicensorIpId(tokenId) != gateIpId[uuid]) return false;
        if (licenseToken.getLicenseTemplate(tokenId) != pilTemplate) return false;
        if (licenseToken.isLicenseTokenRevoked(tokenId)) return false;
        return allowedTerms[uuid][licenseToken.getLicenseTermsId(tokenId)];
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
