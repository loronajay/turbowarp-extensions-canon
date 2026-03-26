# Usage: Textify + Blockify in TurboWarp

This doc covers how to load both extensions and use the AI mutation workflow end-to-end.

## Loading the extensions

In TurboWarp, load both extensions as **unsandboxed** custom extensions:

1. Open TurboWarp (`turbowarp.org` or desktop app).
2. Click the **Extensions** button (bottom-left puzzle piece).
3. Click **Custom Extension**.
4. Load `textify-turbowarp.js` — paste URL or upload file. Accept unsandboxed prompt.
5. Repeat for `blockify-turbowarp.js` (or `dist/blockify-turbowarp.embedded.js` for the bundled build that includes `scratch-blocks`).

**Order matters:** Textify must be loaded before Blockify if you want the shared state bridge to be initialized before Blockify reads it. In practice, loading Textify first then Blockify in the same session is sufficient.

## Exporting IR from Textify

### Click-to-export any block

Use **`textify clicked block to clipboard`** in a script. When it runs, it waits for you to click any block in the editor. The whole stack is serialized from the top (so clicking a block in the middle of a script still exports the complete script). Reporters and boolean blocks clicked directly export as a bare `[opcode:]` node. The result is copied to clipboard with the spec header and stored in `__TEXTIFY_SHARED__`.

Cancel the click by right-clicking, pressing Escape, or clicking the Cancel button that appears.

### Export all stacks from a sprite

| Block | What it does |
|---|---|
| `copy all stacks from sprite [SPRITE] to clipboard with rules` | Copies IR for every top-level stack, with spec header |
| `copy all stacks from sprite [SPRITE] plain` | Same IR, no spec header (useful for debugging) |

Procedure definition blocks are excluded from both. All exported IR is stored in `__TEXTIFY_SHARED__` so Blockify can read it.

## Sending IR to an AI model

After exporting, use Textify's **`copy rules with clipboard IR`** block:

```
when [key] pressed
  textify clicked block to clipboard                    ← Textify (click a block)
  copy rules with clipboard IR                          ← Textify
```

Or for a sprite-wide export:

```
when [key] pressed
  copy all stacks from sprite [Sprite1] to clipboard with rules   ← Textify
  copy rules with clipboard IR                                     ← Textify
```

This copies a merged payload to clipboard:

```
You are modifying Textify canon IR.

Requirements:
- Mutate only the IR provided below.
- Preserve all unrelated structure.
- Preserve opcode ids unless new nodes are required.
- Keep fields, inputs, and stacks distinct.
- Do not invent unsupported structure.
- Return only valid Textify canon IR.
- Do not include explanation outside the IR.

IR:
[procedure ...]
```

Paste this directly into your AI model's prompt. No manual rule-prepending needed.

If no valid IR has been exported yet, the block copies `no copied IR` instead.

## Applying a patch in Blockify

1. Click the **Blockify Clipboard IR** button to open the patch workbench, or use the IR/patch buffer blocks directly.
2. Paste the original IR into **Source IR**.
3. Paste the AI-returned patch JSON into **Patch JSON**.
4. Click **Apply Patch** to see the patched result and visual preview.
5. Use **`copy last Blockify patched IR to clipboard`** to grab the result.

### Patch JSON format (version 1)

```json
{
  "version": 1,
  "target": "project",
  "operations": [
    {
      "op": "rename_variable",
      "from": "score",
      "to": "points",
      "scope": "project"
    }
  ]
}
```

See `PATCH_SCHEMA.md` for the full spec and all supported operations.

## Recommended script layout

```
when [r] pressed                         ← click-to-export + copy rules in one keypress
  textify clicked block to clipboard
  copy rules with clipboard IR

when [p] pressed                         ← open patch workbench
  open Blockify IR editor
```

## Validation blocks

Use these to guard logic in your project scripts:

| Block | Returns |
|---|---|
| `validate Blockify IR [IR]` | `true` if the IR string parses without error |
| `validate Blockify IR buffer` | `true` if the current IR buffer is valid |
| `last Blockify error` | last parse/validation error message, or empty |
| `last Blockify patch error` | last patch apply error, or empty |
