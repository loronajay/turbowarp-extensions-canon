# Factory Leaderboards — Cloud Sync Handoff

## What This Is

A plan to extend `factory-leaderboards.js` with cloud sync blocks that bridge the
existing local leaderboard logic to the Jay Arcade leaderboard server (hosted on Railway).

Read this before touching `factory-leaderboards.js`.

---

## Current State of the Extension

`factory-leaderboards.js` is fully functional as a **local, in-memory** leaderboard system.
It already handles:

- Creating/configuring boards (`createLeaderboard`, `setMaxEntries`, `setSortMode`)
- Adding and sorting entries (`addEntry`, `trimLeaderboard`)
- Score qualification logic (`qualifies` boolean — already detects if a score makes the board)
- Retrieval by rank (`getName`, `getValue`, `entryCount`, `getRank`)

All of this lives in memory and resets when the page reloads. **Do not change any of this.**
The cloud sync layer is additive — new blocks only.

---

## The Interface: `window.JayLeaderboard`

The cloud sync blocks call `window.JayLeaderboard`, a helper object injected into each
game's HTML by the `patch_all_games.py` build pipeline in the `games-directory-page` repo.

The interface it exposes:

```js
// Submit a score to the cloud
JayLeaderboard.submit(playerName, score)
// Returns a Promise. Resolves on success, rejects on network/server error.

// Fetch top scores from the cloud
JayLeaderboard.getTop(limit = 10, device = null)
// Returns a Promise that resolves to an array:
// [{ rank, playerName, score, createdAt }, ...]

// Detect device type
JayLeaderboard.deviceType()
// Returns "mobile" or "desktop" (synchronous)
```

`window.JayLeaderboard` is only present in games that have `leaderboard.enabled: true`
in their `game.json` AND have been rebuilt through the pipeline. It will be `undefined`
in games that haven't been configured for cloud leaderboards yet.

**The extension must handle this gracefully** — all cloud blocks should silently no-op
or return safe defaults if `window.JayLeaderboard` is not present. Local leaderboard
functionality must continue to work regardless.

---

## New Blocks to Add

### 1. `cloud available ?` (boolean)

```
opcode: "cloudAvailable"
text: "cloud leaderboard available ?"
```

Returns `true` if `window.JayLeaderboard` exists. Lets games branch between
cloud-enabled and local-only behavior.

---

### 2. `submit to cloud player [PLAYER] score [VALUE]` (command, async)

```
opcode: "submitToCloud"
text: "submit to cloud player [PLAYER] score [VALUE]"
arguments:
  PLAYER: STRING, default "AAA"
  VALUE:  NUMBER, default 100
```

Calls `window.JayLeaderboard.submit(PLAYER, VALUE)`. Returns a Promise —
TurboWarp will yield the script until it resolves or rejects. On rejection,
sets an internal error status but does not throw. Silent failure.

---

### 3. `fetch top [LIMIT] scores from cloud into [NAME]` (command, async)

```
opcode: "fetchFromCloud"
text: "fetch top [LIMIT] scores from cloud into leaderboard [NAME]"
arguments:
  LIMIT: NUMBER, default 10
  NAME:  STRING, default "High Scores"
```

Calls `window.JayLeaderboard.getTop(LIMIT)`, waits for the result, then:
1. Clears the named local board
2. Adds each returned entry via the existing `addEntry` logic (so sort/trim still apply)

Returns a Promise. TurboWarp yields until complete. On error, leaves the local board
unchanged and sets error status.

---

### 4. `cloud sync status` (reporter)

```
opcode: "cloudSyncStatus"
text: "cloud sync status"
```

Returns one of: `"idle"`, `"loading"`, `"success"`, `"error"`.

Updated by `submitToCloud` and `fetchFromCloud` as they run. Lets games
show a loading spinner or error message in Scratch UI.

---

## Async Handling Pattern

TurboWarp COMMAND blocks can return a Promise and the script will wait for it.
Use this pattern for `submitToCloud` and `fetchFromCloud`:

```js
async submitToCloud({ PLAYER, VALUE }) {
    if (!window.JayLeaderboard) return;
    this._syncStatus = "loading";
    try {
        await window.JayLeaderboard.submit(String(PLAYER), Number(VALUE) || 0);
        this._syncStatus = "success";
    } catch (e) {
        this._syncStatus = "error";
    }
}
```

Store `_syncStatus` on the class instance (not per-sprite — it's a global connection state).
Initialize it to `"idle"` in the constructor.

---

## Expected Scratch Usage Pattern

```
when flag clicked
  if <cloud available ?> then
    set sync status display → "loading"
    fetch top [10] scores from cloud into [High Scores]
    set sync status display → cloud sync status
  end

...

when game ends
  if <value [score] qualifies for leaderboard [High Scores] ?> then
    ask [Enter your name] and wait
    add entry name [answer] value [score] to leaderboard [High Scores]
    if <cloud available ?> then
      submit to cloud player [answer] score [score]
    end
  end
```

---

## What NOT to Change

- Do not modify any existing block opcodes, text, or behavior
- Do not change the local board data structure (`entries`, `maxEntries`, `sortMode`)
- Do not add any server URL or API key to the extension — that all lives in
  `window.JayLeaderboard` which is injected by the pipeline

---

## Relationship to the Other Repo

The `games-directory-page` repo handles the other half of this:

- `patch_all_games.py` injects `window.JayLeaderboard` into each game's HTML at build time
- `game.json` per game controls whether leaderboard is enabled and sets score range bounds
  for server-side anti-cheat
- Plan doc: `games-directory-page/leaderboard-integration-plan.md`

Changes to this extension take effect only after Jay rebuilds and re-exports each game
through TurboWarp and runs the build pipeline. The pipeline does not modify extensions.

---

## Open Questions (Carry These Into the Session)

1. Does the `factory-leaderboards.js` class currently have a constructor? If not, add one
   to initialize `_syncStatus = "idle"`.
2. Confirm TurboWarp version in use supports async COMMAND blocks (it should — standard
   since TW 1.x).
3. After implementing, which game gets the first end-to-end test?
