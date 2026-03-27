class FactoryDJ {
    constructor(runtime) {
        this.runtime = runtime;
        this.playlists = new Map(); // name → { tracks: string[], mode: string, volume: number }
        this.masterVolume = 100;
        this.activePlaylistName = null;
        this.playbackState = 'stopped'; // 'stopped' | 'playing' | 'paused'
        this.activeTrackIndex = null; // 1-based, null when stopped
        this.queuedTrackName = null; // one-shot next-track override
        this._playSession = 0; // incremented on every kill; invalidates stale finished() callbacks
        this._currentPlayer = null; // active SoundPlayer, null when stopped/paused

        runtime.on('PROJECT_START', () => this._reset());
    }

    _reset() {
        this._killCurrentPlayer();
        this.playlists.clear();
        this.masterVolume = 100;
        this.activePlaylistName = null;
        this.playbackState = 'stopped';
        this.activeTrackIndex = null;
        this.queuedTrackName = null;
    }

    _getPlaylist(name) {
        return this.playlists.get(String(name)) || null;
    }

    _clampVolume(value) {
        const n = Number(value);
        if (Number.isNaN(n)) return 0;
        return Math.max(0, Math.min(100, n));
    }

    _killCurrentPlayer() {
        this._playSession++;
        if (this._currentPlayer) {
            this._currentPlayer.stop();
            this._currentPlayer = null;
        }
    }

    _stopActive() {
        this._killCurrentPlayer();
        this.activePlaylistName = null;
        this.playbackState = 'stopped';
        this.activeTrackIndex = null;
        this.queuedTrackName = null;
    }

    _findSound(name) {
        for (const target of this.runtime.targets) {
            const sounds = target.sprite?.sounds;
            if (!sounds) continue;
            const sound = sounds.find(s => s.name === name);
            if (sound) return { soundId: sound.soundId, target };
        }
        return null;
    }

    async _startTrack() {
        const session = this._playSession;
        if (!this.activePlaylistName || this.activeTrackIndex === null) return;
        const pl = this._getPlaylist(this.activePlaylistName);
        if (!pl) return;

        const soundName = pl.tracks[this.activeTrackIndex - 1];
        const found = this._findSound(soundName);
        if (!found) return;

        const { soundId, target } = found;
        const soundBank = target.sprite?.soundBank;
        if (!soundBank) return;

        const playFinished = soundBank.playSound(target, soundId);
        this._currentPlayer = soundBank.soundPlayers?.[soundId] || null;

        if (playFinished && typeof playFinished.then === 'function') {
            try { await playFinished; } catch (_) {}
        }

        if (this._playSession !== session) return;

        this._advanceState();
        if (this.playbackState === 'playing') {
            this._startTrack();
        }
    }

    // Pure state advance — shared by internal auto-advance and public nextTrack block.
    _advanceState() {
        if (this.playbackState === 'stopped' || !this.activePlaylistName) return;
        const pl = this._getPlaylist(this.activePlaylistName);
        if (!pl) return;

        if (this.queuedTrackName !== null) {
            const idx = pl.tracks.indexOf(this.queuedTrackName);
            this.queuedTrackName = null;
            if (idx !== -1) {
                this.activeTrackIndex = idx + 1;
                return;
            }
        }

        const mode = pl.mode;
        if (mode === 'repeat-one') {
            // stay on current track
        } else if (mode === 'shuffle') {
            this.activeTrackIndex = Math.floor(Math.random() * pl.tracks.length) + 1;
        } else if (this.activeTrackIndex >= pl.tracks.length) {
            if (mode === 'repeat-all') {
                this.activeTrackIndex = 1;
            } else {
                this._stopActive();
            }
        } else {
            this.activeTrackIndex++;
        }
    }

    getInfo() {
        return {
            id: 'factorydj',
            name: 'Factory DJ',
            color1: '#C2185B',
            color2: '#8E0038',

            blocks: [
                // --- PLAYLIST MANAGEMENT ---
                { opcode: 'createPlaylist', blockType: Scratch.BlockType.COMMAND, text: 'create playlist [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'deletePlaylist', blockType: Scratch.BlockType.COMMAND, text: 'delete playlist [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'clearPlaylist', blockType: Scratch.BlockType.COMMAND, text: 'clear playlist [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'playlistExists', blockType: Scratch.BlockType.BOOLEAN, text: 'playlist exists? [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },

                { opcode: 'addSound', blockType: Scratch.BlockType.COMMAND, text: 'add sound [SOUND] to playlist [NAME]', arguments: { SOUND: { type: Scratch.ArgumentType.STRING, defaultValue: 'track1' }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'insertSound', blockType: Scratch.BlockType.COMMAND, text: 'insert sound [SOUND] at [INDEX] in playlist [NAME]', arguments: { SOUND: { type: Scratch.ArgumentType.STRING, defaultValue: 'track1' }, INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'removeTrack', blockType: Scratch.BlockType.COMMAND, text: 'remove track [INDEX] from playlist [NAME]', arguments: { INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'moveTrack', blockType: Scratch.BlockType.COMMAND, text: 'move track [FROM] to [TO] in playlist [NAME]', arguments: { FROM: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, TO: { type: Scratch.ArgumentType.NUMBER, defaultValue: 2 }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },

                // --- PLAYBACK ---
                { opcode: 'playPlaylist', blockType: Scratch.BlockType.COMMAND, text: 'play playlist [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'playTrackByName', blockType: Scratch.BlockType.COMMAND, text: 'play track [SOUND] from playlist [NAME]', arguments: { SOUND: { type: Scratch.ArgumentType.STRING, defaultValue: 'track1' }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'playTrackByIndex', blockType: Scratch.BlockType.COMMAND, text: 'play track # [INDEX] from playlist [NAME]', arguments: { INDEX: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'queueTrack', blockType: Scratch.BlockType.COMMAND, text: 'queue track [SOUND] in playlist [NAME]', arguments: { SOUND: { type: Scratch.ArgumentType.STRING, defaultValue: 'track2' }, NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },

                { opcode: 'stopPlaylist', blockType: Scratch.BlockType.COMMAND, text: 'stop playlist [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'stopTrack', blockType: Scratch.BlockType.COMMAND, text: 'stop track [SOUND]', arguments: { SOUND: { type: Scratch.ArgumentType.STRING, defaultValue: 'track1' } } },
                { opcode: 'pausePlaylist', blockType: Scratch.BlockType.COMMAND, text: 'pause playlist' },
                { opcode: 'resumePlaylist', blockType: Scratch.BlockType.COMMAND, text: 'resume playlist' },

                { opcode: 'nextTrack', blockType: Scratch.BlockType.COMMAND, text: 'play next track' },
                { opcode: 'previousTrack', blockType: Scratch.BlockType.COMMAND, text: 'play previous track' },
                { opcode: 'restartTrack', blockType: Scratch.BlockType.COMMAND, text: 'restart current track' },

                // --- SETTINGS ---
                {
                    opcode: 'setPlaylistMode',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set playlist [NAME] mode to [MODE]',
                    arguments: {
                        NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' },
                        MODE: { type: Scratch.ArgumentType.STRING, menu: 'modes' }
                    }
                },
                { opcode: 'setMasterVolume', blockType: Scratch.BlockType.COMMAND, text: 'set master DJ volume to [VALUE]', arguments: { VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 } } },
                { opcode: 'setPlaylistVolume', blockType: Scratch.BlockType.COMMAND, text: 'set playlist [NAME] volume to [VALUE]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' }, VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 } } },

                // --- REPORTERS ---
                { opcode: 'currentPlaylist', blockType: Scratch.BlockType.REPORTER, text: 'current playlist' },
                { opcode: 'currentTrackName', blockType: Scratch.BlockType.REPORTER, text: 'current track name' },
                { opcode: 'currentTrackIndex', blockType: Scratch.BlockType.REPORTER, text: 'current track #' },
                { opcode: 'playlistLength', blockType: Scratch.BlockType.REPORTER, text: 'playlist length [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'playlistMode', blockType: Scratch.BlockType.REPORTER, text: 'playlist mode of [NAME]', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' } } },
                { opcode: 'allPlaylists', blockType: Scratch.BlockType.REPORTER, text: 'all playlists' },

                { opcode: 'isPlaying', blockType: Scratch.BlockType.BOOLEAN, text: 'is playlist playing?' },
                { opcode: 'isPaused', blockType: Scratch.BlockType.BOOLEAN, text: 'is playlist paused?' },
                { opcode: 'playlistContains', blockType: Scratch.BlockType.BOOLEAN, text: 'playlist [NAME] contains sound [SOUND]?', arguments: { NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'Music' }, SOUND: { type: Scratch.ArgumentType.STRING, defaultValue: 'track1' } } }
            ],

            menus: {
                modes: {
                    acceptReporters: true,
                    items: ['sequential', 'shuffle', 'repeat-one', 'repeat-all']
                }
            }
        };
    }

    // --- PLAYLIST MANAGEMENT ---

    createPlaylist(args) {
        const name = String(args.NAME);
        if (!this.playlists.has(name)) {
            this.playlists.set(name, { tracks: [], mode: 'sequential', volume: 100 });
        }
    }

    deletePlaylist(args) {
        const name = String(args.NAME);
        if (this.activePlaylistName === name) {
            this._stopActive();
        }
        this.playlists.delete(name);
    }

    clearPlaylist(args) {
        const name = String(args.NAME);
        const pl = this._getPlaylist(name);
        if (!pl) return;
        pl.tracks = [];
        if (this.activePlaylistName === name) {
            this._stopActive();
        }
    }

    playlistExists(args) {
        return this.playlists.has(String(args.NAME));
    }

    addSound(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return;
        pl.tracks.push(String(args.SOUND));
    }

    insertSound(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return;
        const name = String(args.NAME);
        const sound = String(args.SOUND);
        const index = Math.max(1, Math.min(pl.tracks.length + 1, Math.round(Number(args.INDEX))));
        pl.tracks.splice(index - 1, 0, sound);
        if (this.activePlaylistName === name && this.activeTrackIndex !== null) {
            if (index <= this.activeTrackIndex) {
                this.activeTrackIndex++;
            }
        }
    }

    removeTrack(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return;
        const name = String(args.NAME);
        const index = Math.round(Number(args.INDEX));
        if (index < 1 || index > pl.tracks.length) return;
        pl.tracks.splice(index - 1, 1);
        if (this.activePlaylistName === name && this.activeTrackIndex !== null) {
            if (index < this.activeTrackIndex) {
                this.activeTrackIndex--;
            } else if (index === this.activeTrackIndex) {
                this._stopActive();
            }
        }
    }

    moveTrack(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return;
        const name = String(args.NAME);
        const from = Math.round(Number(args.FROM));
        const to = Math.round(Number(args.TO));
        if (from < 1 || from > pl.tracks.length) return;
        if (to < 1 || to > pl.tracks.length) return;
        if (from === to) return;
        const [track] = pl.tracks.splice(from - 1, 1);
        pl.tracks.splice(to - 1, 0, track);
        if (this.activePlaylistName === name && this.activeTrackIndex !== null) {
            const idx = this.activeTrackIndex;
            if (idx === from) {
                this.activeTrackIndex = to;
            } else if (from < to && idx > from && idx <= to) {
                this.activeTrackIndex--;
            } else if (from > to && idx >= to && idx < from) {
                this.activeTrackIndex++;
            }
        }
    }

    // --- PLAYBACK ---

    playPlaylist(args) {
        const name = String(args.NAME);
        const pl = this._getPlaylist(name);
        if (!pl || pl.tracks.length === 0) return;
        this._killCurrentPlayer();
        this.activePlaylistName = name;
        this.playbackState = 'playing';
        this.activeTrackIndex = 1;
        this.queuedTrackName = null;
        this._startTrack();
    }

    playTrackByName(args) {
        const name = String(args.NAME);
        const sound = String(args.SOUND);
        const pl = this._getPlaylist(name);
        if (!pl) return;
        const idx = pl.tracks.indexOf(sound);
        if (idx === -1) return;
        this._killCurrentPlayer();
        this.activePlaylistName = name;
        this.playbackState = 'playing';
        this.activeTrackIndex = idx + 1;
        this.queuedTrackName = null;
        this._startTrack();
    }

    playTrackByIndex(args) {
        const name = String(args.NAME);
        const index = Math.round(Number(args.INDEX));
        const pl = this._getPlaylist(name);
        if (!pl) return;
        if (index < 1 || index > pl.tracks.length) return;
        this._killCurrentPlayer();
        this.activePlaylistName = name;
        this.playbackState = 'playing';
        this.activeTrackIndex = index;
        this.queuedTrackName = null;
        this._startTrack();
    }

    queueTrack(args) {
        const name = String(args.NAME);
        const sound = String(args.SOUND);
        const pl = this._getPlaylist(name);
        if (!pl || !pl.tracks.includes(sound)) return;
        this.queuedTrackName = sound;
    }

    stopPlaylist(args) {
        if (this.activePlaylistName !== String(args.NAME)) return;
        this._stopActive();
    }

    stopTrack(args) {
        if (this.activePlaylistName === null || this.activeTrackIndex === null) return;
        const pl = this._getPlaylist(this.activePlaylistName);
        if (!pl) return;
        if (pl.tracks[this.activeTrackIndex - 1] === String(args.SOUND)) {
            this._stopActive();
        }
    }

    pausePlaylist() {
        if (this.playbackState !== 'playing') return;
        this._killCurrentPlayer();
        this.playbackState = 'paused';
        // Phase 4: record offset here for sample-accurate resume
    }

    resumePlaylist() {
        if (this.playbackState !== 'paused') return;
        this.playbackState = 'playing';
        this._startTrack(); // Phase 4: start from saved offset instead of beginning
    }

    nextTrack() {
        if (this.playbackState === 'stopped' || !this.activePlaylistName) return;
        this._killCurrentPlayer();
        this._advanceState();
        if (this.playbackState === 'playing') {
            this._startTrack();
        }
    }

    previousTrack() {
        if (this.playbackState === 'stopped' || !this.activePlaylistName) return;
        this._killCurrentPlayer();
        const pl = this._getPlaylist(this.activePlaylistName);
        if (!pl) return;
        if (this.activeTrackIndex > 1) {
            this.activeTrackIndex--;
        } else if (pl.mode === 'repeat-all') {
            this.activeTrackIndex = pl.tracks.length;
        }
        if (this.playbackState === 'playing') {
            this._startTrack();
        }
    }

    restartTrack() {
        if (this.playbackState !== 'playing') return;
        this._killCurrentPlayer();
        this._startTrack(); // Phase 4: start from offset 0 explicitly
    }

    // --- SETTINGS ---

    setPlaylistMode(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return;
        const mode = String(args.MODE);
        if (['sequential', 'shuffle', 'repeat-one', 'repeat-all'].includes(mode)) {
            pl.mode = mode;
        }
    }

    setMasterVolume(args) {
        this.masterVolume = this._clampVolume(args.VALUE);
    }

    setPlaylistVolume(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return;
        pl.volume = this._clampVolume(args.VALUE);
    }

    // --- REPORTERS ---

    currentPlaylist() {
        return this.activePlaylistName || '';
    }

    currentTrackName() {
        if (!this.activePlaylistName || this.activeTrackIndex === null) return '';
        const pl = this._getPlaylist(this.activePlaylistName);
        if (!pl) return '';
        return pl.tracks[this.activeTrackIndex - 1] || '';
    }

    currentTrackIndex() {
        return this.activeTrackIndex !== null ? this.activeTrackIndex : 0;
    }

    playlistLength(args) {
        const pl = this._getPlaylist(args.NAME);
        return pl ? pl.tracks.length : 0;
    }

    playlistMode(args) {
        const pl = this._getPlaylist(args.NAME);
        return pl ? pl.mode : '';
    }

    allPlaylists() {
        return Array.from(this.playlists.keys()).join(', ');
    }

    isPlaying() {
        return this.playbackState === 'playing';
    }

    isPaused() {
        return this.playbackState === 'paused';
    }

    playlistContains(args) {
        const pl = this._getPlaylist(args.NAME);
        if (!pl) return false;
        return pl.tracks.includes(String(args.SOUND));
    }
}

Scratch.extensions.register(new FactoryDJ(Scratch.vm.runtime));
