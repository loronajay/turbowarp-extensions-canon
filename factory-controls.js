(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Factory Input must be run as an unsandboxed extension.");
  }

  // =========================
  // KEYBOARD MAP
  // =========================

  const KEYBOARD_MAP = {
    p1: {
      up: "KeyW",
      left: "KeyA",
      down: "KeyS",
      right: "KeyD",
      cross: "KeyC",
      square: "KeyV",
      circle: "KeyB",
      triangle: "KeyF"
    },
    p2: {
      up: "KeyK",
      left: "KeyM",
      down: "Comma",
      right: "Period",
      cross: "ArrowLeft",
      square: "ArrowDown",
      circle: "ArrowRight",
      triangle: "ArrowUp"
    }
  };

  // =========================
  // GAMEPAD MAP
  // =========================

  const GAMEPAD_BUTTON_MAP = {
    cross: 0,
    circle: 1,
    square: 2,
    triangle: 3
  };

  const DPAD_BUTTON_MAP = {
    up: 12,
    down: 13,
    left: 14,
    right: 15
  };

  // =========================
  // CONTROL NORMALIZATION
  // =========================

  const CONTROL_ALIASES = {
    "✕": "cross",
    "○": "circle",
    "□": "square",
    "△": "triangle",
    up: "up",
    down: "down",
    left: "left",
    right: "right"
  };

  class FactoryInput {
    constructor() {
      this.keys = new Set();

      window.addEventListener("keydown", e => this.keys.add(e.code));
      window.addEventListener("keyup", e => this.keys.delete(e.code));
      window.addEventListener("blur", () => this.keys.clear());
    }

    getInfo() {
      return {
        id: "factoryinput",
        name: "Factory Input",
        color1: "#4C97FF",
        blocks: [
          {
            opcode: "pressed",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "[PLAYER] [CONTROL] pressed?",
            arguments: {
              PLAYER: {
                type: Scratch.ArgumentType.STRING,
                menu: "players",
                defaultValue: "P1"
              },
              CONTROL: {
                type: Scratch.ArgumentType.STRING,
                menu: "controls",
                defaultValue: "✕"
              }
            }
          },
          {
            opcode: "controllerIs",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "[PLAYER] controller is [TYPE]?",
            arguments: {
              PLAYER: {
                type: Scratch.ArgumentType.STRING,
                menu: "players",
                defaultValue: "P1"
              },
              TYPE: {
                type: Scratch.ArgumentType.STRING,
                menu: "types",
                defaultValue: "xbox"
              }
            }
          },
          {
            opcode: "controllerType",
            blockType: Scratch.BlockType.REPORTER,
            text: "[PLAYER] controller type",
            arguments: {
              PLAYER: {
                type: Scratch.ArgumentType.STRING,
                menu: "players",
                defaultValue: "P1"
              }
            }
          }
        ],
        menus: {
          players: {
            items: ["P1", "P2"]
          },
          controls: {
            items: [
              "up",
              "down",
              "left",
              "right",
              "✕",
              "○",
              "□",
              "△"
            ]
          },
          types: {
            items: [
              "xbox",
              "playstation",
              "nintendo",
              "arcade",
              "mobile",
              "keyboard",
              "generic"
            ]
          }
        }
      };
    }

    _normalize(control) {
      return CONTROL_ALIASES[String(control).toLowerCase()] || control;
    }

    _normalizeId(id) {
      return String(id || "")
        .toLowerCase()
        .replace(/[_\-\/()]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    _gamepad(player) {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      return pads[player === "P2" ? 1 : 0] || null;
    }

    _detectType(player) {
      const gp = this._gamepad(player);
      if (!gp) return "keyboard";

      const id = this._normalizeId(gp.id);

      if (
        id.includes("xbox") ||
        id.includes("xinput") ||
        id.includes("360 controller") ||
        id.includes("wireless controller for windows")
      ) {
        return "xbox";
      }

      if (
        id.includes("playstation") ||
        id.includes("dualshock") ||
        id.includes("dualsense") ||
        id.includes("ps3") ||
        id.includes("ps4") ||
        id.includes("ps5") ||
        id.includes("sony interactive entertainment")
      ) {
        return "playstation";
      }

      if (
        id.includes("nintendo") ||
        id.includes("switch") ||
        id.includes("joy con") ||
        id.includes("joycon") ||
        id.includes("pro controller")
      ) {
        return "nintendo";
      }

      if (
        id.includes("arcade") ||
        id.includes("fight stick") ||
        id.includes("fightstick") ||
        id.includes("joystick") ||
        id.includes("stick")
      ) {
        return "arcade";
      }

      if (
        id.includes("backbone") ||
        id.includes("kishi") ||
        id.includes("gamesir")
      ) {
        return "mobile";
      }

      return "generic";
    }

    _keyboard(player, control) {
      const map = KEYBOARD_MAP[player.toLowerCase()];
      const key = map[this._normalize(control)];
      return key ? this.keys.has(key) : false;
    }

    _gamepadPressed(player, control) {
      const gp = this._gamepad(player);
      if (!gp) return false;

      const c = this._normalize(control);

      if (DPAD_BUTTON_MAP[c] !== undefined) {
        return !!gp.buttons[DPAD_BUTTON_MAP[c]]?.pressed;
      }

      if (GAMEPAD_BUTTON_MAP[c] !== undefined) {
        return !!gp.buttons[GAMEPAD_BUTTON_MAP[c]]?.pressed;
      }

      return false;
    }

    pressed(args) {
      return (
        this._keyboard(args.PLAYER, args.CONTROL) ||
        this._gamepadPressed(args.PLAYER, args.CONTROL)
      );
    }

    controllerIs(args) {
      return this._detectType(args.PLAYER) === args.TYPE;
    }

    controllerType(args) {
      return this._detectType(args.PLAYER);
    }
  }

  Scratch.extensions.register(new FactoryInput());
})(Scratch);