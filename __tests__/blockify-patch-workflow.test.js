const { loadExtension } = require('./helpers/load-extension');

describe('Blockify patch workflow', () => {
  function loadWithClipboard(writeTextImpl = jest.fn().mockResolvedValue(undefined)) {
    return loadExtension('blockify-turbowarp.js', {
      globals: {
        navigator: {
          clipboard: {
            writeText: writeTextImpl
          }
        }
      }
    });
  }

  const sourceIR = [
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

  test('set/get patch buffer is independent from IR buffer', () => {
    const { extension } = loadWithClipboard();

    extension.setIRBuffer({ IR: sourceIR });
    extension.setPatchBuffer({ PATCH: '{"version":1}' });

    expect(extension.getIRBuffer()).toBe(sourceIR);
    expect(extension.getPatchBuffer()).toBe('{"version":1}');
  });

  test('apply patch buffer stores patched IR and clears patch error on success', () => {
    const { extension } = loadWithClipboard();
    extension.lastPatchError = 'old error';
    extension.setIRBuffer({ IR: sourceIR });
    extension.setPatchBuffer({
      PATCH: JSON.stringify({
        version: 1,
        target: 'project',
        operations: [
          { op: 'rename_variable', from: 'x', to: 'y', scope: 'project' },
          { op: 'detach_top_level_scripts', match: { opcode: 'events_whenflagclicked' } }
        ]
      })
    });

    const result = extension.applyPatchBufferToIRBuffer();

    expect(result).toBe(true);
    expect(extension.getLastPatchedIR()).toContain('VARIABLE:"y"');
    expect(extension.getLastPatchedIR()).not.toContain('events_whenflagclicked');
    expect(extension.getLastPatchError()).toBe('');
    expect(extension.getIRBuffer()).toBe(sourceIR);
  });

  test('invalid patch JSON sets patch error and leaves source IR and previous patched IR intact', () => {
    const { extension } = loadWithClipboard();
    extension.setIRBuffer({ IR: sourceIR });
    extension.lastPatchedIR = 'good patched result';
    extension.setPatchBuffer({ PATCH: '{bad json' });

    const result = extension.applyPatchBufferToIRBuffer();

    expect(result).toBe(false);
    expect(extension.getLastPatchError()).toBeTruthy();
    expect(extension.getIRBuffer()).toBe(sourceIR);
    expect(extension.getLastPatchedIR()).toBe('good patched result');
  });

  test('setting source IR invalidates previous patched result', () => {
    const { extension } = loadWithClipboard();
    extension.lastPatchedIR = 'old patched result';
    extension.lastPatchError = 'old patch error';

    extension.setIRBuffer({ IR: sourceIR });

    expect(extension.getLastPatchedIR()).toBe('');
    expect(extension.getLastPatchError()).toBe('');
  });

  test('copy patched IR writes the last patched result to clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    const { extension } = loadWithClipboard(writeText);
    extension.lastPatchedIR = 'patched ir';

    const result = await extension.copyLastPatchedIRToClipboard();

    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith('patched ir');
  });

  test('preview source prefers patched IR only after successful apply', () => {
    const { extension, context } = loadWithClipboard();
    const hooks = context.__blockifyTestHooks || context.globalThis.__blockifyTestHooks;

    extension.setIRBuffer({ IR: sourceIR });
    expect(hooks.getPreferredPreviewIR(extension)).toBe(sourceIR);

    extension.setPatchBuffer({
      PATCH: JSON.stringify({
        version: 1,
        target: 'project',
        operations: [
          { op: 'rename_variable', from: 'x', to: 'y', scope: 'project' }
        ]
      })
    });
    extension.applyPatchBufferToIRBuffer();

    expect(hooks.getPreferredPreviewIR(extension)).toBe(extension.getLastPatchedIR());
  });

  test('failed patch keeps preview on source IR', () => {
    const { extension, context } = loadWithClipboard();
    const hooks = context.__blockifyTestHooks || context.globalThis.__blockifyTestHooks;

    extension.setIRBuffer({ IR: sourceIR });
    extension.setPatchBuffer({ PATCH: '{bad json' });
    extension.applyPatchBufferToIRBuffer();

    expect(hooks.getPreferredPreviewIR(extension)).toBe(sourceIR);
  });
});
