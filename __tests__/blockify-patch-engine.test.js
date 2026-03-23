const { loadExtension } = require('./helpers/load-extension');

describe('Blockify patch engine', () => {
  function getHooks() {
    const { context } = loadExtension('blockify-turbowarp.js');
    return context.__blockifyTestHooks || context.globalThis.__blockifyTestHooks;
  }

  test('renames variable fields across script and procedure roots without touching literals', () => {
    const hooks = getHooks();
    const roots = [
      {
        type: 'script',
        body: {
          type: 'stack',
          children: [
            {
              type: 'opcode',
              opcode: 'data_setvariableto',
              id: 'set1',
              fields: { VARIABLE: 'x' },
              inputs: {
                VALUE: { type: 'literal', valueType: 'string', value: 'x should stay literal' }
              },
              stacks: {}
            }
          ]
        }
      },
      {
        type: 'procedure',
        proccode: 'demo',
        argumentnames: [],
        argumentdefaults: [],
        warp: false,
        body: {
          type: 'stack',
          children: [
            {
              type: 'opcode',
              opcode: 'data_variable',
              id: 'var1',
              fields: { VARIABLE: 'x' },
              inputs: {},
              stacks: {}
            }
          ]
        }
      }
    ];

    const patch = {
      version: 1,
      target: 'project',
      operations: [
        {
          op: 'rename_variable',
          from: 'x',
          to: 'y',
          scope: 'project'
        }
      ]
    };

    const patched = hooks.applyProjectPatch(roots, patch);

    expect(patched[0].body.children[0].fields.VARIABLE).toBe('y');
    expect(patched[0].body.children[0].inputs.VALUE.value).toBe('x should stay literal');
    expect(patched[1].body.children[0].fields.VARIABLE).toBe('y');
    expect(patched[0].body.children[0].id).toBe('set1');
    expect(patched[1].body.children[0].id).toBe('var1');
  });

  test('detaches green flag hats from top-level scripts while preserving remaining stack and empty scripts', () => {
    const hooks = getHooks();
    const roots = [
      {
        type: 'script',
        body: {
          type: 'stack',
          children: [
            {
              type: 'opcode',
              opcode: 'events_whenflagclicked',
              id: 'hat1',
              fields: {},
              inputs: {},
              stacks: {}
            },
            {
              type: 'opcode',
              opcode: 'motion_movesteps',
              id: 'move1',
              fields: {},
              inputs: {
                STEPS: { type: 'literal', valueType: 'number', value: 10 }
              },
              stacks: {}
            }
          ]
        }
      },
      {
        type: 'script',
        body: {
          type: 'stack',
          children: [
            {
              type: 'opcode',
              opcode: 'events_whenflagclicked',
              id: 'hatOnly',
              fields: {},
              inputs: {},
              stacks: {}
            }
          ]
        }
      },
      {
        type: 'script',
        body: {
          type: 'stack',
          children: [
            {
              type: 'opcode',
              opcode: 'event_whenbroadcastreceived',
              id: 'recv1',
              fields: { BROADCAST_OPTION: 'start' },
              inputs: {},
              stacks: {}
            }
          ]
        }
      }
    ];

    const patch = {
      version: 1,
      target: 'project',
      operations: [
        {
          op: 'detach_top_level_scripts',
          match: {
            opcode: 'events_whenflagclicked'
          }
        }
      ]
    };

    const patched = hooks.applyProjectPatch(roots, patch);

    expect(patched[0].body.children).toHaveLength(1);
    expect(patched[0].body.children[0].opcode).toBe('motion_movesteps');
    expect(patched[0].body.children[0].id).toBe('move1');
    expect(patched[1].body.children).toHaveLength(0);
    expect(patched[2].body.children[0].opcode).toBe('event_whenbroadcastreceived');
  });

  test('serializes patched roots back into parseable IR', () => {
    const hooks = getHooks();
    const roots = [
      {
        type: 'script',
        body: {
          type: 'stack',
          children: [
            {
              type: 'opcode',
              opcode: 'events_whenflagclicked',
              id: 'hat1',
              fields: {},
              inputs: {},
              stacks: {}
            },
            {
              type: 'opcode',
              opcode: 'data_setvariableto',
              id: 'set1',
              fields: { VARIABLE: 'x' },
              inputs: {
                VALUE: { type: 'literal', valueType: 'number', value: 1 }
              },
              stacks: {}
            }
          ]
        }
      }
    ];

    const patch = {
      version: 1,
      target: 'project',
      operations: [
        { op: 'rename_variable', from: 'x', to: 'y', scope: 'project' },
        { op: 'detach_top_level_scripts', match: { opcode: 'events_whenflagclicked' } }
      ]
    };

    const patched = hooks.applyProjectPatch(roots, patch);
    const ir = hooks.serializeAst(patched[0]);
    const reparsed = new hooks.Parser(ir).parse();

    expect(ir).toContain('[script');
    expect(ir).toContain('VARIABLE:"y"');
    expect(ir).not.toContain('events_whenflagclicked');
    expect(reparsed.type).toBe('script');
    expect(reparsed.body.children[0].opcode).toBe('data_setvariableto');
    expect(reparsed.body.children[0].fields.VARIABLE).toBe('y');
  });

  test('applies a patch directly to IR text', () => {
    const hooks = getHooks();
    const ir = [
      '[script',
      '  body:[stack:',
      '    [opcode:events_whenflagclicked',
      '      id:"hat1"',
      '      fields:{}',
      '      inputs:{}',
      '      stacks:{}',
      '    ]',
      '    [opcode:data_setvariableto',
      '      id:"set1"',
      '      fields:{',
      '        VARIABLE:"x"',
      '      }',
      '      inputs:{',
      '        VALUE:[literal:number:1]',
      '      }',
      '      stacks:{}',
      '    ]',
      '  ]',
      ']'
    ].join('\n');

    const patch = {
      version: 1,
      target: 'project',
      operations: [
        { op: 'rename_variable', from: 'x', to: 'y', scope: 'project' },
        { op: 'detach_top_level_scripts', match: { opcode: 'events_whenflagclicked' } }
      ]
    };

    const result = hooks.applyPatchToIR(ir, patch);

    expect(result.ok).toBe(true);
    expect(result.ir).toContain('VARIABLE:"y"');
    expect(result.ir).not.toContain('events_whenflagclicked');
  });

  test('applies a patch from JSON text to IR text', () => {
    const hooks = getHooks();
    const ir = [
      '[script',
      '  body:[stack:',
      '    [opcode:data_variable',
      '      id:"var1"',
      '      fields:{',
      '        VARIABLE:"x"',
      '      }',
      '      inputs:{}',
      '      stacks:{}',
      '    ]',
      '  ]',
      ']'
    ].join('\n');
    const patchJson = JSON.stringify({
      version: 1,
      target: 'project',
      operations: [
        { op: 'rename_variable', from: 'x', to: 'y', scope: 'project' }
      ]
    });

    const result = hooks.applyPatchJsonToIR(ir, patchJson);

    expect(result.ok).toBe(true);
    expect(result.ir).toContain('VARIABLE:"y"');
  });

  test('returns a structured error for invalid IR input', () => {
    const hooks = getHooks();
    const patch = {
      version: 1,
      target: 'project',
      operations: [
        { op: 'rename_variable', from: 'x', to: 'y', scope: 'project' }
      ]
    };

    const result = hooks.applyPatchToIR('[script body:bad]', patch);

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe('string');
  });

  test('returns a structured error for invalid patch JSON', () => {
    const hooks = getHooks();
    const ir = '[script\n  body:[stack:]\n]';

    const result = hooks.applyPatchJsonToIR(ir, '{invalid json');

    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe('string');
    expect(result.error.length).toBeGreaterThan(0);
  });
});
