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
    this.onclick = null;
    this.onmousedown = null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  append(...nodes) {
    for (const node of nodes) {
      this.appendChild(node);
    }
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
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
    this._listeners = new Map();
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

  addEventListener(eventName, handler) {
    if (!this._listeners.has(eventName)) {
      this._listeners.set(eventName, []);
    }
    this._listeners.get(eventName).push(handler);
  }

  removeEventListener(eventName, handler) {
    const handlers = this._listeners.get(eventName) || [];
    const index = handlers.indexOf(handler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  }
}

describe('Blockify clipboard preview workflow', () => {
  function loadWithClipboard(readTextImpl) {
    const document = new FakeDocument();
    const { extension, context } = loadExtension('blockify-turbowarp.js', {
      globals: {
        document,
        navigator: {
          clipboard: {
            readText: readTextImpl
          }
        }
      }
    });

    return {
      document,
      extension,
      hooks: context.__blockifyTestHooks || context.globalThis.__blockifyTestHooks
    };
  }

  test('returns false when clipboard has no IR text', async () => {
    const { extension } = loadWithClipboard(jest.fn().mockResolvedValue('   '));

    const result = await extension.blockifyClipboardText();

    expect(result).toBe(false);
    expect(extension.getLastError()).toBe('Clipboard does not contain Blockify IR');
  });

  test('opens a floating preview from clipboard IR and hydrates the buffer', async () => {
    const ir = '[procedure\n  proccode:"demo"\n  argumentnames:[]\n  argumentdefaults:[]\n  warp:false\n  body:[stack:]\n]';
    const { document, extension } = loadWithClipboard(jest.fn().mockResolvedValue(ir));

    const result = await extension.blockifyClipboardText();

    expect(result).toBe(true);
    expect(extension.getIRBuffer()).toBe(ir);
    expect(document.getElementById('blockify-phase1-preview')).not.toBeNull();
  });

  test('accepts script roots from the clipboard preview flow', async () => {
    const ir = '[script\n  body:[stack:\n    [opcode: events_whenflagclicked\n      id:"hat1"\n      fields:{}\n      inputs:{}\n      stacks:{}\n    ]\n  ]\n]';
    const { document, extension } = loadWithClipboard(jest.fn().mockResolvedValue(ir));

    const result = await extension.blockifyClipboardText();

    expect(result).toBe(true);
    expect(extension.getIRBuffer()).toBe(ir);
    expect(document.getElementById('blockify-phase1-preview')).not.toBeNull();
  });

  test('editor layout keeps the action row visible within a scrollable viewport', () => {
    const { document, hooks } = loadWithClipboard(jest.fn().mockResolvedValue(''));
    const owner = {
      irBuffer: '[script\n  body:[stack:]\n]',
      patchBuffer: '',
      lastError: '',
      lastRender: '',
      lastVisualRenderMode: '',
      lastVisualRenderError: '',
      lastVisualBlockCount: '',
      lastVisualTopBlockId: '',
      lastVisualCssStatus: '',
      lastPatchedIR: '',
      lastPatchError: '',
      setBufferText(text) {
        this.irBuffer = String(text || '');
        this.lastPatchedIR = '';
        this.lastPatchError = '';
      },
      setPatchBuffer(args) {
        this.patchBuffer = String(args.PATCH || '');
      },
      validateIR() {
        this.lastError = '';
        return true;
      },
      renderIR() {
        this.lastRender = 'SCRIPT';
        return this.lastRender;
      },
      applyPatchBufferToIRBuffer() {
        return false;
      },
      copyLastPatchedIRToClipboard: jest.fn().mockResolvedValue(false)
    };

    hooks.showEditor(owner);

    const overlay = document.getElementById('blockify-phase1-editor');
    const panel = overlay.children[0];
    const content = panel.children[1];
    const row = panel.children[panel.children.length - 1];

    expect(overlay.style.cssText).toContain('overflow:auto');
    expect(panel.style.cssText).toContain('max-height:calc(100vh - 32px)');
    expect(panel.style.cssText).toContain('overflow:hidden');
    expect(content.style.cssText).toContain('flex:1');
    expect(content.style.cssText).toContain('overflow:auto');
    expect(content.style.cssText).toContain('min-height:0');
    expect(row.style.cssText).toContain('flex-shrink:0');
  });
});
