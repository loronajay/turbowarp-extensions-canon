'use strict';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createGrid(width, height, fill = 0) {
  return Array.from({ length: height }, () => Array(width).fill(fill));
}

function createSurface(width, height) {
  return {
    width,
    height,
    local_load: createGrid(width, height, 0),
    local_density: createGrid(width, height, 0),
    accumulation_depth: createGrid(width, height, 0),
    surface_activity: createGrid(width, height, 0)
  };
}

class SpraySimulator {
  constructor(options = {}) {
    this.width = options.width || 200;
    this.height = options.height || 160;
    this.random = typeof options.random === 'function' ? options.random : Math.random;
    this.particles = [];
    this.time = 0;
    this.nextParticleId = 1;
    this.surface = createSurface(this.width, this.height);
    this.surfaceFade = 0.0025;
    this.defaultColor = options.color || '#ff5f1f';
    this.emitter = {
      x: 100,
      y: 24,
      emission_rate: 1,
      emission_intensity: 1,
      spray_cone_angle: 0.15,
      initial_velocity_distribution: 6,
      depth: 1,
      distanceToSurface: 36,
      can_state: 1,
      ...options.emitter
    };
  }

  reset() {
    this.particles = [];
    this.time = 0;
    this.nextParticleId = 1;
    this.surface = createSurface(this.width, this.height);
  }

  setEmitterPosition(x, y) {
    this.emitter.x = clamp(Number(x) || 0, 0, this.width - 1);
    this.emitter.y = clamp(Number(y) || 0, 0, this.height - 1);
  }

  setDepth(depth) {
    this.emitter.depth = Math.max(0.2, Number(depth) || 1);
  }

