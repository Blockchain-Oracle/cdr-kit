// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @notice Marker so we can robustly detect (and reject) Composable-of-Composable nesting.
interface IComposableMarker {
    function COMPOSABLE_MARKER() external pure returns (bytes32);
}

/// @title ComposableCondition
/// @notice Combines other conditions with AND/OR (the Technical-track "composable vault systems"
///         criterion). The factory configures each child for the uuid FIRST, then this parent
///         (children store their own per-uuid state — this parent stores only mode + children, no
///         dead childData). Read gating only in v1.
/// @dev Hardening (round-3 review): MAX_CHILDREN breadth cap + nesting ban (depth bomb); every
///      child call and the aux decode run through try/catch so a malformed input or a reverting
///      child yields `false`, never an opaque precompile revert.
contract ComposableCondition is ConditionBase, IComposableMarker {
    enum Mode {
        AND,
        OR
    }

    struct Combo {
        Mode mode;
        address[] children;
    }

    uint256 public constant MAX_CHILDREN = 8;
    bytes32 private constant _MARKER = keccak256("cdr-kit.ComposableCondition.v1");

    mapping(uint32 => Combo) internal _combo;

    error NoChildren();
    error TooManyChildren();
    error NestedComposableNotAllowed();

    function COMPOSABLE_MARKER() external pure returns (bytes32) {
        return _MARKER;
    }

    /// @dev config = abi.encode(uint8 mode, address[] children).
    function _store(uint32 uuid, bytes calldata config) internal override {
        (uint8 mode, address[] memory children) = abi.decode(config, (uint8, address[]));
        uint256 n = children.length;
        if (n == 0) revert NoChildren();
        if (n > MAX_CHILDREN) revert TooManyChildren();
        for (uint256 i; i < n; i++) {
            try IComposableMarker(children[i]).COMPOSABLE_MARKER() returns (bytes32 m) {
                if (m == _MARKER) revert NestedComposableNotAllowed();
            } catch {
                // child is not a Composable — fine
            }
        }
        _combo[uuid] = Combo(Mode(mode), children);
    }

    /// @notice Read gate: AND requires all children pass; OR requires any. Unconfigured → false.
    function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        Combo storage c = _combo[uuid];
        uint256 n = c.children.length;
        if (n == 0) return false;

        bytes[] memory aux;
        try this.decodeAux(accessAuxData, n) returns (bytes[] memory a) {
            aux = a;
        } catch {
            return false; // malformed aux (abi.decode panics; must be caught externally)
        }

        for (uint256 i; i < n; i++) {
            bool ok;
            try ICdrCondition(c.children[i]).checkReadCondition(uuid, aux[i], "", caller) returns (bool r) {
                ok = r;
            } catch {
                ok = false; // a reverting/non-conforming child counts as false
            }
            if (c.mode == Mode.OR && ok) return true;
            if (c.mode == Mode.AND && !ok) return false;
        }
        return c.mode == Mode.AND; // AND: all passed; OR: none passed
    }

    /// @dev External so it can be invoked via `this.` inside a try/catch. Reverts on bad input or
    ///      length mismatch → the caller's catch turns it into `false`.
    function decodeAux(bytes calldata aux, uint256 expectedLen) external pure returns (bytes[] memory) {
        bytes[] memory a = abi.decode(aux, (bytes[]));
        require(a.length == expectedLen, "aux length mismatch");
        return a;
    }

    function checkWriteCondition(uint32, bytes calldata, bytes calldata, address)
        external
        pure
        override
        returns (bool)
    {
        return false; // read-only composition in v1
    }

    /// @notice Introspection for the dashboard / discover.
    function combo(uint32 uuid) external view returns (uint8 mode, address[] memory children) {
        Combo storage c = _combo[uuid];
        return (uint8(c.mode), c.children);
    }
}
