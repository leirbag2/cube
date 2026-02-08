import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

const elements = {
  size: document.querySelector('#size'),
  sizeValue: document.querySelector('#sizeValue'),
  rebuild: document.querySelector('#rebuild'),
  resetView: document.querySelector('#resetView'),
  layer: document.querySelector('#layer'),
  layerValue: document.querySelector('#layerValue'),
  renderer: document.querySelector('#renderer'),
  moveButtons: document.querySelector('#moveButtons'),
  scramble: document.querySelector('#scramble'),
  applyScramble: document.querySelector('#applyScramble'),
  clearScramble: document.querySelector('#clearScramble'),
  scrambleText: document.querySelector('#scrambleText'),
  timer: document.querySelector('#timer'),
  toggleXray: document.querySelector('#toggleXray'),
  toggleExplode: document.querySelector('#toggleExplode'),
  toggleNet: document.querySelector('#toggleNet'),
  netView: document.querySelector('#netView'),
  openSettings: document.querySelector('#openSettings'),
  settingsModal: document.querySelector('#settingsModal'),
  closeSettings: document.querySelector('#closeSettings'),
  paletteSelect: document.querySelector('#paletteSelect'),
  resetPalette: document.querySelector('#resetPalette'),
  colorGrid: document.querySelector('#colorGrid'),
  sessionName: document.querySelector('#sessionName'),
  createSession: document.querySelector('#createSession'),
  sessionSelect: document.querySelector('#sessionSelect'),
  deleteSession: document.querySelector('#deleteSession'),
  best: document.querySelector('#best'),
  avg: document.querySelector('#avg'),
  ao5: document.querySelector('#ao5'),
  ao12: document.querySelector('#ao12'),
  count: document.querySelector('#count'),
  times: document.querySelector('#times'),
  scrambleDetail: document.querySelector('#scrambleDetail'),
};

let scene;
let camera;
let renderer;
let controls;
let cubeGroup;
const SPACING = 1.08;

const MOVE_KEYS = [
  'R', "R'",
  'L', "L'",
  'U', "U'",
  'D', "D'",
  'F', "F'",
  'B', "B'",
  'M',
  'X', "X'",
  'Y', "Y'",
  'Z', "Z'",
];
const MOVE_AXIS = {
  R: { axis: 'x', face: 'max', dir: -1 },
  L: { axis: 'x', face: 'min', dir: 1 },
  U: { axis: 'y', face: 'max', dir: -1 },
  D: { axis: 'y', face: 'min', dir: 1 },
  F: { axis: 'z', face: 'max', dir: -1 },
  B: { axis: 'z', face: 'min', dir: 1 },
};
const KEY_MOVES = {
  I: "R",
  K: "R'",
  J: "U",
  U: "r",
  L: "D'",
  D: "L",
  V: "L",
  F: "U'",
  W: "B",
  O: "B'",
  E: "L'",
  R: "L'",
  S: "D",
  H: "F",
  G: "F'",
  X: "M",
  M: "r'",
};

const KEY_ROTATIONS = {
  'Ñ': { axis: 'y', dir: -1 }, // rotacion completa eje Y, sentido horario (visto desde +Y)
  A: { axis: 'y', dir: 1 },    // y'
  Y: { axis: 'x', dir: -1 },   // x
  T: { axis: 'x', dir: -1 },   // x
  B: { axis: 'x', dir: 1 },    // x'
  N: { axis: 'x', dir: 1 },    // x'
  Q: { axis: 'z', dir: 1 },    // z
  P: { axis: 'z', dir: -1 },   // z'
};