  setDistanceToSurface(distance) {
    this.emitter.distanceToSurface = Math.max(4, Number(distance) || 36);
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getSurfaceYForEmitter() {
    return clamp(
      Math.round(this.emitter.y + this.emitter.distanceToSurface * this.emitter.depth),
      0,
      this.height - 1
    );
  }

  deployParticle(overrides = {}) {
    if (!this.emitter.can_state) return null;

    const angleOffset = (this.random() - 0.5) * this.emitter.spray_cone_angle;
    const speed = this.emitter.initial_velocity_distribution;
    const surfaceY = this.getSurfaceYForEmitter();
    const distanceToSurface = Math.max(1, surfaceY - this.emitter.y);

    const particle = {
      id: this.nextParticleId++,
      color: overrides.color || this.defaultColor,
      position: { x: this.emitter.x, y: this.emitter.y },
      velocity: {
        x: Math.sin(angleOffset) * speed,
        y: Math.cos(angleOffset) * speed
      },
      phase: 'AIR',
      lifetime_total: 120,
      lifetime_remaining: 120,
      arrival_lifetime: 0,
      time_since_contact: 0,
      active_state: true,
      travel_time: 0,
      dispersion_factor: 1,
      arrival_condition: 0,
      depth: this.emitter.depth,
      distanceToSurface,
      influence_radius: 3,
      contribution_strength: 1,
      lifetime_extension_factor: 0,
      surface_x: null,
      surface_y: null,
      active_contribution: 0
    };

    this.particles.push(particle);
    return particle;
  }

  deployBurst(count, options = {}) {
    const burstCount = Math.max(0, Math.floor(Number(count) || 0));
    const particles = [];
    if (burstCount === 0) return particles;

    const angleStep = Number(options.angleStep) || 0.015;
    const speedJitter = Number(options.speedJitter) || 0.05;
    const centerOffset = (burstCount - 1) / 2;

    for (let i = 0; i < burstCount; i++) {
      const spreadIndex = i - centerOffset;
      const speedFactor = 1 + spreadIndex * speedJitter;
      const particle = this.deployParticle({
        ...options,
        velocity: undefined
      });

      if (!particle) continue;

      const angle = Math.atan2(particle.velocity.x, particle.velocity.y) + spreadIndex * angleStep;
      const speed = this.emitter.initial_velocity_distribution * speedFactor;
      particle.velocity.x = Math.sin(angle) * speed;
      particle.velocity.y = Math.cos(angle) * speed;
      particles.push(particle);
    }

    return particles;
  }

  step(dt = 1) {
    const stepDt = Math.max(0.0001, Number(dt) || 1);
    this.time += stepDt;

    for (const particle of this.particles) {
      this.updateParticle(particle, stepDt);
    }

    this.fadeSurface(stepDt);
  }

  updateParticle(p, dt) {
    if (!p.active_state) return;

    p.lifetime_remaining -= dt;
    if (p.lifetime_remaining <= 0) {
      p.lifetime_remaining = 0;
      p.active_state = false;
      p.phase = 'INACTIVE';
      p.active_contribution = 0;
      return;
    }

    if (p.phase === 'AIR') {
      p.travel_time += dt;
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.dispersion_factor = 1 + p.travel_time * 0.015;

      const surfaceY = this.getSurfaceYForEmitter();
      if (p.position.y >= surfaceY) {
        p.phase = 'SURFACE';
        p.position.y = surfaceY;
        p.arrival_lifetime = p.lifetime_remaining;
        p.arrival_condition = p.arrival_lifetime / p.lifetime_total;
        p.surface_x = clamp(Math.round(p.position.x), 0, this.width - 1);
        p.surface_y = surfaceY;
        this.depositToSurface(p);
      }
      return;
    }

    if (p.phase === 'SURFACE') {
      p.time_since_contact += dt;
      p.active_contribution = p.arrival_condition * Math.max(0, 1 - p.time_since_contact / 120);
      this.applyLocalLifetimeExtension(p, dt);
    }
  }

  depositToSurface(p) {
    const cx = p.surface_x;
    const cy = p.surface_y;

    for (let dy = -p.influence_radius; dy <= p.influence_radius; dy++) {
      for (let dx = -p.influence_radius; dx <= p.influence_radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!this.inBounds(x, y)) continue;

        const dist = Math.hypot(dx, dy);
        if (dist > p.influence_radius) continue;

        const falloff = 1 - dist / p.influence_radius;
        const depthPenalty = 1 / Math.max(1, p.depth);
        const contribution = p.contribution_strength * p.arrival_condition * falloff * depthPenalty;

        this.surface.local_load[y][x] += contribution;
        this.surface.local_density[y][x] += 1;
        this.surface.accumulation_depth[y][x] += contribution;
        this.surface.surface_activity[y][x] = Math.max(this.surface.surface_activity[y][x], p.arrival_condition);
      }
    }
  }

  applyLocalLifetimeExtension(p, dt) {
    if (!this.inBounds(p.surface_x, p.surface_y)) return;

    const localDensity = this.surface.local_density[p.surface_y][p.surface_x];
    const localLoad = this.surface.local_load[p.surface_y][p.surface_x];
    const extension = Math.min(localDensity * 0.02 + localLoad * 0.005, 0.5) * dt;
    p.lifetime_extension_factor = extension;
    p.lifetime_remaining += extension;
  }

  fadeSurface(dt) {
    const fadeAmount = this.surfaceFade * dt;

    for (let y = 0; y < this.surface.height; y++) {
      for (let x = 0; x < this.surface.width; x++) {
        this.surface.surface_activity[y][x] = Math.max(0, this.surface.surface_activity[y][x] - fadeAmount);
      }
    }
  }

  getParticleStats() {
    let air = 0;
    let surface = 0;
    let inactive = 0;

    for (const particle of this.particles) {
      if (particle.phase === 'AIR') air++;
      else if (particle.phase === 'SURFACE') surface++;
      else inactive++;
    }

    return {
      total: this.particles.length,
      air,
      surface,
      inactive
    };
  }
}

const exportsObject = {
  SpraySimulator,
  createSurface
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObject;
}

if (typeof window !== 'undefined') {
  Object.assign(window, exportsObject);
}
