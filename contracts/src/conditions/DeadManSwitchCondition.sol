// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ConditionBase} from "../base/ConditionBase.sol";
import {ICdrCondition} from "../interfaces/ICdrCondition.sol";

/// @title DeadManSwitchCondition
/// @notice Auto-unlock to heir(s) (or public) if the creator stops `poke()`-ing within `duration`.
///         The canonical "wallet recovery" / "estate planning" / "leak-on-disappearance" primitive
///         Story docs hint at. Block-based mode (`blockBased = true`) is more precise for short
///         horizons; timestamp-based is safer for windows beyond a few days because Story Aeneid
///         block time is not constitutionally fixed.
/// @dev    Post-unlock semantics: if `publicAfterUnlock = false` AND the creator is not in the heir
///         set, the creator LOSES read access at unlock. That is the intended trapdoor — the agent
///         helper `agent.createDeadManVault(...)` defaults `creatorCanReadWhileLocked = true` and
///         encourages the caller to add themselves to `heirs` if they want post-unlock access.
contract DeadManSwitchCondition is ConditionBase {
    struct Cfg {
        uint64 unlockAt; // timestamp OR block when access flips to heirs
        uint64 duration; // same unit; `poke()` resets `unlockAt = now + duration`
        bool blockBased;
        bool creatorCanReadWhileLocked; // creator-side oracle for "is this still working?"
        bool publicAfterUnlock; // if true, anyone reads post-unlock; if false, only `heir`s
    }

    mapping(uint32 => Cfg) public cfg;
    /// @notice uuid => heir => allowed
    mapping(uint32 => mapping(address => bool)) public heir;

    error ZeroDuration();
    error NotCreator();
    error AlreadyUnlocked();

    event Poked(uint32 indexed uuid, uint64 newUnlockAt);

    /// @dev config = abi.encode(uint64 duration, address[] heirs, bool blockBased,
    ///                          bool creatorCanReadWhileLocked, bool publicAfterUnlock)
    ///      `publicAfterUnlock` is forced true when `heirs.length == 0` (otherwise unlock
    ///      points at nobody and the vault is unreadable forever — that's never the intent).
    function _store(uint32 uuid, bytes calldata config) internal override {
        (
            uint64 duration,
            address[] memory heirs,
            bool blockBased,
            bool creatorRead,
            bool pubAfter
        ) = abi.decode(config, (uint64, address[], bool, bool, bool));
        if (duration == 0) revert ZeroDuration();
        uint64 now_ = blockBased ? uint64(block.number) : uint64(block.timestamp);
        cfg[uuid] = Cfg({
            unlockAt: now_ + duration,
            duration: duration,
            blockBased: blockBased,
            creatorCanReadWhileLocked: creatorRead,
            publicAfterUnlock: pubAfter || heirs.length == 0
        });
        for (uint256 i; i < heirs.length; i++) {
            heir[uuid][heirs[i]] = true;
        }
    }

    /// @notice Creator-side heartbeat. Resets the unlock countdown to `now + duration`. Cannot
    ///         poke after unlock (the trapdoor is one-way; revival would let the creator block
    ///         heirs forever just by re-poking late).
    function poke(uint32 uuid) external {
        Cfg storage c = cfg[uuid];
        if (msg.sender != creator[uuid]) revert NotCreator();
        uint64 now_ = c.blockBased ? uint64(block.number) : uint64(block.timestamp);
        if (now_ >= c.unlockAt) revert AlreadyUnlocked();
        c.unlockAt = now_ + c.duration;
        emit Poked(uuid, c.unlockAt);
    }

    /// @notice Convenience view for UI countdowns. Returns 0 once unlocked.
    function getRemainingTime(uint32 uuid) external view returns (uint256) {
        if (!_configured(uuid)) return 0;
        Cfg storage c = cfg[uuid];
        uint256 now_ = c.blockBased ? block.number : block.timestamp;
        return now_ >= c.unlockAt ? 0 : (c.unlockAt - now_);
    }

    /// @inheritdoc ICdrCondition
    /// @dev Two phases:
    ///       - Locked (`now < unlockAt`): only the creator can read, and only if
    ///         `creatorCanReadWhileLocked` was set true at configure time.
    ///       - Unlocked (`now >= unlockAt`): public-to-anyone OR restricted-to-heir-set, depending
    ///         on `publicAfterUnlock`. The creator gets NO special treatment here — this is the
    ///         trapdoor's whole point. If the creator wants post-unlock access they must add
    ///         themselves to `heirs` at configure time (the agent helper does this by default).
    function checkReadCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        if (!_configured(uuid)) return false;
        Cfg storage c = cfg[uuid];
        uint256 now_ = c.blockBased ? block.number : block.timestamp;
        if (now_ < c.unlockAt) {
            // Locked phase.
            return caller == creator[uuid] && c.creatorCanReadWhileLocked;
        }
        // Unlocked phase.
        if (c.publicAfterUnlock) return true;
        return heir[uuid][caller];
    }

    /// @inheritdoc ICdrCondition
    /// @dev Creator-only writes regardless of lock state (only the creator can update the secret).
    function checkWriteCondition(uint32 uuid, bytes calldata, bytes calldata, address caller)
        external
        view
        override
        returns (bool)
    {
        return caller == creator[uuid];
    }
}
