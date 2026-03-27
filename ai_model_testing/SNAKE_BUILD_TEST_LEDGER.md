# Snake Build Test Ledger

## Purpose

This ledger benchmarks AI model performance on a full game-construction task using Textify IR.
Unlike the mutation ledger (which tests targeted edits to existing IR), this test requires the model to **write new IR from scratch** across multiple sprites, guided only by a natural language description of the game logic and the IR grammar reference.

The task is the same for every model run. Log each run in the per-sprite sections below.

---

## Test Parameters (Fixed)

| Parameter | Value |
|-----------|-------|
| Game | Snake (TurboWarp, clone-based) |
| Grid size | 24 columns × 18 rows, 20px cells, origin at (-230, 170) |
| Unlimited clones | Yes (TurboWarp setting) |
| IR grammar reference | Provide model with link to IR_GRAMMAR.md or paste full spec |
| Mutation rules | Do NOT prepend — this test generates new IR, not mutations |
| Blockify version | dist/blockify-turbowarp.embedded.js |

**Sprites required:**
1. Grid (clone-based background)
2. Snake Head
3. Snake Body
4. Food

---

## Introduction Prompt (Use This Verbatim)

Paste this to the model at the start of each run. Do not add extra context.

```
I'm building a Snake game in TurboWarp using a custom IR format for Scratch blocks.
I'll give you the grammar spec, then ask you to write the blocks for each sprite one at a time.
Please write all code in the IR format — do not describe blocks in plain text.
After I paste in the grammar, wait for my first sprite request before writing any code.

[paste IR_GRAMMAR.md contents here]
```

Then, for each sprite, paste the sprite prompt from the section below and record the results.

---

## Sprite Prompts (Fixed)

Use these exact prompts for every model run. Do not rephrase.

### Grid Sprite Prompt
```
Write a CREATE GRID procedure for the Grid sprite.
- The grid is 24 columns wide and 18 rows tall.
- Each cell is 20px.
- Start position: x=-230, y=170.
- Use control_create_clone_of to stamp each cell, then move right 20px.
- After each row, reset x to -230 and move down 20px.
- warp: true
```

### Snake Head Sprite Prompt
```
Write all scripts for the Snake Head sprite.
- When flag clicked: go to (0,0), point right (90°), set Length to 0.5, then loop forever:
    set Shield to 1, move 20 steps, create a clone of Snake Body,
    if (Shield = 0) and (touching edge or touching Snake Body): stop all,
    wait 0.1 seconds, set Shield to 0.
- Arrow key handlers: left arrow → point -90°, right arrow → point 90°,
  up arrow → point 0°, down arrow → point 180°.
- When I start as a clone: wait (Length) seconds, delete this clone.
- When I receive "eat": change Length by 0.1.
```

### Snake Body Sprite Prompt
```
Write all scripts for the Snake Body sprite.
- When I start as a clone: wait (Length) seconds, delete this clone.
That's the only script needed.
```

### Food Sprite Prompt
```
Write all scripts for the Food sprite.
- When flag clicked: show, go to a random grid-aligned position
  (x = pick random 0 to 23 * 20 + -230, y = pick random 0 to 17 * -20 + 170),
  then loop forever:
    if touching Snake Head: broadcast "eat", pick a new random grid-aligned position.
```

---

## Log Format (Per Sprite, Per Model)

```
### [Model Name] — [Sprite Name] — [YYYY-MM-DD]

**First output parses:** pass / fail
**Parse error (if any):** [paste Blockify error message, or "none"]
**Correction rounds:** [number of times you sent error back and got a new attempt]
**Final output parses:** pass / fail
**Final output validates:** pass / fail
**Logic correct:** yes / partial / no
**Unintended extras:** [any blocks or fields the model added that weren't asked for, or "none"]
**Notes:** [anything notable — e.g. model asked clarifying questions, hallucinated opcodes, etc.]

**Final IR:**
\```
[paste final accepted IR here]
\```
```

---

## Run Logs

<!-- Start a new subsection per model. Copy the four sprite log blocks for each run. -->

---

### Model: _______________  Date: _______________

#### Grid Sprite

**First output parses:**
**Parse error (if any):**
**Correction rounds:**
**Final output parses:**
**Final output validates:**
**Logic correct:**
**Unintended extras:**
**Notes:**

**Final IR:**
```

```

---

#### Snake Head Sprite

**First output parses:**
**Parse error (if any):**
**Correction rounds:**
**Final output parses:**
**Final output validates:**
**Logic correct:**
**Unintended extras:**
**Notes:**

**Final IR:**
```

```

---

#### Snake Body Sprite

**First output parses:**
**Parse error (if any):**
**Correction rounds:**
**Final output parses:**
**Final output validates:**
**Logic correct:**
**Unintended extras:**
**Notes:**

**Final IR:**
```

```

---

#### Food Sprite

**First output parses:**
**Parse error (if any):**
**Correction rounds:**
**Final output parses:**
**Final output validates:**
**Logic correct:**
**Unintended extras:**
**Notes:**

**Final IR:**
```

```

---

## Summary Table

Fill in after each complete model run (all four sprites).

| Model | Date | Grid Parse | Grid Rounds | Head Parse | Head Rounds | Body Parse | Body Rounds | Food Parse | Food Rounds | All Logic Correct | Notes |
|-------|------|-----------|-------------|-----------|-------------|-----------|-------------|-----------|-------------|-------------------|-------|
| | | | | | | | | | | | |

**Column key:**
- `Parse`: first-attempt parse result (pass/fail)
- `Rounds`: total correction rounds needed (0 = passed on first try)
- `All Logic Correct`: yes / partial / no — whether the final game actually works end-to-end

---

## Error Type Reference

When logging parse errors, classify them using these categories to make cross-model comparison easier:

| Code | Meaning |
|------|---------|
| `SYN-BRACKET` | Unmatched or misplaced bracket |
| `SYN-COLON` | Missing colon in key:value pair |
| `SYN-FIELD` | Wrong key name in fields/inputs/stacks |
| `SYN-LITERAL` | Malformed literal (wrong type, missing quotes) |
| `SYN-MENU` | Malformed menu node |
| `SEM-OPCODE` | Hallucinated or nonexistent opcode |
| `SEM-INPUT` | Wrong input key for a known opcode |
| `SEM-STACK` | Substack placed in inputs instead of stacks, or vice versa |
| `LOGIC` | IR is valid but game logic is wrong (e.g. wrong direction value) |
| `OTHER` | Anything that doesn't fit above |
