import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

const ENABLE_CUBING = true;
let cubingScrambler = null;

async function getCubingScrambler() {
  if (!ENABLE_CUBING) return null;
  if (cubingScrambler !== null) return cubingScrambler;
  try {
    const mod = await import('https://cdn.cubing.net/v0/js/cubing/scramble');
    cubingScrambler = mod?.randomScrambleForEvent || null;
  } catch (err) {
    cubingScrambler = null;
  }
  return cubingScrambler;
}

const elements = {
  size: document.querySelector('#size'),
  sizeValue: document.querySelector('#sizeValue'),
  rebuild: document.querySelector('#rebuild'),
  resetView: document.querySelector('#resetView'),
  layer: document.querySelector('#layer'),
  layerValue: document.querySelector('#layerValue'),
  renderer: document.querySelector('#renderer'),
  webglError: document.querySelector('#webglError'),
  moveButtons: document.querySelector('#moveButtons'),
  applyScramble: document.querySelector('#applyScramble'),
  clearScramble: document.querySelector('#clearScramble'),
  prevScramble: document.querySelector('#prevScramble'),
  nextScramble: document.querySelector('#nextScramble'),
  scrambleText: document.querySelector('#scrambleText'),
  timer: document.querySelector('#timer'),
  toggleXray: document.querySelector('#toggleXray'),
  toggleExplode: document.querySelector('#toggleExplode'),
  toggleNet: document.querySelector('#toggleNet'),
  netView: document.querySelector('#netView'),
  openSettings: document.querySelector('#openSettings'),
  settingsModal: document.querySelector('#settingsModal'),
  closeSettings: document.querySelector('#closeSettings'),
  toggleParty: document.querySelector('#toggleParty'),
  toggleMirror: document.querySelector('#toggleMirror'),
  toggleGhost: document.querySelector('#toggleGhost'),
  cubeTypeSelect: document.querySelector('#cubeTypeSelect'),
  deformNone: document.querySelector('#deformNone'),
  deformJelly: document.querySelector('#deformJelly'),
  deformTwist: document.querySelector('#deformTwist'),
  deformWave: document.querySelector('#deformWave'),
  deformStrength: document.querySelector('#deformStrength'),
  deformValue: document.querySelector('#deformValue'),
  openHelp: document.querySelector('#openHelp'),
  helpModal: document.querySelector('#helpModal'),
  closeHelp: document.querySelector('#closeHelp'),
  solveModal: document.querySelector('#solveModal'),
  closeSolve: document.querySelector('#closeSolve'),
  solveTime: document.querySelector('#solveTime'),
  solveDate: document.querySelector('#solveDate'),
  solveTps: document.querySelector('#solveTps'),
  solveScramble: document.querySelector('#solveScramble'),
  solveMoves: document.querySelector('#solveMoves'),
  deleteSolve: document.querySelector('#deleteSolve'),
  replayPlay: document.querySelector('#replayPlay'),
  replayPause: document.querySelector('#replayPause'),
  replayPrev: document.querySelector('#replayPrev'),
  replayNext: document.querySelector('#replayNext'),
  replaySpeed: document.querySelector('#replaySpeed'),
  replayViewport: document.querySelector('#replayViewport'),
  replayTimer: document.querySelector('#replayTimer'),
  paletteSelect: document.querySelector('#paletteSelect'),
  resetPalette: document.querySelector('#resetPalette'),
  colorGrid: document.querySelector('#colorGrid'),
  edgeThickness: document.querySelector('#edgeThickness'),
  edgeValue: document.querySelector('#edgeValue'),
  cameraDistance: document.querySelector('#cameraDistance'),
  cameraValue: document.querySelector('#cameraValue'),
  toggleLightFollow: document.querySelector('#toggleLightFollow'),
  lightKeyX: document.querySelector('#lightKeyX'),
  lightKeyY: document.querySelector('#lightKeyY'),
  lightKeyZ: document.querySelector('#lightKeyZ'),
  lightKeyXValue: document.querySelector('#lightKeyXValue'),
  lightKeyYValue: document.querySelector('#lightKeyYValue'),
  lightKeyZValue: document.querySelector('#lightKeyZValue'),
  lightFillX: document.querySelector('#lightFillX'),
  lightFillY: document.querySelector('#lightFillY'),
  lightFillZ: document.querySelector('#lightFillZ'),
  lightFillXValue: document.querySelector('#lightFillXValue'),
  lightFillYValue: document.querySelector('#lightFillYValue'),
  lightFillZValue: document.querySelector('#lightFillZValue'),
  sessionName: document.querySelector('#sessionName'),
  createSession: document.querySelector('#createSession'),
  sessionSelect: document.querySelector('#sessionSelect'),
  deleteSession: document.querySelector('#deleteSession'),
  exportData: document.querySelector('#exportData'),
  importData: document.querySelector('#importData'),
  importFile: document.querySelector('#importFile'),
  best: document.querySelector('#best'),
  worst: document.querySelector('#worst'),
  avg: document.querySelector('#avg'),
  median: document.querySelector('#median'),
  ao5: document.querySelector('#ao5'),
  ao12: document.querySelector('#ao12'),
  bestAo5: document.querySelector('#bestAo5'),
  bestAo12: document.querySelector('#bestAo12'),
  stddev: document.querySelector('#stddev'),
  avgTps: document.querySelector('#avgTps'),
  count: document.querySelector('#count'),
  last: document.querySelector('#last'),
  times: document.querySelector('#times'),
};

let scene;
let camera;
let renderer;
let controls;
let cubeGroup;
let ghostGroup;
let keyLight;
let fillLight;
const SPACING = 1.08;

const MOVE_KEYS = [
  'R', "R'",
  'L', "L'",
  'U', "U'",
  'D', "D'",
  'F', "F'",
  'B', "B'",
  'M',
  'r', "r'",
  'l', "l'",
  'u', "u'",
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
  ',': "u",
  C: "u'",
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
    R: '#F4889A',
    L: '#FFAF68',
    U: '#F6E683',
    D: '#A484E9',
    F: '#79D45E',
    B: '#31BFF3',
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
    R: '#ff0c12',
    L: '#fdae32',
    U: '#fdfb00',
    D: '#8f00f2',
    F: '#5cff00',
    B: '#00cffb',
  },
  Retro: {
    R: '#bd6b4d',
    L: '#d4916a',
    U: '#f2ddbd',
    D: '#f0ce8b',
    F: '#92b0ac',
    B: '#7e8fa6',
  },
  Ocean: {
    R: '#ff7f50',
    L: '#8b7355',
    U: '#faf9f6',
    D: '#9fe2bf',
    F: '#008080',
    B: '#003153',
  },
  Solar: {
    R: '#e5cc4c',
    L: '#bceb84',
    U: '#96b5c0',
    D: '#424748',
    F: '#6cb36b',
    B: '#065039',
  },
};
const FACE_KEYS = ['R', 'L', 'U', 'D', 'F', 'B'];
const STICKER_SIZE = 0.94;
const STICKER_OFFSET = 0.52;
const BASE_SCALE = 0.90;
const BASE_SCALE_RANGE = 0.08;
const STICKER_SCALE = 0.88;
const STICKER_SCALE_RANGE = 0.12;
const MIRROR_METAL_COLORS = {
  R: '#f5f7fb',
  L: '#d1d7e0',
  U: '#eef1f6',
  D: '#a2a9b5',
  F: '#cfd6e3',
  B: '#b7becb',
};

