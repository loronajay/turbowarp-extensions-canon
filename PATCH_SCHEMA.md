# Patch Schema

## Current Version

```json
{
  "version": 1,
  "target": "project",
  "operations": []
}
```

## Philosophy

The patch system is intentionally constrained.

It is designed for:

- deterministic structural edits
- validation before success
- reversible, inspectable transformation
- AI-generated candidate patches that are safer than raw IR rewriting

It is not yet designed for:

- whole-project freeform generation
- open-ended autonomous editing
- sprite creation or full project graph mutation

## Supported Operations

### `rename_variable`

Renames matching variable field references from one exact name to another.

```json
{
  "op": "rename_variable",
  "from": "x",
  "to": "y",
  "scope": "project"
}
```

Current semantics:

- exact-name match only
- currently updates `VARIABLE` fields
- does not rewrite unrelated string literals
- preserves existing block IDs

Validation:

- `from` must be non-empty
- `to` must be non-empty
- `from` and `to` must differ

### `detach_top_level_scripts`

Removes the first block from `[script]` roots when that first block matches the requested opcode.

```json
{
  "op": "detach_top_level_scripts",
  "match": {
    "opcode": "events_whenflagclicked"
  }
}
```

Current semantics:

- only applies to `[script]` roots
- only checks the first opcode in `body.children`
- if the first opcode matches, it is removed
- remaining blocks stay intact
- if the script becomes empty, the empty script remains

Validation:

- `match.opcode` must be present and non-empty

## Example Patch

```json
{
  "version": 1,
  "target": "project",
  "operations": [
    {
      "op": "rename_variable",
      "from": "x",
      "to": "y",
      "scope": "project"
    },
    {
      "op": "detach_top_level_scripts",
      "match": {
        "opcode": "events_whenflagclicked"
      }
    }
  ]
}
```

## Apply Model

Current apply flow:

1. Parse IR text into AST.
2. Apply patch ops to cloned AST roots.
3. Serialize patched AST back to canonical IR.
4. Re-parse serialized IR for validation.
5. Return structured success or error result.

Structured results:

```json
{ "ok": true, "ir": "..." }
```

```json
{ "ok": false, "error": "..." }
```

## Planned Growth

Likely future operations:

- `set_field`
- `set_literal`
- `replace_input`
- `insert_after`
- `remove_block`
- `append_to_substack`
- wrapping operations like `wrap_with_if` / `wrap_with_repeat`

Project-level operations such as sprite creation or variable creation are not part of the current schema surface yet.
