class FactoryCamera {
  constructor() {
    this.worldObjects = new Map();
    this.cameras = new Map();
    this.activeCamera = null;

    if (Scratch.vm && Scratch.vm.runtime && typeof Scratch.vm.runtime.on === 'function') {
      const resetState = () => {
        this.worldObjects.clear();
        this.cameras.clear();
        this.activeCamera = null;
      };

      Scratch.vm.runtime.on('PROJECT_START', resetState);
      Scratch.vm.runtime.on('PROJECT_STOP_ALL', resetState);
    }
  }

  getInfo() {
    return {
      id: 'factorycamera',
      name: 'Factory Camera',
      color1: '#4C6FFF',
      color2: '#3E59D9',
      color3: '#3147AD',
      blocks: [
        {
          blockType: Scratch.BlockType.LABEL,
          text: 'World Object Core'
        },
        {
          opcode: 'createWorldObject',
          blockType: Scratch.BlockType.COMMAND,
          text: 'create world object [SPRITE]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            }
          }
        },
        {
          opcode: 'worldXOf',
          blockType: Scratch.BlockType.REPORTER,
          text: 'world x of [SPRITE]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            }
          }
        },
        {
          opcode: 'worldYOf',
          blockType: Scratch.BlockType.REPORTER,
          text: 'world y of [SPRITE]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            }
          }
        },
        {
          opcode: 'setWorldPosition',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set world position of [SPRITE] to x: [X] y: [Y]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            },
            X: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'changeWorldX',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change world x of [SPRITE] by [AMOUNT]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            },
            AMOUNT: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'changeWorldY',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change world y of [SPRITE] by [AMOUNT]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            },
            AMOUNT: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },

        {
          blockType: Scratch.BlockType.LABEL,
          text: 'Camera Core'
        },
        {
          opcode: 'createCamera',
          blockType: Scratch.BlockType.COMMAND,
          text: 'create camera [CAMERA]',
          arguments: {
            CAMERA: {
              type: Scratch.ArgumentType.STRING,
              menu: 'cameras'
            }
          }
        },
        {
          opcode: 'activateCamera',
          blockType: Scratch.BlockType.COMMAND,
          text: 'activate camera [CAMERA]',
          arguments: {
            CAMERA: {
              type: Scratch.ArgumentType.STRING,
              menu: 'cameras'
            }
          }
        },
        {
          opcode: 'setTargetSpriteOfCamera',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set target sprite of camera to [SPRITE]',
          arguments: {
            SPRITE: {
              type: Scratch.ArgumentType.STRING,
              menu: 'sprites'
            }
          }
        },
        {
          opcode: 'setCameraPosition',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set camera position to x: [X] y: [Y]',
          arguments: {
            X: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            },
            Y: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'setCameraSmoothing',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set camera smoothing to [SMOOTHING]',
          arguments: {
            SMOOTHING: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'cameraX',
          blockType: Scratch.BlockType.REPORTER,
          text: 'camera x'
        },
        {
          opcode: 'cameraY',
          blockType: Scratch.BlockType.REPORTER,
          text: 'camera y'
        },

        {
          blockType: Scratch.BlockType.LABEL,
          text: 'Conversion Core'
        },
        {
          opcode: 'screenXForWorldX',
          blockType: Scratch.BlockType.REPORTER,
          text: 'screen x for world x [WORLDX]',
          arguments: {
            WORLDX: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'screenYForWorldY',
          blockType: Scratch.BlockType.REPORTER,
          text: 'screen y for world y [WORLDY]',
          arguments: {
            WORLDY: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },

        {
          blockType: Scratch.BlockType.LABEL,
          text: 'Runtime'
        },
        {
          opcode: 'updateCameraSystem',
          blockType: Scratch.BlockType.COMMAND,
          text: 'update camera system'
        },

        {
          blockType: Scratch.BlockType.LABEL,
          text: 'Bounds'
        },
        {
          opcode: 'setCameraBounds',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set camera bounds left: [LEFT] right: [RIGHT] top: [TOP] bottom: [BOTTOM]',
          arguments: {
            LEFT: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: -240
            },
            RIGHT: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 240
            },
            TOP: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 180
            },
            BOTTOM: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: -180
            }
          }
        },
        {
          opcode: 'clearCameraBounds',
          blockType: Scratch.BlockType.COMMAND,
          text: 'clear camera bounds'
        },

        {
          blockType: Scratch.BlockType.LABEL,
          text: 'Lead'
        },
        {
          opcode: 'setCameraLeadX',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set camera lead x to [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'setCameraLeadY',
          blockType: Scratch.BlockType.COMMAND,
          text: 'set camera lead y to [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0
            }
          }
        },
        {
          opcode: 'changeCameraLeadX',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change camera lead x by [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },
        {
          opcode: 'changeCameraLeadY',
          blockType: Scratch.BlockType.COMMAND,
          text: 'change camera lead y by [VALUE]',
          arguments: {
            VALUE: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            }
          }
        },

        {
          blockType: Scratch.BlockType.LABEL,
          text: 'Shake'
        },
        {
          opcode: 'shakeCamera',
          blockType: Scratch.BlockType.COMMAND,
          text: 'shake camera for [FRAMES] frames with strength [STRENGTH]',
          arguments: {
            FRAMES: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            },
            STRENGTH: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 8
            }
          }
        },
        {
          opcode: 'shakeCameraAndWait',
          blockType: Scratch.BlockType.COMMAND,
          text: 'shake camera for [FRAMES] frames with strength [STRENGTH] and wait',
          arguments: {
            FRAMES: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 10
            },
            STRENGTH: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 8
            }
          }
        }
      ],
      menus: {
        sprites: {
          acceptReporters: true,
          items: '_getSpriteMenu'
        },
        cameras: {
          acceptReporters: true,
          items: ['camera 1']
        }
      }
    };
  }

  _getSpriteMenu() {
    const targets = Scratch.vm.runtime.targets.filter(
      target => !target.isStage && target.isOriginal
    );

    if (targets.length === 0) {
      return ['Sprite1'];
    }

    return targets.map(target => target.getName());
  }

  _getTargetByName(name) {
    if (!name) return null;

    const targets = Scratch.vm.runtime.targets;
    for (const target of targets) {
      if (!target.isStage && target.isOriginal && target.getName() === name) {
        return target;
      }
    }

    return null;
  }

  _getCameraName(name) {
    const cameraName = Scratch.Cast.toString(name || '').trim();
    return cameraName || 'camera 1';
  }

  _getActiveCameraData() {
    if (!this.activeCamera) return null;
    return this.cameras.get(this.activeCamera) || null;
  }

  _getStageBounds() {
    const runtime = Scratch.vm.runtime;
    const width = typeof runtime.stageWidth === 'number' ? runtime.stageWidth : 480;
    const height = typeof runtime.stageHeight === 'number' ? runtime.stageHeight : 360;

    return {
      left: -width / 2,
      right: width / 2,
      top: height / 2,
      bottom: -height / 2
    };
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  _applyBounds(camera) {
    if (!camera || !camera.bounds) return;

    const left = camera.bounds.left;
    const right = camera.bounds.right;
    const top = camera.bounds.top;
    const bottom = camera.bounds.bottom;

    const minX = Math.min(left, right);
    const maxX = Math.max(left, right);
    const minY = Math.min(bottom, top);
    const maxY = Math.max(bottom, top);

    camera.x = this._clamp(camera.x, minX, maxX);
    camera.y = this._clamp(camera.y, minY, maxY);
  }

  _startShake(camera, frames, strength) {
    if (!camera) return;

    const safeFrames = Math.max(
      0,
      Math.round(Scratch.Cast.toNumber(frames))
    );
    const safeStrength = Math.max(
      0,
      Scratch.Cast.toNumber(strength)
    );

    camera.shakeFrames = safeFrames;
    camera.shakeStrength = safeStrength;
    camera.shakeX = 0;
    camera.shakeY = 0;
  }

  createWorldObject(args) {
    const target = this._getTargetByName(args.SPRITE);
    if (!target) return;

    this.worldObjects.set(target.id, {
      name: target.getName(),
      worldX: target.x,
      worldY: target.y
    });
  }

  _getWorldObjectDataByName(name) {
    const target = this._getTargetByName(name);
    if (!target) return null;
    return this.worldObjects.get(target.id) || null;
  }

  worldXOf(args) {
    const data = this._getWorldObjectDataByName(args.SPRITE);
    if (!data) return 0;
    return data.worldX;
  }

  worldYOf(args) {
    const data = this._getWorldObjectDataByName(args.SPRITE);
    if (!data) return 0;
    return data.worldY;
  }

  setWorldPosition(args) {
    const target = this._getTargetByName(args.SPRITE);
    if (!target) return;

    const data = this.worldObjects.get(target.id);
    if (!data) return;

    data.worldX = Scratch.Cast.toNumber(args.X);
    data.worldY = Scratch.Cast.toNumber(args.Y);
  }

  changeWorldX(args) {
    const target = this._getTargetByName(args.SPRITE);
    if (!target) return;

    const data = this.worldObjects.get(target.id);
    if (!data) return;

    data.worldX += Scratch.Cast.toNumber(args.AMOUNT);
  }

  changeWorldY(args) {
    const target = this._getTargetByName(args.SPRITE);
    if (!target) return;

    const data = this.worldObjects.get(target.id);
    if (!data) return;

    data.worldY += Scratch.Cast.toNumber(args.AMOUNT);
  }

  createCamera(args) {
    const cameraName = this._getCameraName(args.CAMERA);

    this.cameras.set(cameraName, {
      x: 0,
      y: 0,
      smoothing: 1,
      targetId: null,
      bounds: null,
      leadX: 0,
      leadY: 0,
      shakeFrames: 0,
      shakeStrength: 0,
      shakeX: 0,
      shakeY: 0
    });
  }

  activateCamera(args) {
    const cameraName = this._getCameraName(args.CAMERA);
    if (!this.cameras.has(cameraName)) return;

    this.activeCamera = cameraName;
  }

  setTargetSpriteOfCamera(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    const target =
      this._getTargetByName(args.SPRITE) ||
      this._getTargetByName('Sprite1');

    camera.targetId = target ? target.id : null;
  }

  setCameraPosition(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    camera.x = Scratch.Cast.toNumber(args.X);
    camera.y = Scratch.Cast.toNumber(args.Y);
    this._applyBounds(camera);
  }

  setCameraSmoothing(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    let smoothing = Scratch.Cast.toNumber(args.SMOOTHING);
    if (smoothing <= 0) smoothing = 1;

    camera.smoothing = smoothing;
  }

  cameraX() {
    const camera = this._getActiveCameraData();
    if (!camera) return 0;
    return camera.x;
  }

  cameraY() {
    const camera = this._getActiveCameraData();
    if (!camera) return 0;
    return camera.y;
  }

  screenXForWorldX(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return 0;

    const worldX = Scratch.Cast.toNumber(args.WORLDX);
    return worldX - camera.x;
  }

  screenYForWorldY(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return 0;

    const worldY = Scratch.Cast.toNumber(args.WORLDY);
    return worldY - camera.y;
  }

  setCameraBounds(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    const rawLeft = Scratch.Cast.toNumber(args.LEFT);
    const rawRight = Scratch.Cast.toNumber(args.RIGHT);
    const rawTop = Scratch.Cast.toNumber(args.TOP);
    const rawBottom = Scratch.Cast.toNumber(args.BOTTOM);

    const stageBounds = this._getStageBounds();

    camera.bounds = {
      left: rawLeft === -240 ? stageBounds.left : rawLeft,
      right: rawRight === 240 ? stageBounds.right : rawRight,
      top: rawTop === 180 ? stageBounds.top : rawTop,
      bottom: rawBottom === -180 ? stageBounds.bottom : rawBottom
    };

    this._applyBounds(camera);
  }

  clearCameraBounds() {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    camera.bounds = null;
  }

  setCameraLeadX(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    camera.leadX = Scratch.Cast.toNumber(args.VALUE);
  }

  setCameraLeadY(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    camera.leadY = Scratch.Cast.toNumber(args.VALUE);
  }

  changeCameraLeadX(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    camera.leadX += Scratch.Cast.toNumber(args.VALUE);
  }

  changeCameraLeadY(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    camera.leadY += Scratch.Cast.toNumber(args.VALUE);
  }

  shakeCamera(args) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    this._startShake(camera, args.FRAMES, args.STRENGTH);
  }

  shakeCameraAndWait(args, util) {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    if (!util.stackFrame.factoryCameraShakeStarted) {
      this._startShake(camera, args.FRAMES, args.STRENGTH);
      util.stackFrame.factoryCameraShakeStarted = true;
    }

    if (camera.shakeFrames > 0) {
      util.yield();
      return;
    }

    util.stackFrame.factoryCameraShakeStarted = false;
  }

  updateCameraSystem() {
    const camera = this._getActiveCameraData();
    if (!camera) return;

    if (camera.targetId) {
      const data = this.worldObjects.get(camera.targetId);
      if (data) {
        const targetX = data.worldX + camera.leadX;
        const targetY = data.worldY + camera.leadY;

        if (camera.smoothing === 1) {
          camera.x = targetX;
          camera.y = targetY;
        } else {
          camera.x += (targetX - camera.x) * camera.smoothing;
          camera.y += (targetY - camera.y) * camera.smoothing;
        }
      }
    }

    this._applyBounds(camera);

    if (camera.shakeFrames > 0 && camera.shakeStrength > 0) {
      const strength = camera.shakeStrength;
      camera.shakeX = (Math.random() * 2 - 1) * strength;
      camera.shakeY = (Math.random() * 2 - 1) * strength;
      camera.shakeFrames -= 1;
    } else {
      camera.shakeFrames = 0;
      camera.shakeX = 0;
      camera.shakeY = 0;
    }

    for (const [id, data] of this.worldObjects.entries()) {
      const target = Scratch.vm.runtime.getTargetById(id);
      if (!target) continue;

      const screenX = data.worldX - camera.x - camera.shakeX;
      const screenY = data.worldY - camera.y - camera.shakeY;

      target.setXY(screenX, screenY);
    }
  }
}

Scratch.extensions.register(new FactoryCamera());
