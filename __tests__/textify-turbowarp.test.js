const { loadExtension } = require('./helpers/load-extension');

function makeTarget(name, blocks) {
  return {
    sprite: { name },
    getName() {
      return name;
    },
    blocks: {
      _blocks: blocks
    }
  };
}

function makeProcedureTarget() {
  const blocks = {
    def1: {
      id: 'def1',
      opcode: 'procedures_definition',
      inputs: {
        custom_block: {
          block: 'proto1',
          shadow: null
        }
      },
      next: 'backdropCmd'
    },
    proto1: {
      id: 'proto1',
      opcode: 'procedures_prototype',
      mutation: {
        proccode: 'demo block',
        argumentnames: '[]',
        argumentdefaults: '[]',
        warp: 'false'
      }
    },
    backdropCmd: {
      id: 'backdropCmd',
      opcode: 'looks_switchbackdropto',
      fields: {},
      inputs: {
        BACKDROP: {
          block: 'backdropMenu',
          shadow: 'backdropMenu'
        }
      },
      next: 'costumeCmd'
    },
    backdropMenu: {
      id: 'backdropMenu',
      opcode: 'looks_backdrops',
      shadow: true,
      fields: {
        BACKDROP: {
          value: 'backdrop1'
        }
      },
      inputs: {}
    },
    costumeCmd: {
      id: 'costumeCmd',
      opcode: 'looks_switchcostumeto',
      fields: {},
      inputs: {
        COSTUME: {
          block: 'costumeMenu',
          shadow: 'costumeMenu'
        }
      },
      next: null
    },
    costumeMenu: {
      id: 'costumeMenu',
      opcode: 'looks_costume',
      shadow: true,
      fields: {
        COSTUME: {
          value: 'costume1'
        }
      },
      inputs: {}
    }
  };

  return makeTarget('Sprite1', blocks);
}

function makeScriptTarget() {
  const blocks = {
    hat1: {
      id: 'hat1',
      opcode: 'events_whenflagclicked',
      topLevel: true,
      parent: null,
      next: 'move1',
      x: 12,
      y: 24,
      fields: {},
      inputs: {}
    },
    move1: {
      id: 'move1',
      opcode: 'motion_movesteps',
      topLevel: false,
      parent: 'hat1',
      next: null,
      fields: {},
      inputs: {
        STEPS: {
          block: 'num1',
          shadow: 'num1'
        }
      }
    },
    num1: {
      id: 'num1',
      opcode: 'math_number',
      shadow: true,
      fields: {
        NUM: {
          value: '10'
        }
      },
      inputs: {}
    },
    recv1: {
      id: 'recv1',
      opcode: 'event_whenbroadcastreceived',
      topLevel: true,
      parent: null,
      next: 'say1',
      x: 14,
      y: 120,
      fields: {
        BROADCAST_OPTION: {
          value: 'start'
        }
      },
      inputs: {}
    },
    say1: {
      id: 'say1',
      opcode: 'looks_say',
      topLevel: false,
      parent: 'recv1',
      next: null,
      fields: {},
      inputs: {
        MESSAGE: {
          block: 'txt1',
          shadow: 'txt1'
        }
      }
    },
    txt1: {
      id: 'txt1',
      opcode: 'text',
      shadow: true,
      fields: {
        TEXT: {
          value: 'hello'
        }
      },
      inputs: {}
    },
    noHat1: {
      id: 'noHat1',
      opcode: 'data_setvariableto',
      topLevel: true,
      parent: null,
      next: null,
      x: 18,
      y: 220,
      fields: {
        VARIABLE: {
          value: 'score'
        }
      },
      inputs: {
        VALUE: {
          block: 'num2',
          shadow: 'num2'
        }
      }
    },
    num2: {
      id: 'num2',
      opcode: 'math_number',
      shadow: true,
      fields: {
        NUM: {
          value: '42'
        }
      },
      inputs: {}
    },
    def1: {
      id: 'def1',
      opcode: 'procedures_definition',
      topLevel: true,
      parent: null,
      next: null,
      x: 22,
      y: 320,
      inputs: {
        custom_block: {
          block: 'proto1',
          shadow: null
        }
      }
    },
    proto1: {
      id: 'proto1',
      opcode: 'procedures_prototype',
      mutation: {
        proccode: 'demo block',
        argumentnames: '[]',
        argumentdefaults: '[]',
        warp: 'false'
      }
    }
  };

  return makeTarget('Sprite1', blocks);
}

