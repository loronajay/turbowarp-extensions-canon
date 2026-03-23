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
    this._ids = new Map();
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  getElementById(id) {
    return this._ids.get(id) || null;
  }
}

function walk(node, visit) {
  visit(node);
  for (const child of node.children || []) {
    walk(child, visit);
  }
}

function findByOpcode(root, opcode) {
  const results = [];
  walk(root, node => {
    if (node.dataset && node.dataset.opcode === opcode) {
      results.push(node);
    }
  });
  return results;
}

describe('Blockify VisualRenderer', () => {
  function getRenderer() {
    const document = new FakeDocument();
    const root = new FakeElement('div');
    const { context } = loadExtension('blockify-turbowarp.js', {
      globals: { document }
    });
    const hooks = context.__blockifyTestHooks || context.globalThis.__blockifyTestHooks;
    return {
      root,
      VisualRenderer: hooks.VisualRenderer
    };
  }

  test('renders all known textify-supported opcodes without unsupported placeholders', () => {
    const { root, VisualRenderer } = getRenderer();

    const ast = {
      type: 'procedure',
      proccode: 'demo %s %b',
      warp: false,
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
            opcode: 'data_changevariableby',
            id: 'chg1',
            fields: { VARIABLE: 'score' },
            inputs: {
              VALUE: { type: 'literal', valueType: 'number', value: 1 }
            },
            stacks: {}
          },
          {
            type: 'opcode',
            opcode: 'control_if',
            id: 'if1',
            fields: {},
            inputs: {
              CONDITION: { type: 'opcode', opcode: 'sensing_mousedown', id: 'mouse1', fields: {}, inputs: {}, stacks: {} }
            },
            stacks: {
              SUBSTACK: { type: 'stack', children: [] }
            }
          },
          {
            type: 'opcode',
            opcode: 'control_if_else',
            id: 'ifelse1',
            fields: {},
            inputs: {
              CONDITION: { type: 'opcode', opcode: 'argument_reporter_boolean', id: 'argb1', fields: { VALUE: 'flag' }, inputs: {}, stacks: {} }
            },
            stacks: {
              SUBSTACK: { type: 'stack', children: [] },
              SUBSTACK2: { type: 'stack', children: [] }
            }
          },
          {
            type: 'opcode',
            opcode: 'control_repeat',
            id: 'repeat1',
            fields: {},
            inputs: {
              TIMES: { type: 'literal', valueType: 'number', value: 3 }
            },
            stacks: {
              SUBSTACK: { type: 'stack', children: [] }
            }
          },
          {
            type: 'opcode',
            opcode: 'procedures_call',
            id: 'call1',
            fields: { PROCCODE: 'say %s for %n seconds if %b' },
            inputs: {
              input0: { type: 'opcode', opcode: 'argument_reporter_string_number', id: 'args1', fields: { VALUE: 'message' }, inputs: {}, stacks: {} },
              input1: { type: 'literal', valueType: 'number', value: 2 },
              input2: { type: 'opcode', opcode: 'operator_equals', id: 'eq1', fields: {}, inputs: {
                OPERAND1: { type: 'opcode', opcode: 'data_variable', id: 'var1', fields: { VARIABLE: 'score' }, inputs: {}, stacks: {} },
                OPERAND2: { type: 'literal', valueType: 'number', value: 100 }
              }, stacks: {} }
            },
            stacks: {}
          }
        ]
      }
    };

    const renderer = new VisualRenderer(root);
    renderer.renderProcedure(ast);

    expect(root.textContent).toContain('set');
    expect(root.textContent).toContain('change');
    expect(root.textContent).toContain('if');
    expect(root.textContent).toContain('else');
    expect(root.textContent).toContain('repeat');
    expect(root.textContent).toContain('mouse down?');
    expect(root.textContent).toContain('score');
    expect(root.textContent).toContain('message');
    expect(root.textContent).toContain('=');
    expect(root.textContent).toContain('say');
    expect(root.textContent).not.toContain('[unsupported opcode:');

    expect(findByOpcode(root, 'data_setvariableto')).toHaveLength(1);
    expect(findByOpcode(root, 'data_changevariableby')).toHaveLength(1);
    expect(findByOpcode(root, 'control_if')).toHaveLength(1);
    expect(findByOpcode(root, 'control_if_else')).toHaveLength(1);
    expect(findByOpcode(root, 'control_repeat')).toHaveLength(1);
    expect(findByOpcode(root, 'procedures_call')).toHaveLength(1);
    expect(findByOpcode(root, 'data_variable')).toHaveLength(1);
    expect(findByOpcode(root, 'argument_reporter_string_number')).toHaveLength(1);
    expect(findByOpcode(root, 'argument_reporter_boolean')).toHaveLength(1);
    expect(findByOpcode(root, 'operator_equals')).toHaveLength(1);
    expect(findByOpcode(root, 'sensing_mousedown')).toHaveLength(1);
  });

  test('renders broad core Scratch categories with Scratch-like shapes and no unsupported placeholders', () => {
    const { root, VisualRenderer } = getRenderer();

    const ast = {
      type: 'procedure',
      proccode: 'broad coverage',
      warp: false,
      argumentnames: [],
      argumentdefaults: [],
      body: {
        type: 'stack',
        children: [
          { type: 'opcode', opcode: 'events_whenflagclicked', id: 'evt1', fields: {}, inputs: {}, stacks: {} },
          { type: 'opcode', opcode: 'motion_movesteps', id: 'mot1', fields: {}, inputs: { STEPS: { type: 'literal', valueType: 'number', value: 10 } }, stacks: {} },
          { type: 'opcode', opcode: 'looks_say', id: 'look1', fields: {}, inputs: { MESSAGE: { type: 'literal', valueType: 'string', value: 'hello' } }, stacks: {} },
          { type: 'opcode', opcode: 'sound_play', id: 'snd1', fields: {}, inputs: { SOUND_MENU: { type: 'menu', menuOpcode: 'sound_sounds_menu', value: 'pop' } }, stacks: {} },
          { type: 'opcode', opcode: 'events_broadcastandwait', id: 'evt2', fields: {}, inputs: { BROADCAST_INPUT: { type: 'menu', menuOpcode: 'event_broadcast_menu', value: 'start' } }, stacks: {} },
          { type: 'opcode', opcode: 'control_forever', id: 'ctl1', fields: {}, inputs: {}, stacks: { SUBSTACK: { type: 'stack', children: [] } } },
          { type: 'opcode', opcode: 'sensing_touchingobject', id: 'sen1', fields: {}, inputs: { TOUCHINGOBJECTMENU: { type: 'menu', menuOpcode: 'sensing_touchingobjectmenu', value: 'mouse-pointer' } }, stacks: {} },
          { type: 'opcode', opcode: 'operator_add', id: 'op1', fields: {}, inputs: { NUM1: { type: 'literal', valueType: 'number', value: 1 }, NUM2: { type: 'literal', valueType: 'number', value: 2 } }, stacks: {} },
          { type: 'opcode', opcode: 'data_addtolist', id: 'data1', fields: { LIST: 'scores' }, inputs: { ITEM: { type: 'literal', valueType: 'string', value: 'AAA' } }, stacks: {} },
          { type: 'opcode', opcode: 'pen_setPenSizeTo', id: 'pen1', fields: {}, inputs: { SIZE: { type: 'literal', valueType: 'number', value: 5 } }, stacks: {} }
        ]
      }
    };

    const renderer = new VisualRenderer(root);
    renderer.renderProcedure(ast);

    expect(root.textContent).toContain('when green flag clicked');
    expect(root.textContent).toContain('move');
    expect(root.textContent).toContain('say');
    expect(root.textContent).toContain('start sound');
    expect(root.textContent).toContain('broadcast');
    expect(root.textContent).toContain('forever');
    expect(root.textContent).toContain('touching');
    expect(root.textContent).toContain('+');
    expect(root.textContent).toContain('add');
    expect(root.textContent).toContain('set pen size to');
    expect(root.textContent).not.toContain('[unsupported opcode:');

    expect(findByOpcode(root, 'events_whenflagclicked')[0].dataset.blockShape).toBe('hat-block');
    expect(findByOpcode(root, 'motion_movesteps')[0].dataset.blockCategory).toBe('motion');
    expect(findByOpcode(root, 'looks_say')[0].dataset.blockCategory).toBe('looks');
    expect(findByOpcode(root, 'sound_play')[0].dataset.blockCategory).toBe('sound');
    expect(findByOpcode(root, 'control_forever')[0].dataset.blockShape).toBe('c-block');
    expect(findByOpcode(root, 'operator_add')[0].dataset.blockShape).toBe('round-block');
    expect(findByOpcode(root, 'sensing_touchingobject')[0].dataset.blockShape).toBe('boolean-block');
    expect(findByOpcode(root, 'data_addtolist')[0].dataset.blockCategory).toBe('data');
    expect(findByOpcode(root, 'pen_setPenSizeTo')[0].dataset.blockCategory).toBe('pen');
  });

  test('renders script roots without procedure chrome', () => {
    const { root, VisualRenderer } = getRenderer();

    const ast = {
      type: 'script',
      body: {
        type: 'stack',
        children: [
          { type: 'opcode', opcode: 'events_whenflagclicked', id: 'evt1', fields: {}, inputs: {}, stacks: {} },
          { type: 'opcode', opcode: 'motion_movesteps', id: 'mot1', fields: {}, inputs: { STEPS: { type: 'literal', valueType: 'number', value: 10 } }, stacks: {} }
        ]
      }
    };

    const renderer = new VisualRenderer(root);
    renderer.renderProcedure(ast);

    expect(root.textContent).toContain('when green flag clicked');
    expect(root.textContent).toContain('move');
    expect(root.textContent).not.toContain('PROCEDURE');
    expect(findByOpcode(root, 'events_whenflagclicked')).toHaveLength(1);
    expect(findByOpcode(root, 'motion_movesteps')).toHaveLength(1);
  });
});