const BASE_INNER = '#111827';
const PALETTES = {
  Standard: {
    R: '#e11d48',
    L: '#f97316',
    U: '#f8fafc',
    D: '#facc15',
    F: '#22c55e',
    B: '#3b82f6',
  },
  Pastel: {
    R: '#ff6f91',
    L: '#ffb347',
    U: '#ffffff',
    D: '#ffe66d',
    F: '#7bed9f',
    B: '#70a1ff',
  },
  HighContrast: {
    R: '#ff0033',
    L: '#ff7a00',
    U: '#ffffff',
    D: '#ffe600',
    F: '#00d45a',
    B: '#0066ff',
  },
  Mono: {
    R: '#e2e8f0',
    L: '#cbd5f5',
    U: '#f8fafc',
    D: '#94a3b8',
    F: '#cbd5e1',
    B: '#a8b3c7',
  },
  Neon: {
    R: '#ff1f5a',
    L: '#ff8a00',
    U: '#f8fafc',
    D: '#ffee00',
    F: '#00e676',
    B: '#1e90ff',
  },
  Retro: {
    R: '#d7263d',
    L: '#f46036',
    U: '#f9c80e',
    D: '#f8f4e3',
    F: '#2e294e',
    B: '#1b998b',
  },
  Ocean: {
    R: '#ff6b6b',
    L: '#ffa07a',
    U: '#f1f5f9',
    D: '#ffd166',
    F: '#06d6a0',
    B: '#118ab2',
  },
  Solar: {
    R: '#ff3c38',
    L: '#ff9f1c',
    U: '#ffffff',
    D: '#f6f740',
    F: '#2ec4b6',
    B: '#3a86ff',
  },
};
const FACE_KEYS = ['R', 'L', 'U', 'D', 'F', 'B'];
const STICKER_SIZE = 0.94;
const STICKER_OFFSET = 0.52;

const state = {
  size: 3,
  layerDepth: 1,
  cubies: [],
  queue: [],
  rotating: false,
  scrambleMoves: [],
  currentScramble: '',
  xray: false,
  exploded: false,
  showNet: true,
  awaitingSolve: false,
  solveActive: false,
  paletteName: 'Standard',
  colors: { ...PALETTES.Standard },
  timerRunning: false,
  timerStart: 0,
  timerElapsed: 0,
  timerRaf: 0,
  sessions: {},
  activeSession: 'Default',
  lastKeyTime: 0,
};

init();

function init() {
  loadPalette();
  initScene();
  initUI();
  initSessions();
  buildCube(state.size);
  render();
}

function loadPalette() {
  const stored = localStorage.getItem('cubePalette');
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.colors) {
      state.colors = { ...PALETTES.Standard, ...parsed.colors };
      state.paletteName = parsed.name || 'Custom';
    }
  } catch (err) {
    // ignore malformed palette
  }
}

function persistPalette() {
  localStorage.setItem('cubePalette', JSON.stringify({
    name: state.paletteName,
    colors: state.colors,
  }));
}

function updateTitle(size) {
  const label = `Cubo ${size}x${size}`;
  document.title = label;
  const brand = document.querySelector('.brand');
  if (brand) brand.textContent = label;
}

function updateTitlePreview(size) {
  const brand = document.querySelector('.brand');
  if (brand) brand.textContent = `Cubo ${size}x${size}`;
}

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1120');

  camera = new THREE.PerspectiveCamera(45, elements.renderer.clientWidth / elements.renderer.clientHeight, 0.1, 1000);
  camera.position.set(6, 6, 6);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(elements.renderer.clientWidth, elements.renderer.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  elements.renderer.appendChild(renderer.domElement);

  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 4.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.6;
  controls.staticMoving = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(8, 10, 6);
  scene.add(ambient, directional);

  window.addEventListener('resize', onResize);
}

function initUI() {
  elements.size.addEventListener('input', () => {
    elements.sizeValue.textContent = elements.size.value;
    updateTitlePreview(Number(elements.size.value));
  });

  elements.rebuild.addEventListener('click', () => {
    state.size = Number(elements.size.value);
    state.layerDepth = 1;
    state.queue = [];
    state.rotating = false;
    updateLayerControl();
    buildCube(state.size);
    frameCube();
    updateTitle(state.size);
  });

  elements.resetView.addEventListener('click', () => {
    frameCube();
  });

  elements.layer.addEventListener('input', () => {
    state.layerDepth = Number(elements.layer.value);
    elements.layerValue.textContent = state.layerDepth;
  });

  buildMoveButtons();
  initLookahead();
  initPalette();
  initSettingsModal();

  elements.scramble.addEventListener('click', () => {
    state.scrambleMoves = generateScramble();
    state.currentScramble = stringifyMoves(state.scrambleMoves);
    elements.scrambleText.textContent = state.currentScramble;
  });

  elements.applyScramble.addEventListener('click', async () => {
    if (!state.scrambleMoves.length) return;
    await enqueueMoves(state.scrambleMoves, { source: 'scramble' });
    state.awaitingSolve = true;
    state.solveActive = false;
    state.timerElapsed = 0;
    updateTimerDisplay(0);
  });

  elements.clearScramble.addEventListener('click', () => {
    state.scrambleMoves = [];
    state.currentScramble = '';
    elements.scrambleText.textContent = '';
  });

  document.addEventListener('keydown', handleKey);
}

