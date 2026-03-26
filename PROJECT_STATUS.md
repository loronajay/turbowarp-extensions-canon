# Project Status

## Current State

This repo is now beyond simple export/render tooling. It currently supports:

- `Textify` export of custom blocks as `[procedure]` IR
- `Textify` export of any top-level stack as `[script]` IR
- direct clipboard-copy workflows for both custom blocks and top-level stacks
- `Blockify` parsing, validating, and rendering of `[procedure]`, `[script]`, `[stack:]`, and bare `[opcode:]` IR
- embedded `scratch-blocks` rendering through `dist/blockify-turbowarp.embedded.js`
- a dual-buffer patch workbench inside the Blockify editor
- a first internal patch engine with deterministic apply/serialize/validate behavior

## Canonical Workflow

The intended workflow right now is:

1. Use `Textify` to export a custom block or top-level stack to IR (copies to clipboard with spec header).
2. Use Textify's **`copy rules with clipboard IR`** block to prepend the canonical AI mutation rules to whatever IR is on the clipboard, and copy the merged payload back to clipboard in one step.
3. Paste into an AI model.
4. Have the model produce patch JSON or edited IR.
5. Open `Blockify`.
6. Paste source IR into `Source IR`.
7. Paste patch JSON into `Patch JSON`.
8. Apply patch and inspect the visual result.
9. Copy the patched IR or use it as the new source.

Step 2 reads from the clipboard directly, so there is no distinction between Textify-exported IR and any other IR source. The `copy rules with clipboard IR` block lives in Textify because it belongs to the export/AI-handoff side of the pipeline.

## Implemented

### Textify

File: [textify-turbowarp.js](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/textify-turbowarp.js)

Implemented:

- **`textify clicked block to clipboard`** — waits for the user to click any block in the editor; serializes from the top of the stack (whole stack always); reporters/booleans export as bare `[opcode:]` nodes; cancels on right-click, Escape, or Cancel button
- **`copy all stacks from sprite [SPRITE] to clipboard with rules`** — exports all top-level stacks from a named sprite as `[script]` IR with spec header; procedure definitions excluded; the running script excludes itself via `util.thread.topBlock`
- **`copy all stacks from sprite [SPRITE] plain`** — same as above, no spec header (for debugging); also self-excluding
- **`copy rules with clipboard IR`** — reads IR from clipboard, strips any spec header, prepends canonical AI mutation rules, copies merged payload back to clipboard; copies `no copied IR` if clipboard does not contain valid IR
- **`exported IR`** reporter — returns the last IR exported in this session
- explicit menu export support for `looks_backdrops` and `looks_costume`
- publishes last export to `globalThis.__TEXTIFY_SHARED__` for cross-extension reads

### Blockify

File: [blockify-turbowarp.js](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/blockify-turbowarp.js)

Implemented:

- parse and validate `[procedure]` roots
- parse and validate `[script]` roots
- parse and validate bare `[stack:]` and `[opcode:]` roots (wrapped into synthetic `[script]` internally)
- `OPERAND1`/`OPERAND2` → `NUM1`/`NUM2` normalization for arithmetic operators in both the visual renderer and the scratch-blocks XML path
- string literals render as orange variable-style reporter blocks in the visual renderer
- visual render fallback renderer
- embedded `scratch-blocks` renderer path
- clipboard preview window
- IR editor with:
  - `Source IR`
  - `Patch JSON`
  - `Patched IR Result`
  - visual preview
- button row pinned at the bottom of the editor
- **`blockify clipboard contents`** command block: loads clipboard IR and renders all block stacks in it; previously named "load clipboard IR"
- **`clipboard contents`** reporter block: reads the clipboard and returns its text, displayed in a value bubble when clicked
- `Parser.parseAll()` — parses multiple root nodes from one IR string (enables multi-stack clipboard rendering)
- multi-root rendering: all stacks loaded into a single scratch-blocks workspace via combined XML; stacks are spread horizontally with a configurable `margin` (default 400px) to prevent overlap
- parser tolerates leading `# comment` lines (e.g. the spec header emitted by Textify)

Embedded build artifact:

- [dist/blockify-turbowarp.embedded.js](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/dist/blockify-turbowarp.embedded.js)

## Patch Surface

Current patch schema version:

- `version: 1`
- `target: "project"`

Current supported operations:

- `rename_variable`
- `detach_top_level_scripts`

## Canonical AI Mutation Samples

Canonical benchmark-style mutation samples are documented in:

- [AI_MUTATION_BENCHMARKS.md](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/AI_MUTATION_BENCHMARKS.md)
- [GOOGLE_AI_ROUNDTRIP_HISTORY.md](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/GOOGLE_AI_ROUNDTRIP_HISTORY.md)
- [CHATGPT_ROUNDTRIP_HISTORY.md](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/CHATGPT_ROUNDTRIP_HISTORY.md)
- [CLAUDE_ROUNDTRIP_HISTORY.md](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/CLAUDE_ROUNDTRIP_HISTORY.md)

