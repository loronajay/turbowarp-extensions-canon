const { SpraySimulator } = require('../spray-sim-core');

function advanceUntil(condition, step, limit = 500) {
  for (let i = 0; i < limit; i++) {
    if (condition()) return true;
    step();
  }
  return condition();
}

describe('SpraySimulator', () => {
  function makeSimulator() {
    return new SpraySimulator({
      width: 200,
      height: 160,
      emitter: {
        x: 100,
        y: 24,
        spray_cone_angle: 0.15,
        initial_velocity_distribution: 6,
        distanceToSurface: 36,
        depth: 1
      },
      random: () => 0.5
    });
  }

  test('single particle lifetime starts in air and continues after contact', () => {
    const sim = makeSimulator();
    const particle = sim.deployParticle();

    expect(particle.phase).toBe('AIR');

    sim.step(1);

    expect(particle.phase).toBe('AIR');
    expect(particle.lifetime_remaining).toBe(119);

    const reachedSurface = advanceUntil(
      () => particle.phase === 'SURFACE',
      () => sim.step(1)
    );

    expect(reachedSurface).toBe(true);
    expect(particle.arrival_lifetime).toBeLessThan(120);
    expect(particle.arrival_lifetime).toBe(particle.lifetime_remaining);

    const arrivalLifetime = particle.arrival_lifetime;
    sim.step(1);

    expect(particle.phase).toBe('SURFACE');
    expect(particle.lifetime_remaining).toBeLessThan(arrivalLifetime);
    expect(particle.lifetime_remaining).toBeGreaterThan(0);
    expect(sim.surface.local_density[particle.surface_y][particle.surface_x]).toBe(1);
  });

  test('two particles at the same spot increase local load and lifetime extension', () => {
    const isolated = makeSimulator();
    const isolatedParticle = isolated.deployParticle();

    advanceUntil(
      () => isolatedParticle.phase === 'SURFACE',
      () => isolated.step(1)
    );

    const isolatedArrival = isolatedParticle.arrival_lifetime;
    isolated.step(1);
    const isolatedExtension = isolatedParticle.lifetime_remaining - (isolatedArrival - 1);

    const grouped = makeSimulator();
    const a = grouped.deployParticle();
    const b = grouped.deployParticle();

    advanceUntil(
      () => a.phase === 'SURFACE' && b.phase === 'SURFACE',
      () => grouped.step(1)
    );

    const loadAfterTwo = grouped.surface.local_load[a.surface_y][a.surface_x];
    const densityAfterTwo = grouped.surface.local_density[a.surface_y][a.surface_x];

    const groupedArrival = a.arrival_lifetime;
    grouped.step(1);
    const groupedExtension = a.lifetime_remaining - (groupedArrival - 1);

    expect(densityAfterTwo).toBeGreaterThan(1);
    expect(loadAfterTwo).toBeGreaterThan(
      isolated.surface.local_load[isolatedParticle.surface_y][isolatedParticle.surface_x]
    );
    expect(groupedExtension).toBeGreaterThan(isolatedExtension);
  });

  test('separated particles do not fake a group', () => {
    const sim = makeSimulator();
    sim.setEmitterPosition(60, 24);
    const left = sim.deployParticle();
    sim.setEmitterPosition(140, 24);
    const right = sim.deployParticle();

    advanceUntil(
      () => left.phase === 'SURFACE' && right.phase === 'SURFACE',
      () => sim.step(1)
    );

    expect(left.surface_x).not.toBe(right.surface_x);
    expect(sim.surface.local_density[left.surface_y][left.surface_x]).toBe(1);
    expect(sim.surface.local_density[right.surface_y][right.surface_x]).toBe(1);

    const leftArrival = left.arrival_lifetime;
    const rightArrival = right.arrival_lifetime;
    sim.step(1);

    const leftExtension = left.lifetime_remaining - (leftArrival - 1);
    const rightExtension = right.lifetime_remaining - (rightArrival - 1);

    expect(leftExtension).toBeCloseTo(rightExtension, 5);
  });

  test('greater travel depth reduces arrival lifetime and deposit strength', () => {
    const shallow = makeSimulator();
    shallow.setDepth(1);
    const shallowParticle = shallow.deployParticle();

    advanceUntil(
      () => shallowParticle.phase === 'SURFACE',
      () => shallow.step(1)
    );

    const deep = makeSimulator();
    deep.setDepth(2);
    const deepParticle = deep.deployParticle();

    advanceUntil(
      () => deepParticle.phase === 'SURFACE',
      () => deep.step(1)
    );

    const shallowLoad = shallow.surface.local_load[shallowParticle.surface_y][shallowParticle.surface_x];
    const deepLoad = deep.surface.local_load[deepParticle.surface_y][deepParticle.surface_x];

    expect(deepParticle.arrival_lifetime).toBeLessThan(shallowParticle.arrival_lifetime);
    expect(deepLoad).toBeLessThan(shallowLoad);
    expect(deepParticle.travel_time).toBeGreaterThan(shallowParticle.travel_time);
  });

  test('ten-particle burst builds a denser local field than a single particle', () => {
    const single = makeSimulator();
    const lone = single.deployParticle();

    advanceUntil(
      () => lone.phase === 'SURFACE',
      () => single.step(1)
    );

    const burst = makeSimulator();
    const particles = burst.deployBurst(10, {
      angleStep: 0.018,
      speedJitter: 0.08
    });

    advanceUntil(
      () => particles.every(particle => particle.phase === 'SURFACE'),
      () => burst.step(1)
    );

    const centerY = particles[0].surface_y;
    const centerX = particles[Math.floor(particles.length / 2)].surface_x;

    expect(particles).toHaveLength(10);
    expect(burst.getParticleStats().surface).toBe(10);
    expect(burst.surface.local_density[centerY][centerX]).toBeGreaterThan(
      single.surface.local_density[lone.surface_y][lone.surface_x]
    );
    expect(burst.surface.local_load[centerY][centerX]).toBeGreaterThan(
      single.surface.local_load[lone.surface_y][lone.surface_x]
    );
  });
});
