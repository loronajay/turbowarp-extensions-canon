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

**Cloud sync (4 blocks):**

| Block | Opcode | Status |
|---|---|---|
| `cloud leaderboard available ?` | `cloudAvailable` | Done |
| `submit to cloud player [P] score [V]` | `submitToCloud` | Done |
| `fetch top [N] scores from cloud into leaderboard [NAME]` | `fetchFromCloud` | Done |
| `cloud sync status` | `cloudSyncStatus` | Done |

**Name entry (6 blocks):** arcade-style letter picker, A–Z + 0–9 + space, 1–7 characters. See `NAME_ENTRY.md` for the full block reference and wiring guide.

---

## Pipeline Integration Status

**Not yet wired up.** Jay is currently configuring the backend.

Remaining steps (in order):
1. Finish backend setup on Railway
2. Update `game.json` per game to add `leaderboard.enabled: true` and score range bounds (used for server-side anti-cheat)
3. Update `patch_all_games.py` in `games-directory-page` to inject `window.JayLeaderboard` into each enabled game's HTML at build time
4. Rebuild and redeploy affected games through the pipeline
5. End-to-end test: submit a score, fetch top scores, verify display in-game

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
| `sumorai` | — | not configured |

Update this table as games are configured.
