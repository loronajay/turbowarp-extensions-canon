class FactoryStats {
    constructor(runtime) {
        this.runtime = runtime;
        this.stats = new Map();

        runtime.on("PROJECT_START", () => {
            this.stats.clear();
        });
    }

    getInfo() {
        return {
            id: "factorystats",
            name: "Factory Stats",
            blocks: [
                {
                    opcode: "setStat",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "set stat [STAT] of [TARGET] to [VALUE]",
                    arguments: {
                        STAT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "HP"
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        },
                        VALUE: {
                            type: Scratch.ArgumentType.NUMBER,
                            defaultValue: 100
                        }
                    }
                },
                {
                    opcode: "changeStat",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "change stat [STAT] of [TARGET] by [AMOUNT]",
                    arguments: {
                        STAT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "HP"
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        },
                        AMOUNT: {
                            type: Scratch.ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: "clearStat",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "clear stat [STAT] of [TARGET]",
                    arguments: {
                        STAT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "HP"
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        }
                    }
                },
                {
                    opcode: "clearAllStatsOfTarget",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "clear all stats of [TARGET]",
                    arguments: {
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        }
                    }
                },
                {
                    opcode: "clearAllData",
                    blockType: Scratch.BlockType.COMMAND,
                    text: "clear all factory stats data"
                },
                {
                    opcode: "getStat",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "stat [STAT] of [TARGET]",
                    arguments: {
                        STAT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "HP"
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        }
                    }
                },
                {
                    opcode: "getStatElse",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "stat [STAT] of [TARGET] else [DEFAULT]",
                    arguments: {
                        STAT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "HP"
                        },
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        },
                        DEFAULT: {
                            type: Scratch.ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: "hasStat",
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: "[TARGET] has stat [STAT]?",
                    arguments: {
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        },
                        STAT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "HP"
                        }
                    }
                },
                {
                    opcode: "hasAnyStats",
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: "[TARGET] has any stats?",
                    arguments: {
                        TARGET: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: "Player"
                        }
                    }
                }
            ]
        };
    }

    _getTargetMap(targetName) {
        const key = String(targetName);
        if (!this.stats.has(key)) {
            this.stats.set(key, new Map());
        }
        return this.stats.get(key);
    }

    _toNumber(value) {
        const n = Number(value);
        return Number.isNaN(n) ? 0 : n;
    }

    setStat(args) {
        const stat = String(args.STAT);
        const target = String(args.TARGET);
        const value = this._toNumber(args.VALUE);

        const map = this._getTargetMap(target);
        map.set(stat, value);
    }

    changeStat(args) {
        const stat = String(args.STAT);
        const target = String(args.TARGET);
        const amount = this._toNumber(args.AMOUNT);

        const map = this._getTargetMap(target);
        const current = map.has(stat) ? map.get(stat) : 0;
        map.set(stat, current + amount);
    }

    clearStat(args) {
        const stat = String(args.STAT);
        const target = String(args.TARGET);

        const map = this.stats.get(target);
        if (!map) return;

        map.delete(stat);

        if (map.size === 0) {
            this.stats.delete(target);
        }
    }

    clearAllStatsOfTarget(args) {
        const target = String(args.TARGET);
        this.stats.delete(target);
    }

    clearAllData() {
        this.stats.clear();
    }

    getStat(args) {
        const stat = String(args.STAT);
        const target = String(args.TARGET);

        const map = this.stats.get(target);
        if (!map) return 0;

        return map.has(stat) ? map.get(stat) : 0;
    }

    getStatElse(args) {
        const stat = String(args.STAT);
        const target = String(args.TARGET);
        const fallback = args.DEFAULT;

        const map = this.stats.get(target);
        if (!map) return fallback;

        return map.has(stat) ? map.get(stat) : fallback;
    }

    hasStat(args) {
        const stat = String(args.STAT);
        const target = String(args.TARGET);

        const map = this.stats.get(target);
        if (!map) return false;

        return map.has(stat);
    }

    hasAnyStats(args) {
        const target = String(args.TARGET);

        const map = this.stats.get(target);
        return !!(map && map.size > 0);
    }
}

Scratch.extensions.register(new FactoryStats(Scratch.vm.runtime));