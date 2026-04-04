# Leaderboard Quickstart — Backpack Setup

How to add cloud leaderboards to any JayArcade game. Carry the sprite below in your TurboWarp backpack and drag it into each new project.

---

## Requirements

Load both extensions before using any leaderboard blocks:
- `factory-leaderboards.js`
- `factory-text.js`

---

## The Backpack Sprite

Create a sprite called **Leaderboard** with no costume. Add all scripts below.

### Variables (this sprite only)
- `entering name` — 0 normally, 1 while player is entering their name

---

### Script 1 — Name entry entry point

```
when I receive [Show Name Entry]
  start name entry length [3]
  write [A] as [ne_1]   at x: [-30] y: [20]
  write [A] as [ne_2]   at x: [0]   y: [20]
  write [A] as [ne_3]   at x: [30]  y: [20]
  write [>] as [ne_cur] at x: [-30] y: [5]
  set scale of all text to [4]
  refresh name entry display
  set [entering name] to [1]
  wait until <(entering name) = [0]>
```

This is what `broadcast [Show Name Entry] and wait` calls from your game. It stays alive until the player confirms.

---

### Script 2 — Refresh display (custom block)

```
define refresh name entry display
  set text [ne_1]   to (name entry letter at [1])
  set text [ne_2]   to (name entry letter at [2])
  set text [ne_3]   to (name entry letter at [3])
  set text [ne_cur] x: (((name entry cursor) - [1]) * [30] + [-30])
  set color of text [ne_1]   to [#ffffff]
  set color of text [ne_2]   to [#ffffff]
  set color of text [ne_3]   to [#ffffff]
  set color of text (join [ne_] (name entry cursor)) to [#ffff00]
```

Call this after every input to sync the display.

---

### Script 3 — Input handlers

```
when [a] pressed
  if <(entering name) = [1]> then
    name entry move cursor [left]
    refresh name entry display

when [d] pressed
  if <(entering name) = [1]> then
    name entry move cursor [right]
    refresh name entry display

when [w] pressed
  if <(entering name) = [1]> then
    name entry scroll letter [up]
    refresh name entry display

when [s] pressed
  if <(entering name) = [1]> then
    name entry scroll letter [down]
    refresh name entry display
```

---

### Script 4 — Confirm (C and V both confirm)

```
when [c] pressed
  if <(entering name) = [1]> then
    set [entering name] to [0]
    delete text [ne_1]
    delete text [ne_2]
    delete text [ne_3]
    delete text [ne_cur]

when [v] pressed
  if <(entering name) = [1]> then
    set [entering name] to [0]
    delete text [ne_1]
    delete text [ne_2]
    delete text [ne_3]
    delete text [ne_cur]
```

---

## Wiring Into Your Game

In your game's end-game logic (single player only), add this before broadcasting to the menu:

```
if <Apple Catcher Mode = [single]> then
  if <cloud leaderboard available?> then
    fetch top [10] scores from cloud into leaderboard [High Scores]
    wait until <<(cloud sync status) = [success]> or <(cloud sync status) = [error]>>
    if <value [score] qualifies for leaderboard [High Scores]?> then
      broadcast [Show Name Entry] and wait
      submit to cloud player (name entry current name) score [score]
```

Replace `[score]` with your actual score variable.

---

## Displaying the Leaderboard

After fetching, read entries with:

```
name at rank [1] in leaderboard [High Scores]
value at rank [1] in leaderboard [High Scores]
```

Loop from 1 to `entry count of leaderboard [High Scores]` to display all rows.

---

## Customisation

| Thing to change | Where |
|---|---|
| Name length (1–7 chars) | `start name entry length [3]` |
| Letter position on screen | x/y in `write` blocks and the cursor x formula |
| Letter spacing | Change `* [30]` in the cursor formula and match the `write` x values |
| Highlight color | `#ffff00` in `refresh name entry display` |
| Controls | Swap key names in the input handlers |
| Max leaderboard entries | `set leaderboard [High Scores] max entries to [10]` before fetching |