const state = {
  size: 3,
  layerDepth: 1,
  cubies: [],
  queue: [],
  rotating: false,
  scrambleMoves: [],
  currentScramble: '',
  scrambleHistory: [],
  scrambleIndex: -1,
  xray: false,
  exploded: false,
  showNet: true,
  awaitingSolve: false,
  solveActive: false,
  paletteName: 'Standard',
  colors: { ...PALETTES.Standard },
  edgeThickness: 70,
  cameraDistance: 2.8,
  lightFollowCamera: false,
  lightKey: { x: 6, y: 9, z: 10 },
  lightFill: { x: -8, y: 4, z: -6 },
  partyMode: false,
  mirrorMode: false,
  ghostMode: false,
  mirrorCube: false,
  cubeType: 'classic',
  deformMode: 'none',
  deformStrength: 0.35,
  deformSpeed: 1,
  mirrorUntil: 0,
  solveRecording: [],
  solveStartPerf: 0,
  solveStartDate: 0,
  preSolveRecording: [],
  preSolveStartPerf: 0,
  selectedSolveIndex: null,
  replay: {
    active: false,
    index: 0,
    moves: [],
    baseMoves: [],
    timers: [],
    speed: 1,
    scene: null,
    camera: null,
    renderer: null,
    group: null,
    cubies: [],
    size: 3,
    raf: 0,
    playId: 0,
    startAt: 0,
    preDuration: 0,
    totalDuration: 0,
    startOffset: 0,
    baseT: 0,
    solveStartT: 0,
  },
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
  loadCubeType();
  loadLights();
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
    if (typeof parsed?.edgeThickness === 'number') {
      state.edgeThickness = parsed.edgeThickness;
    }
    if (typeof parsed?.cameraDistance === 'number') {
      state.cameraDistance = parsed.cameraDistance;
    }
  } catch (err) {
    // ignore malformed palette
  }
}

function loadCubeType() {
  const stored = localStorage.getItem('cubeType');
  if (stored === 'mirror' || stored === 'classic') {
    state.cubeType = stored;
  }
}

function loadLights() {
  const stored = localStorage.getItem('cubeLights');
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.key) state.lightKey = { ...state.lightKey, ...parsed.key };
    if (parsed?.fill) state.lightFill = { ...state.lightFill, ...parsed.fill };
    if (typeof parsed?.follow === 'boolean') state.lightFollowCamera = parsed.follow;
  } catch {
    // ignore
  }
}