function initPalette() {
  elements.paletteSelect.innerHTML = '';
  const names = Object.keys(PALETTES);
  if (!names.includes(state.paletteName)) {
    const custom = document.createElement('option');
    custom.value = 'Custom';
    custom.textContent = 'Custom';
    elements.paletteSelect.appendChild(custom);
  }
  names.forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    elements.paletteSelect.appendChild(option);
  });
  if (names.includes(state.paletteName)) {
    elements.paletteSelect.value = state.paletteName;
  } else {
    elements.paletteSelect.value = 'Custom';
  }

  elements.paletteSelect.addEventListener('change', () => {
    const name = elements.paletteSelect.value;
    state.paletteName = name;
    state.colors = { ...PALETTES[name] };
    persistPalette();
    updateStickerColors();
    renderPaletteInputs();
    if (state.showNet) renderNet();
  });

  elements.resetPalette.addEventListener('click', () => {
    state.paletteName = 'Standard';
    state.colors = { ...PALETTES.Standard };
    elements.paletteSelect.value = 'Standard';
    persistPalette();
    updateStickerColors();
    renderPaletteInputs();
    if (state.showNet) renderNet();
  });

  renderPaletteInputs();
}

function renderPaletteInputs() {
  elements.colorGrid.innerHTML = '';
  FACE_KEYS.forEach((faceKey) => {
    const wrapper = document.createElement('label');
    wrapper.className = 'color-chip';
    wrapper.textContent = faceKey;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = state.colors[faceKey];
    input.addEventListener('input', () => {
      state.paletteName = 'Custom';
      elements.paletteSelect.value = 'Custom';
      state.colors[faceKey] = input.value;
      persistPalette();
      updateStickerColors();
      if (state.showNet) renderNet();
    });
    wrapper.appendChild(input);
    elements.colorGrid.appendChild(wrapper);
  });
}

function initLookahead() {
  elements.toggleXray.classList.add('secondary');
  elements.toggleExplode.classList.add('secondary');
  elements.toggleNet.classList.toggle('secondary', !state.showNet);
  elements.netView.classList.toggle('hidden', !state.showNet);
  if (state.showNet) renderNet();

  elements.toggleXray.addEventListener('click', () => {
    state.xray = !state.xray;
    updateXray();
    elements.toggleXray.classList.toggle('secondary', !state.xray);
  });

  elements.toggleExplode.addEventListener('click', () => {
    state.exploded = !state.exploded;
    updateExplode();
    elements.toggleExplode.classList.toggle('secondary', !state.exploded);
  });

  elements.toggleNet.addEventListener('click', () => {
    state.showNet = !state.showNet;
    elements.netView.classList.toggle('hidden', !state.showNet);
    elements.toggleNet.classList.toggle('secondary', !state.showNet);
    if (state.showNet) renderNet();
  });
}

function initSettingsModal() {
  const open = () => {
    elements.settingsModal.classList.remove('hidden');
    elements.settingsModal.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    elements.settingsModal.classList.add('hidden');
    elements.settingsModal.setAttribute('aria-hidden', 'true');
  };

  elements.openSettings.addEventListener('click', open);
  elements.closeSettings.addEventListener('click', close);
  elements.settingsModal.addEventListener('click', (event) => {
    if (event.target === elements.settingsModal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.settingsModal.classList.contains('hidden')) {
      close();
    }
  });
}

