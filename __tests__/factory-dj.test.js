const { loadExtension } = require('./helpers/load-extension');

// --- Audio mock helpers ---

function makeMockPlayer() {
    let resolve = null;
    // Each play() creates a fresh Promise so repeat-one doesn't get an already-resolved one
    const player = {
        play: jest.fn(() => {
            const p = new Promise(r => { resolve = r; });
            return p;
        }),
        stop: jest.fn(() => { if (resolve) { resolve(); resolve = null; } }),
        _finish: () => { if (resolve) { resolve(); resolve = null; } }
    };
    return player;
}

function makeMockTarget(soundNames) {
    // Use a plain object to mirror TurboWarp's soundPlayers (not a Map)
    const soundPlayers = {};
    soundNames.forEach(name => { soundPlayers[`id-${name}`] = makeMockPlayer(); });

    const soundBank = {
        // playSound calls player.play() on the existing player and returns its Promise —
        // mirroring real scratch-audio where soundPlayers is populated by playSound
        playSound: jest.fn((_target, soundId) => {
            const player = soundPlayers[soundId];
            if (!player) return Promise.resolve();
            return player.play();
        }),
        soundPlayers
    };
    return {
        sprite: {
            sounds: soundNames.map(name => ({ name, soundId: `id-${name}` })),
            soundBank
        },
        _player: name => soundPlayers[`id-${name}`]
    };
}

// Flush all pending microtasks (enough for one chained await)
const tick = () => new Promise(r => setTimeout(r, 0));