function persistPalette() {
  localStorage.setItem('cubePalette', JSON.stringify({
    name: state.paletteName,
    colors: state.colors,
    edgeThickness: state.edgeThickness,
    cameraDistance: state.cameraDistance,
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

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(elements.renderer.clientWidth, elements.renderer.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    elements.renderer.appendChild(renderer.domElement);
  } catch (err) {
    elements.webglError.classList.remove('hidden');
    throw err;
  }

  controls = new TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 4.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.6;
  controls.staticMoving = true;

  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.35);
  keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(state.lightKey.x, state.lightKey.y, state.lightKey.z);
  keyLight.target.position.set(0, 0, 0);
  scene.add(ambient, hemi, keyLight, keyLight.target);

  fillLight = new THREE.DirectionalLight(0xffffff, 0.25);
  fillLight.position.set(state.lightFill.x, state.lightFill.y, state.lightFill.z);
  fillLight.target.position.set(0, 0, 0);
  scene.add(fillLight, fillLight.target);

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
    resetScrambleHistory();
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
  initEdges();
  initCameraDistance();
  initLightControls();
  initSettingsModal();
  initFunModes();
  initDeformControls();
  initCubeType();
  initHelpModal();
  initSolveModal();
  initDataTransfer();

  resetScrambleHistory();

  elements.applyScramble.addEventListener('click', async () => {
    if (!state.scrambleMoves.length) return;
    resetMainCubeToSolved();
    await enqueueMoves(state.scrambleMoves, { source: 'scramble' });
    state.awaitingSolve = true;
    state.solveActive = false;
    state.timerElapsed = 0;
    state.solveRecording = [];
    state.solveStartPerf = 0;
    state.solveStartDate = 0;
    state.preSolveRecording = [];
    state.preSolveStartPerf = 0;
    updateTimerDisplay(0);
    if (state.mirrorMode) {
      state.mirrorUntil = performance.now() + 5000;
    }
  });

  elements.clearScramble.addEventListener('click', () => {
    resetScrambleHistory();
  });

  elements.prevScramble.addEventListener('click', () => {
    if (state.scrambleHistory.length === 0) return;
    state.scrambleIndex = Math.max(0, state.scrambleIndex - 1);
    syncScrambleFromHistory();
  });

  elements.nextScramble.addEventListener('click', () => {
    if (state.scrambleHistory.length === 0) return;
    if (state.scrambleIndex < state.scrambleHistory.length - 1) {
      state.scrambleIndex += 1;
      syncScrambleFromHistory();
      return;
    }
    addNewScramble();
  });

  document.addEventListener('keydown', handleKey);
}

function initDataTransfer() {
  elements.exportData.addEventListener('click', () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: exportLocalStorage(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cube-data-${payload.exportedAt.replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  elements.importData.addEventListener('click', () => {
    elements.importFile.click();
  });

  elements.importFile.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      if (!data || typeof data !== 'object') {
        alert('Archivo inválido.');
        return;
      }
      const proceed = confirm('Esto reemplazará el localStorage actual. ¿Continuar?');
      if (!proceed) return;
      localStorage.clear();
      Object.keys(data).forEach((key) => {
        localStorage.setItem(key, String(data[key]));
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('No se pudo importar el archivo.');
    } finally {
      elements.importFile.value = '';
    }
  });
}

function exportLocalStorage() {
  const out = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    out[key] = localStorage.getItem(key);
  }
  return out;
}

function resetMainCubeToSolved() {
  const size = state.size;
  const offset = (size - 1) / 2;
  state.cubies.forEach((cubie) => {
    const initial = cubie.userData.initialCoord || cubie.userData.coord;
    cubie.userData.coord = { ...initial };
    cubie.position.set(
      (initial.x - offset) * SPACING,
      (initial.y - offset) * SPACING,
      (initial.z - offset) * SPACING
    );
    cubie.quaternion.identity();
  });
  if (state.showNet) renderNet();
}

function mapMirrorLabel(label) {
  if (!state.mirrorMode) return label;
  const now = performance.now();
  if (now > state.mirrorUntil) return label;

  const prime = label.includes("'");
  const base = label.replace("'", '');
  const mirrorMap = { R: 'L', L: 'R', U: 'D', D: 'U', F: 'B', B: 'F', r: 'l', l: 'r' };
  const mappedBase = mirrorMap[base] || base;
  const mappedPrime = !prime;
  return mappedPrime ? `${mappedBase}'` : mappedBase;
}

function keyToRotationLabel(key) {
  const map = {
    'Ñ': 'y',
    A: "y'",
    Y: 'x',
    T: 'x',
    B: "x'",
    N: "x'",
    Q: 'z',
    P: "z'",
  };
  return map[key] || 'rot';
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
    updateGhost();
    renderPaletteInputs();
    if (state.showNet) renderNet();
  });

  elements.resetPalette.addEventListener('click', () => {
    state.paletteName = 'Standard';
    state.colors = { ...PALETTES.Standard };
    elements.paletteSelect.value = 'Standard';
    persistPalette();
    updateStickerColors();
    updateGhost();
    renderPaletteInputs();
    if (state.showNet) renderNet();
  });

  renderPaletteInputs();
}

function initEdges() {
  elements.edgeThickness.value = String(state.edgeThickness);
  elements.edgeValue.textContent = String(state.edgeThickness);
  elements.edgeThickness.addEventListener('input', () => {
    state.edgeThickness = Number(elements.edgeThickness.value);
    elements.edgeValue.textContent = String(state.edgeThickness);
    persistPalette();
    updateEdgeThickness();
  });
}

function initCameraDistance() {
  elements.cameraDistance.value = String(Math.round(state.cameraDistance * 100));
  elements.cameraValue.textContent = state.cameraDistance.toFixed(2);
  elements.cameraDistance.addEventListener('input', () => {
    state.cameraDistance = Number(elements.cameraDistance.value) / 100;
    elements.cameraValue.textContent = state.cameraDistance.toFixed(2);
    persistPalette();
    frameCube();
  });
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
      updateGhost();
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

function initFunModes() {
  elements.toggleParty.classList.add('secondary');
  elements.toggleMirror.classList.add('secondary');
  elements.toggleGhost.classList.add('secondary');

  elements.toggleParty.addEventListener('click', () => {
    state.partyMode = !state.partyMode;
    elements.toggleParty.classList.toggle('secondary', !state.partyMode);
  });

  elements.toggleMirror.addEventListener('click', () => {
    state.mirrorMode = !state.mirrorMode;
    elements.toggleMirror.classList.toggle('secondary', !state.mirrorMode);
    if (state.mirrorMode) {
      state.mirrorUntil = performance.now() + 5000;
    }
  });

  elements.toggleGhost.addEventListener('click', () => {
    state.ghostMode = !state.ghostMode;
    elements.toggleGhost.classList.toggle('secondary', !state.ghostMode);
    updateGhost();
  });
}

function initDeformControls() {
  const buttons = {
    none: elements.deformNone,
    jelly: elements.deformJelly,
    twist: elements.deformTwist,
    wave: elements.deformWave,
  };

  const setMode = (mode) => {
    state.deformMode = mode;
    Object.entries(buttons).forEach(([key, btn]) => {
      if (!btn) return;
      btn.classList.toggle('secondary', key !== mode);
    });
  };

  setMode(state.deformMode);

  Object.entries(buttons).forEach(([mode, btn]) => {
    if (!btn) return;
    btn.addEventListener('click', () => setMode(mode));
  });

  if (elements.deformStrength) {
    elements.deformStrength.value = Math.round(state.deformStrength * 100);
    elements.deformValue.textContent = state.deformStrength.toFixed(2);
    elements.deformStrength.addEventListener('input', () => {
      state.deformStrength = Number(elements.deformStrength.value) / 100;
      elements.deformValue.textContent = state.deformStrength.toFixed(2);
    });
  }
}

function initCubeType() {
  if (!elements.cubeTypeSelect) return;
  elements.cubeTypeSelect.value = state.cubeType;
  elements.cubeTypeSelect.addEventListener('change', () => {
    state.cubeType = elements.cubeTypeSelect.value;
    localStorage.setItem('cubeType', state.cubeType);
    applyCubeType();
  });
  applyCubeType();
}

function initLightControls() {
  const sync = () => {
    if (keyLight) keyLight.position.set(state.lightKey.x, state.lightKey.y, state.lightKey.z);
    if (fillLight) fillLight.position.set(state.lightFill.x, state.lightFill.y, state.lightFill.z);
    if (elements.lightKeyX) elements.lightKeyXValue.textContent = String(state.lightKey.x);
    if (elements.lightKeyY) elements.lightKeyYValue.textContent = String(state.lightKey.y);
    if (elements.lightKeyZ) elements.lightKeyZValue.textContent = String(state.lightKey.z);
    if (elements.lightFillX) elements.lightFillXValue.textContent = String(state.lightFill.x);
    if (elements.lightFillY) elements.lightFillYValue.textContent = String(state.lightFill.y);
    if (elements.lightFillZ) elements.lightFillZValue.textContent = String(state.lightFill.z);
    if (elements.toggleLightFollow) {
      elements.toggleLightFollow.classList.toggle('secondary', !state.lightFollowCamera);
    }
    localStorage.setItem('cubeLights', JSON.stringify({
      key: state.lightKey,
      fill: state.lightFill,
      follow: state.lightFollowCamera,
    }));
  };

  const bind = (input, key, axis) => {
    if (!input) return;
    input.value = String(state[key][axis]);
    input.addEventListener('input', () => {
      state[key][axis] = Number(input.value);
      sync();
    });
  };

  bind(elements.lightKeyX, 'lightKey', 'x');
  bind(elements.lightKeyY, 'lightKey', 'y');
  bind(elements.lightKeyZ, 'lightKey', 'z');
  bind(elements.lightFillX, 'lightFill', 'x');
  bind(elements.lightFillY, 'lightFill', 'y');
  bind(elements.lightFillZ, 'lightFill', 'z');

  if (elements.toggleLightFollow) {
    elements.toggleLightFollow.addEventListener('click', () => {
      state.lightFollowCamera = !state.lightFollowCamera;
      sync();
    });
  }

  sync();
}

function initHelpModal() {
  const open = () => {
    elements.helpModal.classList.remove('hidden');
    elements.helpModal.setAttribute('aria-hidden', 'false');
  };
  const close = () => {
    elements.helpModal.classList.add('hidden');
    elements.helpModal.setAttribute('aria-hidden', 'true');
  };

  elements.openHelp.addEventListener('click', open);
  elements.closeHelp.addEventListener('click', close);
  elements.helpModal.addEventListener('click', (event) => {
    if (event.target === elements.helpModal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.helpModal.classList.contains('hidden')) {
      close();
    }
  });
}

function initSolveModal() {
  const close = () => {
    stopReplay();
    elements.solveModal.classList.add('hidden');
    elements.solveModal.setAttribute('aria-hidden', 'true');
    state.selectedSolveIndex = null;
  };
  elements.closeSolve.addEventListener('click', close);
  elements.solveModal.addEventListener('click', (event) => {
    if (event.target === elements.solveModal) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.solveModal.classList.contains('hidden')) {
      close();
    }
  });

  elements.replayPlay.addEventListener('click', () => {
    startReplay();
  });
  elements.replayPause.addEventListener('click', () => {
    stopReplay();
  });
  elements.replayPrev.addEventListener('click', () => {
    stepReplay(-1);
  });
  elements.replayNext.addEventListener('click', () => {
    stepReplay(1);
  });
  elements.replaySpeed.addEventListener('change', () => {
    state.replay.speed = Number(elements.replaySpeed.value);
  });

  elements.deleteSolve.addEventListener('click', () => {
    if (state.selectedSolveIndex == null) return;
    const ok = confirm('Eliminar este tiempo?');
    if (!ok) return;
    deleteTime(state.selectedSolveIndex);
    elements.solveModal.classList.add('hidden');
    elements.solveModal.setAttribute('aria-hidden', 'true');
    state.selectedSolveIndex = null;
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
        return { time: item, scramble: '', at: Date.now(), reconstruction: { start: Date.now(), moves: [] } };
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
  const sortedTimes = times.slice().sort((a, b) => a - b);
  const lastEntry = entries[entries.length - 1];
  elements.count.textContent = String(entries.length);
  elements.best.textContent = times.length ? formatTime(Math.min(...times)) : '-';
  elements.worst.textContent = times.length ? formatTime(Math.max(...times)) : '-';
  elements.avg.textContent = times.length ? formatTime(average(times)) : '-';
  elements.median.textContent = times.length ? formatTime(median(sortedTimes)) : '-';
  elements.ao5.textContent = formatAverage(times, 5);
  elements.ao12.textContent = formatAverage(times, 12);
  elements.bestAo5.textContent = formatBestAverage(times, 5);
  elements.bestAo12.textContent = formatBestAverage(times, 12);
  elements.stddev.textContent = times.length ? formatTime(stddev(times)) : '-';
  elements.avgTps.textContent = formatTpsAverage(entries);
  elements.last.textContent = lastEntry ? formatTime(lastEntry.time) : '-';

  const ao5List = rollingAverageList(times, 5);
  const ao12List = rollingAverageList(times, 12);

  elements.times.innerHTML = '';
  entries.slice().reverse().forEach((entry, index) => {
    const originalIndex = entries.length - index - 1;
    const ao5 = ao5List[originalIndex];
    const ao12 = ao12List[originalIndex];
    const row = document.createElement('div');
    row.className = 'time-row';

    const main = document.createElement('button');
    main.className = 'time-main';
    main.type = 'button';
    main.innerHTML = `
      <span class="time-core">#${entries.length - index}  ${formatTime(entry.time)}</span>
      <span class="time-avg">${ao5 ? `ao5 ${formatTime(ao5)}` : ''}</span>
      <span class="time-avg">${ao12 ? `ao12 ${formatTime(ao12)}` : ''}</span>
    `;

    main.addEventListener('click', () => {
      elements.scrambleText.textContent = entry.scramble
        ? entry.scramble
        : '';
      openSolveModal(entry, originalIndex);
    });

    row.append(main);
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
        enqueueMoves([{ type: 'cube', axis: axisMap[base], dir, label }], { source: 'user' });
        return;
      }
      const move = parseMove(mapMirrorLabel(label));
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
        setBasePosition(cubie);
        cubie.userData.coord = { x, y, z };
        cubie.userData.initialCoord = { x, y, z };
        cubeGroup.add(cubie);
        state.cubies.push(cubie);
      }
    }
  }

  scene.add(cubeGroup);
  updateLayerControl();
  updateXray();
  updateExplode();
  updateMirrorCube();
  updateEdgeThickness();
  updateBaseMaterials();
  if (state.showNet) renderNet();
  frameCube();
  updateTitle(size);
  updateGhost();
}

function createCubie(x, y, z, size, baseGeometry, stickerGeometry, options = {}) {
  const { ghost = false } = options;
  const group = new THREE.Group();
  const { base, sticker } = getMaterialTheme();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: base.color,
    metalness: base.metalness,
    roughness: base.roughness,
  });
  const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
  const baseScale = getBaseScale();
  baseMesh.scale.set(baseScale, baseScale, baseScale);
  baseMesh.userData.isBase = true;
  group.add(baseMesh);

  const max = size - 1;
  const stickerColors = {};
  group.userData.stickerColors = stickerColors;

  const active = getActiveColors();
  if (x === max) addSticker(group, stickerGeometry, new THREE.Vector3(1, 0, 0), active.R, 'R', ghost, sticker);
  if (x === 0) addSticker(group, stickerGeometry, new THREE.Vector3(-1, 0, 0), active.L, 'L', ghost, sticker);
  if (y === max) addSticker(group, stickerGeometry, new THREE.Vector3(0, 1, 0), active.U, 'U', ghost, sticker);
  if (y === 0) addSticker(group, stickerGeometry, new THREE.Vector3(0, -1, 0), active.D, 'D', ghost, sticker);
  if (z === max) addSticker(group, stickerGeometry, new THREE.Vector3(0, 0, 1), active.F, 'F', ghost, sticker);
  if (z === 0) addSticker(group, stickerGeometry, new THREE.Vector3(0, 0, -1), active.B, 'B', ghost, sticker);

  if (ghost) {
    baseMaterial.transparent = true;
    baseMaterial.opacity = 0.08;
    baseMaterial.depthWrite = false;
  }

  return group;
}

