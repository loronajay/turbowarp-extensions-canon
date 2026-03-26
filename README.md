# turbowarp-extensions-canon

A deterministic IR transformation engine for Scratch/TurboWarp block-based programs. Enables AI-assisted code mutation via a canonical text format called **Textify Canon IR** (also referred to as **Blockify IR**).

## What it does

Two TurboWarp extensions form a round-trip pipeline:

```
Scratch project → [Textify] → Textify IR → [AI model] → [Blockify] → Scratch blocks
```

**Textify** exports custom blocks and top-level scripts from a running Scratch/TurboWarp project to Textify Canon IR and copies it to the clipboard.

**Blockify** accepts Textify IR, validates it, applies AI-produced patch operations, and renders the result as visual Scratch blocks using an embedded scratch-blocks renderer.

## Textify Canon IR

Textify Canon IR is the canonical text representation of Scratch/TurboWarp block programs used by this pipeline. Every IR snippet exported by Textify includes a spec header pointing to the grammar document:

```
# Textify Canon IR — spec: https://raw.githubusercontent.com/loronajay/turbowarp-extensions-canon/main/IR_GRAMMAR.md
[procedure
  proccode:"Spawn Food"
  argumentnames:[]
  argumentdefaults:[]
  warp:true
  body:[stack:
    [opcode:motion_gotoxy
      id:"goto1"
      fields:{}
      inputs:{
        X:[opcode:operator_add
          id:"calc_x"
          fields:{}
          inputs:{
            NUM1:[literal:number:-108]
            NUM2:[opcode:operator_multiply
              id:"scale_x"
              fields:{}
              inputs:{
                NUM1:[opcode:operator_random
                  id:"rand_x"
                  fields:{}
                  inputs:{FROM:[literal:number:0] TO:[literal:number:9]}
                  stacks:{}
                ]
                NUM2:[literal:number:24]
              }
              stacks:{}
            ]
          }
          stacks:{}
        ]
        Y:[literal:number:0]
      }
      stacks:{}
    ]
  ]
]
```

## Grammar Specification

The formal grammar specification for Textify Canon IR is in [`IR_GRAMMAR.md`](IR_GRAMMAR.md).

**Direct URL for AI models:**
```
https://raw.githubusercontent.com/loronajay/turbowarp-extensions-canon/main/IR_GRAMMAR.md
```

This document defines all node types (`procedure`, `script`, `stack`, `opcode`, `literal`, `menu`), canonical input/field names for all Scratch opcodes, and the complete constraint set.

> If you are an AI model working with Textify IR or Blockify IR, fetch and follow the grammar specification at the URL above before producing any output.

## AI Mutation Workflow

1. In Scratch/TurboWarp, use Textify's **copy custom block to clipboard** command — copies IR with spec header to clipboard
2. Use Textify's **copy rules with clipboard IR** command — prepends the full mutation rules and grammar URL, writes back to clipboard
3. Paste into an AI model (Gemini, ChatGPT, Claude, etc.)
4. The model fetches `IR_GRAMMAR.md`, echoes the IR back, then waits for your mutation request
5. Paste the model's output back into Blockify's Source IR pane to preview and validate

## Files

| File | Purpose |
|---|---|
| `textify-turbowarp.js` | TurboWarp extension — exports IR, prepares AI payloads |
| `blockify-turbowarp.js` | TurboWarp extension — parses, patches, and renders IR |
| `dist/blockify-turbowarp.embedded.js` | Blockify bundled with scratch-blocks for visual rendering |
| `IR_GRAMMAR.md` | Formal grammar spec — for AI models |
| `IR_FULL_REFERENCE.md` | Full human reference — mutation rules, failure modes, examples |
| `PATCH_SCHEMA.md` | Patch JSON format specification |
| `PROJECT_STATUS.md` | Implementation status and known limits |

## Development

```bash
npm test               # Run all tests
npm run build:blockify # Bundle blockify with scratch-blocks
```

Tests run under Jest with no browser required. Mock Scratch environments are constructed inline.