function initSessions() {
  const stored = localStorage.getItem('cubeSessions');
  if (stored) {
    state.sessions = JSON.parse(stored);
  }
  if (!state.sessions.Default) state.sessions.Default = [];
  state.activeSession = Object.keys(state.sessions)[0] || 'Default';
  normalizeSessions();
  renderSessions();

  elements.createSession.addEventListener('click', () => {
    const name = elements.sessionName.value.trim();
    if (!name || state.sessions[name]) return;
    state.sessions[name] = [];
    state.activeSession = name;
    elements.sessionName.value = '';
    persistSessions();
    renderSessions();
  });

  elements.sessionSelect.addEventListener('change', () => {
    state.activeSession = elements.sessionSelect.value;
    renderSessions();
  });

  elements.deleteSession.addEventListener('click', () => {
    const name = state.activeSession;
    if (name === 'Default') return;
    delete state.sessions[name];
    state.activeSession = 'Default';
    persistSessions();
    renderSessions();
  });
}

function persistSessions() {
  localStorage.setItem('cubeSessions', JSON.stringify(state.sessions));
}

function normalizeSessions() {
  Object.keys(state.sessions).forEach((name) => {
    const items = state.sessions[name] || [];
    state.sessions[name] = items.map((item) => {
      if (typeof item === 'number') {
        return { time: item, scramble: '', at: Date.now() };
      }
      return item;
    });
  });
}

function renderSessions() {
  elements.sessionSelect.innerHTML = '';
  Object.keys(state.sessions).forEach((name) => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    if (name === state.activeSession) option.selected = true;
    elements.sessionSelect.appendChild(option);
  });

  const entries = state.sessions[state.activeSession] || [];
  const times = entries.map((e) => e.time);
  elements.count.textContent = String(entries.length);
  elements.best.textContent = times.length ? formatTime(Math.min(...times)) : '-';
  elements.avg.textContent = times.length ? formatTime(average(times)) : '-';
  elements.ao5.textContent = formatAverage(times, 5);
  elements.ao12.textContent = formatAverage(times, 12);
  elements.scrambleDetail.textContent = 'Scramble: -';

  elements.times.innerHTML = '';
  entries.slice().reverse().forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'time-row';

    const main = document.createElement('button');
    main.className = 'time-main';
    main.type = 'button';
    main.textContent = `#${entries.length - index}  ${formatTime(entry.time)}`;

    main.addEventListener('click', () => {
      elements.scrambleDetail.textContent = entry.scramble
        ? `Scramble: ${entry.scramble}`
        : 'Scramble: -';
    });

    const del = document.createElement('button');
    del.className = 'delete-time';
    del.type = 'button';
    del.textContent = 'Borrar';
    del.addEventListener('click', () => {
      deleteTime(entries.length - index - 1);
    });

    row.append(main, del);
    elements.times.appendChild(row);
  });
}

function deleteTime(index) {
  const entries = state.sessions[state.activeSession] || [];
  entries.splice(index, 1);
  persistSessions();
  renderSessions();
}

function buildMoveButtons() {
  elements.moveButtons.innerHTML = '';
  MOVE_KEYS.forEach((label) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (['X', "X'", 'Y', "Y'", 'Z', "Z'"].includes(label)) {
        const base = label.replace("'", '');
        const prime = label.includes("'");
        const axisMap = { X: 'x', Y: 'y', Z: 'z' };
        const dir = prime ? 1 : -1;
        enqueueMoves([{ type: 'cube', axis: axisMap[base], dir }], { source: 'user' });
        return;
      }
      const move = parseMove(label);
      enqueueMoves([move], { source: 'user' });
    });
    elements.moveButtons.appendChild(btn);
  });
}

function updateLayerControl() {
  elements.layer.max = state.size;
  state.layerDepth = Math.min(state.layerDepth, state.size);
  elements.layer.value = state.layerDepth;
  elements.layerValue.textContent = state.layerDepth;
}

function buildCube(size) {
  if (cubeGroup) {
    scene.remove(cubeGroup);
  }

  cubeGroup = new THREE.Group();
  state.cubies = [];

  const offset = (size - 1) / 2;
  const baseGeometry = new THREE.BoxGeometry(1, 1, 1);
  const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cubie = createCubie(x, y, z, size, baseGeometry, stickerGeometry);
        cubie.position.set(
          (x - offset) * SPACING,
          (y - offset) * SPACING,
          (z - offset) * SPACING
        );
        cubie.userData.coord = { x, y, z };
        cubeGroup.add(cubie);
        state.cubies.push(cubie);
      }
    }
  }

  scene.add(cubeGroup);
  updateLayerControl();
  updateXray();
  updateExplode();
  if (state.showNet) renderNet();
  frameCube();
  updateTitle(size);
}