function addSticker(group, geometry, normal, color, faceKey, ghost = false, theme = null) {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: theme?.metalness ?? 0.2,
    roughness: theme?.roughness ?? 0.6,
  });
  const sticker = new THREE.Mesh(geometry, material);
  sticker.userData.isSticker = true;
  sticker.userData.faceKey = faceKey;
  const stickerScale = getStickerScale();
  sticker.scale.set(stickerScale, stickerScale, stickerScale);
  sticker.position.copy(normal.clone().multiplyScalar(STICKER_OFFSET));
  sticker.lookAt(normal);
  if (ghost) {
    material.transparent = true;
    material.opacity = 0.25;
    material.depthWrite = false;
  }
  group.add(sticker);
  group.userData.stickerColors[faceKey] = color;
}

function onResize() {
  const { clientWidth, clientHeight } = elements.renderer;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight);
  renderReplay();
}

function render() {
  applyDeform(performance.now());
  if (keyLight && fillLight && controls) {
    if (state.lightFollowCamera) {
      keyLight.position.copy(camera.position);
      fillLight.position.copy(camera.position).add(new THREE.Vector3(-4, -2, -4));
    }
    keyLight.target.position.copy(controls.target);
    keyLight.target.updateMatrixWorld();
    fillLight.target.position.copy(controls.target);
    fillLight.target.updateMatrixWorld();
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function applyDeform(now) {
  if (!cubeGroup) return;
  if (state.rotating) return;
  const mode = state.deformMode;
  const strength = clamp(state.deformStrength, 0, 1);
  const amount = strength * 0.28;
  const t = now * 0.001 * state.deformSpeed;

  const applyTo = (cubies) => {
    cubies.forEach((cubie) => {
      const base = cubie.userData.basePosition;
      if (!base) return;
      if (mode === 'none' || state.rotating) {
        cubie.position.copy(base);
        return;
      }

      const bx = base.x;
      const by = base.y;
      const bz = base.z;

      if (mode === 'twist') {
        const angle = Math.sin(t * 1.6 + by * 0.6) * amount * 2.2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = bx * cos - bz * sin;
        const z = bx * sin + bz * cos;
        cubie.position.set(x, by, z);
        return;
      }

      let dx = 0;
      let dy = 0;
      let dz = 0;

      if (mode === 'jelly') {
        dx = Math.sin(t * 2.3 + by * 1.3) * amount;
        dy = Math.sin(t * 2.9 + bx * 1.1) * amount;
        dz = Math.sin(t * 2.1 + (bx + bz) * 0.8) * amount;
      }

      if (mode === 'wave') {
        dy = Math.sin(t * 2 + bx * 0.9 + bz * 0.9) * amount * 1.2;
        dx = Math.sin(t * 1.5 + by * 0.7) * amount * 0.5;
        dz = Math.sin(t * 1.7 + by * 0.6) * amount * 0.4;
      }

      cubie.position.set(bx + dx, by + dy, bz + dz);
    });
  };

  applyTo(state.cubies);
  if (ghostGroup) applyTo(ghostGroup.children);
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
  camera.position.copy(center.clone().add(dir.multiplyScalar(radius * state.cameraDistance)));
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
    const rotationLabel = keyToRotationLabel(key);
    enqueueMoves([{ type: 'cube', duration, label: rotationLabel, ...KEY_ROTATIONS[key] }], { source: 'user' });
    return;
  }

  if (KEY_MOVES[key] || MOVE_AXIS[key]) {
    const mapped = KEY_MOVES[key] || key;
    const base = mapped.replace("'", '');
    const prime = mapped.includes("'");
    const primeFromShift = event.shiftKey ? !prime : prime;
    const label = primeFromShift ? `${base}'` : base;
    const move = { ...parseMove(mapMirrorLabel(label)), duration };
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
  if (label === 'l' || label === "l'") {
    const prime = label.includes("'");
    const config = MOVE_AXIS.L;
    return {
      label,
      axis: config.axis,
      face: config.face,
      dir: prime ? -config.dir : config.dir,
      layers: [0, 1].filter((v) => v < state.size),
    };
  }
  if (label === 'u' || label === "u'") {
    const prime = label.includes("'");
    const config = MOVE_AXIS.U;
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

function parseScrambleToMoves(text, size) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const moves = [];
  tokens.forEach((token) => {
    let t = token;
    let turns = 1;
    let prime = false;

    if (t.endsWith("2")) {
      turns = 2;
      t = t.slice(0, -1);
    }
    if (t.endsWith("'")) {
      prime = true;
      t = t.slice(0, -1);
    }

    const match = t.match(/^(\d+)?([rludfb])w?$/i);
    if (!match) return;
    const width = match[1] ? Math.max(1, Number(match[1])) : (t.toLowerCase().includes('w') ? 2 : 1);
    const face = match[2].toUpperCase();
    const config = MOVE_AXIS[face];
    if (!config) return;
    const dir = prime ? -config.dir : config.dir;
    const layers = buildLayers(face, width, size);

    moves.push({
      label: token,
      axis: config.axis,
      face: config.face,
      dir,
      layers,
      turns,
    });
  });
  return moves;
}

function buildLayers(face, width, size) {
  const max = size - 1;
  const clamped = Math.min(width, size);
  if (face === 'R' || face === 'U' || face === 'F') {
    return Array.from({ length: clamped }, (_, i) => max - i);
  }
  return Array.from({ length: clamped }, (_, i) => i);
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
  const tagged = moves.map((m) => ({ ...m, source: options.source || m.source }));
  state.queue.push(...tagged);
  const hasFaceTurn = tagged.some((m) => m.type !== 'cube');
  if (options.source === 'user' && state.awaitingSolve && !state.timerRunning && hasFaceTurn) {
    state.awaitingSolve = false;
    state.solveActive = true;
    state.solveStartPerf = performance.now();
    state.solveStartDate = Date.now();
    startTimer();
    if (state.preSolveRecording.length) {
      const startPerf = state.solveStartPerf;
      const pre = state.preSolveRecording.map((rec) => ({
        ...rec,
        t: rec.t - startPerf,
      }));
      state.solveRecording.push(...pre);
      state.preSolveRecording = [];
      state.preSolveStartPerf = 0;
    }
  }
  if (options.source === 'user') {
    const now = performance.now();
    tagged.forEach((move) => {
      const payload = {
        label: move.label || move.type || 'move',
        t: now,
        duration: move.duration ?? 0,
        type: move.type || 'layer',
        axis: move.axis,
        face: move.face,
        dir: move.dir,
        depth: move.depth,
        layers: move.layers,
        layerIndex: move.layerIndex,
        turns: move.turns,
      };

      if (state.solveActive) {
        payload.t = Math.max(0, now - (state.solveStartPerf || now));
        state.solveRecording.push(payload);
        if (move.type !== 'cube' && willSolveAfterMove(move)) {
          stopSolveEarly();
        }
      } else if (state.awaitingSolve && move.type === 'cube') {
        if (!state.preSolveStartPerf) state.preSolveStartPerf = now;
        payload.t = now;
        state.preSolveRecording.push(payload);
      }
    });
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
    const turns = move.turns ?? 1;
    const angle = move.dir * (Math.PI / 2) * turns;

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
        updateCoord(cubie, axis, move.dir, state.size, turns);
        snapCubiePosition(cubie, state.size);
        cubeGroup.add(cubie);
      });

      cubeGroup.remove(pivot);
      if (state.showNet) renderNet();
      maybePartyPalette(move);
      if (state.solveActive && isCubeSolved()) {
        state.solveActive = false;
        onSolveComplete();
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
    const turns = move.turns ?? 1;
    const angle = move.dir * (Math.PI / 2) * turns;
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
        updateCoord(cubie, axis, move.dir, state.size, turns);
        snapCubiePosition(cubie, state.size);
        cubeGroup.add(cubie);
      });
      cubeGroup.remove(pivot);
      if (state.showNet) renderNet();
      maybePartyPalette(move);
      if (state.solveActive && isCubeSolved()) {
        state.solveActive = false;
        onSolveComplete();
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


function updateCoord(cubie, axis, dir, size, turns = 1) {
  const coord = cubie.userData.coord;
  const offset = (size - 1) / 2;
  let nx = coord.x - offset;
  let ny = coord.y - offset;
  let nz = coord.z - offset;

  for (let i = 0; i < turns; i++) {
    const x = nx;
    const y = ny;
    const z = nz;
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
  }

  coord.x = Math.round(nx + offset);
  coord.y = Math.round(ny + offset);
  coord.z = Math.round(nz + offset);
}

function snapCubiePosition(cubie, size) {
  const offset = (size - 1) / 2;
  const { x, y, z } = cubie.userData.coord;
  const spacing = SPACING * (state.exploded ? 1.35 : 1);
  const basePos = new THREE.Vector3(
    (x - offset) * spacing,
    (y - offset) * spacing,
    (z - offset) * spacing
  );
  cubie.position.copy(basePos);
  setBasePosition(cubie, basePos);
  if (state.mirrorCube) {
    const mirrorOffset = getMirrorOffset(cubie.userData.coord, size, spacing);
    cubie.position.add(mirrorOffset);
  }
}

function setBasePosition(cubie, pos = null) {
  if (!cubie.userData.basePosition) {
    cubie.userData.basePosition = new THREE.Vector3();
  }
  if (pos) {
    cubie.userData.basePosition.copy(pos);
  } else {
    cubie.userData.basePosition.copy(cubie.position);
  }
}

function getMirrorOffset(coord, size, spacing) {
  const offset = (size - 1) / 2;
  const max = Math.max(offset, 1);
  const nx = (coord.x - offset) / max;
  const ny = (coord.y - offset) / max;
  const nz = (coord.z - offset) / max;
  const gap = spacing * 0.055;
  const ease = (v) => Math.sign(v) * Math.sqrt(Math.abs(v));
  const maxAbs = Math.max(Math.abs(nx), Math.abs(ny), Math.abs(nz));
  const layerBoost = 0.6 + maxAbs * 0.8;
  return new THREE.Vector3(ease(nx) * gap * layerBoost, ease(ny) * gap * layerBoost, ease(nz) * gap * layerBoost);
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

function pushScramble(text, moves) {
  const entry = {
    moves: moves.map((m) => ({ ...m })),
    text,
  };
  state.scrambleHistory.push(entry);
  state.scrambleIndex = state.scrambleHistory.length - 1;
  syncScrambleFromHistory();
}

function syncScrambleFromHistory() {
  const entry = state.scrambleHistory[state.scrambleIndex];
  if (!entry) return;
  state.scrambleMoves = entry.moves.map((m) => ({ ...m }));
  state.currentScramble = entry.text;
  elements.scrambleText.textContent = entry.text;
}

async function addNewScramble() {
  const { text, moves } = await generateOfficialScramble(state.size);
  pushScramble(text, moves);
}

function resetScrambleHistory() {
  state.scrambleHistory = [];
  state.scrambleIndex = -1;
  addNewScramble();
}

async function generateOfficialScramble(size) {
  const eventMap = {
    2: '222',
    3: '333',
    4: '444',
    5: '555',
    6: '666',
    7: '777',
  };
  if (eventMap[size]) {
    try {
      const scrambler = await getCubingScrambler();
      if (!scrambler) throw new Error('scrambler_unavailable');
      const alg = await scrambler(eventMap[size]);
      const text = alg.toString();
      const moves = parseScrambleToMoves(text, size);
      return { text, moves };
    } catch (err) {
      // fallback below
    }
  }
  const moves = generateScramble();
  return { text: stringifyMoves(moves), moves };
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
    reconstruction: {
      start: state.solveStartDate || Date.now(),
      moves: state.solveRecording.slice(),
    },
  });
  persistSessions();
  renderSessions();
  state.timerElapsed = 0;
  state.solveRecording = [];
  state.solveStartPerf = 0;
  state.solveStartDate = 0;
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

function median(sortedValues) {
  if (!sortedValues.length) return 0;
  const mid = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 0) {
    return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
  }
  return sortedValues[mid];
}

function stddev(values) {
  if (!values.length) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

function formatAverage(values, count) {
  if (values.length < count) return '-';
  const slice = values.slice(-count);
  const sorted = slice.slice().sort((a, b) => a - b);
  const trimmed = sorted.slice(1, -1);
  const avg = average(trimmed);
  return formatTime(avg);
}

function formatBestAverage(values, count) {
  if (values.length < count) return '-';
  const list = rollingAverageList(values, count).filter((v) => Number.isFinite(v));
  if (!list.length) return '-';
  return formatTime(Math.min(...list));
}

function formatTpsAverage(entries) {
  const tpsValues = entries
    .map((entry) => tpsForEntry(entry))
    .filter((v) => Number.isFinite(v));
  if (!tpsValues.length) return '-';
  const avg = average(tpsValues);
  return `${avg.toFixed(2)} TPS`;
}

function tpsForEntry(entry) {
  if (!entry?.time) return null;
  const moves = entry.reconstruction?.moves || [];
  if (!moves.length) return null;
  const effectiveMoves = moves.filter((m) => (m.t || 0) >= 0);
  if (!effectiveMoves.length) return null;
  const seconds = entry.time / 1000;
  if (seconds <= 0) return null;
  return effectiveMoves.length / seconds;
}

function rollingAverageList(values, count) {
  return values.map((_, index) => {
    const start = index - count + 1;
    if (start < 0) return null;
    const slice = values.slice(start, index + 1);
    const sorted = slice.slice().sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1);
    return average(trimmed);
  });
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
  const active = getActiveColors();
  const { sticker } = getMaterialTheme();
  state.cubies.forEach((cubie) => {
    const map = cubie.userData.stickerColors || {};
    cubie.children.forEach((child) => {
      if (!child.userData.isSticker) return;
      const faceKey = child.userData.faceKey;
      const color = active[faceKey];
      child.material.color.set(color);
      child.material.metalness = sticker.metalness;
      child.material.roughness = sticker.roughness;
      map[faceKey] = color;
    });
    cubie.userData.stickerColors = map;
  });
  if (ghostGroup) {
    ghostGroup.children.forEach((cubie) => {
      cubie.children.forEach((child) => {
        if (!child.userData.isSticker) return;
        const faceKey = child.userData.faceKey;
        const color = active[faceKey];
        child.material.color.set(color);
        child.material.metalness = sticker.metalness;
        child.material.roughness = sticker.roughness;
      });
    });
  }
}

function updateEdgeThickness() {
  const baseScale = getBaseScale();
  const stickerScale = getStickerScale();
  state.cubies.forEach((cubie) => {
    cubie.children.forEach((child) => {
      if (child.userData.isBase) {
        child.scale.set(baseScale, baseScale, baseScale);
      }
      if (child.userData.isSticker) {
        child.scale.set(stickerScale, stickerScale, stickerScale);
      }
    });
  });
  if (state.showNet) renderNet();
}

function applyCubeType() {
  state.mirrorCube = state.cubeType === 'mirror';
  updateMirrorCube();
  updateStickerColors();
  updateBaseMaterials();
  updatePaletteControls();
  if (state.showNet) renderNet();
}

function updateBaseMaterials() {
  const { base } = getMaterialTheme();
  state.cubies.forEach((cubie) => {
    cubie.children.forEach((child) => {
      if (!child.userData.isBase) return;
      child.material.color.set(base.color);
      child.material.metalness = base.metalness;
      child.material.roughness = base.roughness;
    });
  });
  if (ghostGroup) {
    ghostGroup.children.forEach((cubie) => {
      cubie.children.forEach((child) => {
        if (!child.userData.isBase) return;
        child.material.color.set(base.color);
        child.material.metalness = base.metalness;
        child.material.roughness = base.roughness;
      });
    });
  }
}

function updatePaletteControls() {
  const disabled = state.cubeType === 'mirror';
  if (elements.paletteSelect) elements.paletteSelect.disabled = disabled;
  if (elements.resetPalette) elements.resetPalette.disabled = disabled;
  if (elements.colorGrid) {
    elements.colorGrid.querySelectorAll('input[type=\"color\"]').forEach((input) => {
      input.disabled = disabled;
    });
  }
}

function getActiveColors() {
  if (state.cubeType === 'mirror') return MIRROR_METAL_COLORS;
  return state.colors;
}

function getMaterialTheme() {
  if (state.cubeType === 'mirror') {
    return {
      base: { color: '#3f4855', metalness: 0.85, roughness: 0.22 },
      sticker: { metalness: 0.95, roughness: 0.16 },
    };
  }
  return {
    base: { color: BASE_INNER, metalness: 0.1, roughness: 0.85 },
    sticker: { metalness: 0.2, roughness: 0.6 },
  };
}

function getBaseScale() {
  const t = clamp(state.edgeThickness / 100, 0, 1);
  return BASE_SCALE + BASE_SCALE_RANGE * t;
}

function getStickerScale() {
  const t = clamp(state.edgeThickness / 100, 0, 1);
  const size = STICKER_SCALE + STICKER_SCALE_RANGE * t;
  return size / STICKER_SIZE;
}

function updateGhost() {
  if (ghostGroup) {
    scene.remove(ghostGroup);
    ghostGroup = null;
  }
  if (!state.ghostMode) return;
  ghostGroup = buildGhostCube(state.size);
  scene.add(ghostGroup);
  updateMirrorCube();
  updateBaseMaterials();
  updateStickerColors();
}

function buildGhostCube(size) {
  const group = new THREE.Group();
  const offset = (size - 1) / 2;
  const baseGeometry = new THREE.BoxGeometry(1, 1, 1);
  const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cubie = createCubie(x, y, z, size, baseGeometry, stickerGeometry, { ghost: true });
        cubie.position.set(
          (x - offset) * SPACING,
          (y - offset) * SPACING,
          (z - offset) * SPACING
        );
        setBasePosition(cubie);
        group.add(cubie);
      }
    }
  }
  return group;
}

