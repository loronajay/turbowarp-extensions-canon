const { loadExtension } = require('./helpers/load-extension');

describe('Factory Camera', () => {
  function makeTarget(id, name) {
    return {
      id,
      isStage: false,
      isOriginal: true,
      x: 0,
      y: 0,
      getName() {
        return name;
      },
      setXY(x, y) {
        this.x = x;
        this.y = y;
      }
    };
  }

  test('resets world objects, cameras, and active camera on project lifecycle events', () => {
    const { extension, runtime } = loadExtension('factory-camera.js');

    extension.worldObjects.set('sprite-a', { worldX: 10, worldY: 20 });
    extension.cameras.set('camera 1', { x: 5, y: 6 });
    extension.activeCamera = 'camera 1';

    runtime.emit('PROJECT_START');

    expect(extension.worldObjects.size).toBe(0);
    expect(extension.cameras.size).toBe(0);
    expect(extension.activeCamera).toBeNull();

    extension.worldObjects.set('sprite-b', { worldX: 30, worldY: 40 });
    extension.cameras.set('camera 2', { x: 7, y: 8 });
    extension.activeCamera = 'camera 2';

    runtime.emit('PROJECT_STOP_ALL');

    expect(extension.worldObjects.size).toBe(0);
    expect(extension.cameras.size).toBe(0);
    expect(extension.activeCamera).toBeNull();
  });

  test('falls back to Sprite1 when target sprite is missing', () => {
    const sprite1 = makeTarget('sprite-1', 'Sprite1');
    const other = makeTarget('sprite-2', 'Hero');
    const { extension } = loadExtension('factory-camera.js', {
      targets: [sprite1, other]
    });

    extension.createCamera({ CAMERA: 'camera 1' });
    extension.activateCamera({ CAMERA: 'camera 1' });
    extension.setTargetSpriteOfCamera({ SPRITE: 'MissingSprite' });

    expect(extension.cameras.get('camera 1').targetId).toBe('sprite-1');
  });
});
