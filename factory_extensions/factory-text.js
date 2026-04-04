(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Factory Text v3 must be loaded as an unsandboxed extension.');
  }

  const vm = Scratch.vm;
  const runtime = vm.runtime;

  const GLYPH_W = 5;
  const GLYPH_H = 7;

  const BASE_PIXEL_SIZE = 4;

  const DEFAULT_ALIGNMENT = 'left';
  const DEFAULT_SCALE = 1;
  const DEFAULT_LETTER_SPACING = 0;
  const DEFAULT_VISIBLE = true;
  const DEFAULT_COLOR = '#ffffff';

  const FONT = {
    'A': [
      '01110',
      '10001',
      '10001',
      '11111',
      '10001',
      '10001',
      '10001'
    ],
    'B': [
      '11110',
      '10001',
      '10001',
      '11110',
      '10001',
      '10001',
      '11110'
    ],
    'C': [
      '01111',
      '10000',
      '10000',
      '10000',
      '10000',
      '10000',
      '01111'
    ],
    'D': [
      '11110',
      '10001',
      '10001',
      '10001',
      '10001',
      '10001',
      '11110'
    ],
    'E': [
      '11111',
      '10000',
      '10000',
      '11110',
      '10000',
      '10000',
      '11111'
    ],
    'F': [
      '11111',
      '10000',
      '10000',
      '11110',
      '10000',
      '10000',
      '10000'
    ],
    'G': [
      '01111',
      '10000',
      '10000',
      '10011',
      '10001',
      '10001',
      '01110'
    ],
    'H': [
      '10001',
      '10001',
      '10001',
      '11111',
      '10001',
      '10001',
      '10001'
    ],
    'I': [
      '11111',
      '00100',
      '00100',
      '00100',
      '00100',
      '00100',
      '11111'
    ],
    'J': [
      '00001',
      '00001',
      '00001',
      '00001',
      '10001',
      '10001',
      '01110'
    ],
    'K': [
      '10001',
      '10010',
      '10100',
      '11000',
      '10100',
      '10010',
      '10001'
    ],
    'L': [
      '10000',
      '10000',
      '10000',
      '10000',
      '10000',
      '10000',
      '11111'
    ],
    'M': [
      '10001',
      '11011',
      '10101',
      '10101',
      '10001',
      '10001',
      '10001'
    ],
    'N': [
      '10001',
      '11001',
      '10101',
      '10011',
      '10001',
      '10001',
      '10001'
    ],
    'O': [
      '01110',
      '10001',
      '10001',
      '10001',
      '10001',
      '10001',
      '01110'
    ],
    'P': [
      '11110',
      '10001',
      '10001',
      '11110',
      '10000',
      '10000',
      '10000'
    ],
    'Q': [
      '01110',
      '10001',
      '10001',
      '10001',
      '10101',
      '10010',
      '01101'
    ],
    'R': [
      '11110',
      '10001',
      '10001',
      '11110',
      '10100',
      '10010',
      '10001'
    ],
    'S': [
      '01111',
      '10000',
      '10000',
      '01110',
      '00001',
      '00001',
      '11110'
    ],
    'T': [
      '11111',
      '00100',
      '00100',
      '00100',
      '00100',
      '00100',
      '00100'
    ],
    'U': [
      '10001',
      '10001',
      '10001',
      '10001',
      '10001',
      '10001',
      '01110'
    ],
    'V': [
      '10001',
      '10001',
      '10001',
      '10001',
      '10001',
      '01010',
      '00100'
    ],
    'W': [
      '10001',
      '10001',
      '10001',
      '10101',
      '10101',
      '10101',
      '01010'
    ],
    'X': [
      '10001',
      '10001',
      '01010',
      '00100',
      '01010',
      '10001',
      '10001'
    ],
    'Y': [
      '10001',
      '10001',
      '01010',
      '00100',
      '00100',
      '00100',
      '00100'
    ],
    'Z': [
      '11111',
      '00001',
      '00010',
      '00100',
      '01000',
      '10000',
      '11111'
    ],

    'a': [
      '00000',
      '00000',
      '01110',
      '00001',
      '01111',
      '10001',
      '01111'
    ],
    'b': [
      '10000',
      '10000',
      '11110',
      '10001',
      '10001',
      '10001',
      '11110'
    ],
    'c': [
      '00000',
      '00000',
      '01111',
      '10000',
      '10000',
      '10000',
      '01111'
    ],
    'd': [
      '00001',
      '00001',
      '01111',
      '10001',
      '10001',
      '10001',
      '01111'
    ],
    'e': [
      '00000',
      '00000',
      '01110',
      '10001',
      '11111',
      '10000',
      '01111'
    ],
    'f': [
      '00110',
      '01001',
      '01000',
      '11100',
      '01000',
      '01000',
      '01000'
    ],
    'g': [
      '00000',
      '00000',
      '01111',
      '10001',
      '10001',
      '01111',
      '00001'
    ],
    'h': [
      '10000',
      '10000',
      '11110',
      '10001',
      '10001',
      '10001',
      '10001'
    ],
    'i': [
      '00100',
      '00000',
      '01100',
      '00100',
      '00100',
      '00100',
      '01110'
    ],
    'j': [
      '00010',
      '00000',
      '00110',
      '00010',
      '00010',
      '10010',
      '01100'
    ],
    'k': [
      '10000',
      '10000',
      '10010',
      '10100',
      '11000',
      '10100',
      '10010'
    ],
    'l': [
      '01100',
      '00100',
      '00100',
      '00100',
      '00100',
      '00100',
      '01110'
    ],
    'm': [
      '00000',
      '00000',
      '11010',
      '10101',
      '10101',
      '10101',
      '10101'
    ],
    'n': [
      '00000',
      '00000',
      '11110',
      '10001',
      '10001',
      '10001',
      '10001'
    ],
    'o': [
      '00000',
      '00000',
      '01110',
      '10001',
      '10001',
      '10001',
      '01110'
    ],
    'p': [
      '00000',
      '00000',
      '11110',
      '10001',
      '10001',
      '11110',
      '10000'
    ],
    'q': [
      '00000',
      '00000',
      '01111',
      '10001',
      '10001',
      '01111',
      '00001'
    ],
    'r': [
      '00000',
      '00000',
      '10111',
      '11000',
      '10000',
      '10000',
      '10000'
    ],
    's': [
      '00000',
      '00000',
      '01111',
      '10000',
      '01110',
      '00001',
      '11110'
    ],
    't': [
      '01000',
      '01000',
      '11100',
      '01000',
      '01000',
      '01001',
      '00110'
    ],
    'u': [
      '00000',
      '00000',
      '10001',
      '10001',
      '10001',
      '10011',
      '01101'
    ],
    'v': [
      '00000',
      '00000',
      '10001',
      '10001',
      '10001',
      '01010',
      '00100'
    ],
    'w': [
      '00000',
      '00000',
      '10001',
      '10001',
      '10101',
      '10101',
      '01010'
    ],
    'x': [
      '00000',
      '00000',
      '10001',
      '01010',
      '00100',
      '01010',
      '10001'
    ],
    'y': [
      '00000',
      '00000',
      '10001',
      '10001',
      '10001',
      '01111',
      '00001'
    ],
    'z': [
      '00000',
      '00000',
      '11111',
      '00010',
      '00100',
      '01000',
      '11111'
    ],

    '0': [
      '01110',
      '10001',
      '10011',
      '10101',
      '11001',
      '10001',
      '01110'
    ],
    '1': [
      '00100',
      '01100',
      '00100',
      '00100',
      '00100',
      '00100',
      '01110'
    ],
    '2': [
      '01110',
      '10001',
      '00001',
      '00010',
      '00100',
      '01000',
      '11111'
    ],
    '3': [
      '11110',
      '00001',
      '00001',
      '01110',
      '00001',
      '00001',
      '11110'
    ],
    '4': [
      '00010',
      '00110',
      '01010',
      '10010',
      '11111',
      '00010',
      '00010'
    ],
    '5': [
      '11111',
      '10000',
      '10000',
      '11110',
      '00001',
      '00001',
      '11110'
    ],
    '6': [
      '01110',
      '10000',
      '10000',
      '11110',
      '10001',
      '10001',
      '01110'
    ],
    '7': [
      '11111',
      '00001',
      '00010',
      '00100',
      '01000',
      '01000',
      '01000'
    ],
    '8': [
      '01110',
      '10001',
      '10001',
      '01110',
      '10001',
      '10001',
      '01110'
    ],
    '9': [
      '01110',
      '10001',
      '10001',
      '01111',
      '00001',
      '00001',
      '01110'
    ],

    ' ': [
      '00000',
      '00000',
      '00000',
      '00000',
      '00000',
      '00000',
      '00000'
    ],
    '?': [
      '01110',
      '10001',
      '00001',
      '00010',
      '00100',
      '00000',
      '00100'
    ],
    '!': [
      '00100',
      '00100',
      '00100',
      '00100',
      '00100',
      '00000',
      '00100'
    ],
    '.': [
      '00000',
      '00000',
      '00000',
      '00000',
      '00000',
      '00100',
      '00100'
    ],
    ',': [
      '00000',
      '00000',
      '00000',
      '00000',
      '00100',
      '00100',
      '01000'
    ],
    ':': [
      '00000',
      '00100',
      '00100',
      '00000',
      '00100',
      '00100',
      '00000'
    ],
    ';': [
      '00000',
      '00100',
      '00100',
      '00000',
      '00100',
      '00100',
      '01000'
    ],
    '-': [
      '00000',
      '00000',
      '00000',
      '11111',
      '00000',
      '00000',
      '00000'
    ],
    '_': [
      '00000',
      '00000',
      '00000',
      '00000',
      '00000',
      '00000',
      '11111'
    ],
    '+': [
      '00000',
      '00100',
      '00100',
      '11111',
      '00100',
      '00100',
      '00000'
    ],
    '/': [
      '00001',
      '00010',
      '00100',
      '01000',
      '10000',
      '00000',
      '00000'
    ],
    '\\': [
      '10000',
      '01000',
      '00100',
      '00010',
      '00001',
      '00000',
      '00000'
    ],
    '=': [
      '00000',
      '11111',
      '00000',
      '11111',
      '00000',
      '00000',
      '00000'
    ],
    '(': [
      '00010',
      '00100',
      '01000',
      '01000',
      '01000',
      '00100',
      '00010'
    ],
    ')': [
      '01000',
      '00100',
      '00010',
      '00010',
      '00010',
      '00100',
      '01000'
    ],
    '[': [
      '01110',
      '01000',
      '01000',
      '01000',
      '01000',
      '01000',
      '01110'
    ],
    ']': [
      '01110',
      '00010',
      '00010',
      '00010',
      '00010',
      '00010',
      '01110'
    ],
    '%': [
      '11001',
      '11010',
      '00100',
      '01000',
      '10110',
      '00110',
      '00000'
    ],
    '#': [
      '01010',
      '11111',
      '01010',
      '01010',
      '11111',
      '01010',
      '00000'
    ],
    '*': [
      '00000',
      '01010',
      '00100',
      '11111',
      '00100',
      '01010',
      '00000'
    ],
    '\'': [
      '00100',
      '00100',
      '00000',
      '00000',
      '00000',
      '00000',
      '00000'
    ],
    '"': [
      '01010',
      '01010',
      '00000',
      '00000',
      '00000',
      '00000',
      '00000'
    ]
  };

  class FactoryTextV3 {
    constructor() {
      this.textObjects = new Map();

      this.canvas = document.createElement('canvas');
      const stage = this._getStageMetrics();
      this.canvas.width = stage.width;
      this.canvas.height = stage.height;
      this.ctx = this.canvas.getContext('2d', {alpha: true});

      this.skinId = null;
      this.drawableId = null;

      this._setupDrawable();

      runtime.on('PROJECT_STOP_ALL', () => {
        this.deleteAllText();
      });

      runtime.on('PROJECT_START', () => {
        this._refresh();
      });
    }

    getInfo() {
      return {
        id: 'jayArcadeTurboWarpText',
        name: 'Factory Text',
        color1: '#6a5acd',
        color2: '#5b4ab8',
        color3: '#4a3d96',
        blocks: [
          {
            opcode: 'writeText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'write [TEXT] as [ID] at: x: [X] y: [Y]',
            arguments: {
              TEXT: {type: Scratch.ArgumentType.STRING, defaultValue: 'Score: 0'},
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              X: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0},
              Y: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0}
            }
          },
          {
            opcode: 'setText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set text [ID] to [TEXT]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              TEXT: {type: Scratch.ArgumentType.STRING, defaultValue: 'Score: 100'}
            }
          },
          {
            opcode: 'setX',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set text [ID] x: [X]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              X: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0}
            }
          },
          {
            opcode: 'setY',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set text [ID] y: [Y]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              Y: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0}
            }
          },
          {
            opcode: 'changeX',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change text [ID] x: [DX]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              DX: {type: Scratch.ArgumentType.NUMBER, defaultValue: 10}
            }
          },
          {
            opcode: 'changeY',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change text [ID] y: [DY]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              DY: {type: Scratch.ArgumentType.NUMBER, defaultValue: -10}
            }
          },
          {
            opcode: 'deleteText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'deleteAllTextBlock',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete all text'
          },
          {
            opcode: 'showText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'show text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'hideText',
            blockType: Scratch.BlockType.COMMAND,
            text: 'hide text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'textExists',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'text exists? [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'setAlignment',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set alignment of text [ID] to [ALIGNMENT]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              ALIGNMENT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'alignmentMenu',
                defaultValue: 'center'
              }
            }
          },
          {
            opcode: 'setScale',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set scale of text [ID] to [SCALE]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              SCALE: {type: Scratch.ArgumentType.NUMBER, defaultValue: 1}
            }
          },
          {
            opcode: 'changeScale',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change scale of text [ID] by [AMOUNT]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              AMOUNT: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0.25}
            }
          },
          {
            opcode: 'setLetterSpacing',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set letter spacing of text [ID] to [SPACING]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              SPACING: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0}
            }
          },
          {
            opcode: 'changeLetterSpacing',
            blockType: Scratch.BlockType.COMMAND,
            text: 'change letter spacing of text [ID] by [AMOUNT]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              AMOUNT: {type: Scratch.ArgumentType.NUMBER, defaultValue: 1}
            }
          },
          {
            opcode: 'setColor',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set color of text [ID] to [COLOR]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'},
              COLOR: {type: Scratch.ArgumentType.COLOR, defaultValue: '#000000'}
            }
          },
          {
            opcode: 'setColorAll',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set color of all text to [COLOR]',
            arguments: {
              COLOR: {type: Scratch.ArgumentType.COLOR, defaultValue: '#000000'}
            }
          },
          {
            opcode: 'setScaleAll',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set scale of all text to [SCALE]',
            arguments: {
              SCALE: {type: Scratch.ArgumentType.NUMBER, defaultValue: 1}
            }
          },
          {
            opcode: 'setAlignmentAll',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set alignment of all text to [ALIGNMENT]',
            arguments: {
              ALIGNMENT: {
                type: Scratch.ArgumentType.STRING,
                menu: 'alignmentMenu',
                defaultValue: 'left'
              }
            }
          },
          {
            opcode: 'setLetterSpacingAll',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set letter spacing of all text to [SPACING]',
            arguments: {
              SPACING: {type: Scratch.ArgumentType.NUMBER, defaultValue: 0}
            }
          },

          '---',

          {
            opcode: 'getTextValue',
            blockType: Scratch.BlockType.REPORTER,
            text: 'text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextX',
            blockType: Scratch.BlockType.REPORTER,
            text: 'x of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextY',
            blockType: Scratch.BlockType.REPORTER,
            text: 'y of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextAlignment',
            blockType: Scratch.BlockType.REPORTER,
            text: 'alignment of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextScale',
            blockType: Scratch.BlockType.REPORTER,
            text: 'scale of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextLetterSpacing',
            blockType: Scratch.BlockType.REPORTER,
            text: 'letter spacing of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextColor',
            blockType: Scratch.BlockType.REPORTER,
            text: 'color of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextWidth',
            blockType: Scratch.BlockType.REPORTER,
            text: 'width of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'getTextHeight',
            blockType: Scratch.BlockType.REPORTER,
            text: 'height of text [ID]',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          },
          {
            opcode: 'isTextVisible',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'text [ID] visible?',
            arguments: {
              ID: {type: Scratch.ArgumentType.STRING, defaultValue: 'scoreDisplay'}
            }
          }
        ],
        menus: {
          alignmentMenu: {
            acceptReporters: true,
            items: ['left', 'center', 'right']
          }
        }
      };
    }

    _getStageMetrics() {
      const stageWidth = Number(runtime.stageWidth);
      const stageHeight = Number(runtime.stageHeight);

      const width = Number.isFinite(stageWidth) && stageWidth > 0 ? stageWidth : 480;
      const height = Number.isFinite(stageHeight) && stageHeight > 0 ? stageHeight : 360;

      return {
        width,
        height,
        halfWidth: width / 2,
        halfHeight: height / 2
      };
    }

    _ensureCanvasSize() {
      const stage = this._getStageMetrics();
      if (this.canvas.width !== stage.width || this.canvas.height !== stage.height) {
        this.canvas.width = stage.width;
        this.canvas.height = stage.height;
      }
      return stage;
    }

    _setupDrawable() {
      const renderer = runtime.renderer;
      if (!renderer) return;

      const stage = this._ensureCanvasSize();
      const rotationCenter = [stage.halfWidth, stage.halfHeight];

      if (this.skinId === null) {
        this.skinId = renderer.createBitmapSkin(this.canvas, 1, rotationCenter);
      }

      if (this.drawableId === null) {
        this.drawableId = renderer.createDrawable('sprite');
        renderer.updateDrawableSkinId(this.drawableId, this.skinId);
        renderer.updateDrawablePosition(this.drawableId, [0, 0]);
        renderer.updateDrawableVisible(this.drawableId, true);

        if (renderer.setDrawableOrder) {
          try {
            renderer.setDrawableOrder(this.drawableId, Infinity, 'sprite');
          } catch (e) {
            // no-op
          }
        }
      }

      this._pushCanvasToSkin();
    }

    _pushCanvasToSkin() {
      const renderer = runtime.renderer;
      if (!renderer || this.skinId === null) return;

      const stage = this._getStageMetrics();
      const rotationCenter = [stage.halfWidth, stage.halfHeight];

      if (typeof renderer.updateBitmapSkin === 'function') {
        renderer.updateBitmapSkin(this.skinId, this.canvas, 1, rotationCenter);
      } else if (
        renderer._allSkins &&
        renderer._allSkins[this.skinId] &&
        typeof renderer._allSkins[this.skinId].setBitmap === 'function'
      ) {
        renderer._allSkins[this.skinId].setBitmap(this.canvas, 1, rotationCenter);
      }

      if (runtime.requestRedraw) runtime.requestRedraw();
    }

    _normalizeId(id) {
      return Scratch.Cast.toString(id).trim();
    }

    _normalizeText(text) {
      return Scratch.Cast.toString(text);
    }

    _normalizeAlignment(value) {
      const v = Scratch.Cast.toString(value).toLowerCase().trim();
      if (v === 'center' || v === 'right') return v;
      return 'left';
    }

    _normalizeScale(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return DEFAULT_SCALE;
      return Math.max(0.25, n);
    }

    _normalizeSpacing(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return DEFAULT_LETTER_SPACING;
      return n;
    }

    _normalizeColor(value) {
      const color = Scratch.Cast.toString(value).trim();
      if (!color) return DEFAULT_COLOR;
      return color;
    }

    _ensureObject(id) {
      const key = this._normalizeId(id);
      if (!key) return null;

      if (!this.textObjects.has(key)) {
        this.textObjects.set(key, {
          id: key,
          text: '',
          x: 0,
          y: 0,
          alignment: DEFAULT_ALIGNMENT,
          scale: DEFAULT_SCALE,
          letterSpacing: DEFAULT_LETTER_SPACING,
          visible: DEFAULT_VISIBLE,
          color: DEFAULT_COLOR
        });
      }

      return this.textObjects.get(key);
    }

    _getObject(id) {
      const key = this._normalizeId(id);
      if (!key) return null;
      return this.textObjects.get(key) || null;
    }

    _getGlyph(ch) {
      if (FONT[ch]) return FONT[ch];

      const upper = ch.toUpperCase();
      if (FONT[upper]) return FONT[upper];

      return FONT['?'];
    }

    _charAdvance(scale, letterSpacing) {
      return (GLYPH_W + 1 + letterSpacing) * BASE_PIXEL_SIZE * scale;
    }

    _textWidth(text, scale, letterSpacing) {
      if (!text || text.length === 0) return 0;
      return text.length * this._charAdvance(scale, letterSpacing) - (BASE_PIXEL_SIZE * scale);
    }

    _textHeight(text, scale) {
      if (!text || text.length === 0) return 0;
      return GLYPH_H * BASE_PIXEL_SIZE * scale;
    }

    _stageToCanvasX(x) {
      const stage = this._getStageMetrics();
      return x + stage.halfWidth;
    }

    _stageToCanvasY(y) {
      const stage = this._getStageMetrics();
      return stage.halfHeight - y;
    }

    _drawGlyph(glyph, x, y, scale) {
      const pixelSize = BASE_PIXEL_SIZE * scale;

      for (let row = 0; row < glyph.length; row++) {
        const rowData = glyph[row];
        for (let col = 0; col < rowData.length; col++) {
          if (rowData[col] === '1') {
            this.ctx.fillRect(
              Math.round(x + col * pixelSize),
              Math.round(y + row * pixelSize),
              Math.ceil(pixelSize),
              Math.ceil(pixelSize)
            );
          }
        }
      }
    }

    _drawTextObject(obj) {
      if (!obj.visible) return;
      if (!obj.text) return;

      const scale = this._normalizeScale(obj.scale);
      const letterSpacing = this._normalizeSpacing(obj.letterSpacing);
      const text = this._normalizeText(obj.text);
      const totalWidth = this._textWidth(text, scale, letterSpacing);
      const textHeight = this._textHeight(text, scale);

      const anchorX = Scratch.Cast.toNumber(obj.x);
      let drawX = anchorX;

      // Fixed alignment behavior:
      // left = text extends LEFT from anchor
      // center = text is centered on anchor
      // right = text extends RIGHT from anchor
      if (obj.alignment === 'left') {
        drawX = anchorX - totalWidth;
      } else if (obj.alignment === 'center') {
        drawX = anchorX - totalWidth / 2;
      } else if (obj.alignment === 'right') {
        drawX = anchorX;
      }

      const drawY = Scratch.Cast.toNumber(obj.y);

      const canvasX = this._stageToCanvasX(drawX);
      const canvasY = this._stageToCanvasY(drawY) - textHeight;

      const advance = this._charAdvance(scale, letterSpacing);

      this.ctx.fillStyle = this._normalizeColor(obj.color);

      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const glyph = this._getGlyph(ch);
        const gx = canvasX + i * advance;
        this._drawGlyph(glyph, gx, canvasY, scale);
      }
    }

    _refresh() {
      if (!runtime.renderer) return;
      this._ensureCanvasSize();
      this._setupDrawable();

      const renderer = runtime.renderer;
      if (this.drawableId !== null && renderer.setDrawableOrder) {
        try { renderer.setDrawableOrder(this.drawableId, Infinity, 'sprite'); } catch (e) {}
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const obj of this.textObjects.values()) {
        this._drawTextObject(obj);
      }

      this._pushCanvasToSkin();
    }

    writeText(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.text = this._normalizeText(args.TEXT);
      obj.x = Scratch.Cast.toNumber(args.X);
      obj.y = Scratch.Cast.toNumber(args.Y);
      obj.visible = true;

      this._refresh();
    }

    setText(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.text = this._normalizeText(args.TEXT);
      this._refresh();
    }

    setX(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.x = Scratch.Cast.toNumber(args.X);
      this._refresh();
    }

    setY(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.y = Scratch.Cast.toNumber(args.Y);
      this._refresh();
    }

    changeX(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.x = Scratch.Cast.toNumber(obj.x) + Scratch.Cast.toNumber(args.DX);
      this._refresh();
    }

    changeY(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.y = Scratch.Cast.toNumber(obj.y) + Scratch.Cast.toNumber(args.DY);
      this._refresh();
    }

    deleteText(args) {
      const id = this._normalizeId(args.ID);
      if (!id) return;

      this.textObjects.delete(id);
      this._refresh();
    }

    deleteAllText() {
      this.textObjects.clear();
      this._refresh();
    }

    deleteAllTextBlock() {
      this.deleteAllText();
    }

    showText(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.visible = true;
      this._refresh();
    }

    hideText(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.visible = false;
      this._refresh();
    }

    textExists(args) {
      const id = this._normalizeId(args.ID);
      if (!id) return false;
      return this.textObjects.has(id);
    }

    setAlignment(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.alignment = this._normalizeAlignment(args.ALIGNMENT);
      this._refresh();
    }

    setScale(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.scale = this._normalizeScale(args.SCALE);
      this._refresh();
    }

    changeScale(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.scale = this._normalizeScale(
        Scratch.Cast.toNumber(obj.scale) + Scratch.Cast.toNumber(args.AMOUNT)
      );
      this._refresh();
    }

    setLetterSpacing(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.letterSpacing = this._normalizeSpacing(args.SPACING);
      this._refresh();
    }

    changeLetterSpacing(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.letterSpacing = this._normalizeSpacing(
        Scratch.Cast.toNumber(obj.letterSpacing) + Scratch.Cast.toNumber(args.AMOUNT)
      );
      this._refresh();
    }

    setColor(args) {
      const obj = this._ensureObject(args.ID);
      if (!obj) return;

      obj.color = this._normalizeColor(args.COLOR);
      this._refresh();
    }

    setColorAll(args) {
      const color = this._normalizeColor(args.COLOR);
      for (const obj of this.textObjects.values()) obj.color = color;
      this._refresh();
    }

    setScaleAll(args) {
      const scale = this._normalizeScale(args.SCALE);
      for (const obj of this.textObjects.values()) obj.scale = scale;
      this._refresh();
    }

    setAlignmentAll(args) {
      const alignment = this._normalizeAlignment(args.ALIGNMENT);
      for (const obj of this.textObjects.values()) obj.alignment = alignment;
      this._refresh();
    }

    setLetterSpacingAll(args) {
      const spacing = this._normalizeSpacing(args.SPACING);
      for (const obj of this.textObjects.values()) obj.letterSpacing = spacing;
      this._refresh();
    }

    getTextValue(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return '';
      return this._normalizeText(obj.text);
    }

    getTextX(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return 0;
      return Scratch.Cast.toNumber(obj.x);
    }

    getTextY(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return 0;
      return Scratch.Cast.toNumber(obj.y);
    }

    getTextAlignment(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return DEFAULT_ALIGNMENT;
      return this._normalizeAlignment(obj.alignment);
    }

    getTextScale(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return DEFAULT_SCALE;
      return this._normalizeScale(obj.scale);
    }

    getTextLetterSpacing(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return DEFAULT_LETTER_SPACING;
      return this._normalizeSpacing(obj.letterSpacing);
    }

    getTextColor(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return DEFAULT_COLOR;
      return this._normalizeColor(obj.color);
    }

    getTextWidth(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return 0;

      const text = this._normalizeText(obj.text);
      if (!text) return 0;

      const scale = this._normalizeScale(obj.scale);
      const letterSpacing = this._normalizeSpacing(obj.letterSpacing);

      return this._textWidth(text, scale, letterSpacing);
    }

    getTextHeight(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return 0;

      const text = this._normalizeText(obj.text);
      if (!text) return 0;

      const scale = this._normalizeScale(obj.scale);
      return this._textHeight(text, scale);
    }

    isTextVisible(args) {
      const obj = this._getObject(args.ID);
      if (!obj) return false;
      return !!obj.visible;
    }
  }

  Scratch.extensions.register(new FactoryTextV3());
})(Scratch);