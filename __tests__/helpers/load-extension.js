const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createScratchMock(options = {}) {
  const runtimeEvents = new Map();
  const registeredExtensions = [];
  const targets = options.targets || [];

  const runtime = {
    targets,
    stageWidth: 480,
    stageHeight: 360,
    on(event, handler) {
      if (!runtimeEvents.has(event)) {
        runtimeEvents.set(event, []);
      }
      runtimeEvents.get(event).push(handler);
    },
    emit(event) {
      const handlers = runtimeEvents.get(event) || [];
      for (const handler of handlers) {
        handler();
      }
    },
    getHandlers(event) {
      return runtimeEvents.get(event) || [];
    },
    getTargetById(id) {
      return targets.find(target => target.id === id) || null;
    }
  };

  const Scratch = {
    extensions: {
      unsandboxed: true,
      register(extensionInstance) {
        registeredExtensions.push(extensionInstance);
      }
    },
    vm: {
      runtime
    },
    BlockType: {
      COMMAND: 'command',
      BOOLEAN: 'boolean',
      REPORTER: 'reporter',
      LABEL: 'label',
      BUTTON: 'button'
    },
    ArgumentType: {
      STRING: 'string',
      NUMBER: 'number'
    },
    Cast: {
      toString(value) {
        return String(value);
      },
      toNumber(value) {
        const n = Number(value);
        return Number.isNaN(n) ? 0 : n;
      }
    }
  };

  return { Scratch, runtime, registeredExtensions };
}

function loadExtension(filename, options = {}) {
  const filePath = path.resolve(__dirname, '..', '..', filename);
  const source = fs.readFileSync(filePath, 'utf8');
  const { Scratch, runtime, registeredExtensions } = createScratchMock(options);
  const baseGlobals = options.globals || {};
  const globalObject = {};

  const context = vm.createContext({
    Scratch,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    globalThis: globalObject,
    ...baseGlobals
  });

  Object.assign(globalObject, context);

  new vm.Script(source, { filename: filePath }).runInContext(context);

  if (registeredExtensions.length !== 1) {
    throw new Error(`Expected exactly one extension registration from ${filename}, got ${registeredExtensions.length}`);
  }

  return {
    extension: registeredExtensions[0],
    runtime,
    Scratch,
    context
  };
}

module.exports = {
  loadExtension
};