function updateExplode() {
  state.cubies.forEach((cubie) => snapCubiePosition(cubie, state.size));
  if (state.showNet) renderNet();
}

function updateMirrorCube() {
  const applyTo = (cubies, size) => {
    const offset = (size - 1) / 2;
    const max = Math.max(offset, 1);
    const strength = state.mirrorCube ? 0.5 : 0;
    cubies.forEach((cubie) => {
      const { x, y, z } = cubie.userData.coord;
      const nx = (x - offset) / max;
      const ny = (y - offset) / max;
      const nz = (z - offset) / max;
      const ax = Math.abs(nx);
      const ay = Math.abs(ny);
      const az = Math.abs(nz);
      const centerBias = 0.4;
      const sx = 1 + strength * (nx * 0.5 + (ax - centerBias) * 0.75);
      const sy = 1 + strength * (ny * 0.5 + (ay - centerBias) * 0.75);
      const sz = 1 + strength * (nz * 0.5 + (az - centerBias) * 0.75);
      cubie.scale.set(sx, sy, sz);
      const scaleFactor = (sx + sy + sz) / 3;
      const baseScale = getBaseScale() * scaleFactor;
      const stickerScale = getStickerScale() * scaleFactor;
      cubie.children.forEach((child) => {
        if (child.userData.isBase) {
          child.scale.set(baseScale, baseScale, baseScale);
        }
        if (child.userData.isSticker) {
          child.scale.set(stickerScale, stickerScale, stickerScale);
        }
      });
      if (state.mirrorCube) {
        const spacing = SPACING * (state.exploded ? 1.35 : 1);
        const mirrorOffset = getMirrorOffset(cubie.userData.coord, size, spacing);
        cubie.position.copy(cubie.userData.basePosition || cubie.position).add(mirrorOffset);
      }
    });
  };

  applyTo(state.cubies, state.size);
  if (ghostGroup) applyTo(ghostGroup.children, state.size);
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
  const baseColor = getMaterialTheme().base.color;

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
  const grid = Array.from({ length: size * size }).fill(baseColor);

  state.cubies.forEach((cubie) => {
    if (cubie.userData.coord[map.axis] !== map.value) return;
    const { row, col } = map.get(cubie.userData.coord);
    const color = getStickerColor(cubie, faceKey);
    grid[row * size + col] = color || baseColor;
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

function willSolveAfterMove(move) {
  const snapshot = snapshotMainCube();
  applyLayerInstantMain(move);
  const solved = isCubeSolved();
  restoreMainCube(snapshot);
  return solved;
}

function snapshotMainCube() {
  return state.cubies.map((cubie) => ({
    cubie,
    coord: { ...cubie.userData.coord },
    position: cubie.position.clone(),
    quaternion: cubie.quaternion.clone(),
  }));
}

function restoreMainCube(snapshot) {
  snapshot.forEach((snap) => {
    snap.cubie.userData.coord = { ...snap.coord };
    snap.cubie.position.copy(snap.position);
    snap.cubie.quaternion.copy(snap.quaternion);
  });
}

function applyLayerInstantMain(move) {
  const m = normalizeReplayMove(move) || move;
  const axis = m.axis;
  const layer = layerIndexForMove(m);
  const layers = Array.isArray(layer) ? layer : [layer];
  const pivot = new THREE.Group();
  const affected = state.cubies.filter((c) => layers.includes(c.userData.coord[axis]));
  cubeGroup.add(pivot);
  affected.forEach((cubie) => {
    pivot.attach(cubie);
  });
  const turns = m.turns ?? 1;
  const angle = m.dir * (Math.PI / 2) * turns;
  pivot.rotation[axis] = angle;
  pivot.updateMatrixWorld();
  affected.forEach((cubie) => {
    cubie.applyMatrix4(pivot.matrix);
    updateCoord(cubie, axis, m.dir, state.size, turns);
    snapCubiePosition(cubie, state.size);
    cubeGroup.add(cubie);
  });
  cubeGroup.remove(pivot);
}

function stopSolveEarly() {
  if (!state.timerRunning) return;
  state.solveActive = false;
  stopTimer();
  addNewScramble();
}

function onSolveComplete() {
  if (state.partyMode) {
    pulseCube();
  }
  addNewScramble();
}

function pulseCube() {
  const start = performance.now();
  const duration = 240;
  const base = 1;
  const peak = 1.08;
  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    const k = t < 0.5 ? t * 2 : (1 - t) * 2;
    const scale = base + (peak - base) * k;
    cubeGroup.scale.set(scale, scale, scale);
    if (ghostGroup) ghostGroup.scale.set(scale, scale, scale);
    if (t < 1) requestAnimationFrame(animate);
    else {
      cubeGroup.scale.set(1, 1, 1);
      if (ghostGroup) ghostGroup.scale.set(1, 1, 1);
    }
  }
  requestAnimationFrame(animate);
}

function openSolveModal(entry, index) {
  state.selectedSolveIndex = index;
  const date = new Date(entry.at || Date.now());
  elements.solveTime.textContent = `Tiempo: ${formatTime(entry.time)}`;
  elements.solveDate.textContent = `Fecha: ${date.toLocaleString()}`;
  const tps = tpsForEntry(entry);
  const moves = entry.reconstruction?.moves || [];
  const effectiveMoves = moves.filter((m) => (m.t || 0) >= 0);
  elements.solveTps.textContent = tps ? `TPS: ${tps.toFixed(2)} (${effectiveMoves.length} movimientos)` : `TPS: - (${effectiveMoves.length} movimientos)`;
  elements.solveScramble.textContent = entry.scramble || '-';

  elements.solveMoves.innerHTML = '';
  if (!moves.length) {
    const empty = document.createElement('div');
    empty.className = 'hint';
    empty.textContent = 'No hay reconstruccion guardada.';
    elements.solveMoves.appendChild(empty);
  } else {
    let counter = 0;
    moves.forEach((move, idx) => {
      if ((move.t || 0) >= 0) counter += 1;
      const row = document.createElement('div');
      row.className = 'move-row';
      const t = document.createElement('div');
      const tSeconds = (move.t / 1000).toFixed(2);
      t.textContent = `${tSeconds}s`;
      const label = document.createElement('div');
      const prefix = (move.t || 0) >= 0 ? `#${counter} ` : 'pre ';
      label.textContent = `${prefix}${move.label || 'mov'}`;
      const dur = document.createElement('div');
      dur.textContent = move.duration ? `${Math.round(move.duration)}ms` : '-';
      row.append(t, label, dur);
      elements.solveMoves.appendChild(row);
    });
  }

  prepareReplay(entry);

  elements.solveModal.classList.remove('hidden');
  elements.solveModal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    renderReplay();
    frameReplayCube();
  });
}

