# Project Status

## Current State

This repo is now beyond simple export/render tooling. It currently supports:

- `Textify` export of custom blocks as `[procedure]` IR
- `Textify` export of any top-level stack as `[script]` IR
- direct clipboard-copy workflows for both custom blocks and top-level stacks
- `Blockify` parsing, validating, and rendering of `[procedure]` and `[script]` IR
- embedded `scratch-blocks` rendering through `dist/blockify-turbowarp.embedded.js`
- a dual-buffer patch workbench inside the Blockify editor
- a first internal patch engine with deterministic apply/serialize/validate behavior

## Canonical Workflow

The intended workflow right now is:

1. Use `Textify` to export a custom block or top-level stack to IR.
2. Give that IR to an AI model.
3. Have the model produce patch JSON or edited IR.
4. Open `Blockify`.
5. Paste source IR into `Source IR`.
6. Paste patch JSON into `Patch JSON`.
7. Apply patch and inspect the visual result.
8. Copy the patched IR or use it as the new source.

## Implemented

### Textify

File: [textify-turbowarp.js](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/textify-turbowarp.js)

Implemented:

- export custom block from sprite/current sprite
- copy custom block IR to clipboard without popup
- export top-level stack by index from sprite
- copy top-level stack by index to clipboard
- top-level stack count by sprite
- explicit menu export support for `looks_backdrops` and `looks_costume`

### Blockify

File: [blockify-turbowarp.js](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/blockify-turbowarp.js)

Implemented:

- parse and validate `[procedure]` roots
- parse and validate `[script]` roots
- visual render fallback renderer
- embedded `scratch-blocks` renderer path
- clipboard preview window
- IR editor with:
  - `Source IR`
  - `Patch JSON`
  - `Patched IR Result`
  - visual preview
- button row pinned at the bottom of the editor

Embedded build artifact:

- [dist/blockify-turbowarp.embedded.js](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/dist/blockify-turbowarp.embedded.js)

## Patch Surface

Current patch schema version:

- `version: 1`
- `target: "project"`

Current supported operations:

- `rename_variable`
- `detach_top_level_scripts`

Current behavior:

- patching is applied to parsed AST, not raw text directly
- patched output is serialized back to canonical IR
- patched output is re-parsed for validation before success is returned
- source IR is preserved
- failed patches do not overwrite previous successful patched IR
- changing source IR invalidates stale patched IR

## Internal Patch Runner

Internal helpers currently exist for:

- apply patch object to IR text
- apply patch JSON text to IR text

These return structured results:

- success: `{ ok: true, ir: "..." }`
- failure: `{ ok: false, error: "..." }`

## Known Limits

- no user-facing patch language help yet
- no natural-language-to-patch layer yet
- no project-wide wrapper IR root yet
- no sprite creation patch ops yet
- no logic-review/lint engine yet
- top-level stack export currently uses sprite + stack index, not visual selection
- patch editor does not yet surface patch errors inside the patched-result pane itself

## Testing Status

Current Jest status at this checkpoint:

- `9` test suites passing
- `47` tests passing

Coverage currently includes:

- camera/leaderboards regressions
- embedded `scratch-blocks` rendering regressions
- script root support
- textify top-level stack export
- patch engine operations
- patch workflow state behavior
- editor layout behavior

## Next Likely Steps

Most likely next directions:

1. Grow the internal patch surface with more safe edit ops.
2. Improve patch workbench UX for faster testing.
3. Introduce project-level operations after script-level patching is mature.
4. Add diagnostics/linting as a separate layer from patching.

