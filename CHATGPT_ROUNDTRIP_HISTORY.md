# ChatGPT Round-Trip History

## Purpose

This file records ChatGPT mutation tests run against the Textify/Blockify IR workflow.

Each round includes:

- the model tested
- the test setup and tooling used
- results across all 8 structured tests
- any notable behavior or methodology findings

---

## Round 1 — 2026-03-24 (AI Model Test Ledger)

### Setup

- **Model:** ChatGPT
- **Date:** 2026-03-24
- **Tooling:** `copy rules with IR buffer` block in Blockify embedded renderer
- **Renderer:** full embedded scratch-blocks (real block images, not fallback)
- **Test source:** `AI_MODEL_TEST_LEDGER.md` — 8 structured tests across IR-A and IR-B
- **Session structure:** all 8 tests run in succession in the same chat session

### Bleed and Fix

ChatGPT initially showed session context bleed — structure from earlier mutations appeared in later outputs, the same pattern observed with Google Gemini (current) in round 2.

Two changes were made together to address this:

1. `AI_MUTATION_RULES` was updated to require the model to repeat the starting IR back exactly before applying any mutation.
2. A **continuation prompt** was added between tests:

   ```
   start from here, don't change anything: (provided test IR)
   ```

   This explicitly re-anchors the model to the correct base before each new mutation request.

After both changes, bleed was completely eliminated for the remainder of the session. All subsequent tests produced clean output from the correct starting IR.

### Results Summary

| Test | Description | Parses | Validates | Achieved | Notes |
|------|-------------|--------|-----------|----------|-------|
| 1 | Rename variable | pass | pass | yes | — |
| 2 | Promote change to top level | pass | pass | yes | — |
| 3 | Insert block into substack | pass | pass | yes | — |
| 4 | Swap operator | pass | pass | yes | — |
| 5 | Wrap inner change in repeat | pass | pass | yes | — |
| 6 | Change literal value | pass | pass | yes | — |
| 7 | Append block after sequence | pass | pass | yes | — |
| 8 | Lift sequence out of repeat | pass | pass | yes | — |

All 8 tests passed. No unintended changes after bleed was resolved.

### Round 1 Significance

This is the first ChatGPT round using the full embedded renderer and the structured 8-test ledger. Compared to the Google Gemini (current) round 2 baseline:

- same 8/8 result
- same bleed pattern initially observed
- bleed eliminated more cleanly — the continuation prompt approach proved sufficient without needing to restart the session

The continuation prompt (`start from here, don't change anything: (provided IR)`) is now the standard between-test reset step for any model when running multiple tests in the same session.