describe('Textify TurboWarp export', () => {
  test('exports costume and backdrop menus as menu nodes', () => {
    const target = makeProcedureTarget();
    const { context } = loadExtension('textify-turbowarp.js', {
      targets: [target],
      globals: {
        document: {
          getElementById() {
            return null;
          },
          createElement() {
            return {
              style: {},
              appendChild() {},
              append() {},
              remove() {},
              set textContent(value) {
                this._textContent = value;
              },
              get textContent() {
                return this._textContent || '';
              }
            };
          },
          body: {
            appendChild() {}
          }
        },
        navigator: {
          clipboard: {
            writeText: jest.fn()
          }
        }
      }
    });
    const hooks = context.__textifyTestHooks || context.globalThis.__textifyTestHooks;

    const exported = hooks.exportProcedureText(target, 'demo block');

    expect(exported).toContain('[menu:looks_backdrops:"backdrop1"]');
    expect(exported).toContain('[menu:looks_costume:"costume1"]');
  });

  test('copy command writes IR to clipboard without opening popup', async () => {
    const target = makeProcedureTarget();
    const writeText = jest.fn().mockResolvedValue(undefined);
    const createElement = jest.fn(() => ({
      style: {},
      appendChild() {},
      append() {},
      remove() {},
      select() {},
      setSelectionRange() {},
      focus() {},
      set textContent(value) {
        this._textContent = value;
      },
      get textContent() {
        return this._textContent || '';
      }
    }));

    const { extension } = loadExtension('textify-turbowarp.js', {
      targets: [target],
      globals: {
        document: {
          getElementById() {
            return null;
          },
          createElement,
          body: {
            appendChild() {}
          }
        },
        navigator: {
          clipboard: {
            writeText
          }
        }
      }
    });

    await extension.copyCustomBlockToClipboard({
      PROCNAME: 'demo block',
      SPRITE: 'Sprite1'
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('[procedure');
    expect(createElement).not.toHaveBeenCalled();
  });

  test('exports top-level stacks as script IR, excluding procedure definitions', () => {
    const target = makeScriptTarget();
    const { context } = loadExtension('textify-turbowarp.js', {
      targets: [target]
    });
    const hooks = context.__textifyTestHooks || context.globalThis.__textifyTestHooks;

    expect(hooks.getTopLevelStackIds(target)).toEqual(['hat1', 'recv1', 'noHat1']);

    const hatExport = hooks.exportTopLevelStackText(target, 1);
    const receiveExport = hooks.exportTopLevelStackText(target, 2);
    const noHatExport = hooks.exportTopLevelStackText(target, 3);

    expect(hatExport).toContain('[script');
    expect(hatExport).toContain('opcode:events_whenflagclicked');
    expect(hatExport).toContain('opcode:motion_movesteps');

    expect(receiveExport).toContain('opcode:event_whenbroadcastreceived');
    expect(receiveExport).toContain('BROADCAST_OPTION:"start"');

    expect(noHatExport).toContain('opcode:data_setvariableto');
    expect(noHatExport).not.toContain('procedures_definition');
  });

  test('copy stack command writes script IR to clipboard without popup', async () => {
    const target = makeScriptTarget();
    const writeText = jest.fn().mockResolvedValue(undefined);
    const createElement = jest.fn();

    const { extension } = loadExtension('textify-turbowarp.js', {
      targets: [target],
      globals: {
        document: {
          getElementById() {
            return null;
          },
          createElement,
          body: {
            appendChild() {}
          }
        },
        navigator: {
          clipboard: {
            writeText
          }
        }
      }
    });

    await extension.copyTopLevelStackToClipboard({
      INDEX: 2,
      SPRITE: 'Sprite1'
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('[script');
    expect(writeText.mock.calls[0][0]).toContain('event_whenbroadcastreceived');
    expect(createElement).not.toHaveBeenCalled();
  });
});
