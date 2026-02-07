import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

const state = {
  size: 3,
  layerDepth: 1,
  cubies: [],
  queue: [],
  rotating: false,
  scrambleMoves: [],
  currentScramble: '',
  timerRunning: false,
  timerStart: 0,
  timerElapsed: 0,
  timerRaf: 0,
  sessions: {},
  activeSession: 'Default',
  lastKeyTime: 0,
};

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
  sessionName: document.querySelector('#sessionName'),
  createSession: document.querySelector('#createSession'),
  sessionSelect: document.querySelector('#sessionSelect'),
  deleteSession: document.querySelector('#deleteSession'),
  best: document.querySelector('#best'),
  avg: document.querySelector('#avg'),
  count: document.querySelector('#count'),
  times: document.querySelector('#times'),
};

let scene;
let camera;
let renderer;
let controls;
let cubeGroup;
const SPACING = 1.08;

const MOVE_KEYS = ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"];
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
  L: "D'",
  D: "L",
  F: "U'",
  W: "B'",
  E: "L'",
  S: "D",
  H: "F",
  G: "F'",
};

const KEY_ROTATIONS = {
  'Ñ': { axis: 'x', dir: -1 }, // rotacion completa eje X, sentido horario (visto desde +X)
};

const COLORS = {
  R: '#e11d48',
  L: '#f97316',
  U: '#f8fafc',
  D: '#facc15',
  F: '#22c55e',
  B: '#3b82f6',
  inner: '#111827',
};

init();

function init() {
  initScene();
  initUI();
  initSessions();
  buildCube(state.size);
  render();
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
  });

  elements.rebuild.addEventListener('click', () => {
    state.size = Number(elements.size.value);
    state.layerDepth = 1;
    state.queue = [];
    state.rotating = false;
    updateLayerControl();
    buildCube(state.size);
    frameCube();
  });

  elements.resetView.addEventListener('click', () => {
    frameCube();
  });

  elements.layer.addEventListener('input', () => {
    state.layerDepth = Number(elements.layer.value);
    elements.layerValue.textContent = state.layerDepth;
  });

  buildMoveButtons();

  elements.scramble.addEventListener('click', () => {
    state.scrambleMoves = generateScramble();
    state.currentScramble = stringifyMoves(state.scrambleMoves);
    elements.scrambleText.textContent = state.currentScramble;
  });

  elements.applyScramble.addEventListener('click', async () => {
    if (!state.scrambleMoves.length) return;
    await enqueueMoves(state.scrambleMoves);
  });

  elements.clearScramble.addEventListener('click', () => {
    state.scrambleMoves = [];
    state.currentScramble = '';
    elements.scrambleText.textContent = '';
  });

  document.addEventListener('keydown', handleKey);
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

  elements.times.innerHTML = '';
  entries.slice().reverse().forEach((entry, index) => {
    const row = document.createElement('div');
    row.className = 'time-row';

    const main = document.createElement('button');
    main.className = 'time-main';
    main.type = 'button';
    main.textContent = `#${entries.length - index}  ${formatTime(entry.time)}`;

    const scramble = document.createElement('div');
    scramble.className = 'time-scramble';
    scramble.textContent = entry.scramble || 'Sin scramble registrado';

    main.addEventListener('click', () => {
      scramble.classList.toggle('is-open');
    });

    const del = document.createElement('button');
    del.className = 'delete-time';
    del.type = 'button';
    del.textContent = 'Borrar';
    del.addEventListener('click', () => {
      deleteTime(entries.length - index - 1);
    });

    row.append(main, del, scramble);
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
      const move = parseMove(label);
      enqueueMoves([move]);
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
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const materials = createMaterials(x, y, z, size);
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.position.set(
          (x - offset) * SPACING,
          (y - offset) * SPACING,
          (z - offset) * SPACING
        );
        mesh.userData.coord = { x, y, z };
        cubeGroup.add(mesh);
        state.cubies.push(mesh);
      }
    }
  }

  scene.add(cubeGroup);
  updateLayerControl();
  frameCube();
}

function createMaterials(x, y, z, size) {
  const max = size - 1;
  const faces = [
    x === max ? COLORS.R : COLORS.inner,
    x === 0 ? COLORS.L : COLORS.inner,
    y === max ? COLORS.U : COLORS.inner,
    y === 0 ? COLORS.D : COLORS.inner,
    z === max ? COLORS.F : COLORS.inner,
    z === 0 ? COLORS.B : COLORS.inner,
  ];
  return faces.map((color) => new THREE.MeshStandardMaterial({ color }));
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
  const dir = new THREE.Vector3(1, 1, 1).normalize();
  camera.position.copy(center.clone().add(dir.multiplyScalar(radius * 2.2)));
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
  const duration = clamp(delta, 80, 420);

  if (KEY_ROTATIONS[key]) {
    enqueueMoves([{ type: 'cube', duration, ...KEY_ROTATIONS[key] }]);
    return;
  }

  if (KEY_MOVES[key] || MOVE_AXIS[key]) {
    const mapped = KEY_MOVES[key] || key;
    const base = mapped.replace("'", '');
    const prime = mapped.includes("'");
    const primeFromShift = event.shiftKey ? !prime : prime;
    const move = { ...parseMove(primeFromShift ? `${base}'` : base), duration };
    enqueueMoves([move]);
  }
}

function parseMove(label) {
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
  const max = state.size - 1;
  if (move.face === 'max') {
    return max - (move.depth - 1);
  }
  return move.depth - 1;
}

async function enqueueMoves(moves) {
  state.queue.push(...moves);
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
    const affected = state.cubies.filter((c) => c.userData.coord[axis] === layer);
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
      resolve();
    }

    requestAnimationFrame(animate);
  });
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
  cubie.position.set(
    (x - offset) * SPACING,
    (y - offset) * SPACING,
    (z - offset) * SPACING
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

function onVisibilityChange() {
  if (document.hidden && state.timerRunning) {
    stopTimer();
  }
}

document.addEventListener('visibilitychange', onVisibilityChange);