function createCubie(x, y, z, size, baseGeometry, stickerGeometry) {
  const group = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({ color: BASE_INNER });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  baseMesh.scale.set(0.96, 0.96, 0.96);
  baseMesh.userData.isBase = true;
  group.add(baseMesh);

  const max = size - 1;
  const stickerColors = {};
  group.userData.stickerColors = stickerColors;

  if (x === max) addSticker(group, stickerGeometry, new THREE.Vector3(1, 0, 0), state.colors.R, 'R');
  if (x === 0) addSticker(group, stickerGeometry, new THREE.Vector3(-1, 0, 0), state.colors.L, 'L');
  if (y === max) addSticker(group, stickerGeometry, new THREE.Vector3(0, 1, 0), state.colors.U, 'U');
  if (y === 0) addSticker(group, stickerGeometry, new THREE.Vector3(0, -1, 0), state.colors.D, 'D');
  if (z === max) addSticker(group, stickerGeometry, new THREE.Vector3(0, 0, 1), state.colors.F, 'F');
  if (z === 0) addSticker(group, stickerGeometry, new THREE.Vector3(0, 0, -1), state.colors.B, 'B');

  return group;
}

function addSticker(group, geometry, normal, color, faceKey) {
  const material = new THREE.MeshStandardMaterial({ color });
  const sticker = new THREE.Mesh(geometry, material);
  sticker.userData.isSticker = true;
  sticker.userData.faceKey = faceKey;
  sticker.position.copy(normal.clone().multiplyScalar(STICKER_OFFSET));
  sticker.lookAt(normal);
  group.add(sticker);
  group.userData.stickerColors[faceKey] = color;
}

function onResize() {
  const { clientWidth, clientHeight } = elements.renderer;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
}

function render() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function frameCube() {
  if (!cubeGroup) return;
  const box = new THREE.Box3().setFromObject(cubeGroup);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.8;

  controls.target.copy(center);
  const dir = new THREE.Vector3(0, 1, 1).normalize();
  camera.up.set(0, 1, 0);
  camera.position.copy(center.clone().add(dir.multiplyScalar(radius * 2.8)));
  controls.minDistance = radius * 0.8;
  controls.maxDistance = radius * 6;
  controls.update();
}

function handleKey(event) {
  if (event.repeat) return;
  const tag = event.target?.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  const key = event.key.toUpperCase();

  if (key === ' ') {
    event.preventDefault();
    toggleTimer();
    return;
  }

  if (key === 'ENTER') {
    event.preventDefault();
    commitTime();
    return;
  }

  if (key === '-') {
    state.layerDepth = Math.max(1, state.layerDepth - 1);
    updateLayerControl();
    return;
  }

  if (key === '=') {
    state.layerDepth = Math.min(state.size, state.layerDepth + 1);
    updateLayerControl();
    return;
  }

  if (!Number.isNaN(Number(key)) && key !== '0') {
    const depth = Math.min(state.size, Number(key));
    state.layerDepth = depth;
    updateLayerControl();
    return;
  }

  const now = performance.now();
  const delta = state.lastKeyTime ? now - state.lastKeyTime : 220;
  state.lastKeyTime = now;
  const duration = delta > 300 ? 30 : clamp(delta * 0.6, 20, 260);

  if (KEY_ROTATIONS[key]) {
    enqueueMoves([{ type: 'cube', duration, ...KEY_ROTATIONS[key] }], { source: 'user' });
    return;
  }

  if (KEY_MOVES[key] || MOVE_AXIS[key]) {
    const mapped = KEY_MOVES[key] || key;
    const base = mapped.replace("'", '');
    const prime = mapped.includes("'");
    const primeFromShift = event.shiftKey ? !prime : prime;
    const move = { ...parseMove(primeFromShift ? `${base}'` : base), duration };
    enqueueMoves([move], { source: 'user' });
  }
}

