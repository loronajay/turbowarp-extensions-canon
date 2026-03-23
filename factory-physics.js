(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Factory Gravity v1 must run unsandboxed.');
  }

  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const Cast = Scratch.Cast;

  class FactoryGravityV1 {
    constructor() {
      // body registry keyed by exact sprite name
      this.bodies = new Map();
    }

    getInfo() {
      return {
        id: 'factorygravityv1',
        name: 'Factory Gravity v1',
        color1: '#4C97FF',
        color2: '#3373CC',
        color3: '#2E64B5',

        menus: {
          spriteMenu: {
            acceptReporters: true,
            items: '_getSpriteMenu'
          },
          solidMenu: {
            acceptReporters: true,
            items: '_getSpriteMenu'
          }
        },

        blocks: [
          {
            opcode: 'createGravityBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'create gravity body [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'deleteGravityBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'delete gravity body [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'setupGravityBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'setup gravity body [NAME] with solid sprite [SOLID]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              SOLID: {
                type: Scratch.ArgumentType.STRING,
                menu: 'solidMenu',
                defaultValue: 'Sprite2'
              }
            }
          },
          {
            opcode: 'setSolidTarget',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set solid sprite of [NAME] to [SOLID]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              SOLID: {
                type: Scratch.ArgumentType.STRING,
                menu: 'solidMenu',
                defaultValue: 'Sprite2'
              }
            }
          },
          {
            opcode: 'setGravity',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set gravity of [NAME] to [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: -0.5
              }
            }
          },
          {
            opcode: 'setJumpPower',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set jump power of [NAME] to [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 8
              }
            }
          },
          {
            opcode: 'setMaxFallSpeed',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set max fall speed of [NAME] to [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'setGravitySettings',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set gravity settings of [NAME] gravity [GRAVITY] jump [JUMP] max fall [FALL]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              GRAVITY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: -0.5
              },
              JUMP: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 8
              },
              FALL: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 10
              }
            }
          },
          {
            opcode: 'setXVelocity',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set x velocity of [NAME] to [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'setYVelocity',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set y velocity of [NAME] to [VALUE]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: 'makeJump',
            blockType: Scratch.BlockType.COMMAND,
            text: 'make [NAME] jump',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'stopGravityBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'stop gravity body [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'updateGravityBody',
            blockType: Scratch.BlockType.COMMAND,
            text: 'update gravity body [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },

          '---',

          {
            opcode: 'getXVelocity',
            blockType: Scratch.BlockType.REPORTER,
            text: 'x velocity of [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'getYVelocity',
            blockType: Scratch.BlockType.REPORTER,
            text: 'y velocity of [NAME]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'doesGravityBodyExist',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'does gravity body [NAME] exist?',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'isGrounded',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is [NAME] grounded?',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'isFalling',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is [NAME] falling?',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'isTouchingLeftWall',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is [NAME] touching left wall?',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'isTouchingRightWall',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is [NAME] touching right wall?',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'isTouchingCeiling',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is [NAME] touching ceiling?',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                menu: 'spriteMenu',
                defaultValue: 'Sprite1'
              }
            }
          }
        ]
      };
    }

    _normalizeName(name) {
      return Cast.toString(name).trim();
    }

    _toNumber(value, fallback = 0) {
      const n = Cast.toNumber(value);
      return Number.isFinite(n) ? n : fallback;
    }

    _getAllSpriteTargets() {
      return runtime.targets.filter(target => target && !target.isStage && target.isOriginal);
    }

    _getTargetName(target) {
      if (!target) return '';
      if (typeof target.getName === 'function') {
        return target.getName();
      }
      if (target.sprite && typeof target.sprite.name === 'string') {
        return target.sprite.name;
      }
      return '';
    }

    _getSpriteMenu() {
      const targets = this._getAllSpriteTargets();
      const names = targets
        .map(target => this._getTargetName(target))
        .filter(name => !!name);

      if (names.length === 0) {
        return ['Sprite1'];
      }

      return names;
    }

    _getSpriteByName(name) {
      const exact = this._normalizeName(name);
      if (!exact) return null;

      const targets = this._getAllSpriteTargets();
      for (const target of targets) {
        if (this._getTargetName(target) === exact) {
          return target;
        }
      }
      return null;
    }

    _refreshBodyTarget(body) {
      if (!body) return null;
      const target = this._getSpriteByName(body.name);
      if (target) {
        body.target = target;
      }
      return body.target || null;
    }

    _refreshSolidTarget(body) {
      if (!body || !body.solidName) return null;
      const solidTarget = this._getSpriteByName(body.solidName);
      if (solidTarget) {
        body.solidTarget = solidTarget;
      }
      return body.solidTarget || null;
    }

    _getBody(name) {
      const key = this._normalizeName(name);
      if (!key) return null;
      return this.bodies.get(key) || null;
    }

    _getOrCreateBody(name) {
      const key = this._normalizeName(name);
      if (!key) return null;

      let body = this.bodies.get(key);
      if (body) {
        this._refreshBodyTarget(body);
        this._refreshSolidTarget(body);
        return body;
      }

      const target = this._getSpriteByName(key);
      if (!target) return null;

      body = {
        name: key,
        target: target,
        solidName: '',
        solidTarget: null,
        xVel: 0,
        yVel: 0,
        gravity: -0.5,
        jumpPower: 8,
        maxFall: 10,
        grounded: false,
        leftWall: false,
        rightWall: false,
        ceiling: false,
        coyoteTicks: 0,
        coyoteTime: 4
      };

      this.bodies.set(key, body);
      return body;
    }

    _getXY(target) {
      return {
        x: typeof target.x === 'number' ? target.x : 0,
        y: typeof target.y === 'number' ? target.y : 0
      };
    }

    _setXY(target, x, y) {
      if (!target) return;
      if (typeof target.setXY === 'function') {
        target.setXY(x, y);
        return;
      }
      target.x = x;
      target.y = y;
    }

    _touchingSolid(body) {
      if (!body) return false;

      const target = this._refreshBodyTarget(body);
      const solidTarget = this._refreshSolidTarget(body);

      if (!target || !solidTarget) return false;

      if (typeof target.isTouchingObject === 'function') {
        try {
          return !!target.isTouchingObject(body.solidName);
        } catch (e) {}

        try {
          if (typeof solidTarget.drawableID !== 'undefined') {
            return !!target.isTouchingObject(solidTarget.drawableID);
          }
        } catch (e) {}
      }

      try {
        const renderer = runtime.renderer;
        if (
          renderer &&
          typeof renderer.isTouchingDrawables === 'function' &&
          typeof target.drawableID !== 'undefined' &&
          typeof solidTarget.drawableID !== 'undefined'
        ) {
          return !!renderer.isTouchingDrawables(
            target.drawableID,
            [solidTarget.drawableID]
          );
        }
      } catch (e) {}

      return false;
    }

    _resetContactStates(body) {
      body.grounded = false;
      body.leftWall = false;
      body.rightWall = false;
      body.ceiling = false;
    }

    _moveX(body, amount) {
      const target = this._refreshBodyTarget(body);
      if (!target) return;

      const dir = Math.sign(amount);
      const total = Math.abs(amount);

      const wholeSteps = Math.floor(total);
      const remainder = total - wholeSteps;

      const tryStep = stepAmount => {
        const pos = this._getXY(target);
        this._setXY(target, pos.x + stepAmount, pos.y);

        if (this._touchingSolid(body)) {
          this._setXY(target, pos.x, pos.y);
          body.xVel = 0;

          if (stepAmount > 0) {
            body.rightWall = true;
          } else if (stepAmount < 0) {
            body.leftWall = true;
          }
          return false;
        }
        return true;
      };

      for (let i = 0; i < wholeSteps; i++) {
        if (!tryStep(dir)) return;
      }

      if (remainder > 0) {
        tryStep(dir * remainder);
      }
    }

    _moveY(body, amount) {
      const target = this._refreshBodyTarget(body);
      if (!target) return;

      const dir = Math.sign(amount);
      const total = Math.abs(amount);

      const wholeSteps = Math.floor(total);
      const remainder = total - wholeSteps;

      const tryStep = stepAmount => {
        const pos = this._getXY(target);
        this._setXY(target, pos.x, pos.y + stepAmount);

        if (this._touchingSolid(body)) {
          this._setXY(target, pos.x, pos.y);
          body.yVel = 0;

          if (stepAmount < 0) {
            body.grounded = true;
          } else if (stepAmount > 0) {
            body.ceiling = true;
          }
          return false;
        }
        return true;
      };

      for (let i = 0; i < wholeSteps; i++) {
        if (!tryStep(dir)) return;
      }

      if (remainder > 0) {
        tryStep(dir * remainder);
      }
    }

    _groundProbe(body) {
      const target = this._refreshBodyTarget(body);
      if (!target) return;

      const pos = this._getXY(target);
      this._setXY(target, pos.x, pos.y - 1);

      if (this._touchingSolid(body)) {
        body.grounded = true;
      }

      this._setXY(target, pos.x, pos.y);
    }

    createGravityBody(args) {
      const name = this._normalizeName(args.NAME);
      if (!name) return;

      const target = this._getSpriteByName(name);
      if (!target) return;

      const existing = this.bodies.get(name);
      if (existing) {
        existing.target = target;
        return;
      }

      this.bodies.set(name, {
        name,
        target,
        solidName: '',
        solidTarget: null,
        xVel: 0,
        yVel: 0,
        gravity: -0.5,
        jumpPower: 8,
        maxFall: 10,
        grounded: false,
        leftWall: false,
        rightWall: false,
        ceiling: false,
        coyoteTicks: 0,
        coyoteTime: 4
      });
    }

    deleteGravityBody(args) {
      const name = this._normalizeName(args.NAME);
      if (!name) return;
      this.bodies.delete(name);
    }

    setupGravityBody(args) {
      const name = this._normalizeName(args.NAME);
      const solidName = this._normalizeName(args.SOLID);
      if (!name || !solidName) return;

      const body = this._getOrCreateBody(name);
      if (!body) return;

      const solidTarget = this._getSpriteByName(solidName);
      if (!solidTarget) return;

      body.solidName = solidName;
      body.solidTarget = solidTarget;
    }

    setSolidTarget(args) {
      const name = this._normalizeName(args.NAME);
      const solidName = this._normalizeName(args.SOLID);
      if (!name || !solidName) return;

      const body = this._getOrCreateBody(name);
      if (!body) return;

      const solidTarget = this._getSpriteByName(solidName);
      if (!solidTarget) return;

      body.solidName = solidName;
      body.solidTarget = solidTarget;
    }

    setGravity(args) {
      const body = this._getOrCreateBody(args.NAME);
      if (!body) return;
      body.gravity = this._toNumber(args.VALUE, -0.5);
    }

    setJumpPower(args) {
      const body = this._getOrCreateBody(args.NAME);
      if (!body) return;
      body.jumpPower = this._toNumber(args.VALUE, 8);
    }

    setMaxFallSpeed(args) {
      const body = this._getOrCreateBody(args.NAME);
      if (!body) return;

      const value = this._toNumber(args.VALUE, 10);
      body.maxFall = Math.max(0, value);
    }

    setGravitySettings(args) {
      const body = this._getOrCreateBody(args.NAME);
      if (!body) return;

      body.gravity = this._toNumber(args.GRAVITY, -0.5);
      body.jumpPower = this._toNumber(args.JUMP, 8);
      body.maxFall = Math.max(0, this._toNumber(args.FALL, 10));
    }

    setXVelocity(args) {
      const body = this._getOrCreateBody(args.NAME);
      if (!body) return;
      body.xVel = this._toNumber(args.VALUE, 0);
    }

    setYVelocity(args) {
      const body = this._getOrCreateBody(args.NAME);
      if (!body) return;
      body.yVel = this._toNumber(args.VALUE, 0);
    }

    makeJump(args) {
      const body = this._getBody(args.NAME);
      if (!body) return;

      if (body.grounded || body.coyoteTicks > 0) {
        body.yVel = Math.abs(body.jumpPower);
        body.grounded = false;
        body.coyoteTicks = 0;
      }
    }

    stopGravityBody(args) {
      const body = this._getBody(args.NAME);
      if (!body) return;

      body.xVel = 0;
      body.yVel = 0;
    }

    updateGravityBody(args) {
      const body = this._getBody(args.NAME);
      if (!body) return;

      const target = this._refreshBodyTarget(body);
      const solidTarget = this._refreshSolidTarget(body);

      if (!target || !solidTarget || !body.solidName) return;

      this._resetContactStates(body);

      body.yVel += body.gravity;

      if (body.yVel < -body.maxFall) {
        body.yVel = -body.maxFall;
      }

      if (body.xVel !== 0) {
        this._moveX(body, body.xVel);
      }

      if (body.yVel !== 0) {
        this._moveY(body, body.yVel);
      }

      this._groundProbe(body);

      if (body.grounded) {
        body.coyoteTicks = body.coyoteTime;
      } else if (body.coyoteTicks > 0) {
        body.coyoteTicks--;
      }
    }

    getXVelocity(args) {
      const body = this._getBody(args.NAME);
      return body ? body.xVel : 0;
    }

    getYVelocity(args) {
      const body = this._getBody(args.NAME);
      return body ? body.yVel : 0;
    }

    doesGravityBodyExist(args) {
      const name = this._normalizeName(args.NAME);
      if (!name) return false;
      return this.bodies.has(name);
    }

    isGrounded(args) {
      const body = this._getBody(args.NAME);
      return body ? !!body.grounded : false;
    }

    isFalling(args) {
      const body = this._getBody(args.NAME);
      return body ? (body.yVel < 0 && !body.grounded) : false;
    }

    isTouchingLeftWall(args) {
      const body = this._getBody(args.NAME);
      return body ? !!body.leftWall : false;
    }

    isTouchingRightWall(args) {
      const body = this._getBody(args.NAME);
      return body ? !!body.rightWall : false;
    }

    isTouchingCeiling(args) {
      const body = this._getBody(args.NAME);
      return body ? !!body.ceiling : false;
    }
  }

  Scratch.extensions.register(new FactoryGravityV1());
})(Scratch);