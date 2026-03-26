# AI Mutation Prompt — System Prompt + Test IR

## Purpose

This document contains the canonical system prompt for the AI mutation API block,
plus ready-to-use test IRs for immediate validation testing.

---

## System Prompt

```
You are modifying Textify canon IR.

Before responding, fetch and read the full grammar specification at:
https://raw.githubusercontent.com/loronajay/textify-blockify-IR/main/IR_GRAMMAR.md

Follow all rules and grammar defined in that document exactly.

When you receive the IR below, do not make any modifications yet. First, repeat the IR back exactly as provided, then wait for a modification request.

IR:
```

---

## User Message Format

The user message sent with each API call:

```
{MUTATION_REQUEST}

IR:
{EXPORTED_IR}
```

`{MUTATION_REQUEST}` is whatever the user typed into the request block.
`{EXPORTED_IR}` is the last Textify export read from `__TEXTIFY_SHARED__`.

---

## Test IR — IR-A (Control Structure)

```
[procedure
  proccode:"TEST BLOCK A"
  argumentnames:[]
  argumentdefaults:[]
  warp:true
  body:[stack:
    [opcode:control_repeat
      id:"repeat1"
      fields:{}
      inputs:{
        TIMES:[literal:number:10]
      }
      stacks:{
        SUBSTACK:[stack:
          [opcode:control_if
            id:"if1"
            fields:{}
            inputs:{
              CONDITION:[opcode:operator_equals
                id:"cond1"
                fields:{}
                inputs:{
                  OPERAND1:[opcode:motion_xposition
                    id:"xpos1"
                    fields:{}
                    inputs:{}
                    stacks:{}
                  ]
                  OPERAND2:[literal:number:50]
                }
                stacks:{}
              ]
            }
            stacks:{
              SUBSTACK:[stack:
                [opcode:data_changevariableby
                  id:"change1"
                  fields:{VARIABLE:"x"}
                  inputs:{VALUE:[literal:number:1]}
                  stacks:{}
                ]
              ]
            }
          ]
        ]
      }
    ]
  ]
]
```

### IR-A test mutations

1. `Rename the variable x to score.`
2. `Move the control_if block out of the repeat and place it directly below the repeat at the top level.`
3. `Wrap the data_changevariableby command inside a new control_repeat block with TIMES set to 3. Place it inside the existing control_if SUBSTACK.`
4. `Replace the top-level stack with: a control_if containing the data_changevariableby command, followed by an empty control_repeat.`
5. `Change the OPERAND2 of the operator_equals condition from 50 to 100.`

---

## Test IR — IR-B (String Literals)

Use this IR to specifically verify string literal handling — the known failure mode.

```
[procedure
  proccode:"ANNOUNCE SCORE %s"
  argumentnames:["label"]
  argumentdefaults:["score"]
  warp:false
  body:[stack:
    [opcode:control_if
      id:"check1"
      fields:{}
      inputs:{
        CONDITION:[opcode:operator_gt
          id:"gt1"
          fields:{}
          inputs:{
            OPERAND1:[opcode:data_variable
              id:"var1"
              fields:{VARIABLE:"score"}
              inputs:{}
              stacks:{}
            ]
            OPERAND2:[literal:number:0]
          }
          stacks:{}
        ]
      }
      stacks:{
        SUBSTACK:[stack:
          [opcode:looks_say
            id:"say1"
            fields:{}
            inputs:{
              MESSAGE:[opcode:argument_reporter_string_number
                id:"arg1"
                fields:{VALUE:"label"}
                inputs:{}
                stacks:{}
              ]
            }
            stacks:{}
          ]
        ]
      }
    ]
    [opcode:control_if_else
      id:"state1"
      fields:{}
      inputs:{
        CONDITION:[opcode:operator_gt
          id:"gt2"
          fields:{}
          inputs:{
            OPERAND1:[opcode:data_variable
              id:"var2"
              fields:{VARIABLE:"score"}
              inputs:{}
              stacks:{}
            ]
            OPERAND2:[literal:number:100]
          }
          stacks:{}
        ]
      }
      stacks:{
        SUBSTACK:[stack:
          [opcode:looks_say
            id:"say2"
            fields:{}
            inputs:{MESSAGE:[literal:string:"done"]}
            stacks:{}
          ]
        ]
        SUBSTACK2:[stack:
          [opcode:looks_say
            id:"say3"
            fields:{}
            inputs:{MESSAGE:[literal:string:"looping"]}
            stacks:{}
          ]
        ]
      }
    ]
  ]
]
```

### IR-B test mutations

1. `Add a looks_say block at the top of the body, before the first control_if, that says "starting".`
2. `Change the OPERAND2 of the first operator_gt from 0 to 10.`
3. `Replace the looks_say in SUBSTACK2 of the control_if_else so it says "still going" instead of "looping".`
4. `Swap the contents of SUBSTACK and SUBSTACK2 in the control_if_else.`

---

## What to check in Blockify after each test

1. **ERROR** — must show `[none]`.
2. **Visual renderer** — must show real block images, not fallback text. Fallback with no error means an opcode was misspelled.
3. **String literals** — if the mutation involved string values, verify they appear correctly in the render.
4. **Unintended changes** — blocks not mentioned in the request must be unchanged.
