(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Factory Animation must be run unsandboxed.');
  }

  const BlockType = Scratch.BlockType;
  const ArgumentType = Scratch.ArgumentType;
  const runtime = Scratch.vm.runtime;

  const targetStates = new Map();

  function clampInt(value, fallback) {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) ? n : fallback;
  }

  function clampNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function getTargetState(target) {
    if (!target || target.isStage) return null;

    let state = targetStates.get(target.id);
    if (!state) {
      state = {
        animations: Object.create(null),
        currentAnimation: '',
        currentFrame: 0,
        playing: false,
        paused: false,
        finished: false,
        accumulator: 0,
        lastUpdate: 0
      };
      targetStates.set(target.id, state);
    }
    return state;
  }

  function getAnimation(state, name) {
    if (!state) return null;
    const key = String(name || '').trim();
    if (!key) return null;
    return state.animations[key] || null;
  }

  function setCostumeForFrame(target, anim, frameIndex) {
    if (!target || !anim) return;

    const costumeNumber = anim.start + frameIndex;
    const zeroBased = costumeNumber - 1;

    if (!target.sprite || !target.sprite.costumes) return;
    const costumeCount = target.sprite.costumes.length;
    if (zeroBased < 0 || zeroBased >= costumeCount) return;

    target.setCostume(zeroBased);
  }

  function resetPlaybackState(state) {
    if (!state) return;
    state.currentAnimation = '';
    state.currentFrame = 0;
    state.playing = false;
    state.paused = false;
    state.finished = false;
    state.accumulator = 0;
    state.lastUpdate = Date.now();
  }

  function resetAllPlaybackStates() {
    for (const state of targetStates.values()) {
      resetPlaybackState(state);
    }
  }

  function startAnimation(target, state, name, forceRestart) {
    const anim = getAnimation(state, name);
    if (!anim) return false;

    const sameAnimation = state.currentAnimation === name;
    const activeNow = state.playing || state.paused;

    if (sameAnimation && activeNow && !forceRestart) {
      return false;
    }

    state.currentAnimation = name;
    state.currentFrame = 0;
    state.playing = true;
    state.paused = false;
    state.finished = false;
    state.accumulator = 0;
    state.lastUpdate = Date.now();

    setCostumeForFrame(target, anim, 0);
    return true;
  }

  function stopCurrentAnimation(state) {
    if (!state) return;
    if (!state.currentAnimation) return;

    state.playing = false;
    state.paused = false;
    state.finished = false;
    state.accumulator = 0;
    state.lastUpdate = Date.now();
    // Leave current animation name and current costume as-is
  }

  function updateTargetAnimation(target, state, now) {
    if (!target || !state) return;
    if (!state.currentAnimation) return;

    if (!state.playing) {
      state.lastUpdate = now;
      return;
    }

    if (state.paused) {
      state.lastUpdate = now;
      return;
    }

    const anim = getAnimation(state, state.currentAnimation);
    if (!anim) {
      resetPlaybackState(state);
      return;
    }

    const elapsedMs = Math.max(0, now - state.lastUpdate);
    state.lastUpdate = now;

    if (anim.fps <= 0) return;

    state.accumulator += (elapsedMs / 1000) * anim.fps;

    let steps = Math.floor(state.accumulator);
    if (steps <= 0) return;

    state.accumulator -= steps;

    while (steps > 0) {
      steps--;

      if (anim.mode === 'once') {
        if (state.currentFrame < anim.length - 1) {
          state.currentFrame++;
          setCostumeForFrame(target, anim, state.currentFrame);
        } else {
          state.currentFrame = anim.length - 1;
          state.playing = false;
          state.paused = false;
          state.finished = true;
          state.accumulator = 0;
          setCostumeForFrame(target, anim, state.currentFrame);
          return;
        }
      } else {
        state.currentFrame++;
        if (state.currentFrame >= anim.length) {
          state.currentFrame = 0;
        }
        setCostumeForFrame(target, anim, state.currentFrame);
      }
    }
  }

  if (runtime && typeof runtime.on === 'function') {
    runtime.on('PROJECT_START', () => {
      resetAllPlaybackStates();
    });

    runtime.on('PROJECT_STOP_ALL', () => {
      resetAllPlaybackStates();
    });
  }

  setInterval(() => {
    const now = Date.now();

    for (const target of runtime.targets) {
      if (!target || target.isStage) continue;
      const state = targetStates.get(target.id);
      if (!state) continue;
      updateTargetAnimation(target, state, now);
    }
  }, 1000 / 60);

  class FactoryAnimation {
    getInfo() {
      return {
        id: 'factoryAnimation',
        name: 'Factory Animation',
        color1: '#8e44ad',
        color2: '#7d3c98',
        color3: '#6c3483',
        blocks: [
          {
            opcode: 'defineAnimation',
            blockType: BlockType.COMMAND,
            text: 'define animation [NAME] from costume [START] to [END] at [FPS] fps mode [MODE]',
            arguments: {
              NAME: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              },
              START: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              },
              END: {
                type: ArgumentType.NUMBER,
                defaultValue: 4
              },
              FPS: {
                type: ArgumentType.NUMBER,
                defaultValue: 6
              },
              MODE: {
                type: ArgumentType.STRING,
                menu: 'animationMode'
              }
            }
          },
          {
            opcode: 'playAnimation',
            blockType: BlockType.COMMAND,
            text: 'play animation [NAME]',
            arguments: {
              NAME: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            }
          },
          {
            opcode: 'playAnimationForSeconds',
            blockType: BlockType.COMMAND,
            text: 'play animation [NAME] for [SECONDS] seconds',
            arguments: {
              NAME: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              },
              SECONDS: {
                type: ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'restartAnimation',
            blockType: BlockType.COMMAND,
            text: 'restart animation [NAME]',
            arguments: {
              NAME: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            }
          },
          {
            opcode: 'stopAnimation',
            blockType: BlockType.COMMAND,
            text: 'stop animation'
          },
          {
            opcode: 'pauseAnimation',
            blockType: BlockType.COMMAND,
            text: 'pause animation'
          },
          {
            opcode: 'resumeAnimation',
            blockType: BlockType.COMMAND,
            text: 'resume animation'
          },
          {
            opcode: 'currentAnimation',
            blockType: BlockType.REPORTER,
            text: 'current animation'
          },
          {
            opcode: 'animationExists',
            blockType: BlockType.BOOLEAN,
            text: 'animation [NAME] exists?',
            arguments: {
              NAME: {
                type: ArgumentType.STRING,
                defaultValue: 'idle'
              }
            }
          },
          {
            opcode: 'animationIsPlaying',
            blockType: BlockType.BOOLEAN,
            text: 'animation is playing?'
          },
          {
            opcode: 'animationIsPaused',
            blockType: BlockType.BOOLEAN,
            text: 'animation is paused?'
          },
          {
            opcode: 'animationIsFinished',
            blockType: BlockType.BOOLEAN,
            text: 'animation is finished?'
          },
          {
            opcode: 'currentAnimationFrame',
            blockType: BlockType.REPORTER,
            text: 'current animation frame'
          }
        ],
        menus: {
          animationMode: {
            acceptReporters: true,
            items: ['loop', 'once']
          }
        }
      };
    }

    defineAnimation(args, util) {
      const target = util.target;
      const state = getTargetState(target);
      if (!state) return;

      const name = String(args.NAME || '').trim();
      if (!name) return;

      let start = clampInt(args.START, 1);
      let end = clampInt(args.END, start);
      let fps = clampNumber(args.FPS, 6);
      let mode = String(args.MODE || 'loop').trim().toLowerCase();

      if (mode !== 'loop' && mode !== 'once') {
        mode = 'loop';
      }

      if (fps < 0) fps = 0;
      if (start < 1) start = 1;
      if (end < 1) end = 1;

      if (end < start) {
        const temp = start;
        start = end;
        end = temp;
      }

      const length = (end - start) + 1;
      if (length <= 0) return;

      state.animations[name] = {
        start,
        end,
        fps,
        mode,
        length
      };
    }

    playAnimation(args, util) {
      const target = util.target;
      const state = getTargetState(target);
      if (!state) return;

      const name = String(args.NAME || '').trim();
      if (!name) return;

      startAnimation(target, state, name, false);
    }

    async playAnimationForSeconds(args, util) {
      const target = util.target;
      const state = getTargetState(target);
      if (!state) return;

      const name = String(args.NAME || '').trim();
      if (!name) return;

      const seconds = clampNumber(args.SECONDS, 0);
      if (seconds <= 0) return;

      const started = startAnimation(target, state, name, true);
      if (!started) return;

      await new Promise(resolve => setTimeout(resolve, seconds * 1000));

      // Only stop if this same animation is still the current one.
      // If something else interrupted it during the wait, do nothing.
      if (state.currentAnimation === name && (state.playing || state.paused || state.finished)) {
        stopCurrentAnimation(state);
      }
    }

    restartAnimation(args, util) {
      const target = util.target;
      const state = getTargetState(target);
      if (!state) return;

      const name = String(args.NAME || '').trim();
      if (!name) return;

      startAnimation(target, state, name, true);
    }

    stopAnimation(args, util) {
      const state = getTargetState(util.target);
      if (!state) return;
      if (!state.currentAnimation) return;
      stopCurrentAnimation(state);
    }

    pauseAnimation(args, util) {
      const state = getTargetState(util.target);
      if (!state) return;
      if (!state.playing) return;
      if (state.paused) return;

      state.paused = true;
      state.lastUpdate = Date.now();
    }

    resumeAnimation(args, util) {
      const state = getTargetState(util.target);
      if (!state) return;
      if (!state.currentAnimation) return;
      if (!state.paused) return;

      state.paused = false;
      state.playing = true;
      state.lastUpdate = Date.now();
    }

    currentAnimation(args, util) {
      const state = getTargetState(util.target);
      if (!state) return '';
      return state.currentAnimation || '';
    }

    animationExists(args, util) {
      const state = getTargetState(util.target);
      if (!state) return false;

      const name = String(args.NAME || '').trim();
      if (!name) return false;

      return !!state.animations[name];
    }

    animationIsPlaying(args, util) {
      const state = getTargetState(util.target);
      if (!state) return false;
      return !!state.playing;
    }

    animationIsPaused(args, util) {
      const state = getTargetState(util.target);
      if (!state) return false;
      return !!state.paused;
    }

    animationIsFinished(args, util) {
      const state = getTargetState(util.target);
      if (!state) return false;
      return !!state.finished;
    }

    currentAnimationFrame(args, util) {
      const state = getTargetState(util.target);
      if (!state) return 0;
      if (!state.currentAnimation) return 0;
      return state.currentFrame + 1;
    }
  }

  Scratch.extensions.register(new FactoryAnimation());
})(Scratch);