function prepareReplay(entry) {
  stopReplay();
  ensureReplayScene();
  buildReplayCube(state.size);

  const scrambleText = entry.scramble || '';
  const baseMoves = scrambleText ? parseScrambleToMoves(scrambleText, state.size) : [];
  const moves = (entry.reconstruction?.moves || []).map((m) => ({
    label: m.label,
    t: m.t || 0,
    duration: m.duration || 0,
    type: m.type || 'layer',
    axis: m.axis,
    face: m.face,
    dir: m.dir,
    depth: m.depth,
    layers: m.layers,
    layerIndex: m.layerIndex,
    turns: m.turns,
  }));

  const sortedMoves = moves.slice().sort((a, b) => (a.t || 0) - (b.t || 0));
  const preMoves = sortedMoves.filter((m) => (m.t || 0) < 0);
  const solveMoves = sortedMoves.filter((m) => (m.t || 0) >= 0);
  const preDuration = preMoves.length ? Math.abs(preMoves[0].t || 0) : 0;
  const totalDuration = solveMoves.length ? (solveMoves[solveMoves.length - 1].t || 0) : 0;
  const baseT = sortedMoves.length ? (sortedMoves[0].t || 0) : 0;
  const solveStartT = solveMoves.length ? (solveMoves[0].t || 0) : 0;

  state.replay.baseMoves = baseMoves;
  state.replay.moves = [...preMoves, ...solveMoves];
  state.replay.index = 0;
  state.replay.preDuration = preDuration;
  state.replay.totalDuration = totalDuration;
  state.replay.startOffset = preDuration;
  state.replay.baseT = baseT;
  state.replay.solveStartT = solveStartT;

  resetReplayCube();
  applyMovesInstantToReplay(baseMoves);
  frameReplayCube();
  elements.replayTimer.textContent = formatTime(0);
}

