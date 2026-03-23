# Architecture Boundaries

## Purpose

This document records the current architectural boundary between:

- the structural core of the system
- the Scratch/TurboWarp-specific adapter layer
- future abstraction candidates

It exists to keep the project from drifting into one of two failure modes:

1. staying permanently trapped in Scratch/TurboWarp assumptions
2. abstracting too early and damaging the working round-trip system

## Current Strategic Framing

The correct current framing is:

- Scratch/TurboWarp is the proving ground
- not the long-term identity of the system

The system should be thought of as:

- Adapter A: Scratch/TurboWarp -> IR
- Core: parser + validator + patch engine + canonical serializer
- Adapter B: IR -> Scratch/TurboWarp

This means the current project is best described as:

- a deterministic transformation engine
- currently tested against Scratch/TurboWarp

not:

- a Scratch-only AI tool

## What Is Core Right Now

The following concepts should be treated as part of the current structural core:

- root units such as `[procedure]` and `[script]`
- parsed AST representation
- stack nesting and child ordering
- typed node categories such as opcode, literal, stack, procedure, script, and menu
- stable node identity through IDs
- canonical serialization
- validation before success
- re-parse validation after serialization
- deterministic patch application against parsed structure

These concepts are already meaningful independent of the current UI and renderer.

## What Is Adapter-Specific Right Now

The following concepts are currently Scratch/TurboWarp adapter details and should be treated that way:

- raw Scratch opcode strings
- raw Scratch field names such as `VARIABLE`
- Scratch menu opcode names
- Scratch mutation payload details
- Scratch/TurboWarp-specific visual rendering behavior
- `scratch-blocks` renderer integration
- exact field/input names where they mirror Scratch workspace conventions

These may still appear in the current canonical IR for fidelity reasons, but they should not be mistaken for the long-term universal semantic layer.

## Current Reality Check

The repo already has a real structural core, but it is still visibly Scratch-shaped at the vocabulary layer.

That means:

- the project is not platform-agnostic yet
- the project is also not trapped yet

This is acceptable at the current stage as long as the distinction stays explicit.

## Current IR Guidance

The current IR is allowed to remain fidelity-first and somewhat Scratch-shaped.

That is intentional because:

- round-trip fidelity matters
- visual reconstruction matters
- fast testing matters
- premature abstraction would likely slow development and weaken confidence

The current IR should therefore be treated as:

- the canonical working representation for the Scratch/TurboWarp adapter

not yet as:

- the final universal semantic model

## Future Abstraction Guidance

Future abstraction should be staged, not forced early.

The likely safe path is:

1. keep the current fidelity IR stable
2. continue growing the patch engine on top of stable structural concepts
3. document which IR elements are core structure versus adapter detail
4. later extract or define a more abstract semantic layer once the current system is proven

This means the project should avoid:

- rewriting the IR too early in the name of universality
- pretending the current Scratch-shaped vocabulary is already portable

## Patch Design Guidance

Future patch operations should increasingly prefer structural targeting where possible.

Examples of more structural directions:

- replace an input slot
- insert after a node
- remove a node
- append to a substack
- wrap a stack in a control structure

Examples of still adapter-shaped directions:

- matching a raw Scratch opcode string
- editing a field by Scratch-specific field name

Both are acceptable for now, but new work should favor structural concepts whenever that can be done without weakening fidelity or clarity.

## Current Scope Truth

The current patch engine is still intentionally small.

It currently supports:

- `rename_variable`
- `detach_top_level_scripts`

It currently operates as a disciplined structural patch pass over parsed IR roots.

This should be described honestly as:

- a bounded transformation prototype

not yet as:

- a complete project-wide edit engine

## Decision Rule For New Features

For each future feature, ask:

1. Does this deepen the structural core?
2. Does this only add more Scratch-shaped surface area?
3. If it adds Scratch-shaped detail, is that necessary for current fidelity?
4. Can the feature be expressed in a more structural way without harming round-trip safety?

If a new feature only increases Scratch-specific vocabulary without increasing structural leverage, it should be questioned.

## Near-Term Architectural Goal

The near-term goal is not to leave Scratch/TurboWarp immediately.

The near-term goal is to:

- keep using Scratch/TurboWarp as the testbed
- strengthen the structural patch/validation core
- make the boundary between core and adapter increasingly explicit

That keeps the project grounded while preserving future upside.
