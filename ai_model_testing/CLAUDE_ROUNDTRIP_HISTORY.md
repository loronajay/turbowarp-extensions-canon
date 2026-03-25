# Claude Round-Trip History

## Purpose

This file records Claude mutation tests run against the Textify/Blockify IR workflow.

Each round includes:

- the model tested and access method
- the test setup and tooling used
- results across all 8 structured tests
- any notable behavior or methodology findings

## Important Notes

### Authorship Bias

Claude authored the AI mutation rules and the IR grammar used in these tests. This gives Claude an inherent advantage over models like Google Gemini (current) and ChatGPT that had no prior exposure to the format. Results should be interpreted with this in mind — a clean pass from Claude is weaker evidence than a clean pass from an independent model.

### Access Method

Claude cannot be tested anonymously — claude.ai requires an account, and Claude Code carries full project context. Tests were run via **Poe** (poe.com), which provides access to Claude models without a Claude account and with no project context loaded.

---

## Round 1 — 2026-03-24 (AI Model Test Ledger, Partial)

### Setup

- **Model:** Claude Sonnet 4.6
- **Access:** Poe (poe.com) — no Claude account, no project context
- **Date:** 2026-03-24
- **Tooling:** `copy rules with IR buffer` block in Blockify embedded renderer
- **Renderer:** full embedded scratch-blocks (real block images, not fallback)
- **Test source:** `AI_MODEL_TEST_LEDGER.md` — 8 structured tests across IR-A and IR-B
- **Session structure:** tests run in succession in the same Poe session; continuation prompt used between tests

### Results Summary

| Test | Description | Parses | Validates | Achieved | Notes |
|------|-------------|--------|-----------|----------|-------|
| 1 | Rename variable | pass | pass | yes | — |
| 2 | Promote change to top level | pass | pass | yes | — |
| 3 | Insert block into substack | **fail** | **fail** | **no** | String literal quoting error — see below |
| 4 | Swap operator | incomplete | incomplete | incomplete | Poe credits ran out; IR echo was correct |
| 5–8 | — | — | — | — | Not reached |

Round 1 is incomplete. Testing to resume when Poe credits are available.

### Test 3 Failure — String Literal Quoting

Test 3 uses IR-B (`ANNOUNCE SCORE`), which contains `[literal:string:"looping"]` and `[literal:string:"done"]`. Claude's output produced these without quotes:

```
[literal:string:looping]
```

instead of the required:

```
[literal:string:"looping"]
```

This caused Blockify to throw:

```
ERROR: Expected "\"" at index 396, found "looping]\n..."
```

The structural mutation was otherwise attempted correctly — the failure was purely a grammar violation on string literal formatting. Claude understood what to change but dropped the required quotes around string values.

This is the first model-produced grammar error recorded in the test ledger.

### Test 4 — Incomplete

Poe free credits ran out before the mutation output could be produced. However, the continuation prompt (`start from here, don't change anything: (provided IR)`) was sent and Claude correctly repeated the starting IR back before the session ended. The IR-echo rule worked as intended.

### Round 1 Significance

Even with the authorship bias, the test 3 failure is a meaningful signal:

- Claude knows the IR format well enough to produce valid output for simpler mutations (tests 1–2)
- but under IR-B's string literal requirement, Claude omitted the quotes — a specific and reproducible grammar rule that models can miss
- this suggests string literal quoting is a **known failure mode** worth watching across all models on IR-B tests

Full round 1 results pending resumption of testing.