function startReplay() {
  if (!state.replay.moves.length) return;
  stopReplay();
  resetReplayCube();
  applyMovesInstantToReplay(state.replay.baseMoves);
  frameReplayCube();
  state.replay.active = true;
  state.replay.index = 0;
  state.replay.startAt = performance.now();
  playFromIndex(state.replay.index);
  tickReplayTimer();
}

async function playFromIndex(startIndex) {
  const playId = ++state.replay.playId;
  const speed = state.replay.speed || 1;
  const baseT = state.replay.baseT ?? 0;
  const realStart = performance.now();

  for (let i = startIndex; i < state.replay.moves.length; i += 1) {
    if (!state.replay.active || state.replay.playId !== playId) return;
    const move = state.replay.moves[i];
    const desiredStart = Math.max(0, (move.t - baseT) / speed);
    const elapsed = (performance.now() - realStart);
    const wait = Math.max(0, desiredStart - elapsed);
    if (wait) {
      await sleep(wait);
    }
    if (!state.replay.active || state.replay.playId !== playId) return;
    const duration = Math.max(40, Math.min(260, (move.duration || 120) / speed));
    await applyMoveAnimatedToReplay(move, duration);
    state.replay.index = i + 1;
  }

  state.replay.active = false;
  const finalTime = Math.max(0, state.replay.totalDuration - state.replay.solveStartT);
  elements.replayTimer.textContent = formatTime(finalTime);
}

function stopReplay() {
  state.replay.active = false;
  state.replay.playId += 1;
  state.replay.timers.forEach((t) => clearTimeout(t));
  state.replay.timers = [];
}

function tickReplayTimer() {
  if (!state.replay.active) return;
  const elapsed = (performance.now() - state.replay.startAt) * (state.replay.speed || 1);
  const timeline = (state.replay.baseT || 0) + elapsed;
  const solveTime = Math.max(0, timeline - (state.replay.solveStartT || 0));
  elements.replayTimer.textContent = formatTime(solveTime);
  requestAnimationFrame(tickReplayTimer);
}

async function stepReplay(direction) {
  stopReplay();
  if (direction === 1 && state.replay.index < state.replay.moves.length) {
    const move = state.replay.moves[state.replay.index];
    await applyMoveAnimatedToReplay(move);
    state.replay.index += 1;
    return;
  }
  if (direction === -1 && state.replay.index > 0) {
    const move = inverseReplayMove(state.replay.moves[state.replay.index - 1]);
    await applyMoveAnimatedToReplay(move);
    state.replay.index -= 1;
    return;
  }
}

function ensureReplayScene() {
  if (state.replay.scene) return;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1120');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(6, 6, 6);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  elements.replayViewport.innerHTML = '';
  renderer.setClearColor('#0b1120');
  elements.replayViewport.appendChild(renderer.domElement);
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(8, 10, 6);
  scene.add(ambient, directional);

  state.replay.scene = scene;
  state.replay.camera = camera;
  state.replay.renderer = renderer;
  renderReplay();
}

function renderReplay() {
  if (!state.replay.renderer || !state.replay.scene || !state.replay.camera) return;
  const { clientWidth, clientHeight } = elements.replayViewport;
  if (clientWidth && clientHeight) {
    state.replay.camera.aspect = clientWidth / clientHeight;
    state.replay.camera.updateProjectionMatrix();
    state.replay.renderer.setSize(clientWidth, clientHeight);
  }
  if (state.replay.group) {
    state.replay.group.position.set(0, 0, 0);
  }
  state.replay.renderer.render(state.replay.scene, state.replay.camera);
}

function buildReplayCube(size) {
  if (state.replay.group) {
    state.replay.scene.remove(state.replay.group);
  }
  const group = new THREE.Group();
  const cubies = [];
  const offset = (size - 1) / 2;
  const baseGeometry = new THREE.BoxGeometry(1, 1, 1);
  const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cubie = createCubie(x, y, z, size, baseGeometry, stickerGeometry);
        cubie.userData.coord = { x, y, z };
        cubie.userData.initialCoord = { x, y, z };
        cubie.position.set(
          (x - offset) * SPACING,
          (y - offset) * SPACING,
          (z - offset) * SPACING
        );
        group.add(cubie);
        cubies.push(cubie);
      }
    }
  }
  state.replay.group = group;
  state.replay.cubies = cubies;
  state.replay.size = size;
  state.replay.scene.add(group);
  frameReplayCube();
}