function parseMove(label) {
  if (label === 'M') {
    return {
      label,
      axis: 'x',
      layerIndex: centerLayerIndex(state.size),
      dir: -1, // M invertido
      depth: 1,
    };
  }
  if (label === 'r' || label === "r'") {
    const prime = label.includes("'");
    const config = MOVE_AXIS.R;
    const max = state.size - 1;
    return {
      label,
      axis: config.axis,
      face: config.face,
      dir: prime ? -config.dir : config.dir,
      layers: [max, Math.max(0, max - 1)],
    };
  }
  const base = label.replace("'", '');
  const prime = label.includes("'");
  const config = MOVE_AXIS[base];
  return {
    label,
    axis: config.axis,
    face: config.face,
    dir: prime ? -config.dir : config.dir,
    depth: state.layerDepth,
  };
}

function layerIndexForMove(move) {
  if (Array.isArray(move.layers)) return move.layers;
  if (typeof move.layerIndex === 'number') return move.layerIndex;
  const max = state.size - 1;
  if (move.face === 'max') {
    return max - (move.depth - 1);
  }
  return move.depth - 1;
}

async function enqueueMoves(moves, options = {}) {
  state.queue.push(...moves);
  if (options.source === 'user' && state.awaitingSolve && !state.timerRunning) {
    state.awaitingSolve = false;
    state.solveActive = true;
    startTimer();
  }
  if (state.rotating) return;

  state.rotating = true;
  while (state.queue.length) {
    const next = state.queue.shift();
    if (next.type === 'cube') {
      await rotateCube(next);
    } else {
      await rotateLayer(next);
    }
  }
  state.rotating = false;
}

function rotateLayer(move) {
  return new Promise((resolve) => {
    const axis = move.axis;
    const layer = layerIndexForMove(move);
    const angle = move.dir * (Math.PI / 2);

    const pivot = new THREE.Group();
    const layers = Array.isArray(layer) ? layer : [layer];
    const affected = state.cubies.filter((c) => layers.includes(c.userData.coord[axis]));
    cubeGroup.add(pivot);
    affected.forEach((cubie) => {
      pivot.attach(cubie);
    });

    const duration = move.duration ?? 180;
    const start = performance.now();

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      pivot.rotation[axis] = angle * t;
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        finalize();
      }
    }

    function finalize() {
      pivot.rotation[axis] = angle;
      pivot.updateMatrixWorld();

      affected.forEach((cubie) => {
        cubie.applyMatrix4(pivot.matrix);
        updateCoord(cubie, axis, move.dir, state.size);
        snapCubiePosition(cubie, state.size);
        cubeGroup.add(cubie);
      });

      cubeGroup.remove(pivot);
      if (state.showNet) renderNet();
      if (state.solveActive && isCubeSolved()) {
        state.solveActive = false;
        stopTimer();
      }
      resolve();
    }

    requestAnimationFrame(animate);
  });
}

function centerLayerIndex(size) {
  if (size % 2 === 1) return Math.floor(size / 2);
  return Math.floor(size / 2) - 1;
}

function rotateCube(move) {
  return new Promise((resolve) => {
    const axis = move.axis;
    const angle = move.dir * (Math.PI / 2);
    const duration = move.duration ?? 220;
    const start = performance.now();

    const pivot = new THREE.Group();
    cubeGroup.add(pivot);
    state.cubies.forEach((cubie) => {
      pivot.attach(cubie);
    });

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      pivot.rotation[axis] = angle * t;
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        finalize();
      }
    }

    function finalize() {
      pivot.rotation[axis] = angle;
      pivot.updateMatrixWorld();
      state.cubies.forEach((cubie) => {
        cubie.applyMatrix4(pivot.matrix);
        updateCoord(cubie, axis, move.dir, state.size);
        snapCubiePosition(cubie, state.size);
        cubeGroup.add(cubie);
      });
      cubeGroup.remove(pivot);
      if (state.showNet) renderNet();
      if (state.solveActive && isCubeSolved()) {
        state.solveActive = false;
        stopTimer();
      }
      resolve();
    }

    requestAnimationFrame(animate);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}


