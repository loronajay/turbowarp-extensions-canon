const { loadExtension } = require('./helpers/load-extension');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.className = '';
    this.dataset = {};
    this.children = [];
    this.parentNode = null;
    this._textContent = '';
    this.style = {};
    this.id = '';
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  set textContent(value) {
    this._textContent = String(value);
  }

  get textContent() {
    return this._textContent + this.children.map(child => child.textContent).join('');
  }

  set innerHTML(value) {
    if (value === '') {
      this.children = [];
      this._textContent = '';
    }
  }
}

class FakeDocument {
  constructor() {
    this.head = new FakeElement('head');
    this.body = new FakeElement('body');
    this._elementsById = new Map();
  }

  createElement(tagName) {
    const element = new FakeElement(tagName);
    Object.defineProperty(element, 'id', {
      get: () => element._id || '',
      set: value => {
        element._id = String(value);
        if (element._id) {
          this._elementsById.set(element._id, element);
        }
      }
    });
    return element;
  }

  getElementById(id) {
    return this._elementsById.get(id) || null;
  }
}

describe('Blockify embedded Scratch renderer bridge', () => {
  function getHooks(extraGlobals = {}) {
    const document = new FakeDocument();
    const { context } = loadExtension('blockify-turbowarp.js', {
      globals: {
        document,
        ...extraGlobals
      }
    });
    return {
      document,
      hooks: context.__blockifyTestHooks || context.globalThis.__blockifyTestHooks
    };
  }

  test('converts a procedure AST into Scratch custom block XML', () => {
    const { hooks } = getHooks();
    const ast = {
      type: 'procedure',
      proccode: 'demo %s %b',
      warp: true,
      argumentnames: ['name', 'flag'],
      argumentdefaults: ['', 'false'],
      body: {
        type: 'stack',
        children: [
          {
            type: 'opcode',
            opcode: 'data_setvariableto',
            id: 'set1',
            fields: { VARIABLE: 'score' },
            inputs: {
              VALUE: { type: 'literal', valueType: 'number', value: 10 }
            },
            stacks: {}
          },
          {
            type: 'opcode',
            opcode: 'control_if',
            id: 'if1',
            fields: {},
            inputs: {
              CONDITION: {
                type: 'opcode',
                opcode: 'argument_reporter_boolean',
                id: 'arg1',
                fields: { VALUE: 'flag' },
                inputs: {},
                stacks: {}
              }
            },
            stacks: {
              SUBSTACK: {
                type: 'stack',
                children: [
                  {
                    type: 'opcode',
                    opcode: 'looks_say',
                    id: 'say1',
                    fields: {},
                    inputs: {
                      MESSAGE: {
                        type: 'opcode',
                        opcode: 'argument_reporter_string_number',
                        id: 'arg2',
                        fields: { VALUE: 'name' },
                        inputs: {},
                        stacks: {}
                      }
                    },
                    stacks: {}
                  }
                ]
              }
            }
          }
        ]
      }
    };

    const xml = hooks.astToScratchBlocksXml(ast);

    expect(xml).toContain('<variables>');
    expect(xml).toContain('<variable type="" id="scalar:score">score</variable>');
    expect(xml).toContain('<block type="procedures_definition"');
    expect(xml).toContain('<block type="procedures_prototype">');
    expect(xml).toContain('proccode="demo %s %b"');
    expect(xml).toContain('argumentnames="[&quot;name&quot;,&quot;flag&quot;]"');
    expect(xml).toContain('argumentdefaults="[&quot;&quot;,&quot;false&quot;]"');
    expect(xml).toContain('warp="true"');
    expect(xml).toContain('<block type="data_setvariableto"');
    expect(xml).toContain('<field name="VARIABLE" id="scalar:score" variabletype="">score</field>');
    expect(xml).toContain('<block type="control_if"');
    expect(xml).toContain('<statement name="SUBSTACK">');
    expect(xml).toContain('<block type="looks_say"');
  });

  test('converts a script AST into top-level Scratch stack XML', () => {
    const { hooks } = getHooks();
    const ast = {
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
    };

    const xml = hooks.astToScratchBlocksXml(ast);

    expect(xml).toContain('<xml xmlns="https://developers.google.com/blockly/xml">');
    expect(xml).toContain('<block type="events_whenflagclicked" id="hat1">');
    expect(xml).toContain('<next><block type="motion_movesteps" id="move1">');
    expect(xml).not.toContain('procedures_definition');
  });

  test('keeps empty control stacks and dynamic menu blocks representable in Scratch XML', () => {
    const { hooks } = getHooks();
    const ast = {
      type: 'procedure',
      proccode: 'menus and empties',
      warp: false,
      argumentnames: [],
      argumentdefaults: [],
      body: {
        type: 'stack',
        children: [
          {
            type: 'opcode',
            opcode: 'control_if_else',
            id: 'ifElse1',
            fields: {},
            inputs: {
              CONDITION: {
                type: 'opcode',
                opcode: 'sensing_touchingobject',
                id: 'touch1',
                fields: {},
                inputs: {
                  TOUCHINGOBJECTMENU: {
                    type: 'menu',
                    menuOpcode: 'sensing_touchingobjectmenu',
                    value: '_mouse_'
                  }
                },
                stacks: {}
              }
            },
            stacks: {
              SUBSTACK: { type: 'stack', children: [] },
              SUBSTACK2: {
                type: 'stack',
                children: [
                  {
                    type: 'opcode',
                    opcode: 'control_create_clone_of',
                    id: 'clone1',
                    fields: {},
                    inputs: {
                      CLONE_OPTION: {
                        type: 'menu',
                        menuOpcode: 'control_create_clone_of_menu',
                        value: '_myself_'
                      }
                    },
                    stacks: {}
                  }
                ]
              }
            }
          }
        ]
      }
    };

    const xml = hooks.astToScratchBlocksXml(ast);

    expect(xml).toContain('<block type="control_if_else"');
    expect(xml).toContain('<statement name="SUBSTACK"></statement>');
    expect(xml).toContain('<statement name="SUBSTACK2">');
    expect(xml).toContain('<shadow type="sensing_touchingobjectmenu">');
    expect(xml).toContain('<field name="TOUCHINGOBJECTMENU">_mouse_</field>');
    expect(xml).toContain('<shadow type="control_create_clone_of_menu">');
    expect(xml).toContain('<field name="CLONE_OPTION">_myself_</field>');
  });

  test('installs dynamic Scratch menu shims with reporter outputs during setup', () => {
    const { hooks } = getHooks();
    const scratchBlocks = {
      Blocks: {
        motion_goto_menu: {},
        motion_glideto_menu: {},
        motion_pointtowards_menu: {},
        looks_costume: {},
        looks_backdrops: {},
        sound_sounds_menu: {},
        sensing_touchingobjectmenu: {},
        sensing_distancetomenu: {},
        control_create_clone_of_menu: {}
      }
    };

    hooks.ensureScratchBlocksReady(scratchBlocks);

    for (const opcode of Object.keys(scratchBlocks.Blocks)) {
      expect(typeof scratchBlocks.Blocks[opcode].init).toBe('function');
    }
  });

  test('parser backfills empty substacks for forever and while blocks', () => {
    const { hooks } = getHooks();
    const parser = new hooks.Parser(`
      [procedure
        proccode:"demo"
        argumentnames:[]
        argumentdefaults:[]
        warp:false
        body:[stack:
          [opcode: control_forever
            id:"forever1"
            fields:{}
            inputs:{}
            stacks:{}
          ]
          [opcode: control_while
            id:"while1"
            fields:{}
            inputs:{}
            stacks:{}
          ]
        ]
      ]
    `);

    const ast = parser.parse();

    expect(ast.body.children[0].stacks.SUBSTACK).toEqual({ type: 'stack', children: [] });
    expect(ast.body.children[1].stacks.SUBSTACK).toEqual({ type: 'stack', children: [] });
  });

  test('prefers the embedded scratch-blocks renderer when available', () => {
    const installAllBlocks = jest.fn();
    const setLocale = jest.fn();
    const moveBy = jest.fn();
    const resizeContents = jest.fn();
    const render = jest.fn();
    const centerOnBlock = jest.fn();
    const requestAnimationFrame = jest.fn(callback => {
      callback();
      return 1;
    });
    const workspace = {
      dispose: jest.fn(),
      getTopBlocks: jest.fn(() => [{ moveBy, id: 'top1' }]),
      resizeContents,
      render,
      centerOnBlock
    };
    const inject = jest.fn(() => workspace);
    const domToWorkspace = jest.fn();
    const svgResize = jest.fn();
    const textToDom = jest.fn(xml => ({ xml }));
    const { hooks, document } = getHooks({
      requestAnimationFrame,
      __blockifyScratchBlocks: {
        installAllBlocks,
        Themes: {
          Zelos: { name: 'Zelos' },
          Classic: { name: 'Classic' }
        },
        ScratchMsgs: {
          setLocale
        },
        inject,
        Xml: {
          domToWorkspace
        },
        utils: {
          xml: {
            textToDom
          }
        },
        svgResize
      }
    });
    const commonStyle = document.createElement('style');
    commonStyle.id = 'blockly-common-style';
    document.head.appendChild(commonStyle);
    const rendererStyle = document.createElement('style');
    rendererStyle.id = 'blockly-renderer-style-scratch_classic-Zelos';
    document.head.appendChild(rendererStyle);

    const root = new FakeElement('div');
    const ast = {
      type: 'procedure',
      proccode: 'demo',
      warp: false,
      argumentnames: [],
      argumentdefaults: [],
      body: { type: 'stack', children: [] }
    };

    const rendered = hooks.renderProcedureWithScratchBlocks(root, ast, {
      installAllBlocks,
      Themes: {
        Zelos: { name: 'Zelos' },
        Classic: { name: 'Classic' }
      },
      ScratchMsgs: {
        setLocale
      },
      inject,
      Xml: { domToWorkspace },
      utils: {
        xml: {
          textToDom
        }
      },
      svgResize
    });

    expect(rendered).toBe(true);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(installAllBlocks).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenCalledWith('en');
    expect(inject).toHaveBeenCalledTimes(1);
    expect(inject.mock.calls[0][1]).toEqual(expect.objectContaining({
      readOnly: true,
      scratchTheme: expect.anything(),
      theme: expect.objectContaining({
        name: 'blockifyScratchPreviewTheme',
        blockStyles: expect.objectContaining({
          control: expect.objectContaining({
            colourPrimary: '#FFAB19',
            colourSecondary: '#CF8B17',
            colourTertiary: '#DB6E00'
          }),
          motion: expect.objectContaining({
            colourPrimary: '#4C97FF',
            colourSecondary: '#4280D7',
            colourTertiary: '#3373CC'
          }),
          more: expect.objectContaining({
            colourPrimary: '#FF6680',
            colourSecondary: '#FF4D6A',
            colourTertiary: '#FF3355'
          })
        }),
        categoryStyles: expect.objectContaining({
          control: expect.objectContaining({ colour: '#FFAB19' }),
          motion: expect.objectContaining({ colour: '#4C97FF' }),
          more: expect.objectContaining({ colour: '#FF6680' })
        }),
        componentStyles: expect.objectContaining({
          workspaceBackgroundColour: '#F9F9F9'
        })
      })
    }));
    expect(textToDom).toHaveBeenCalledTimes(1);
    expect(domToWorkspace).toHaveBeenCalledTimes(1);
    expect(moveBy).toHaveBeenCalledWith(24, 24);
    expect(render).toHaveBeenCalledTimes(2);
    expect(centerOnBlock).toHaveBeenCalledTimes(2);
    expect(centerOnBlock).toHaveBeenCalledWith('top1');
    expect(resizeContents).toHaveBeenCalledTimes(2);
    expect(svgResize).toHaveBeenCalledTimes(2);
    expect(root.children.length).toBe(1);
    expect(root.children[0].className).toContain('bfv-scratch-workspace');
    expect(root.children[0].style.height).toBe('240px');
    expect(root.children[0].style.position).toBe('relative');
    expect(root.dataset.renderMode).toBe('embedded');
    expect(root.dataset.renderError || '').toBe('');
    expect(root.dataset.blockCount).toBe('1');
    expect(root.dataset.topBlockId).toBe('top1');
    expect(root.dataset.commonCssInjected).toBe('true');
    expect(root.dataset.rendererCssInjected).toBe('true');
    expect(root.dataset.rendererCssIds).toBe('blockly-renderer-style-scratch_classic-Zelos');
  });

  test('fills the host viewport when requested by the preview container', () => {
    const installAllBlocks = jest.fn();
    const setLocale = jest.fn();
    const workspace = {
      dispose: jest.fn(),
      getTopBlocks: jest.fn(() => []),
      resizeContents: jest.fn(),
      render: jest.fn(),
      centerOnBlock: jest.fn()
    };
    const inject = jest.fn(() => workspace);
    const domToWorkspace = jest.fn();
    const svgResize = jest.fn();
    const textToDom = jest.fn(xml => ({ xml }));
    const { hooks } = getHooks({
      __blockifyScratchBlocks: {
        installAllBlocks,
        ScratchMsgs: { setLocale },
        inject,
        Xml: { domToWorkspace },
        utils: { xml: { textToDom } },
        svgResize
      }
    });

    const root = new FakeElement('div');
    root.dataset.viewportFill = 'true';
    const ast = {
      type: 'procedure',
      proccode: 'demo',
      warp: false,
      argumentnames: [],
      argumentdefaults: [],
      body: { type: 'stack', children: [] }
    };

    const rendered = hooks.renderProcedureWithScratchBlocks(root, ast, {
      installAllBlocks,
      ScratchMsgs: { setLocale },
      inject,
      Xml: { domToWorkspace },
      utils: { xml: { textToDom } },
      svgResize
    });

    expect(rendered).toBe(true);
    expect(root.children[0].style.height).toBe('100%');
    expect(root.children[0].style.minHeight).toBe('100%');
  });

  test('marks fallback mode and preserves the embedded error when the scratch renderer fails', () => {
    const inject = jest.fn(() => {
      throw new Error('inject failed');
    });
    const { hooks } = getHooks();
    const root = new FakeElement('div');
    const ast = {
      type: 'procedure',
      proccode: 'demo',
      warp: false,
      argumentnames: [],
      argumentdefaults: [],
      body: { type: 'stack', children: [] }
    };

    const rendered = hooks.renderProcedureWithScratchBlocks(root, ast, {
      inject,
      Xml: {
        textToDom: jest.fn(),
        domToWorkspace: jest.fn()
      },
      svgResize: jest.fn()
    });

    expect(rendered).toBe(false);
    expect(root.dataset.renderMode).toBe('fallback');
    expect(root.dataset.renderError).toContain('inject failed');
  });

  test('formats status text using the latest visual render state', () => {
    const { hooks } = getHooks();
    const text = hooks.buildEditorStatusText({
      lastError: '',
      lastRender: 'PROCEDURE "demo"',
      lastVisualRenderMode: 'fallback',
      lastVisualRenderError: 'scratch-blocks unavailable'
    });

    expect(text).toContain('ERROR:\n[none]');
    expect(text).toContain('RENDER:\nPROCEDURE "demo"');
    expect(text).toContain('VISUAL MODE:\nfallback');
    expect(text).toContain('VISUAL ERROR:\nscratch-blocks unavailable');
    expect(text).toContain('VISUAL BLOCKS:\n[none]');
    expect(text).toContain('VISUAL CSS:\n[none]');
  });

  test('editor preview state is recomputed from current IR text even after a stale empty-input error', () => {
    const { hooks } = getHooks();
    const owner = {
      lastError: 'IR input is empty',
      lastRender: '',
      lastVisualRenderMode: '',
      lastVisualRenderError: '',
      lastVisualBlockCount: '',
      lastVisualTopBlockId: '',
      lastVisualCssStatus: ''
    };
    const visual = new FakeElement('div');
    const ir = '[script\n  body:[stack:\n    [opcode: events_whenflagclicked\n      id:"hat1"\n      fields:{}\n      inputs:{}\n      stacks:{}\n    ]\n  ]\n]';

    hooks.updateEditorPreviewState(owner, visual, ir);

    expect(owner.lastError).toBe('');
    expect(owner.lastRender).toContain('SCRIPT');
  });
});