function frameReplayCube() {
  const { group, camera } = state.replay;
  if (!group || !camera) return;
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.8;
  camera.position.copy(center.clone().add(new THREE.Vector3(0, 1, 1).normalize().multiplyScalar(radius * 2.4)));
  camera.lookAt(center);
  group.position.sub(center);
  renderReplay();
}

function resetReplayCube() {
  const size = state.replay.size;
  const offset = (size - 1) / 2;
  state.replay.cubies.forEach((cubie) => {
    const initial = cubie.userData.initialCoord || cubie.userData.coord;
    cubie.userData.coord = { ...initial };
    cubie.position.set(
      (initial.x - offset) * SPACING,
      (initial.y - offset) * SPACING,
      (initial.z - offset) * SPACING
    );
    cubie.quaternion.identity();
  });
  renderReplay();
}

function applyMovesInstantToReplay(moves) {
  moves.forEach((move) => applyMoveInstantToReplay(move));
}

function applyMoveInstantToReplay(move) {
  const m = normalizeReplayMove(move);
  if (!m) return;
  if (m.type === 'cube') {
    applyCubeInstantToReplay(m);
  } else {
    applyLayerInstantToReplay(m);
  }
  renderReplay();
}

function applyMoveAnimatedToReplay(move, durationOverride) {
  const m = normalizeReplayMove(move);
  if (!m) return;
  const duration = Math.max(60, Math.min(260, durationOverride || m.duration || 120));
  if (m.type === 'cube') {
    return rotateCubeOnReplay(m, duration);
  }
  return rotateLayerOnReplay(m, duration);
}

function normalizeReplayMove(move) {
  if (!move) return null;
  if (move.axis && typeof move.dir === 'number') {
    return {
      label: move.label,
      axis: move.axis,
      face: move.face,
      dir: move.dir,
      depth: move.depth,
      layers: move.layers,
      layerIndex: move.layerIndex,
      turns: move.turns || 1,
      type: move.type || (move.face ? 'layer' : 'cube'),
    };
  }
  if (move.type === 'cube') {
    const parsed = parseRotationLabel(move.label);
    if (!parsed) return null;
    return { ...parsed, type: 'cube', turns: move.turns || parsed.turns || 1 };
  }
  return parseMoveLabel(move.label);
}

function parseMoveLabel(label) {
  if (!label) return null;
  const token = label.trim();
  let turns = 1;
  let prime = false;
  let base = token;
  if (base.endsWith('2')) {
    turns = 2;
    base = base.slice(0, -1);
  }
  if (base.endsWith("'")) {
    prime = true;
    base = base.slice(0, -1);
  }

  if (['M', 'r', 'l'].includes(base)) {
    const move = parseMove(prime ? `${base}'` : base);
    return { ...move, turns };
  }

  const config = MOVE_AXIS[base];
  if (!config) return null;
  const dir = prime ? -config.dir : config.dir;
  return {
    label,
    axis: config.axis,
    face: config.face,
    dir,
    depth: 1,
    turns,
  };
}

function parseRotationLabel(label) {
  if (!label) return null;
  let turns = 1;
  let prime = false;
  let base = label.trim().toLowerCase();
  if (base.endsWith('2')) {
    turns = 2;
    base = base.slice(0, -1);
  }
  if (base.endsWith("'")) {
    prime = true;
    base = base.slice(0, -1);
  }
  const axisMap = { x: 'x', y: 'y', z: 'z' };
  if (!axisMap[base]) return null;
  const dir = prime ? 1 : -1;
  return { label, axis: axisMap[base], dir, turns };
}

function inverseReplayMove(move) {
  if (!move) return move;
  const m = { ...move };
  if (typeof m.dir === 'number') m.dir *= -1;
  if (m.label) {
    if (m.label.includes("'")) {
      m.label = m.label.replace("'", '');
    } else if (m.label.endsWith('2')) {
      // keep double turns as is
    } else {
      m.label = `${m.label}'`;
    }
  }
  return m;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rotateLayerOnReplay(move, duration) {
  return new Promise((resolve) => {
  const axis = move.axis;
  const layer = layerIndexForMove(move);
  const layers = Array.isArray(layer) ? layer : [layer];
  const turns = move.turns ?? 1;
  const angle = move.dir * (Math.PI / 2) * turns;
  const pivot = new THREE.Group();
  const affected = state.replay.cubies.filter((c) => layers.includes(c.userData.coord[axis]));
  state.replay.group.add(pivot);
  affected.forEach((cubie) => pivot.attach(cubie));
  const start = performance.now();

  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    pivot.rotation[axis] = angle * t;
    renderReplay();
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      pivot.rotation[axis] = angle;
      pivot.updateMatrixWorld();
      affected.forEach((cubie) => {
        cubie.applyMatrix4(pivot.matrix);
        updateCoord(cubie, axis, move.dir, state.replay.size, turns);
        snapCubiePosition(cubie, state.replay.size);
        state.replay.group.add(cubie);
      });
      state.replay.group.remove(pivot);
      renderReplay();
      resolve();
    }
  }

  requestAnimationFrame(animate);
  });
}

function rotateCubeOnReplay(move, duration) {
  return new Promise((resolve) => {
  const axis = move.axis;
  const turns = move.turns ?? 1;
  const angle = move.dir * (Math.PI / 2) * turns;
  const pivot = new THREE.Group();
  state.replay.group.add(pivot);
  state.replay.cubies.forEach((cubie) => pivot.attach(cubie));
  const start = performance.now();

  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    pivot.rotation[axis] = angle * t;
    renderReplay();
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      pivot.rotation[axis] = angle;
      pivot.updateMatrixWorld();
      state.replay.cubies.forEach((cubie) => {
        cubie.applyMatrix4(pivot.matrix);
        updateCoord(cubie, axis, move.dir, state.replay.size, turns);
        snapCubiePosition(cubie, state.replay.size);
        state.replay.group.add(cubie);
      });
      state.replay.group.remove(pivot);
      renderReplay();
      resolve();
    }
  }

  requestAnimationFrame(animate);
  });
}

function applyLayerInstantToReplay(move) {
  const axis = move.axis;
  const layer = layerIndexForMove(move);
  const layers = Array.isArray(layer) ? layer : [layer];
  const pivot = new THREE.Group();
  const affected = state.replay.cubies.filter((c) => layers.includes(c.userData.coord[axis]));
  state.replay.group.add(pivot);
  affected.forEach((cubie) => {
    pivot.attach(cubie);
  });
  const turns = move.turns ?? 1;
  const angle = move.dir * (Math.PI / 2) * turns;
  pivot.rotation[axis] = angle;
  pivot.updateMatrixWorld();
  affected.forEach((cubie) => {
    cubie.applyMatrix4(pivot.matrix);
    updateCoord(cubie, axis, move.dir, state.replay.size, turns);
    snapCubiePosition(cubie, state.replay.size);
    state.replay.group.add(cubie);
  });
  state.replay.group.remove(pivot);
}

function applyCubeInstantToReplay(move) {
  const axis = move.axis;
  const pivot = new THREE.Group();
  state.replay.group.add(pivot);
  state.replay.cubies.forEach((cubie) => {
    pivot.attach(cubie);
  });
  const turns = move.turns ?? 1;
  const angle = move.dir * (Math.PI / 2) * turns;
  pivot.rotation[axis] = angle;
  pivot.updateMatrixWorld();
  state.replay.cubies.forEach((cubie) => {
    cubie.applyMatrix4(pivot.matrix);
    updateCoord(cubie, axis, move.dir, state.replay.size, turns);
    snapCubiePosition(cubie, state.replay.size);
    state.replay.group.add(cubie);
  });
  state.replay.group.remove(pivot);
}

function maybePartyPalette(move) {
  if (!state.partyMode) return;
  if (move.source !== 'user') return;
  const chance = 0.12;
  if (Math.random() > chance) return;
  const paletteNames = Object.keys(PALETTES);
  const next = paletteNames[Math.floor(Math.random() * paletteNames.length)];
  state.paletteName = next;
  state.colors = { ...PALETTES[next] };
  if (elements.paletteSelect) elements.paletteSelect.value = next;
  persistPalette();
  updateStickerColors();
  updateGhost();
  if (state.showNet) renderNet();
  pulseCube();
}