function updateCoord(cubie, axis, dir, size) {
  const coord = cubie.userData.coord;
  const offset = (size - 1) / 2;
  const x = coord.x - offset;
  const y = coord.y - offset;
  const z = coord.z - offset;

  let nx = x;
  let ny = y;
  let nz = z;

  if (axis === 'x') {
    ny = dir === 1 ? -z : z;
    nz = dir === 1 ? y : -y;
  }

  if (axis === 'y') {
    nx = dir === 1 ? z : -z;
    nz = dir === 1 ? -x : x;
  }

  if (axis === 'z') {
    nx = dir === 1 ? -y : y;
    ny = dir === 1 ? x : -x;
  }

  coord.x = Math.round(nx + offset);
  coord.y = Math.round(ny + offset);
  coord.z = Math.round(nz + offset);
}

function snapCubiePosition(cubie, size) {
  const offset = (size - 1) / 2;
  const { x, y, z } = cubie.userData.coord;
  const spacing = SPACING * (state.exploded ? 1.35 : 1);
  cubie.position.set(
    (x - offset) * spacing,
    (y - offset) * spacing,
    (z - offset) * spacing
  );
}

function generateScramble() {
  const moves = ['R', 'L', 'U', 'D', 'F', 'B'];
  const axisMap = { R: 'x', L: 'x', U: 'y', D: 'y', F: 'z', B: 'z' };
  const length = state.size <= 3 ? 20 : Math.min(100, state.size * 10);
  const result = [];
  let lastAxis = '';

  while (result.length < length) {
    const base = moves[Math.floor(Math.random() * moves.length)];
    const axis = axisMap[base];
    if (axis === lastAxis) continue;
    lastAxis = axis;
    const prime = Math.random() > 0.5;
    result.push({ ...parseMove(prime ? `${base}'` : base), depth: 1 });
  }

  return result;
}

function stringifyMoves(moves) {
  return moves.map((m) => (m.depth > 1 ? `${m.depth}${m.label}` : m.label)).join(' ');
}

function toggleTimer() {
  if (state.timerRunning) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  state.timerRunning = true;
  state.timerStart = performance.now() - state.timerElapsed;
  tickTimer();
}

function stopTimer() {
  state.timerRunning = false;
  cancelAnimationFrame(state.timerRaf);
  state.timerElapsed = performance.now() - state.timerStart;
  updateTimerDisplay(state.timerElapsed);
  commitTime();
}

function tickTimer() {
  if (!state.timerRunning) return;
  state.timerElapsed = performance.now() - state.timerStart;
  updateTimerDisplay(state.timerElapsed);
  state.timerRaf = requestAnimationFrame(tickTimer);
}

function updateTimerDisplay(ms) {
  elements.timer.textContent = formatTime(ms);
}

function commitTime() {
  if (!state.timerElapsed) return;
  const time = state.timerElapsed;
  state.sessions[state.activeSession].push({
    time,
    scramble: state.currentScramble,
    at: Date.now(),
  });
  persistSessions();
  renderSessions();
  state.timerElapsed = 0;
  updateTimerDisplay(0);
}

function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3).padStart(6, '0');
  return minutes ? `${minutes}:${seconds}` : `${seconds}`;
}

