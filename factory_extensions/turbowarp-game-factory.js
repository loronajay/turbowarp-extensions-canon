(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("TurboWarp Game Factory must run unsandboxed.");
  }

  // =========================
  // MODULE: FACTORY INPUT
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

  // =========================
  // MODULE: TEXTIFY-TURBOWARP
  // =========================

  const vm = Scratch.vm;

  function getEditingTarget() {
    return vm.editingTarget || vm.runtime.getEditingTarget();
  }

  function getTargetByName(name) {
    const runtime = vm.runtime;
    if (!runtime || !runtime.targets) return null;

    const lower = String(name || '').trim().toLowerCase();
    return runtime.targets.find(t => {
      const targetName = (t.getName ? t.getName() : t.sprite?.name || '').toLowerCase();
      return targetName === lower;
    }) || null;
  }

  function escapeText(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\n/g, '\\n');
  }

  function indentStr(level) {
    return '  '.repeat(level);
  }

  function getBlock(target, blockId) {
    return target?.blocks?._blocks?.[blockId] || null;
  }

  function getInputBlockId(block, inputName) {
    return block?.inputs?.[inputName]?.block || null;
  }

  function getFieldValue(block, fieldName) {
    return block?.fields?.[fieldName]?.value ?? '';
  }

  function isWrappedBy(text, openChar, closeChar) {
    const s = String(text || '').trim();
    if (!s || s[0] !== openChar || s[s.length - 1] !== closeChar) return false;

    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === openChar) depth++;
      if (ch === closeChar) depth--;

      if (depth === 0 && i < s.length - 1) return false;
      if (depth < 0) return false;
    }

    return depth === 0;
  }

  function isParenWrapped(text) {
    return isWrappedBy(text, '(', ')');
  }

  function isAngleWrapped(text) {
    return isWrappedBy(text, '<', '>');
  }

  function isBracketWrapped(text) {
    return isWrappedBy(text, '[', ']');
  }

  function wrapParens(text) {
    return isParenWrapped(text) ? text : `(${text})`;
  }

  function wrapAngles(text) {
    return isAngleWrapped(text) ? text : `<${text}>`;
  }

  function normalizeLiteralOutput(text) {
    if (text === null || text === undefined) return text;

    const s = String(text);

    if (isBracketWrapped(s)) {
      const inner = s.slice(1, -1).trim();

      if (inner !== '' && !isNaN(inner)) {
        return inner;
      }
    }

    return s;
  }

  function getLiteralFromShadow(target, blockId) {
    const block = getBlock(target, blockId);
    if (!block) return null;

    const f = block.fields || {};

    switch (block.opcode) {
      case 'math_number':
      case 'math_integer':
      case 'math_whole_number':
      case 'math_positive_number':
      case 'math_angle': {
        const val = f.NUM ? f.NUM.value : '0';
        return String(val);
      }

      case 'text': {
        const val = f.TEXT ? escapeText(f.TEXT.value) : '';
        return `[${val}]`;
      }

      case 'colour_picker': {
        const val = f.COLOUR ? f.COLOUR.value : '#000000';
        return `[${val}]`;
      }
    }

    return null;
  }

  function isArithmeticOpcode(opcode) {
    return opcode === 'operator_add' ||
           opcode === 'operator_subtract' ||
           opcode === 'operator_multiply' ||
           opcode === 'operator_divide' ||
           opcode === 'operator_mod';
  }

  function isBooleanOpcode(opcode) {
    return opcode === 'operator_equals' ||
           opcode === 'operator_lt' ||
           opcode === 'operator_gt' ||
           opcode === 'operator_and' ||
           opcode === 'operator_or' ||
           opcode === 'operator_not' ||
           opcode === 'operator_contains';
  }

  function isReporterOpcode(opcode) {
    return isArithmeticOpcode(opcode) ||
           opcode === 'operator_random' ||
           opcode === 'operator_join' ||
           opcode === 'operator_letter_of' ||
           opcode === 'operator_length' ||
           opcode === 'data_itemoflist' ||
           opcode === 'procedures_call';
  }

  function looksLikeMenuOpcode(opcode) {
    if (typeof opcode !== 'string' || !opcode) return false;

    const lower = opcode.toLowerCase();

    if (lower.endsWith('_menu')) return true;
    if (lower.includes('_menu_')) return true;
    if (lower.startsWith('menu_')) return true;

    const parts = lower.split('_');
    return parts.includes('menu');
  }

  function getFirstFieldEntry(block) {
    const values = Object.values(block?.fields || {});
    return values.length ? values[0] : null;
  }

  function hasAnyInputs(block) {
    return !!block && !!block.inputs && Object.keys(block.inputs).length > 0;
  }

  function hasAnyFields(block) {
    return !!block && !!block.fields && Object.keys(block.fields).length > 0;
  }

  function hasMeaningfulMenuField(block) {
    const firstField = getFirstFieldEntry(block);
    if (!firstField) return false;
    if (firstField.value === undefined || firstField.value === null) return false;
    return String(firstField.value).trim() !== '';
  }

  function isLikelyMenuBlock(block) {
    if (!block || !looksLikeMenuOpcode(block.opcode)) return false;

    if (block.shadow) return true;
    if (!hasAnyInputs(block) && hasMeaningfulMenuField(block)) return true;
    if (!hasAnyInputs(block) && hasAnyFields(block)) return true;

    return false;
  }

  function isAtomicInputBlock(block) {
    if (!block) return true;

    switch (block.opcode) {
      case 'math_number':
      case 'math_integer':
      case 'math_whole_number':
      case 'math_positive_number':
      case 'math_angle':
      case 'text':
      case 'colour_picker':
        return true;
      default:
        return false;
    }
  }

  function wrapArithmeticChild(target, blockId) {
    const text = renderInput(target, blockId);
    if (!blockId) return text;

    const block = getBlock(target, blockId);
    if (!block) return text;

    if (isAtomicInputBlock(block)) return text;
    if (isParenWrapped(text) || isAngleWrapped(text) || isBracketWrapped(text)) return text;

    if (isArithmeticOpcode(block.opcode) || isReporterOpcode(block.opcode) || isBooleanOpcode(block.opcode)) {
      return wrapParens(text);
    }

    return text;
  }

  function wrapBooleanChild(target, blockId) {
    const text = renderInput(target, blockId);
    if (!blockId) return text;

    const block = getBlock(target, blockId);
    if (!block) return text;

    if (isAtomicInputBlock(block)) return text;
    if (isAngleWrapped(text) || isParenWrapped(text) || isBracketWrapped(text)) return text;

    if (isBooleanOpcode(block.opcode)) return wrapAngles(text);
    if (isArithmeticOpcode(block.opcode) || isReporterOpcode(block.opcode)) return wrapParens(text);

    return text;
  }

  function renderTypedReporter(block) {
    switch (block.opcode) {
      case 'data_variable':
        return `var [${getFieldValue(block, 'VARIABLE')}]`;

      case 'argument_reporter_string_number':
      case 'argument_reporter_boolean':
        return `arg [${getFieldValue(block, 'VALUE') || getFieldValue(block, 'NAME') || 'arg'}]`;

      default:
        return null;
    }
  }

  function renderMenuInput(block) {
    const firstField = getFirstFieldEntry(block);
    const rawValue = firstField?.value;

    if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== '') {
      return `menu [${escapeText(rawValue)} | ${block.opcode}]`;
    }

    return `menu [${block.opcode}]`;
  }

  function renderProcedureCallInputs(target, block) {
    const inputs = block?.inputs || {};
    const names = Object.keys(inputs).sort();

    if (!names.length) return '';

    return names.map(name => {
      const inputBlockId = inputs[name]?.block || null;
      return `${name}: ${renderInput(target, inputBlockId)}`;
    }).join(', ');
  }

  function renderUnknownInputs(target, block) {
    const inputs = block?.inputs || {};
    const names = Object.keys(inputs);

    if (!names.length) return '';

    return names.map(name => {
      const inputBlockId = inputs[name]?.block || null;
      return `${name}: ${renderInput(target, inputBlockId)}`;
    }).join(', ');
  }

  function renderUnknownStack(block, target) {
    const args = renderUnknownInputs(target, block);
    return `[opcode ${block.opcode}${args ? ' ' + args : ''}]`;
  }

  function renderInput(target, blockId) {
    if (!blockId) return '[]';

    const literal = getLiteralFromShadow(target, blockId);
    if (literal !== null) return normalizeLiteralOutput(literal);

    const block = getBlock(target, blockId);
    if (!block) return '[missing]';

    const typedReporter = renderTypedReporter(block);
    if (typedReporter !== null) return normalizeLiteralOutput(typedReporter);

    if (isLikelyMenuBlock(block)) {
      return normalizeLiteralOutput(renderMenuInput(block));
    }

    const raw = name => renderInput(target, getInputBlockId(block, name));
    const ar = name => wrapArithmeticChild(target, getInputBlockId(block, name));
    const bo = name => wrapBooleanChild(target, getInputBlockId(block, name));

    switch (block.opcode) {
      case 'data_itemoflist':
        return normalizeLiteralOutput(
          wrapParens(`item ${raw('INDEX')} of list [${getFieldValue(block, 'LIST')}]`)
        );

      case 'operator_add':
        return normalizeLiteralOutput(wrapParens(`${ar('NUM1')} + ${ar('NUM2')}`));

      case 'operator_subtract':
        return normalizeLiteralOutput(wrapParens(`${ar('NUM1')} - ${ar('NUM2')}`));

      case 'operator_multiply':
        return normalizeLiteralOutput(wrapParens(`${ar('NUM1')} * ${ar('NUM2')}`));

      case 'operator_divide':
        return normalizeLiteralOutput(wrapParens(`${ar('NUM1')} / ${ar('NUM2')}`));

      case 'operator_mod':
        return normalizeLiteralOutput(wrapParens(`${ar('NUM1')} mod ${ar('NUM2')}`));

      case 'operator_random':
        return normalizeLiteralOutput(wrapParens(`pick random ${raw('FROM')} to ${raw('TO')}`));

      case 'operator_join':
        return normalizeLiteralOutput(wrapParens(`join ${raw('STRING1')} ${raw('STRING2')}`));

      case 'operator_letter_of':
        return normalizeLiteralOutput(wrapParens(`letter ${raw('LETTER')} of ${raw('STRING')}`));

      case 'operator_length':
        return normalizeLiteralOutput(wrapParens(`length of ${raw('STRING')}`));

      case 'operator_contains':
        return normalizeLiteralOutput(wrapAngles(`${bo('STRING1')} contains ${bo('STRING2')}`));

      case 'operator_equals':
        return normalizeLiteralOutput(wrapAngles(`${bo('OPERAND1')} = ${bo('OPERAND2')}`));

      case 'operator_lt':
        return normalizeLiteralOutput(wrapAngles(`${bo('OPERAND1')} < ${bo('OPERAND2')}`));

      case 'operator_gt':
        return normalizeLiteralOutput(wrapAngles(`${bo('OPERAND1')} > ${bo('OPERAND2')}`));

      case 'operator_and':
        return normalizeLiteralOutput(wrapAngles(`${bo('OPERAND1')} and ${bo('OPERAND2')}`));

      case 'operator_or':
        return normalizeLiteralOutput(wrapAngles(`${bo('OPERAND1')} or ${bo('OPERAND2')}`));

      case 'operator_not': {
        const operandId = getInputBlockId(block, 'OPERAND');
        const operandText = wrapBooleanChild(target, operandId);
        return normalizeLiteralOutput(wrapAngles(`not ${operandText}`));
      }

      case 'sensing_touchingobject':
        return normalizeLiteralOutput(wrapAngles(`touching ${raw('TOUCHINGOBJECTMENU')} ?`));

      case 'sensing_touchingcolor':
        return normalizeLiteralOutput(wrapAngles(`touching color ${raw('COLOR')} ?`));

      case 'sensing_coloristouchingcolor':
        return normalizeLiteralOutput(wrapAngles(`color ${raw('COLOR')} is touching ${raw('COLOR2')} ?`));

      case 'sensing_keypressed':
        return normalizeLiteralOutput(wrapAngles(`key ${raw('KEY_OPTION')} pressed ?`));

      case 'sensing_mousedown':
        return normalizeLiteralOutput(wrapAngles('mouse down ?'));

      case 'sensing_mousex':
        return normalizeLiteralOutput(wrapParens('mouse x'));

      case 'sensing_mousey':
        return normalizeLiteralOutput(wrapParens('mouse y'));

      case 'sensing_of':
        return normalizeLiteralOutput(wrapParens(`${raw('PROPERTY')} of ${raw('OBJECT')}`));

      case 'motion_xposition':
        return normalizeLiteralOutput(wrapParens('x position'));

      case 'motion_yposition':
        return normalizeLiteralOutput(wrapParens('y position'));

      case 'motion_direction':
        return normalizeLiteralOutput(wrapParens('direction'));

      case 'looks_costumenumbername': {
        const mode = getFieldValue(block, 'NUMBER_NAME') || 'number';
        return normalizeLiteralOutput(wrapParens(`costume ${String(mode).toLowerCase()}`));
      }

      case 'looks_backdropnumbername': {
        const mode = getFieldValue(block, 'NUMBER_NAME') || 'number';
        return normalizeLiteralOutput(wrapParens(`backdrop ${String(mode).toLowerCase()}`));
      }

      case 'looks_size':
        return normalizeLiteralOutput(wrapParens('size'));

      case 'procedures_call': {
        const code = block.mutation?.proccode || 'call';
        const args = renderProcedureCallInputs(target, block);
        return normalizeLiteralOutput(
          wrapParens(`call [${code}]${args ? ` (${args})` : ''}`)
        );
      }

      default: {
        const args = renderUnknownInputs(target, block);
        return normalizeLiteralOutput(
          `[opcode ${block.opcode}${args ? ' ' + args : ''}]`
        );
      }
    }
  }

  function pushRenderedSubstack(lines, target, substackId, indent) {
    if (!substackId) return;
    const subText = renderStack(target, substackId, indent);
    if (!subText) return;
    lines.push(...subText.split('\n'));
  }

  function renderStack(target, blockId, indent) {
    const lines = [];
    let currentId = blockId;

    while (currentId) {
      const block = getBlock(target, currentId);
      if (!block) break;

      const i = name => renderInput(target, getInputBlockId(block, name));
      const ind = indentStr(indent);

      switch (block.opcode) {
        case 'motion_movesteps':
          lines.push(`${ind}move ${i('STEPS')} steps`);
          break;

        case 'motion_turnright':
          lines.push(`${ind}turn clockwise ${i('DEGREES')} degrees`);
          break;

        case 'motion_turnleft':
          lines.push(`${ind}turn counterclockwise ${i('DEGREES')} degrees`);
          break;

        case 'motion_goto':
          lines.push(`${ind}go to ${i('TO')}`);
          break;

        case 'motion_gotoxy':
          lines.push(`${ind}go to x: ${i('X')} y: ${i('Y')}`);
          break;

        case 'motion_glideto':
          lines.push(`${ind}glide ${i('SECS')} secs to ${i('TO')}`);
          break;

        case 'motion_glidesecstoxy':
          lines.push(`${ind}glide ${i('SECS')} secs to x: ${i('X')} y: ${i('Y')}`);
          break;

        case 'motion_pointindirection':
          lines.push(`${ind}point in direction ${i('DIRECTION')}`);
          break;

        case 'motion_pointtowards':
          lines.push(`${ind}point towards ${i('TOWARDS')}`);
          break;

        case 'motion_changexby':
          lines.push(`${ind}change x by ${i('DX')}`);
          break;

        case 'motion_setx':
          lines.push(`${ind}set x to ${i('X')}`);
          break;

        case 'motion_changeyby':
          lines.push(`${ind}change y by ${i('DY')}`);
          break;

        case 'motion_sety':
          lines.push(`${ind}set y to ${i('Y')}`);
          break;

        case 'motion_ifonedgebounce':
          lines.push(`${ind}if on edge, bounce`);
          break;

        case 'motion_setrotationstyle':
          lines.push(`${ind}set rotation style [${escapeText(getFieldValue(block, 'STYLE'))}]`);
          break;

        case 'looks_sayforsecs':
          lines.push(`${ind}say ${i('MESSAGE')} for ${i('SECS')} seconds`);
          break;

        case 'looks_say':
          lines.push(`${ind}say ${i('MESSAGE')}`);
          break;

        case 'looks_thinkforsecs':
          lines.push(`${ind}think ${i('MESSAGE')} for ${i('SECS')} seconds`);
          break;

        case 'looks_think':
          lines.push(`${ind}think ${i('MESSAGE')}`);
          break;

        case 'looks_switchcostumeto':
          lines.push(`${ind}switch costume to ${i('COSTUME')}`);
          break;

        case 'looks_nextcostume':
          lines.push(`${ind}next costume`);
          break;

        case 'looks_switchbackdropto':
          lines.push(`${ind}switch backdrop to ${i('BACKDROP')}`);
          break;

        case 'looks_nextbackdrop':
          lines.push(`${ind}next backdrop`);
          break;

        case 'looks_changesizeby':
          lines.push(`${ind}change size by ${i('CHANGE')}`);
          break;

        case 'looks_setsizeto':
          lines.push(`${ind}set size to ${i('SIZE')} %`);
          break;

        case 'looks_changeeffectby':
          lines.push(`${ind}change [${escapeText(getFieldValue(block, 'EFFECT'))}] effect by ${i('CHANGE')}`);
          break;

        case 'looks_seteffectto':
          lines.push(`${ind}set [${escapeText(getFieldValue(block, 'EFFECT'))}] effect to ${i('VALUE')}`);
          break;

        case 'looks_cleargraphiceffects':
          lines.push(`${ind}clear graphic effects`);
          break;

        case 'looks_show':
          lines.push(`${ind}show`);
          break;

        case 'looks_hide':
          lines.push(`${ind}hide`);
          break;

        case 'sound_play':
          lines.push(`${ind}start sound ${i('SOUND_MENU')}`);
          break;

        case 'sound_playuntildone':
          lines.push(`${ind}play sound ${i('SOUND_MENU')} until done`);
          break;

        case 'sound_stopallsounds':
          lines.push(`${ind}stop all sounds`);
          break;

        case 'event_broadcast':
          lines.push(`${ind}broadcast ${i('BROADCAST_INPUT')}`);
          break;

        case 'event_broadcastandwait':
          lines.push(`${ind}broadcast ${i('BROADCAST_INPUT')} and wait`);
          break;

        case 'data_setvariableto':
          lines.push(`${ind}set [${getFieldValue(block, 'VARIABLE')}] to ${i('VALUE')}`);
          break;

        case 'data_changevariableby':
          lines.push(`${ind}change [${getFieldValue(block, 'VARIABLE')}] by ${i('VALUE')}`);
          break;

        case 'data_addtolist':
          lines.push(`${ind}add ${i('ITEM')} to list [${getFieldValue(block, 'LIST')}]`);
          break;

        case 'data_deleteoflist':
          lines.push(`${ind}delete ${i('INDEX')} of list [${getFieldValue(block, 'LIST')}]`);
          break;

        case 'data_deletealloflist':
          lines.push(`${ind}delete all of list [${getFieldValue(block, 'LIST')}]`);
          break;

        case 'data_insertatlist':
          lines.push(`${ind}insert ${i('ITEM')} at ${i('INDEX')} of list [${getFieldValue(block, 'LIST')}]`);
          break;

        case 'data_replaceitemoflist':
          lines.push(`${ind}replace item ${i('INDEX')} of list [${getFieldValue(block, 'LIST')}] with ${i('ITEM')}`);
          break;

        case 'control_wait':
          lines.push(`${ind}wait ${i('DURATION')} seconds`);
          break;

        case 'control_stop':
          lines.push(`${ind}stop [${escapeText(getFieldValue(block, 'STOP_OPTION'))}]`);
          break;

        case 'control_create_clone_of':
          lines.push(`${ind}create clone of ${i('CLONE_OPTION')}`);
          break;

        case 'control_delete_this_clone':
          lines.push(`${ind}delete this clone`);
          break;

        case 'control_if':
          lines.push(`${ind}if ${i('CONDITION')} then`);
          pushRenderedSubstack(lines, target, getInputBlockId(block, 'SUBSTACK'), indent + 1);
          lines.push(`${ind}end`);
          break;

        case 'control_if_else':
          lines.push(`${ind}if ${i('CONDITION')} then`);
          pushRenderedSubstack(lines, target, getInputBlockId(block, 'SUBSTACK'), indent + 1);
          lines.push(`${ind}else`);
          pushRenderedSubstack(lines, target, getInputBlockId(block, 'SUBSTACK2'), indent + 1);
          lines.push(`${ind}end`);
          break;

        case 'control_repeat':
          lines.push(`${ind}repeat ${i('TIMES')}`);
          pushRenderedSubstack(lines, target, getInputBlockId(block, 'SUBSTACK'), indent + 1);
          lines.push(`${ind}end`);
          break;

        case 'control_forever':
          lines.push(`${ind}forever`);
          pushRenderedSubstack(lines, target, getInputBlockId(block, 'SUBSTACK'), indent + 1);
          lines.push(`${ind}end`);
          break;

        case 'control_repeat_until':
          lines.push(`${ind}repeat until ${i('CONDITION')}`);
          pushRenderedSubstack(lines, target, getInputBlockId(block, 'SUBSTACK'), indent + 1);
          lines.push(`${ind}end`);
          break;

        case 'procedures_call': {
          const code = block.mutation?.proccode || 'call';
          const args = renderProcedureCallInputs(target, block);
          lines.push(`${ind}call [${code}]${args ? ` (${args})` : ''}`);
          break;
        }

        default:
          lines.push(`${ind}${renderUnknownStack(block, target)}`);
          break;
      }

      currentId = block.next;
    }

    return lines.join('\n');
  }

  function findProcedureDefinition(target, procName) {
    const blocks = target?.blocks?._blocks || {};
    const wanted = String(procName).toLowerCase().trim();

    for (const id in blocks) {
      const block = blocks[id];
      if (!block || block.opcode !== 'procedures_definition') continue;

      const proto = getBlock(target, getInputBlockId(block, 'custom_block'));
      const code = proto?.mutation?.proccode || '';

      if (String(code).toLowerCase().trim() === wanted) return id;
    }

    return null;
  }

  function exportProcedureText(target, procName) {
    const defId = findProcedureDefinition(target, procName);
    if (!defId) return `Custom block not found: ${procName}`;

    const def = getBlock(target, defId);
    const proto = getBlock(target, getInputBlockId(def, 'custom_block'));
    const code = proto?.mutation?.proccode || procName;

    const body = def?.next || null;

    let out = `define [${code}]`;
    out += body ? '\n' + renderStack(target, body, 1) : '\n  [empty]';

    return out;
  }

  function showPopup(text) {
    const old = document.getElementById('twgf-export-popup');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'twgf-export-popup';
    overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.65);
      z-index:999999;display:flex;align-items:center;justify-content:center;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      width:min(900px,90vw);height:min(650px,80vh);
      background:#1e1e1e;border:2px solid #888;border-radius:12px;
      padding:16px;display:flex;flex-direction:column;gap:12px;
    `;

    const title = document.createElement('div');
    title.textContent = 'Textify-Turbowarp Export';
    title.style.cssText = 'color:white;font:bold 18px sans-serif';

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = `
      flex:1;width:100%;resize:none;background:#111;color:#0f0;
      border:1px solid #666;border-radius:8px;padding:12px;
      font:13px monospace;white-space:pre;
    `;

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

    const makeBtn = (txt, fn) => {
      const btn = document.createElement('button');
      btn.textContent = txt;
      btn.onclick = fn;
      btn.style.cssText = `
        padding:8px 14px;border-radius:8px;border:1px solid #666;
        background:#2d2d2d;color:white;cursor:pointer;
      `;
      return btn;
    };

    const copy = makeBtn('Copy', async () => {
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      try {
        await navigator.clipboard.writeText(textarea.value);
        copy.textContent = 'Copied!';
        setTimeout(() => {
          copy.textContent = 'Copy';
        }, 1200);
      } catch {
        document.execCommand('copy');
      }
    });

    const close = makeBtn('Close', () => overlay.remove());

    row.append(copy, close);
    panel.append(title, textarea, row);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  class TextifyTurbowarp {
    getInfo() {
      return {
        id: 'textifyturbowarp',
        name: 'Textify-Turbowarp',
        blocks: [
          {
            opcode: 'exportCustomBlock',
            blockType: Scratch.BlockType.COMMAND,
            text: 'export custom block [PROCNAME] from sprite [SPRITE]',
            arguments: {
              PROCNAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my block'
              },
              SPRITE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'Sprite1'
              }
            }
          },
          {
            opcode: 'exportFromEditingTarget',
            blockType: Scratch.BlockType.COMMAND,
            text: 'export custom block [PROCNAME] from current sprite',
            arguments: {
              PROCNAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'my block'
              }
            }
          }
        ]
      };
    }

    exportCustomBlock(args) {
      const target = getTargetByName(args.SPRITE);
      if (!target) {
        showPopup(`Sprite not found: ${args.SPRITE}`);
        return;
      }
      showPopup(exportProcedureText(target, args.PROCNAME));
    }

    exportFromEditingTarget(args) {
      const target = getEditingTarget();
      if (!target) {
        showPopup('No current sprite.');
        return;
      }
      showPopup(exportProcedureText(target, args.PROCNAME));
    }
  }

  // =========================
  // REGISTER MODULES
  // =========================

  Scratch.extensions.register(new FactoryInput());
  Scratch.extensions.register(new TextifyTurbowarp());
})(Scratch);