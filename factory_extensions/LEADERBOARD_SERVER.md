# Leaderboard Server Status

Canonical reference for the JayArcade leaderboard backend. Update this file whenever server state, game config, or pipeline status changes.

---

## Server

| | |
|---|---|
| **Platform** | Railway (separate project from Factory Network) |
| **Default URL** | `https://leaderboard-server-production.up.railway.app` |
| **Custom domain** | None yet |
| **Status** | Live and deployed |

---

## `window.JayLeaderboard` Interface

The extension never talks to the server directly. The build pipeline injects a `window.JayLeaderboard` helper into each game's HTML. The extension calls that helper.

```js
JayLeaderboard.submit(playerName, score)
// Promise — resolves on success, rejects on network/server error

JayLeaderboard.getTop(limit = 10, device = null)
// Promise → [{ rank, playerName, score, createdAt }, ...]

JayLeaderboard.deviceType()
// "mobile" | "desktop" (synchronous)
```

`window.JayLeaderboard` is `undefined` in any game not yet configured. All cloud sync blocks handle this with silent no-ops.

---

## Extension Status

All leaderboard blocks are implemented in `factory-leaderboards.js`.

**Cloud sync (4 blocks):** ✓ Done

| Block | Opcode | Status |
|---|---|---|
| `cloud leaderboard available ?` | `cloudAvailable` | Done |
| `submit to cloud player [P] score [V]` | `submitToCloud` | Done |
| `fetch top [N] scores from cloud into leaderboard [NAME]` | `fetchFromCloud` | Done |
| `cloud sync status` | `cloudSyncStatus` | Done |

**Name entry (6 blocks):** arcade-style letter picker, A–Z + 0–9 + space, 1–7 characters. See `NAME_ENTRY.md` for the full block reference and wiring guide.

**Note:** Any game using these cloud sync blocks must be rebuilt and re-exported from TurboWarp for changes to take effect.

---

## Pipeline Integration Status

**Server deployed. Extension done. Pipeline wiring complete. Waiting on apple-catcher TurboWarp rebuild.**

Completed:
- `.env` created with all 9 game keys
- `game.json` leaderboard block added to all games (enabled for apple-catcher, bird-duty, blade-and-sphere, space-molestors, speed-demon)
- `patch_all_games.py` extended to inject `leaderboard` config into `JAY_GAME_CONFIG` + `JayLeaderboard` helper inline
- Dry run confirmed correct output

Remaining:
1. Rebuild apple-catcher in TurboWarp with leaderboard blocks wired up → re-export
2. Full build + deploy via `build_arcade.py --commit --push`
3. End-to-end test: submit a score, fetch top scores, verify display in-game

Full status tracked in `games-directory-page/leaderboard-server-progress.md`.

---

## Per-Game Enablement

| Game | `leaderboard.enabled` | Notes |
|---|---|---|
| `apple-catcher` | — | not configured |
| `art-of-war` | — | not configured |
| `bird-duty` | — | not configured |
| `blade-and-sphere` | — | not configured |
| `dodgeballs` | — | not configured |
| `paddle-battle` | — | not configured |
| `space-molestors` | — | not configured |
| `speed-demon` | — | not configured |
| `sumorai` | — | not configured |

Update this table as games are configured.
