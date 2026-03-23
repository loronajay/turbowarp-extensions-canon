const { loadExtension } = require('./helpers/load-extension');

describe('Factory Leaderboards', () => {
  test('read-style blocks do not create a missing leaderboard', () => {
    const { extension } = loadExtension('factory-leaderboards.js');

    expect(extension.exists({ NAME: 'Ghost Board' })).toBe(false);

    expect(extension.qualifies({ NAME: 'Ghost Board', VALUE: 50 })).toBe(false);
    expect(extension.getRank({ NAME: 'Ghost Board', VALUE: 50 })).toBe(0);
    expect(extension.isFull({ NAME: 'Ghost Board' })).toBe(false);
    expect(extension.entryCount({ NAME: 'Ghost Board' })).toBe(0);
    expect(extension.getName({ NAME: 'Ghost Board', RANK: 1 })).toBe('');
    expect(extension.getValue({ NAME: 'Ghost Board', RANK: 1 })).toBe(0);
    expect(extension.hasEntries({ NAME: 'Ghost Board' })).toBe(false);

    expect(extension.exists({ NAME: 'Ghost Board' })).toBe(false);
  });

  test('write-style blocks still create and update leaderboards', () => {
    const { extension } = loadExtension('factory-leaderboards.js');

    extension.addEntry({ NAME: 'High Scores', PLAYER: 'AAA', VALUE: 100 });

    expect(extension.exists({ NAME: 'High Scores' })).toBe(true);
    expect(extension.entryCount({ NAME: 'High Scores' })).toBe(1);
    expect(extension.getName({ NAME: 'High Scores', RANK: 1 })).toBe('AAA');
    expect(extension.getValue({ NAME: 'High Scores', RANK: 1 })).toBe(100);
    expect(extension.hasEntries({ NAME: 'High Scores' })).toBe(true);
  });

  test('getRank reflects descending order by default', () => {
    const { extension } = loadExtension('factory-leaderboards.js');

    extension.addEntry({ NAME: 'High Scores', PLAYER: 'AAA', VALUE: 300 });
    extension.addEntry({ NAME: 'High Scores', PLAYER: 'BBB', VALUE: 200 });
    extension.addEntry({ NAME: 'High Scores', PLAYER: 'CCC', VALUE: 100 });

    expect(extension.getRank({ NAME: 'High Scores', VALUE: 350 })).toBe(1);
    expect(extension.getRank({ NAME: 'High Scores', VALUE: 250 })).toBe(2);
    expect(extension.getRank({ NAME: 'High Scores', VALUE: 50 })).toBe(4);
  });

  test('qualifies and isFull respect max entries and ascending sort mode', () => {
    const { extension } = loadExtension('factory-leaderboards.js');

    extension.createLeaderboard({ NAME: 'Speedrun' });
    extension.setMaxEntries({ NAME: 'Speedrun', NUM: 2 });
    extension.setSortMode({ NAME: 'Speedrun', MODE: 'asc' });
    extension.addEntry({ NAME: 'Speedrun', PLAYER: 'AAA', VALUE: 20 });
    extension.addEntry({ NAME: 'Speedrun', PLAYER: 'BBB', VALUE: 30 });

    expect(extension.isFull({ NAME: 'Speedrun' })).toBe(true);
    expect(extension.qualifies({ NAME: 'Speedrun', VALUE: 25 })).toBe(true);
    expect(extension.qualifies({ NAME: 'Speedrun', VALUE: 35 })).toBe(false);
  });

  test('trim and clear preserve an existing board without recreating it through reads', () => {
    const { extension } = loadExtension('factory-leaderboards.js');

    extension.createLeaderboard({ NAME: 'Arcade' });
    extension.setMaxEntries({ NAME: 'Arcade', NUM: 2 });
    extension.addEntry({ NAME: 'Arcade', PLAYER: 'AAA', VALUE: 300 });
    extension.addEntry({ NAME: 'Arcade', PLAYER: 'BBB', VALUE: 200 });
    extension.addEntry({ NAME: 'Arcade', PLAYER: 'CCC', VALUE: 100 });

    expect(extension.entryCount({ NAME: 'Arcade' })).toBe(2);
    expect(extension.getName({ NAME: 'Arcade', RANK: 2 })).toBe('BBB');

    extension.clearLeaderboard({ NAME: 'Arcade' });

    expect(extension.exists({ NAME: 'Arcade' })).toBe(true);
    expect(extension.entryCount({ NAME: 'Arcade' })).toBe(0);
    expect(extension.hasEntries({ NAME: 'Arcade' })).toBe(false);
  });
});
