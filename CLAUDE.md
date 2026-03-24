# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test                          # Run all tests (95 tests, ~1.7s)
npm run build:blockify            # Bundle blockify with scratch-blocks → dist/blockify-turbowarp.embedded.js
```

No lint command is configured. There is no separate single-test command; Jest can be invoked directly:

```bash
npx jest __tests__/blockify-patch-engine.test.js   # Run a single test file
npx jest --testNamePattern="rename"                 # Run tests matching a pattern
```

## Architecture

This project is a **deterministic IR transformation engine** for Scratch/TurboWarp block-based programs. It enables AI-assisted code mutation via a canonical text IR (Intermediate Representation).

### Three-layer pipeline

```
Scratch project → [Textify] → IR text → [AI/User] → patch JSON → [Blockify] → Scratch XML
```

1. **`textify-turbowarp.js`** — Adapter A. Exports custom blocks and top-level stacks from a running Scratch project to canonical IR text. Copies to clipboard.
2. **`blockify-turbowarp.js`** — Adapter B + Core. Parses IR text, validates it, applies patches, re-validates, and renders the result as visual Scratch blocks (using `scratch-blocks`) or a plain-text fallback. Contains the patch engine and a patch workbench UI.
3. **Patch engine** (inside blockify) — applies operations from a JSON patch document to an AST clone, serializes back, and re-parses for validation. Failed patches never overwrite prior state.

### Canonical IR grammar

```
[procedure
  proccode:"NAME %s"
  argumentnames:[arg1]
  argumentdefaults:[""]
  warp:false
  body:[stack: ...]
]

[script body:[stack: ...]]

[stack:
  [opcode:OPCODE
    id:"uid"
    fields:{FIELD:"value"}
    inputs:{INPUT:node}
    stacks:{SUBSTACK:[stack:...]}
  ]
  ...
]

[literal:type:value]
[menu:opcode:field:value]
```

Both textify and blockify use hand-written recursive-descent parsers (`parseIdentifier`, `parseString`, `parseBracketNode`, etc.) with custom error classes (`ParseError`, `ValidationError`).

### Patch operations

Patch documents are versioned JSON (`"version": 1`). See `PATCH_SCHEMA.md` for the full spec. Currently implemented operations:

| Operation | Description |
|---|---|
| `rename_variable` | Rename variable field references across project |
| `detach_top_level_scripts` | Remove the first block of `[script]` roots matching an opcode |

`replace_body` is defined in the schema but partially commented out in tests.

### Factory extensions

The `factory-*.js` files are independent unsandboxed TurboWarp extensions (animation, physics, camera, visuals, text, controls, stats, leaderboards). Each follows the same pattern: `getInfo()` returns block/menu definitions; instance methods handle block execution; per-sprite state is stored in a `targetStates` Map keyed by sprite ID. `turbowarp-game-factory.js` is the top-level game framework that wires them together.

### Testing approach

Tests run under Jest. Extensions expose internals via `__blockifyTestHooks` / `__textifyTestHooks` on the global object (set during `loadExtension()`). Mock Scratch environments (vm, runtime, targets) are constructed inline in tests — no browser required.

Key test files:
- `blockify-patch-engine.test.js` — patch operation semantics
- `blockify-patch-workflow.test.js` — patch editor state machine
- `textify-turbowarp.test.js` — IR serialization round-trips
- `blockify-visual-renderer.test.js` — visual fallback renderer
- `replace-body-patch.test.js` — body replacement (partially commented)
- `factory-*.test.js` / `turbowarp-game-factory.test.js` — factory regression tests

### Key documentation

- `ARCHITECTURE_BOUNDARIES.md` — what belongs in the core vs. Scratch adapter
- `PROJECT_STATUS.md` — current implementation status and known limits
- `PATCH_SCHEMA.md` — patch JSON format specification
- `AI_MUTATION_BENCHMARKS.md` — canonical AI mutation test cases
