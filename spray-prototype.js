(function () {
  'use strict';

  const { SpraySimulator } = window;
  if (!SpraySimulator) {
    throw new Error('SpraySimulator is not available on window.');
  }

  const simCanvas = document.getElementById('simCanvas');
  const simCtx = simCanvas.getContext('2d');
  const wheelCanvas = document.getElementById('colorWheel');
  const wheelCtx = wheelCanvas.getContext('2d');

  const deployBtn = document.getElementById('deployBtn');
  const burstBtn = document.getElementById('burstBtn');
  const clearBtn = document.getElementById('clearBtn');
  const test1Btn = document.getElementById('test1Btn');
  const test2Btn = document.getElementById('test2Btn');
  const test3Btn = document.getElementById('test3Btn');
  const test4Btn = document.getElementById('test4Btn');
  const test10Btn = document.getElementById('test10Btn');

  const distanceSlider = document.getElementById('distanceSlider');
  const depthSlider = document.getElementById('depthSlider');
  const coneSlider = document.getElementById('coneSlider');
  const velocitySlider = document.getElementById('velocitySlider');
  const valueSlider = document.getElementById('valueSlider');

  const distanceValue = document.getElementById('distanceValue');
  const depthValue = document.getElementById('depthValue');
  const coneValue = document.getElementById('coneValue');
  const velocityValue = document.getElementById('velocityValue');
  const colorValue = document.getElementById('colorValue');
  const colorPreview = document.getElementById('colorPreview');
  const stats = document.getElementById('stats');
  const particleReadout = document.getElementById('particleReadout');
  const eventLog = document.getElementById('eventLog');

  const sim = new SpraySimulator({
    width: 200,
    height: 140,
    emitter: {
      x: 100,
      y: 16,
      distanceToSurface: Number(distanceSlider.value),
      depth: Number(depthSlider.value),
      spray_cone_angle: Number(coneSlider.value),
      initial_velocity_distribution: Number(velocitySlider.value)
    }
  });

  let selectedColor = '#ff5f1f';
  let wheelSelection = { x: wheelCanvas.width / 2, y: 20 };
  let lastTimestamp = performance.now();
  let trackedParticleId = null;

  function getViewMetrics() {
    const wall = {
      x: 150,
      y: 58,
      width: simCanvas.width - 300,
      height: 350
    };

    return {
      wall,
      wallCenterX: wall.x + wall.width / 2,
      wallBottom: wall.y + wall.height,
      nozzleX: simCanvas.width / 2,
      nozzleY: simCanvas.height - 74
    };
  }

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const value = parseInt(clean, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;

    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Math.round(255 * color);
    };

    return `#${[f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  }

  function drawWheelSelection() {
    wheelCtx.save();
    wheelCtx.beginPath();
    wheelCtx.arc(wheelSelection.x, wheelSelection.y, 8, 0, Math.PI * 2);
    wheelCtx.lineWidth = 2;
    wheelCtx.strokeStyle = '#ffffff';
    wheelCtx.stroke();
    wheelCtx.restore();
  }

  function drawColorWheel() {
    const width = wheelCanvas.width;
    const height = wheelCanvas.height;
    const imageData = wheelCtx.createImageData(width, height);
    const radius = width / 2;
    const brightness = Number(valueSlider.value);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - radius;
        const dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const index = (y * width + x) * 4;

        if (dist > radius) {
          imageData.data[index + 3] = 0;
          continue;
        }

        const saturation = Math.min(100, (dist / radius) * 100);
        const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const hex = hslToHex(hue, saturation, brightness * 50);
        const rgb = hexToRgb(hex);

        imageData.data[index] = rgb.r;
        imageData.data[index + 1] = rgb.g;
        imageData.data[index + 2] = rgb.b;
        imageData.data[index + 3] = 255;
      }
    }

    wheelCtx.putImageData(imageData, 0, 0);
    drawWheelSelection();
  }

  function pickColor(clientX, clientY) {
    const rect = wheelCanvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (wheelCanvas.width / rect.width);
    const y = (clientY - rect.top) * (wheelCanvas.height / rect.height);
    const dx = x - wheelCanvas.width / 2;
    const dy = y - wheelCanvas.height / 2;
    const radius = wheelCanvas.width / 2;

    if (Math.sqrt(dx * dx + dy * dy) > radius) return;

    const pixel = wheelCtx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    const hex = `#${[pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`;
    selectedColor = hex;
    wheelSelection = { x, y };
    colorValue.textContent = hex;
    colorPreview.style.background = hex;
    drawColorWheel();
  }

  function syncControls() {
    sim.setDistanceToSurface(distanceSlider.value);
    sim.setDepth(depthSlider.value);
    sim.emitter.spray_cone_angle = Number(coneSlider.value);
    sim.emitter.initial_velocity_distribution = Number(velocitySlider.value);

    distanceValue.textContent = distanceSlider.value;
    depthValue.textContent = Number(depthSlider.value).toFixed(2);
    coneValue.textContent = Number(coneSlider.value).toFixed(2);
    velocityValue.textContent = Number(velocitySlider.value).toFixed(1);
  }

  function pushEvent(message) {
    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `<time>${sim.time.toFixed(1)}</time>${message}`;
    eventLog.prepend(item);

    while (eventLog.childElementCount > 10) {
      eventLog.removeChild(eventLog.lastChild);
    }
  }

  function deployParticle() {
    const particle = sim.deployParticle({ color: selectedColor });
    if (!particle) return;
    trackedParticleId = particle.id;
    pushEvent(`particle ${particle.id} emitted`);
  }

  function deployBurst(count = 10, options = {}) {
    const particles = sim.deployBurst(count, {
      angleStep: 0.02,
      speedJitter: 0.035,
      color: selectedColor,
      ...options
    });
    if (!particles.length) return;
    trackedParticleId = particles[particles.length - 1].id;
    pushEvent(`${particles.length}-particle burst emitted`);
  }

  function runHarnessSameSpot() {
    deployParticle();
    deployParticle();
    pushEvent('same-spot pair test started');
  }

  function runHarnessSeparated() {
    sim.setEmitterPosition(60, sim.emitter.y);
    deployParticle();
    sim.setEmitterPosition(140, sim.emitter.y);
    deployParticle();
    pushEvent('separated pair test started');
  }

  function runHarnessDepthSweep() {
    const originalDepth = sim.emitter.depth;
    sim.setEmitterPosition(70, sim.emitter.y);
    sim.setDepth(1);
    deployParticle();
    sim.setEmitterPosition(130, sim.emitter.y);
    sim.setDepth(2);
    deployParticle();
    sim.setDepth(originalDepth);
    pushEvent('depth sweep started');
  }

  function runHarnessTenFan() {
    deployBurst(10, {
      angleStep: 0.03,
      speedJitter: 0.025
    });
    pushEvent('10-particle fan started');
  }

  function clearSimulation() {
    sim.reset();
    trackedParticleId = null;
    eventLog.innerHTML = '';
    pushEvent('simulation reset');
  }

  function projectWallPoint(x, y) {
    const view = getViewMetrics();
    return {
      x: view.wall.x + (x / sim.surface.width) * view.wall.width,
      y: view.wall.y + (y / sim.surface.height) * view.wall.height
    };
  }

  function projectParticle(particle) {
    const view = getViewMetrics();
    const surfaceY = sim.getSurfaceYForEmitter();
    const travelSpan = Math.max(1, surfaceY - sim.emitter.y);
    const progress = Math.max(0, Math.min(1, (particle.position.y - sim.emitter.y) / travelSpan));
    const target = projectWallPoint(
      Math.max(0, Math.min(sim.surface.width - 1, particle.phase === 'SURFACE' ? particle.surface_x : particle.position.x)),
      Math.max(0, Math.min(sim.surface.height - 1, particle.phase === 'SURFACE' ? particle.surface_y : particle.position.y))
    );

    return {
      x: view.nozzleX + (target.x - view.nozzleX) * progress,
      y: view.nozzleY + (target.y - view.nozzleY) * progress,
      progress
    };
  }

  function drawGridBackground() {
    const view = getViewMetrics();
    simCtx.save();
    const skyGradient = simCtx.createLinearGradient(0, 0, 0, simCanvas.height);
    skyGradient.addColorStop(0, '#17233a');
    skyGradient.addColorStop(0.42, '#0f1729');
    skyGradient.addColorStop(0.57, '#2b2118');
    skyGradient.addColorStop(1, '#150f0d');
    simCtx.fillStyle = skyGradient;
    simCtx.fillRect(0, 0, simCanvas.width, simCanvas.height);

    const glow = simCtx.createRadialGradient(
      simCanvas.width * 0.52,
      simCanvas.height * 0.18,
      10,
      simCanvas.width * 0.52,
      simCanvas.height * 0.18,
      simCanvas.width * 0.35
    );
    glow.addColorStop(0, 'rgba(255, 152, 102, 0.14)');
    glow.addColorStop(1, 'rgba(255, 152, 102, 0)');
    simCtx.fillStyle = glow;
    simCtx.fillRect(0, 0, simCanvas.width, simCanvas.height);

    simCtx.strokeStyle = 'rgba(255,255,255,0.06)';
    simCtx.lineWidth = 1;
    for (let x = 0; x < simCanvas.width; x += 40) {
      simCtx.beginPath();
      simCtx.moveTo(x, 0);
      simCtx.lineTo(x, simCanvas.height);
      simCtx.stroke();
    }
    for (let y = 0; y < simCanvas.height; y += 40) {
      simCtx.beginPath();
      simCtx.moveTo(0, y);
      simCtx.lineTo(simCanvas.width, y);
      simCtx.stroke();
    }

    const floorGradient = simCtx.createLinearGradient(0, view.wallBottom, 0, simCanvas.height);
    floorGradient.addColorStop(0, 'rgba(42, 30, 22, 0.7)');
    floorGradient.addColorStop(1, 'rgba(17, 12, 10, 0.98)');
    simCtx.fillStyle = floorGradient;
    simCtx.beginPath();
    simCtx.moveTo(0, simCanvas.height);
    simCtx.lineTo(view.wall.x - 40, view.wallBottom);
    simCtx.lineTo(view.wall.x + view.wall.width + 40, view.wallBottom);
    simCtx.lineTo(simCanvas.width, simCanvas.height);
    simCtx.closePath();
    simCtx.fill();

    const wallGradient = simCtx.createLinearGradient(0, view.wall.y, 0, view.wallBottom);
    wallGradient.addColorStop(0, 'rgba(52, 61, 78, 0.92)');
    wallGradient.addColorStop(1, 'rgba(35, 31, 28, 0.95)');
    simCtx.fillStyle = wallGradient;
    simCtx.fillRect(view.wall.x, view.wall.y, view.wall.width, view.wall.height);

    simCtx.strokeStyle = 'rgba(255,255,255,0.12)';
    simCtx.lineWidth = 2;
    simCtx.strokeRect(view.wall.x, view.wall.y, view.wall.width, view.wall.height);

    simCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    simCtx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const y = view.wall.y + (view.wall.height / 5) * i;
      simCtx.beginPath();
      simCtx.moveTo(view.wall.x, y);
      simCtx.lineTo(view.wall.x + view.wall.width, y);
      simCtx.stroke();
    }
    simCtx.restore();
  }

  function drawSurface() {
    const view = getViewMetrics();
    const cellWidth = view.wall.width / sim.surface.width;
    const cellHeight = view.wall.height / sim.surface.height;

    for (let y = 0; y < sim.surface.height; y++) {
      for (let x = 0; x < sim.surface.width; x++) {
        const load = sim.surface.local_load[y][x];
        const activity = sim.surface.surface_activity[y][x];
        if (load <= 0.0001 && activity <= 0.0001) continue;

        const alpha = Math.min(0.85, load * 0.18 + activity * 0.45);
        const cellColor = loadToColor(load, activity);
        const point = projectWallPoint(x, y);
        simCtx.fillStyle = `rgba(${cellColor.r}, ${cellColor.g}, ${cellColor.b}, ${alpha})`;
        simCtx.fillRect(point.x, point.y, Math.ceil(cellWidth), Math.ceil(cellHeight));
      }
    }

    const sheen = simCtx.createLinearGradient(0, view.wall.y, 0, view.wallBottom);
    sheen.addColorStop(0, 'rgba(255,255,255,0.05)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    simCtx.fillStyle = sheen;
    simCtx.fillRect(view.wall.x, view.wall.y, view.wall.width, view.wall.height);
  }

  function loadToColor(load, activity) {
    const rgb = hexToRgb(selectedColor);
    const mix = Math.min(1, load * 0.4 + activity * 0.8);
    return {
      r: Math.round(30 + (rgb.r - 30) * mix),
      g: Math.round(24 + (rgb.g - 24) * mix),
      b: Math.round(18 + (rgb.b - 18) * mix)
    };
  }

  function drawEmitter(surfaceY) {
    const view = getViewMetrics();
    const x = view.nozzleX;
    const y = view.nozzleY;
    const target = projectWallPoint(sim.emitter.x, surfaceY);
    const coneHalf = sim.emitter.spray_cone_angle * 220;

    simCtx.save();
    simCtx.strokeStyle = 'rgba(255,255,255,0.14)';
    simCtx.setLineDash([8, 8]);
    simCtx.beginPath();
    simCtx.moveTo(x, y);
    simCtx.lineTo(target.x, target.y);
    simCtx.stroke();
    simCtx.setLineDash([]);

    simCtx.beginPath();
    simCtx.moveTo(x, y + 6);
    simCtx.lineTo(target.x - coneHalf, target.y);
    simCtx.lineTo(target.x + coneHalf, target.y);
    simCtx.closePath();
    const plumeGradient = simCtx.createLinearGradient(x, y, target.x, target.y);
    const rgb = hexToRgb(selectedColor);
    plumeGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
    plumeGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.02)`);
    simCtx.fillStyle = plumeGradient;
    simCtx.fill();

    const canGradient = simCtx.createLinearGradient(x - 10, y - 18, x + 10, y + 18);
    canGradient.addColorStop(0, '#f4f8ff');
    canGradient.addColorStop(0.5, '#b2bdca');
    canGradient.addColorStop(1, '#65707d');
    simCtx.fillStyle = canGradient;
    simCtx.beginPath();
    simCtx.roundRect(x - 11, y - 24, 22, 44, 10);
    simCtx.fill();

    simCtx.fillStyle = '#262b33';
    simCtx.fillRect(x - 4, y - 30, 8, 8);
    simCtx.fillStyle = '#ff8d57';
    simCtx.fillRect(x - 2, y - 34, 4, 6);

    simCtx.fillStyle = '#8ea0b8';
    simCtx.font = '12px IBM Plex Mono, monospace';
    simCtx.fillText('spray head', x - 28, y + 38);
    simCtx.restore();
  }

  function drawParticles() {
    for (const particle of sim.particles) {
      const projected = projectParticle(particle);
      const x = projected.x;
      const y = projected.y;
      const rgb = hexToRgb(particle.color);

      if (particle.phase === 'AIR') {
        const radius = 1.8 + projected.progress * 4 + particle.dispersion_factor * 0.12;
        const glow = simCtx.createRadialGradient(x, y, 0, x, y, radius * 2.2);
        glow.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`);
        glow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        simCtx.fillStyle = glow;
        simCtx.beginPath();
        simCtx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
        simCtx.fill();

        simCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.92)`;
        simCtx.beginPath();
        simCtx.arc(x, y, radius, 0, Math.PI * 2);
        simCtx.fill();
      } else if (particle.phase === 'SURFACE') {
        simCtx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.42)`;
        simCtx.beginPath();
        simCtx.ellipse(x, y + 1, 7, 4, 0, 0, Math.PI * 2);
        simCtx.fill();
      } else {
        simCtx.fillStyle = 'rgba(255,255,255,0.08)';
        simCtx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
  }

  function getMaxLoad() {
    let max = 0;
    for (let y = 0; y < sim.surface.height; y++) {
      for (let x = 0; x < sim.surface.width; x++) {
        if (sim.surface.local_load[y][x] > max) {
          max = sim.surface.local_load[y][x];
        }
      }
    }
    return max;
  }

  function drawHud(surfaceY) {
    const particle = sim.particles.find(item => item.id === trackedParticleId) || sim.particles.at(-1) || null;
    const summary = sim.getParticleStats();
    const maxLoad = getMaxLoad();

    stats.innerHTML = '';
    const cards = [
      ['time', sim.time.toFixed(1)],
      ['particles', String(summary.total)],
      ['air', String(summary.air)],
      ['surface', String(summary.surface)],
      ['inactive', String(summary.inactive)],
      ['max load', maxLoad.toFixed(2)],
      ['surface y', String(surfaceY)],
      ['depth', sim.emitter.depth.toFixed(2)]
    ];

    for (const [label, value] of cards) {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      stats.appendChild(card);
    }

    if (!particle) {
      particleReadout.textContent = 'No particle yet.';
      return;
    }

    particleReadout.textContent = JSON.stringify({
      id: particle.id,
      phase: particle.phase,
      position: {
        x: Number(particle.position.x).toFixed(2),
        y: Number(particle.position.y).toFixed(2)
      },
      lifetime_remaining: Number(particle.lifetime_remaining).toFixed(2),
      arrival_lifetime: Number(particle.arrival_lifetime).toFixed(2),
      time_since_contact: Number(particle.time_since_contact).toFixed(2),
      arrival_condition: Number(particle.arrival_condition).toFixed(3),
      lifetime_extension_factor: Number(particle.lifetime_extension_factor).toFixed(3),
      active_state: particle.active_state
    }, null, 2);
  }

  function render() {
    const surfaceY = sim.getSurfaceYForEmitter();
    const view = getViewMetrics();
    const impactPoint = projectWallPoint(sim.emitter.x, surfaceY);

    drawGridBackground();
    drawSurface();
    drawEmitter(surfaceY);
    drawParticles();
    drawHud(surfaceY);

    simCtx.fillStyle = '#dce6f2';
    simCtx.font = '13px IBM Plex Mono, monospace';
    simCtx.fillText('FIRST-PERSON SPRAY VIEW', 18, 26);
    simCtx.fillText('WALL / CONTACT PLANE', view.wall.x + 16, view.wall.y + 24);

    simCtx.strokeStyle = 'rgba(255,255,255,0.18)';
    simCtx.beginPath();
    simCtx.moveTo(impactPoint.x - 10, impactPoint.y);
    simCtx.lineTo(impactPoint.x + 10, impactPoint.y);
    simCtx.moveTo(impactPoint.x, impactPoint.y - 10);
    simCtx.lineTo(impactPoint.x, impactPoint.y + 10);
    simCtx.stroke();
  }

  function frame(timestamp) {
    const dtMs = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const dt = Math.min(1.5, dtMs / 16.6667);
    sim.step(dt);
    render();
    requestAnimationFrame(frame);
  }

  function onCanvasPointer(event) {
    const view = getViewMetrics();
    const rect = simCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (simCanvas.width / rect.width);
    const y = (event.clientY - rect.top) * (simCanvas.height / rect.height);
    const wallX = ((x - view.wall.x) / view.wall.width) * sim.surface.width;
    const wallY = ((y - view.wall.y) / view.wall.height) * sim.surface.height;
    sim.setEmitterPosition(
      Math.max(0, Math.min(sim.surface.width - 1, wallX)),
      Math.max(4, Math.min(sim.surface.height - 8, wallY * 0.35))
    );
    pushEvent(`aim moved to x ${sim.emitter.x.toFixed(1)}`);
  }

  [distanceSlider, depthSlider, coneSlider, velocitySlider].forEach(input => {
    input.addEventListener('input', syncControls);
  });

  valueSlider.addEventListener('input', drawColorWheel);

  wheelCanvas.addEventListener('pointerdown', event => {
    pickColor(event.clientX, event.clientY);
    const move = moveEvent => pickColor(moveEvent.clientX, moveEvent.clientY);
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  });

  simCanvas.addEventListener('pointerdown', onCanvasPointer);
  deployBtn.addEventListener('click', deployParticle);
  burstBtn.addEventListener('click', () => deployBurst(10));
  clearBtn.addEventListener('click', clearSimulation);
  test1Btn.addEventListener('click', deployParticle);
  test2Btn.addEventListener('click', runHarnessSameSpot);
  test3Btn.addEventListener('click', runHarnessSeparated);
  test4Btn.addEventListener('click', runHarnessDepthSweep);
  test10Btn.addEventListener('click', runHarnessTenFan);

  window.addEventListener('keydown', event => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'd') {
      deployParticle();
    } else if (key === 'f') {
      deployBurst(10);
    }
  });

  syncControls();
  colorPreview.style.background = selectedColor;
  drawColorWheel();
  pushEvent('ready');
  requestAnimationFrame(frame);
})();