function average(values) {
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function formatAverage(values, count) {
  if (values.length < count) return '-';
  const slice = values.slice(-count);
  const sorted = slice.slice().sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  const avg = average(trimmed);
  return formatTime(avg);
}

function onVisibilityChange() {
  if (document.hidden && state.timerRunning) {
    stopTimer();
  }
}

document.addEventListener('visibilitychange', onVisibilityChange);

function updateXray() {
  const baseOpacity = state.xray ? 0.12 : 1;
  const stickerOpacity = state.xray ? 0.9 : 1;
  const depthWrite = !state.xray;
  state.cubies.forEach((cubie) => {
    cubie.children.forEach((child) => {
      const mat = child.material;
      if (!mat) return;
      const isSticker = child.userData.isSticker;
      const opacity = isSticker ? stickerOpacity : baseOpacity;
      mat.transparent = opacity < 1;
      mat.opacity = opacity;
      mat.depthWrite = depthWrite;
      mat.side = isSticker ? THREE.DoubleSide : THREE.FrontSide;
      if (isSticker && state.xray) {
        mat.emissive = mat.color.clone().multiplyScalar(0.35);
      } else {
        mat.emissive = new THREE.Color(0x000000);
      }
      mat.needsUpdate = true;
    });
  });
}

function updateStickerColors() {
  state.cubies.forEach((cubie) => {
    const map = cubie.userData.stickerColors || {};
    cubie.children.forEach((child) => {
      if (!child.userData.isSticker) return;
      const faceKey = child.userData.faceKey;
      const color = state.colors[faceKey];
      child.material.color.set(color);
      map[faceKey] = color;
    });
    cubie.userData.stickerColors = map;
  });
}

function updateExplode() {
  state.cubies.forEach((cubie) => snapCubiePosition(cubie, state.size));
  if (state.showNet) renderNet();
}

function renderNet() {
  if (!elements.netView) return;
  const size = state.size;
  elements.netView.innerHTML = '';

  const rows = [
    ['', 'U', '', ''],
    ['L', 'F', 'R', 'B'],
    ['', 'D', '', ''],
  ];

  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'net-row';
    row.forEach((faceKey) => {
      const faceEl = document.createElement('div');
      const faceSize = netFacePixelSize(size);
      faceEl.style.width = `${faceSize}px`;
      faceEl.style.height = `${faceSize}px`;
      if (!faceKey) {
        faceEl.className = 'net-face net-spacer';
        rowEl.appendChild(faceEl);
        return;
      }
      faceEl.className = 'net-face';
      faceEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      const colors = getFaceColors(faceKey, size);
      colors.forEach((color) => {
        const sticker = document.createElement('div');
        sticker.className = 'net-sticker';
        sticker.style.background = color;
        faceEl.appendChild(sticker);
      });
      rowEl.appendChild(faceEl);
    });
    elements.netView.appendChild(rowEl);
  });
}

function netFacePixelSize(size) {
  const cell = 16;
  const gap = 2;
  const pad = 6;
  return size * cell + (size - 1) * gap + pad * 2;
}

function getFaceColors(faceKey, size) {
  const max = size - 1;
  const stickers = [];
  const coords = [];

  for (let y = max; y >= 0; y--) {
    for (let x = 0; x < size; x++) {
      coords.push({ x, y });
    }
  }

  const faceMap = {
    U: { axis: 'y', value: max, get: (c) => ({ row: max - c.z, col: c.x }) },
    D: { axis: 'y', value: 0, get: (c) => ({ row: c.z, col: c.x }) },
    F: { axis: 'z', value: max, get: (c) => ({ row: max - c.y, col: c.x }) },
    B: { axis: 'z', value: 0, get: (c) => ({ row: max - c.y, col: max - c.x }) },
    R: { axis: 'x', value: max, get: (c) => ({ row: max - c.y, col: max - c.z }) },
    L: { axis: 'x', value: 0, get: (c) => ({ row: max - c.y, col: c.z }) },
  };

  const map = faceMap[faceKey];
  const grid = Array.from({ length: size * size }).fill(BASE_INNER);

  state.cubies.forEach((cubie) => {
    if (cubie.userData.coord[map.axis] !== map.value) return;
    const { row, col } = map.get(cubie.userData.coord);
    const color = getStickerColor(cubie, faceKey);
    grid[row * size + col] = color || BASE_INNER;
  });

  grid.forEach((color) => stickers.push(color));
  return stickers;
}

function getStickerColor(cubie, faceKey) {
  const localNormals = {
    R: new THREE.Vector3(1, 0, 0),
    L: new THREE.Vector3(-1, 0, 0),
    U: new THREE.Vector3(0, 1, 0),
    D: new THREE.Vector3(0, -1, 0),
    F: new THREE.Vector3(0, 0, 1),
    B: new THREE.Vector3(0, 0, -1),
  };
  const targetWorld = localNormals[faceKey];
  let bestKey = null;
  let bestDot = -1;
  const quat = cubie.getWorldQuaternion(new THREE.Quaternion());
  FACE_KEYS.forEach((key) => {
    const worldNormal = localNormals[key].clone().applyQuaternion(quat);
    const dot = worldNormal.dot(targetWorld);
    if (dot > bestDot) {
      bestDot = dot;
      bestKey = key;
    }
  });

  if (!bestKey) return null;
  const map = cubie.userData.stickerColors || {};
  return map[bestKey] || null;
}

function isCubeSolved() {
  const size = state.size;
  return FACE_KEYS.every((faceKey) => {
    const colors = getFaceColors(faceKey, size);
    if (!colors.length) return false;
    return colors.every((c) => c === colors[0]);
  });
}