describe('Factory DJ', () => {
    // --- PLAYLIST CRUD ---

    describe('playlist CRUD', () => {
        test('createPlaylist creates a playlist with defaults', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            expect(extension.playlistExists({ NAME: 'Music' })).toBe(true);
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(0);
            expect(extension.playlistMode({ NAME: 'Music' })).toBe('sequential');
        });

        test('createPlaylist is idempotent', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.createPlaylist({ NAME: 'Music' });
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(1);
        });

        test('deletePlaylist removes the playlist', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.deletePlaylist({ NAME: 'Music' });
            expect(extension.playlistExists({ NAME: 'Music' })).toBe(false);
        });

        test('deletePlaylist of active playlist stops playback', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            expect(extension.isPlaying()).toBe(true);
            extension.deletePlaylist({ NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
            expect(extension.currentPlaylist()).toBe('');
        });

        test('clearPlaylist empties tracks', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.addSound({ SOUND: 'track2', NAME: 'Music' });
            extension.clearPlaylist({ NAME: 'Music' });
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(0);
            expect(extension.playlistExists({ NAME: 'Music' })).toBe(true);
        });

        test('clearPlaylist of active playlist stops playback', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.clearPlaylist({ NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
            expect(extension.currentTrackIndex()).toBe(0);
        });

        test('playlistExists returns false for unknown playlist', () => {
            const { extension } = loadExtension('factory-dj.js');
            expect(extension.playlistExists({ NAME: 'Nope' })).toBe(false);
        });
    });

    // --- TRACK MANAGEMENT ---

    describe('track management', () => {
        test('addSound appends to the playlist', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'b', NAME: 'Music' });
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(2);
            expect(extension.playlistContains({ NAME: 'Music', SOUND: 'b' })).toBe(true);
        });

        test('addSound on nonexistent playlist is a no-op', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.addSound({ SOUND: 'a', NAME: 'Ghost' });
            expect(extension.playlistExists({ NAME: 'Ghost' })).toBe(false);
        });

        test('insertSound inserts at 1-based index', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'c', NAME: 'Music' });
            extension.insertSound({ SOUND: 'b', INDEX: 2, NAME: 'Music' });
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(3);
            // verify order by playing each index
            extension.playTrackByIndex({ INDEX: 2, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('b');
        });

        test('insertSound clamps below 1 to position 1', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.insertSound({ SOUND: 'x', INDEX: -5, NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 1, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('x');
        });

        test('insertSound clamps above length+1 to append', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.insertSound({ SOUND: 'z', INDEX: 99, NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 2, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('z');
        });

        test('insertSound before active track adjusts activeTrackIndex', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'b', NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 2, NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(2);
            extension.insertSound({ SOUND: 'x', INDEX: 1, NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(3);
            expect(extension.currentTrackName()).toBe('b');
        });

        test('insertSound after active track does not change activeTrackIndex', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'b', NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 1, NAME: 'Music' });
            extension.insertSound({ SOUND: 'x', INDEX: 2, NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(1);
            expect(extension.currentTrackName()).toBe('a');
        });

        test('removeTrack removes by 1-based index', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'b', NAME: 'Music' });
            extension.removeTrack({ INDEX: 1, NAME: 'Music' });
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(1);
            expect(extension.playlistContains({ NAME: 'Music', SOUND: 'a' })).toBe(false);
        });

        test('removeTrack out of bounds is a no-op', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.removeTrack({ INDEX: 5, NAME: 'Music' });
            expect(extension.playlistLength({ NAME: 'Music' })).toBe(1);
        });

        test('removeTrack of active track stops playback', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'b', NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 1, NAME: 'Music' });
            extension.removeTrack({ INDEX: 1, NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
            expect(extension.currentTrackIndex()).toBe(0);
        });

        test('removeTrack before active track adjusts activeTrackIndex', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.addSound({ SOUND: 'b', NAME: 'Music' });
            extension.addSound({ SOUND: 'c', NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 3, NAME: 'Music' });
            extension.removeTrack({ INDEX: 1, NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(2);
            expect(extension.currentTrackName()).toBe('c');
        });

        test('moveTrack moves forward correctly', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c', 'd'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.moveTrack({ FROM: 1, TO: 3, NAME: 'Music' });
            // expected: [b, c, a, d]
            extension.playTrackByIndex({ INDEX: 1, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('b');
            extension.playTrackByIndex({ INDEX: 3, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('a');
        });

        test('moveTrack moves backward correctly', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c', 'd'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.moveTrack({ FROM: 3, TO: 1, NAME: 'Music' });
            // expected: [c, a, b, d]
            extension.playTrackByIndex({ INDEX: 1, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('c');
            extension.playTrackByIndex({ INDEX: 2, NAME: 'Music' });
            expect(extension.currentTrackName()).toBe('a');
        });

        test('moveTrack updates activeTrackIndex when active track moves', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playTrackByIndex({ INDEX: 1, NAME: 'Music' });
            extension.moveTrack({ FROM: 1, TO: 3, NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(3);
            expect(extension.currentTrackName()).toBe('a');
        });

        test('moveTrack updates activeTrackIndex when displaced by forward move', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c', 'd'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playTrackByIndex({ INDEX: 3, NAME: 'Music' }); // playing 'c'
            extension.moveTrack({ FROM: 1, TO: 3, NAME: 'Music' }); // [b, c, a, d] → 'c' shifts to index 2
            expect(extension.currentTrackIndex()).toBe(2);
            expect(extension.currentTrackName()).toBe('c');
        });
    });

    // --- PLAYBACK STATE MACHINE ---

    describe('playback state machine', () => {
        test('playPlaylist starts playing at index 1', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            expect(extension.isPlaying()).toBe(true);
            expect(extension.currentPlaylist()).toBe('Music');
            expect(extension.currentTrackIndex()).toBe(1);
            expect(extension.currentTrackName()).toBe('track1');
        });

        test('playPlaylist on empty playlist does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
        });

        test('playPlaylist on nonexistent playlist does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.playPlaylist({ NAME: 'Ghost' });
            expect(extension.isPlaying()).toBe(false);
        });

        test('playTrackByName starts at the correct index', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playTrackByName({ SOUND: 'b', NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(2);
            expect(extension.currentTrackName()).toBe('b');
        });

        test('playTrackByName for nonexistent sound does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playTrackByName({ SOUND: 'nope', NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
        });

        test('playTrackByIndex starts at correct index', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playTrackByIndex({ INDEX: 3, NAME: 'Music' });
            expect(extension.currentTrackIndex()).toBe(3);
            expect(extension.currentTrackName()).toBe('c');
        });

        test('playTrackByIndex out of bounds does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playTrackByIndex({ INDEX: 5, NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
        });

        test('stopPlaylist clears all active state', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.stopPlaylist({ NAME: 'Music' });
            expect(extension.isPlaying()).toBe(false);
            expect(extension.currentPlaylist()).toBe('');
            expect(extension.currentTrackIndex()).toBe(0);
            expect(extension.currentTrackName()).toBe('');
        });

        test('stopPlaylist with wrong name is a no-op', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.stopPlaylist({ NAME: 'SFX' });
            expect(extension.isPlaying()).toBe(true);
        });

        test('stopTrack stops if named sound is currently playing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.stopTrack({ SOUND: 'track1' });
            expect(extension.isPlaying()).toBe(false);
        });

        test('stopTrack does nothing if named sound is not currently playing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.stopTrack({ SOUND: 'other' });
            expect(extension.isPlaying()).toBe(true);
        });

        test('pausePlaylist pauses, resumePlaylist resumes', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.pausePlaylist();
            expect(extension.isPlaying()).toBe(false);
            expect(extension.isPaused()).toBe(true);
            extension.resumePlaylist();
            expect(extension.isPlaying()).toBe(true);
            expect(extension.isPaused()).toBe(false);
        });

        test('pausePlaylist when stopped does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.pausePlaylist();
            expect(extension.isPaused()).toBe(false);
        });

        test('resumePlaylist when stopped does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.resumePlaylist();
            expect(extension.isPlaying()).toBe(false);
        });

        test('nextTrack advances in sequential mode', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            extension.nextTrack();
            expect(extension.currentTrackIndex()).toBe(2);
            expect(extension.currentTrackName()).toBe('b');
        });

        test('nextTrack at end of sequential playlist stops playback', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'only', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.nextTrack();
            expect(extension.isPlaying()).toBe(false);
        });

        test('nextTrack wraps in repeat-all mode', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'repeat-all' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.nextTrack();
            extension.nextTrack();
            expect(extension.currentTrackIndex()).toBe(1);
        });

        test('nextTrack stays on same track in repeat-one mode', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'repeat-one' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.nextTrack();
            expect(extension.currentTrackIndex()).toBe(1);
        });

        test('nextTrack when stopped does nothing', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.nextTrack();
            expect(extension.isPlaying()).toBe(false);
        });

        test('previousTrack goes back one', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playTrackByIndex({ INDEX: 3, NAME: 'Music' });
            extension.previousTrack();
            expect(extension.currentTrackIndex()).toBe(2);
        });

        test('previousTrack at first track does nothing in sequential mode', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            extension.previousTrack();
            expect(extension.currentTrackIndex()).toBe(1);
        });

        test('previousTrack at first track wraps in repeat-all mode', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'repeat-all' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.previousTrack();
            expect(extension.currentTrackIndex()).toBe(3);
        });

        test('queueTrack consumed by nextTrack', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' }); // playing 'a' at index 1
            extension.queueTrack({ SOUND: 'c', NAME: 'Music' });
            extension.nextTrack();
            expect(extension.currentTrackName()).toBe('c');
            expect(extension.currentTrackIndex()).toBe(3);
        });

        test('queueTrack is consumed once only', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            extension.queueTrack({ SOUND: 'c', NAME: 'Music' });
            extension.nextTrack(); // consumes queue → 'c'
            extension.nextTrack(); // no queue, sequential from index 3 → stops
            expect(extension.isPlaying()).toBe(false);
        });

        test('queueTrack with nonexistent sound is a no-op', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.queueTrack({ SOUND: 'nope', NAME: 'Music' });
            extension.nextTrack();
            expect(extension.isPlaying()).toBe(false); // sequential end
        });
    });

    // --- SETTINGS ---

    describe('settings', () => {
        test('setPlaylistMode updates mode', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'repeat-all' });
            expect(extension.playlistMode({ NAME: 'Music' })).toBe('repeat-all');
        });

        test('setPlaylistMode with invalid value is a no-op', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'invalid' });
            expect(extension.playlistMode({ NAME: 'Music' })).toBe('sequential');
        });

        test('setMasterVolume clamps to 0-100', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.setMasterVolume({ VALUE: 150 });
            expect(extension.masterVolume).toBe(100);
            extension.setMasterVolume({ VALUE: -10 });
            expect(extension.masterVolume).toBe(0);
            extension.setMasterVolume({ VALUE: 75 });
            expect(extension.masterVolume).toBe(75);
        });

        test('setPlaylistVolume clamps to 0-100', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.setPlaylistVolume({ NAME: 'Music', VALUE: 200 });
            expect(extension.playlists.get('Music').volume).toBe(100);
            extension.setPlaylistVolume({ NAME: 'Music', VALUE: 50 });
            expect(extension.playlists.get('Music').volume).toBe(50);
        });
    });

    // --- ALL PLAYLISTS REPORTER ---

    describe('allPlaylists', () => {
        test('returns empty string when no playlists exist', () => {
            const { extension } = loadExtension('factory-dj.js');
            expect(extension.allPlaylists()).toBe('');
        });

        test('returns comma-separated playlist names', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.createPlaylist({ NAME: 'SFX' });
            extension.createPlaylist({ NAME: 'Ambience' });
            expect(extension.allPlaylists()).toBe('Music, SFX, Ambience');
        });

        test('reflects deletions', () => {
            const { extension } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.createPlaylist({ NAME: 'SFX' });
            extension.deletePlaylist({ NAME: 'Music' });
            expect(extension.allPlaylists()).toBe('SFX');
        });
    });

    // --- RESET ---

    describe('reset on PROJECT_START', () => {
        test('clears all playlists and resets state', () => {
            const { extension, runtime } = loadExtension('factory-dj.js');
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.setMasterVolume({ VALUE: 42 });

            runtime.emit('PROJECT_START');

            expect(extension.playlistExists({ NAME: 'Music' })).toBe(false);
            expect(extension.isPlaying()).toBe(false);
            expect(extension.currentPlaylist()).toBe('');
            expect(extension.masterVolume).toBe(100);
        });
    });

    // --- AUDIO PLAYBACK ---

    describe('audio playback', () => {
        test('playPlaylist calls soundBank.playSound with correct target and soundId', () => {
            const target = makeMockTarget(['track1', 'track2']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'track1', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            expect(target.sprite.soundBank.playSound).toHaveBeenCalledWith(target, 'id-track1');
        });

        test('on natural completion, auto-advances and plays next track', async () => {
            const target = makeMockTarget(['a', 'b', 'c']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });

            target._player('a')._finish();
            await tick();

            expect(extension.currentTrackIndex()).toBe(2);
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-b');
        });

        test('on last track completion in sequential mode, stops', async () => {
            const target = makeMockTarget(['only']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'only', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });

            target._player('only')._finish();
            await tick();

            expect(extension.isPlaying()).toBe(false);
            expect(extension.currentPlaylist()).toBe('');
        });

        test('on last track completion in repeat-all mode, wraps to first track', async () => {
            const target = makeMockTarget(['a', 'b']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'repeat-all' });
            extension.playPlaylist({ NAME: 'Music' });

            target._player('a')._finish();
            await tick();
            target._player('b')._finish();
            await tick();

            expect(extension.currentTrackIndex()).toBe(1);
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-a');
        });

        test('on track completion in repeat-one mode, replays same track', async () => {
            const target = makeMockTarget(['a', 'b']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.setPlaylistMode({ NAME: 'Music', MODE: 'repeat-one' });
            extension.playPlaylist({ NAME: 'Music' });

            target._player('a')._finish();
            await tick();

            expect(extension.currentTrackIndex()).toBe(1);
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-a');
        });

        test('queued track is consumed on auto-advance', async () => {
            const target = makeMockTarget(['a', 'b', 'c']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            extension.queueTrack({ SOUND: 'c', NAME: 'Music' });

            target._player('a')._finish();
            await tick();

            expect(extension.currentTrackIndex()).toBe(3);
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-c');
        });

        test('stopPlaylist stops the current player', () => {
            const target = makeMockTarget(['a']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.stopPlaylist({ NAME: 'Music' });
            expect(target._player('a').stop).toHaveBeenCalled();
            expect(extension.isPlaying()).toBe(false);
        });

        test('stopPlaylist prevents finished() from auto-advancing', async () => {
            const target = makeMockTarget(['a', 'b']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            extension.stopPlaylist({ NAME: 'Music' }); // stop() triggers finished() resolution
            await tick();
            expect(extension.isPlaying()).toBe(false);
            expect(target.sprite.soundBank.playSound).toHaveBeenCalledTimes(1); // no second play
        });

        test('nextTrack (manual) stops current player and starts next', async () => {
            const target = makeMockTarget(['a', 'b']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            extension.nextTrack();
            expect(target._player('a').stop).toHaveBeenCalled();
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-b');
        });

        test('previousTrack (manual) stops current player and starts previous', () => {
            const target = makeMockTarget(['a', 'b', 'c']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b', 'c'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playTrackByIndex({ INDEX: 3, NAME: 'Music' });
            extension.previousTrack();
            expect(target._player('c').stop).toHaveBeenCalled();
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-b');
        });

        test('pausePlaylist stops the player, resumePlaylist replays from start', () => {
            const target = makeMockTarget(['a']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'a', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            extension.pausePlaylist();
            expect(target._player('a').stop).toHaveBeenCalled();
            expect(extension.isPaused()).toBe(true);
            extension.resumePlaylist();
            expect(extension.isPlaying()).toBe(true);
            expect(target.sprite.soundBank.playSound).toHaveBeenCalledTimes(2); // initial + resume
        });

        test('restartTrack replays the current track', () => {
            const target = makeMockTarget(['a', 'b']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' });
            const playerBeforeRestart = target._player('a'); // capture before restart creates a new one
            extension.restartTrack();
            expect(playerBeforeRestart.stop).toHaveBeenCalled();
            expect(extension.currentTrackIndex()).toBe(1);
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-a');
        });

        test('sound not found in project: no audio call, state stays playing', () => {
            const target = makeMockTarget([]); // no sounds registered
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            extension.addSound({ SOUND: 'missing', NAME: 'Music' });
            extension.playPlaylist({ NAME: 'Music' });
            expect(target.sprite.soundBank.playSound).not.toHaveBeenCalled();
            expect(extension.isPlaying()).toBe(true); // state is playing, audio silently absent
        });

        test('playPlaylist mid-playback interrupts previous track', () => {
            const target = makeMockTarget(['a', 'b']);
            const { extension } = loadExtension('factory-dj.js', { targets: [target] });
            extension.createPlaylist({ NAME: 'Music' });
            ['a', 'b'].forEach(s => extension.addSound({ SOUND: s, NAME: 'Music' }));
            extension.playPlaylist({ NAME: 'Music' }); // starts 'a'
            extension.playTrackByIndex({ INDEX: 2, NAME: 'Music' }); // interrupts → starts 'b'
            expect(target._player('a').stop).toHaveBeenCalled();
            expect(target.sprite.soundBank.playSound).toHaveBeenLastCalledWith(target, 'id-b');
        });
    });
});