These record nontrivial LLM mutation tasks that go beyond simple scalar edits, including:

- stack reordering
- nested control restructuring
- empty substacks
- promotion/demotion of commands across stack levels

A structured test ledger with 8 tests across two base IRs is available in `AI_MODEL_TEST_LEDGER.md` and `ai-model-test-ledger.html` (V1 — inline rules). A behavioral variant is in `ai-model-test-ledger-v2.html` (V2). A post-rule-update ledger using the same direct-mutation tests as V1 but with URL-based rules is in `ai-model-test-ledger-v3.html` (V3).

**AI mutation rules update (2026-03-25):** `AI_MUTATION_RULES` was changed from an inline bullet-point list to a prompt instructing the model to fetch and follow `IR_GRAMMAR.md` from GitHub before responding. V1 and V2 ledger results used the old inline rules. V3 results use the new URL-based rules. Do not compare results across ledger versions.

**Pipeline update (2026-03-25):** `AI_MUTATION_RULES` and the `copy rules with clipboard IR` block moved from Blockify to Textify. `IR_GRAMMAR.md` was replaced with a machine-optimized formal grammar spec; the previous content moved to `IR_FULL_REFERENCE.md`. Textify clipboard exports now include a `# Textify Canon IR — spec:` header line. Blockify parser now tolerates and strips those header lines. Blockify now accepts bare `[stack:]` and `[opcode:]` roots.

Google Gemini (current) round 2 (2026-03-24): **8/8 pass** across parse, validate, and structural correctness using the embedded renderer. Session context bleed observed on tests 4 and 5 — resolved by re-anchoring to the starting IR before each mutation request.

ChatGPT round 1 (2026-03-24): **8/8 pass** across parse, validate, and structural correctness using the embedded renderer. Initial bleed observed and eliminated mid-session by combining two fixes: updated `AI_MUTATION_RULES` (require IR echo before mutation) and a between-test continuation prompt (`start from here, don't change anything: (provided IR)`). All 8 tests ran in the same session. See `CHATGPT_ROUNDTRIP_HISTORY.md`.

Claude Sonnet 4.6 round 1 (2026-03-24): **partial** — 2/4 pass before Poe credits ran out. Test 3 failed: Claude produced unquoted string literals (`[literal:string:looping]` instead of `[literal:string:"looping"]`), causing a parse error. Tests 5–8 not reached. Testing to resume. See `CLAUDE_ROUNDTRIP_HISTORY.md`.

Google Gemini 3 v2 behavioral round 1 (2026-03-24): **partial** — tests 1–2 clean pass from behavioral prompts alone. Test 3 parsed/validated but Blockify fell back to the fallback renderer (under investigation). Test 4 showed unintended threshold adjustment (50→49) on operator swap from behavioral description. Tests 5–8 not reached. See `GOOGLE_AI_ROUNDTRIP_HISTORY.md`.

## Architecture Boundary

The current architectural boundary between structural core and Scratch/TurboWarp adapter detail is documented in:

- [ARCHITECTURE_BOUNDARIES.md](/Users/leoja/Desktop/Dad%20Games/turbowarp-extensions-js/canon/ARCHITECTURE_BOUNDARIES.md)

This file should be used as the canonical record for:

- what is currently core
- what is currently adapter-specific
- how to think about future abstraction without destabilizing the current system

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

- `15` test suites passing
- `113` tests passing

Coverage currently includes:

- camera/leaderboards regressions
- embedded `scratch-blocks` rendering regressions
- script root support
- Textify block registration (all remaining blocks)
- `getStackRoot` helper (next-chain, SUBSTACK, reporter, detached, unknown)
- `exportAllStacksText` (empty target, single stack, multi-stack, procedure exclusion)
- `copyAllStacksToClipboard` / `copyAllStacksPlain` (sprite lookup, clipboard payload, shared state, self-exclusion via util)
- `getExportedIR` reporter
- `textifyClickedBlock` (graceful no-op when ScratchBlocks unavailable)
- patch engine operations
- patch workflow state behavior
- editor layout behavior
- Textify/Blockify shared state bridge (`__TEXTIFY_SHARED__`)
- `copyRulesWithClipboardIR` block behavior (all cases)
- `readClipboard` / `loadClipboardIR` / `clipboardIRMatchesBuffer` block behavior

## Next Likely Steps

Most likely next directions:

1. Grow the internal patch surface with more safe edit ops.
2. Improve patch workbench UX for faster testing.
3. Introduce project-level operations after script-level patching is mature.
4. Add diagnostics/linting as a separate layer from patching.
