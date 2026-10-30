import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { DEPARTMENTS, DEPT_MAP, FLOW_ORDER, WORLD, ENTRY } from './data.js';
import { COMPANY_STAFF, LEGAL_SOURCES, formatViDate, formatViTime, getDailyPlan, loadAIState, saveAIState } from './hr-ai.js';
import { buildWorld, FLOOR_Y } from './world.js';

// ------------------------------------------------------------ renderer

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 300);

const world = buildWorld(scene);

// ------------------------------------------------------------ controls

const DEFAULT_TARGET = new THREE.Vector3(2.2, 0.6, 0.6);
const VIEW_DIR = new THREE.Vector3(28, 36, 34).normalize();
const PORTRAIT_VIEW_DIR = new THREE.Vector3(20, 50, 22).normalize();

function viewDir() {
  const p = THREE.MathUtils.clamp((1.1 - camera.aspect) / 0.6, 0, 1);
  return VIEW_DIR.clone().lerp(PORTRAIT_VIEW_DIR, p).normalize();
}

function defaultDistance() {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const dH = 28 / (Math.tan(vFov / 2) * Math.max(camera.aspect, 0.45));
  const dV = 17 / Math.tan(vFov / 2);
  return THREE.MathUtils.clamp(Math.max(dH, dV) * 1.06, 32, 154);
}

function defaultPos() {
  return DEFAULT_TARGET.clone().addScaledVector(viewDir(), defaultDistance());
}

const controls = new OrbitControls(camera, canvas);
controls.target.copy(DEFAULT_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 12;
controls.maxDistance = 170;
controls.minPolarAngle = 0.32;
controls.maxPolarAngle = 1.34;
controls.enablePan = false;
controls.autoRotateSpeed = 0.5;

const camGoal = { pos: defaultPos(), target: DEFAULT_TARGET.clone() };
let camGoalActive = true;

camera.position.copy(camGoal.pos).addScaledVector(viewDir(), 14);

controls.addEventListener('start', () => {
  camGoalActive = false;
});

function focusCamera(pos, target) {
  camGoal.pos.copy(pos);
  camGoal.target.copy(target);
  camGoalActive = true;
}

// ------------------------------------------------------------ state

const state = {
  running: false,
  runId: 0,
  speed: 1,
  hovered: null,
  selected: null,
  tokenMode: 'idle',
  lastDept: null,
  bubbleDept: null,
  stepStatus: Object.fromEntries(FLOW_ORDER.map((id) => [id, 'pending'])),
  stats: Object.fromEntries(DEPARTMENTS.map((d) => [d.id, { in: 0, out: 0 }])),
  logCount: 0,
};

// ------------------------------------------------------------ HR AI

let aiPlan = getDailyPlan();
let aiState = loadAIState(aiPlan.key);

function syncAI() {
  const plan = getDailyPlan();
  if (plan.key !== aiPlan.key) {
    aiPlan = plan;
    aiState = loadAIState(plan.key);
  }
  return aiPlan;
}

// ------------------------------------------------------------ staff routes

const stopPoints = {};
for (const d of DEPARTMENTS) {
  stopPoints[d.id] = new THREE.Vector3(d.posX, 2.55, d.posZ + 0.15);
}

const WALK_SPEED = 5.4;
const STAFF_SIDE = { director: -1 };

function walkSpeed() {
  return WALK_SPEED * state.speed;
}

function floorPoint(x, z) {
  return new THREE.Vector3(x, FLOOR_Y, z);
}

function doorZ(d) {
  return d.posZ + (d.posZ < 0 ? 1 : -1) * (WORLD.roomD / 2);
}

function innerDoorZ(d) {
  return doorZ(d) + (d.posZ < 0 ? -0.85 : 0.85);
}

function outerDoorZ(d) {
  return doorZ(d) + (d.posZ < 0 ? 0.85 : -0.85);
}

// nhân viên đi vòng qua bàn theo làn phía sau ghế
function lanePoint(d) {
  const side = STAFF_SIDE[d.id] || 1;
  return floorPoint(d.posX + side * 2.8, d.posZ - 3.1);
}

// ghế → cửa phòng, dừng ngay trong cửa quay mặt ra ngoài
function routeToDoor(d) {
  const lane = lanePoint(d);
  const out = d.posZ < 0 ? 0.55 : -0.55;
  return [
    floorPoint(d.posX, d.posZ - 2.5),
    lane,
    floorPoint(lane.x, innerDoorZ(d)),
    floorPoint(d.posX, innerDoorZ(d)),
    floorPoint(d.posX, innerDoorZ(d) + out),
  ];
}

// ghế → ra hẳn hành lang
function routeToOutside(d) {
  const lane = lanePoint(d);
  return [
    floorPoint(d.posX, d.posZ - 2.5),
    lane,
    floorPoint(lane.x, innerDoorZ(d)),
    floorPoint(d.posX, innerDoorZ(d)),
    floorPoint(d.posX, outerDoorZ(d)),
  ];
}

function deliveryRoute(from, to) {
  const stopZ = outerDoorZ(to) + (to.posZ < 0 ? -0.55 : 0.55);
  const pts = routeToOutside(from);
  pts.push(floorPoint(from.posX, WORLD.corridorZ));
  pts.push(floorPoint((from.posX + to.posX) / 2, WORLD.corridorZ));
  pts.push(floorPoint(to.posX, WORLD.corridorZ));
  pts.push(floorPoint(to.posX, outerDoorZ(to)));
  pts.push(floorPoint(to.posX, stopZ));
  return pts;
}

function routeLength(points) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += points[i].distanceTo(points[i - 1]);
  return sum;
}

function buildEntryRoute(to) {
  const faceZ = innerDoorZ(to) + (to.posZ < 0 ? 0.55 : -0.55);
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(ENTRY.x, 1.55, ENTRY.z),
    new THREE.Vector3(ENTRY.x, 2.2, 8.5),
    new THREE.Vector3(ENTRY.x, 2.35, WORLD.corridorZ),
    new THREE.Vector3(to.posX, 2.2, WORLD.corridorZ),
    new THREE.Vector3(to.posX, 1.62, outerDoorZ(to)),
    new THREE.Vector3(to.posX, 1.3, faceZ),
  ], false, 'centripetal');
}

// ------------------------------------------------------------ trails

const trails = [];

function makeTrailCurveLine(curve, colorHex) {
  const pts = curve.getPoints(64).map((p) => new THREE.Vector3(p.x, 0.185, p.z));
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color: colorHex,
    dashSize: 0.45,
    gapSize: 0.33,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.renderOrder = 3;
  scene.add(line);
  trails.push({ line, age: 0, life: 2.9 });
}

function clearTrails() {
  for (const tr of trails) {
    scene.remove(tr.line);
    tr.line.geometry.dispose();
    tr.line.material.dispose();
  }
  trails.length = 0;
}

function updateTrails(dt) {
  for (let i = trails.length - 1; i >= 0; i--) {
    const tr = trails[i];
    tr.age += dt;
    if (tr.age > 1.2) {
      tr.line.material.opacity = Math.max(0, 0.8 * (1 - (tr.age - 1.2) / 1.6));
    }
    if (tr.age >= tr.life) {
      scene.remove(tr.line);
      tr.line.geometry.dispose();
      tr.line.material.dispose();
      trails.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------ dom refs

const ui = {
  statusChip: document.getElementById('statusChip'),
  statusText: document.getElementById('statusText'),
  run: document.getElementById('btnRun'),
  speed: document.getElementById('btnSpeed'),
  rotate: document.getElementById('btnRotate'),
  reset: document.getElementById('btnReset'),
  card: document.getElementById('deptCard'),
  logList: document.getElementById('logList'),
  logCount: document.getElementById('logCount'),
  flowSteps: document.getElementById('flowSteps'),
  bubble: document.getElementById('bubble'),
  toast: document.getElementById('toast'),
};

const chips = {};

// ------------------------------------------------------------ helpers

function setStatus(text, mode = 'idle') {
  ui.statusText.textContent = text;
  ui.statusChip.dataset.state = mode;
}

function fmtTime() {
  return new Date().toLocaleTimeString('vi-VN', { hour12: false });
}

function addLog(deptId, text) {
  const d = deptId ? DEPT_MAP[deptId] : null;
  const li = document.createElement('li');
  const dot = d ? d.color : '#94a3b8';
  li.innerHTML = `
    <span class="log-dot" style="background:${dot}"></span>
    <div>
      <div class="log-top"><strong>${d ? d.short : 'Hệ thống'}</strong><time>${fmtTime()}</time></div>
      <p>${text}</p>
    </div>`;
  ui.logList.prepend(li);
  while (ui.logList.children.length > 8) ui.logList.lastChild.remove();
  state.logCount += 1;
  ui.logCount.textContent = state.logCount;
}

let toastTimer = null;
function showToast(msg, ms = 4200) {
  ui.toast.textContent = msg;
  ui.toast.classList.remove('hidden');
  ui.toast.style.animation = 'none';
  void ui.toast.offsetWidth;
  ui.toast.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.add('hidden'), ms);
}

function hideToast() {
  clearTimeout(toastTimer);
  ui.toast.classList.add('hidden');
}

function setRunButton(on) {
  ui.run.classList.toggle('stop', on);
  ui.run.querySelector('.ico').textContent = on ? '■' : '▶';
  ui.run.querySelector('.label').textContent = on ? 'Dừng' : 'Chạy quy trình';
}

// ------------------------------------------------------------ flow chips

function buildChips() {
  FLOW_ORDER.forEach((id, i) => {
    const d = DEPT_MAP[id];
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.style.setProperty('--c', d.color);
    chip.innerHTML = `
      <span class="chip-dot"></span>
      <span class="chip-ico">${d.icon}</span>
      <span class="chip-name">${d.short}</span>
      <span class="chip-state">${i + 1}</span>`;
    chip.addEventListener('click', () => selectDept(id));
    ui.flowSteps.appendChild(chip);
    chips[id] = chip;

    if (i < FLOW_ORDER.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'chip-sep';
      sep.textContent = '›';
      ui.flowSteps.appendChild(sep);
    }
  });
}

function setStepState(id, s) {
  state.stepStatus[id] = s;
  const chip = chips[id];
  if (!chip) return;
  chip.classList.toggle('is-active', s === 'active');
  chip.classList.toggle('is-done', s === 'done');
  chip.querySelector('.chip-state').textContent =
    s === 'done' ? '✓' : s === 'active' ? '•' : String(FLOW_ORDER.indexOf(id) + 1);
}

// ------------------------------------------------------------ dept card

function renderCard(d) {
  ui.card.classList.remove('is-ai');
  if (d.id === 'hr') {
    renderHRCard(d);
    return;
  }
  ui.card.innerHTML = `
    <button class="close" type="button" aria-label="Đóng">×</button>
    <div class="card-head">
      <div class="avatar" style="background:${d.color}">${d.icon}</div>
      <div>
        <span class="tag" style="color:${d.color}">${d.tag}</span>
        <h2>${d.name}</h2>
      </div>
    </div>
    <div class="staff">
      <strong>${d.staff}</strong>
      <span>${d.role}</span>
    </div>
    <p class="desc">${d.desc}</p>
    <div class="duties">${d.duties.map((x) => `<span>${x}</span>`).join('')}</div>
    <div class="stats">
      <div><strong id="statIn">${state.stats[d.id].in}</strong><span>Hồ sơ nhận</span></div>
      <div><strong id="statOut">${state.stats[d.id].out}</strong><span>Hoàn tất</span></div>
    </div>`;
  ui.card.querySelector('.close').addEventListener('click', deselect);
  if (d.id === 'director') appendDirectorInbox();
}

function renderHRCard(d) {
  const plan = syncAI();
  const doneSet = new Set(aiState.done);
  const doneCount = plan.tasks.filter((t) => doneSet.has(t.id)).length;
  const sent = Boolean(aiState.sentAt);

  ui.card.classList.add('is-ai');
  ui.card.innerHTML = `
    <button class="close" type="button" aria-label="Đóng">×</button>
    <div class="card-head">
      <div class="avatar" style="background:${d.color}">${d.icon}</div>
      <div>
        <span class="tag" style="color:${d.color}">${d.tag}</span>
        <h2>${d.name}</h2>
      </div>
    </div>
    <div class="staff">
      <strong>${d.staff}</strong>
      <span>${d.role}</span>
    </div>
    <div class="ai-panel">
      <div class="ai-head">
        <span class="ai-badge"><span class="ai-dot"></span>AI NHÂN SỰ</span>
        <span class="ai-date">${formatViDate(plan.date)}</span>
      </div>
      <p class="ai-summary">Đã đọc ${LEGAL_SOURCES.length} văn bản · đối chiếu quy mô ${COMPANY_STAFF} nhân sự · chọn 2 việc ưu tiên cho Giám đốc hôm nay</p>
      <ol class="ai-tasks">
        ${plan.tasks.map((t) => `
          <li class="ai-task ${doneSet.has(t.id) ? 'is-done' : ''}" data-task="${t.id}">
            <button class="ai-check" type="button" aria-pressed="${doneSet.has(t.id)}" aria-label="Đánh dấu hoàn thành">${doneSet.has(t.id) ? '✓' : ''}</button>
            <div class="ai-task-body">
              <span class="ai-pri ${t.priority}">${t.priorityLabel}</span>
              <h3>${t.title}</h3>
              <p>${t.detail}</p>
              <div class="ai-meta">
                <span><b>Căn cứ:</b> ${t.legal}</span>
                <span><b>Hạn:</b> ${t.deadline}</span>
              </div>
              ${t.reason ? `<p class="ai-why">${t.reason}</p>` : ''}
            </div>
          </li>`).join('')}
      </ol>
      <div class="ai-foot">
        <span class="ai-progress">${doneCount}/2 hoàn thành</span>
        <button class="ai-send" type="button" ${sent ? 'disabled' : ''}>${sent ? '✓ Đã gửi Giám đốc' : 'Gửi Giám đốc'}</button>
      </div>
      <details class="ai-sources">
        <summary>Nguồn AI đã đọc (${LEGAL_SOURCES.length})</summary>
        <ul>${LEGAL_SOURCES.map((s) => `<li><b>${s.code}</b> — ${s.name}. <span>${s.note}</span></li>`).join('')}</ul>
      </details>
      <p class="ai-note">Nội dung mô phỏng phục vụ trình diễn, cần đối chiếu văn bản pháp luật hiện hành trước khi áp dụng.</p>
    </div>`;

  ui.card.querySelector('.close').addEventListener('click', deselect);
  for (const btn of ui.card.querySelectorAll('.ai-check')) {
    btn.addEventListener('click', () => toggleAITask(btn.closest('.ai-task')));
  }
  ui.card.querySelector('.ai-send').addEventListener('click', sendHRProposal);
}

function toggleAITask(li) {
  const id = li.dataset.task;
  const doneSet = new Set(aiState.done);
  if (doneSet.has(id)) doneSet.delete(id);
  else doneSet.add(id);
  aiState.done = [...doneSet];
  saveAIState(aiState);

  const isDone = doneSet.has(id);
  li.classList.toggle('is-done', isDone);
  const btn = li.querySelector('.ai-check');
  btn.setAttribute('aria-pressed', String(isDone));
  btn.textContent = isDone ? '✓' : '';
  const count = aiPlan.tasks.filter((t) => doneSet.has(t.id)).length;
  ui.card.querySelector('.ai-progress').textContent = `${count}/2 hoàn thành`;
}

function sendHRProposal() {
  if (aiState.sentAt) return;
  aiState.sentAt = Date.now();
  saveAIState(aiState);

  const btn = ui.card.querySelector('.ai-send');
  btn.disabled = true;
  btn.textContent = '✓ Đã gửi Giám đốc';
  chips.director?.classList.add('has-inbox');

  addLog('hr', 'AI Nhân sự gửi 2 đề xuất cho Giám đốc');
  showToast('Đã gửi 2 đề xuất nhân sự tới Giám đốc · Bấm phòng Giám đốc để xem', 4600);
}

function appendDirectorInbox() {
  const plan = syncAI();
  if (!aiState.sentAt) return;
  const doneSet = new Set(aiState.done);
  const dotColor = { high: '#e11d48', medium: '#f59e0b', low: '#14b8a6' };
  const box = document.createElement('div');
  box.className = 'inbox';
  box.innerHTML = `
    <div class="inbox-head">
      <span class="tag" style="color:#0d9488">Đề xuất từ Nhân sự</span>
      <span class="inbox-time">${formatViTime(aiState.sentAt)}</span>
    </div>
    <ul class="inbox-list">
      ${plan.tasks.map((t) => `
        <li class="${doneSet.has(t.id) ? 'is-done' : ''}">
          <span class="inbox-dot" style="background:${dotColor[t.priority] || dotColor.low}"></span>
          <span>${t.title}</span>
          <span class="inbox-state">${doneSet.has(t.id) ? 'Đã xong' : 'Chờ xử lý'}</span>
        </li>`).join('')}
    </ul>
    <p class="inbox-note">AI Nhân sự đề xuất hôm nay · 2 việc</p>`;
  ui.card.appendChild(box);
}

function updateStatsUI(id) {
  if (state.selected !== id) return;
  const inEl = document.getElementById('statIn');
  const outEl = document.getElementById('statOut');
  if (inEl) inEl.textContent = state.stats[id].in;
  if (outEl) outEl.textContent = state.stats[id].out;
}

function focusDeptCamera(d) {
  const target = new THREE.Vector3(d.posX, 0.9, d.posZ + 0.3);
  const dist = THREE.MathUtils.clamp(defaultDistance() * 0.44, 19, 64);
  focusCamera(target.clone().addScaledVector(viewDir(), dist), target);
}

function selectDept(id, focus = true) {
  state.selected = id;
  hideToast();
  const d = DEPT_MAP[id];
  renderCard(d);
  ui.card.classList.remove('hidden');
  if (id === 'director') chips.director?.classList.remove('has-inbox');

  if (focus) {
    if (controls.autoRotate) {
      controls.autoRotate = false;
      ui.rotate.classList.remove('active');
    }
    focusDeptCamera(d);
  }
}

function deselect() {
  state.selected = null;
  ui.card.classList.add('hidden');
}

// ------------------------------------------------------------ bubble

function showBubble(d, msg) {
  state.bubbleDept = d.id;
  ui.bubble.innerHTML = `
    <span class="b-ico" style="background:${d.color}">${d.icon}</span>
    <div>
      <strong>${d.staff} · ${d.short}</strong>
      <span class="b-msg">${msg}</span>
    </div>`;
  ui.bubble.classList.remove('hidden');
}

function hideBubble() {
  state.bubbleDept = null;
  ui.bubble.classList.add('hidden');
}

const bubbleAnchor = new THREE.Vector3();
function updateBubblePosition() {
  if (!state.bubbleDept) return;
  const d = DEPT_MAP[state.bubbleDept];
  bubbleAnchor.set(d.posX, 3.55, d.posZ);
  bubbleAnchor.project(camera);
  const x = (bubbleAnchor.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-bubbleAnchor.y * 0.5 + 0.5) * window.innerHeight;
  const inView = bubbleAnchor.z < 1 && x > 30 && x < window.innerWidth - 30 && y > 50;
  ui.bubble.classList.toggle('hidden', !inView);
  ui.bubble.style.left = `${x}px`;
  ui.bubble.style.top = `${y - 12}px`;
}

// ------------------------------------------------------------ token

function setTokenDept(d) {
  const tk = world.token;
  const c = new THREE.Color(d.colorHex);
  tk.stripeMat.color.copy(c);
  tk.stripeMat.emissive.copy(c);
  tk.ringMat.color.copy(c);
  tk.glowMat.color.copy(c);
  tk.light.color.copy(c);
  tk.marker.material.color.copy(c);
  tk.frameMat.color.copy(c);
  tk.beamMat.color.copy(c);
}

function resetTokenToEntry() {
  state.tokenMode = 'idle';
  state.lastDept = null;
  state.carrier = null;
  state.tokenGoal = null;
  world.token.group.visible = true;
  world.token.group.position.set(ENTRY.x, 1.55, ENTRY.z);
}

const carryTarget = new THREE.Vector3();

function animateToken(t, dt) {
  const tk = world.token;
  tk.group.rotation.y += dt * 0.75;
  if (state.tokenMode === 'carry' && state.carrier) {
    const p = world.people[state.carrier];
    const yaw = p.group.rotation.y;
    carryTarget.set(
      p.group.position.x + Math.sin(yaw) * 0.48,
      p.group.position.y + 1.12,
      p.group.position.z + Math.cos(yaw) * 0.48
    );
    tk.group.position.lerp(carryTarget, Math.min(1, dt * 12));
  } else if (state.tokenMode === 'glide' && state.tokenGoal) {
    tk.group.position.lerp(state.tokenGoal, Math.min(1, dt * 5));
    if (tk.group.position.distanceToSquared(state.tokenGoal) < 0.004) {
      tk.group.position.copy(state.tokenGoal);
      state.tokenGoal = null;
      state.tokenMode = 'hover';
    }
  } else if (state.tokenMode === 'idle' || state.tokenMode === 'hover') {
    const base = state.tokenMode === 'hover' && state.lastDept
      ? stopPoints[state.lastDept].y
      : 1.55;
    tk.group.position.y = base + Math.sin(t * 2.1) * 0.06;
  }
  tk.beam.visible = tk.group.position.y > 2.0 && state.tokenMode !== 'carry' && state.tokenMode !== 'glide';
  tk.glow.material.opacity = 0.36 + 0.18 * Math.sin(t * 3);
  tk.ring.scale.setScalar(1 + Math.sin(t * 2.4) * 0.05);
  tk.light.intensity = 1.4 + Math.sin(t * 3) * 0.25;
  tk.beamMat.opacity = 0.13 + 0.06 * (0.5 + 0.5 * Math.sin(t * 2.2));
  tk.marker.position.set(tk.group.position.x, 0.2, tk.group.position.z);
  tk.marker.material.opacity = 0.24 + 0.16 * (0.5 + 0.5 * Math.sin(t * 3.4));
}

// ------------------------------------------------------------ waiting / movement

function wait(ms, runId) {
  return new Promise((resolve) => {
    const end = performance.now() + ms;
    const tick = () => {
      if (runId !== state.runId) return resolve(false);
      if (performance.now() >= end) return resolve(true);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function moveToken(curve, colorHex, runId) {
  return new Promise((resolve) => {
    const length = curve.getLength();
    const dur = (Math.min(2.7, Math.max(1.2, 0.65 + length * 0.055))) / state.speed;
    const startTime = performance.now();
    makeTrailCurveLine(curve, colorHex);
    const pos = new THREE.Vector3();

    const tick = (now) => {
      if (runId !== state.runId) return resolve(false);
      const p = Math.min(1, (now - startTime) / (dur * 1000));
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      curve.getPointAt(e, pos);
      pos.y += Math.sin(p * Math.PI * 2) * 0.05;
      world.token.group.position.copy(pos);
      if (p < 1) requestAnimationFrame(tick);
      else resolve(true);
    };
    requestAnimationFrame(tick);
  });
}

// ------------------------------------------------------------ workflow

function resetFlowData() {
  state.stats = Object.fromEntries(DEPARTMENTS.map((d) => [d.id, { in: 0, out: 0 }]));
  FLOW_ORDER.forEach((id) => setStepState(id, 'pending'));
  DEPARTMENTS.forEach((d) => {
    world.rooms[d.id].active = false;
    world.people[d.id].active = false;
  });
  world.resetPeople();
  state.carrier = null;
  state.tokenGoal = null;
  for (const id of DEPARTMENTS.map((d) => d.id)) updateStatsUI(id);
  ui.logList.innerHTML = '';
  state.logCount = 0;
  ui.logCount.textContent = '0';
  hideBubble();
  clearTrails();
  resetTokenToEntry();
}

function abortFlow() {
  state.runId += 1;
  state.running = false;
  setRunButton(false);
  setStatus('Đã dừng quy trình', 'stopped');
  hideBubble();
  for (const id of FLOW_ORDER) {
    if (state.stepStatus[id] === 'active') setStepState(id, 'pending');
    world.rooms[id].active = false;
    world.people[id].active = false;
  }
  world.resetPeople();
  clearTrails();
  resetTokenToEntry();
  addLog(null, 'Đã dừng quy trình theo yêu cầu');
}

async function runFlow() {
  if (state.running) {
    abortFlow();
    return;
  }

  resetFlowData();
  state.running = true;
  state.runId += 1;
  const runId = state.runId;
  setRunButton(true);
  deselect();
  state.hovered = null;
  canvas.classList.remove('pointing');
  controls.autoRotate = false;
  ui.rotate.classList.remove('active');
  focusCamera(defaultPos(), DEFAULT_TARGET);
  setStatus('Khởi tạo hồ sơ...', 'running');
  addLog(null, 'Khách hàng gửi hồ sơ dự án — bắt đầu quy trình');
  await wait(520 / state.speed, runId);
  if (runId !== state.runId) return;

  let prev = null;
  for (const id of FLOW_ORDER) {
    const d = DEPT_MAP[id];
    setStepState(id, 'active');
    setTokenDept(d);

    if (!prev) {
      setStatus(`Khách hàng gửi hồ sơ tới ${d.short}...`, 'running');
      state.tokenMode = 'travel';
      const landed = await Promise.all([
        moveToken(buildEntryRoute(d), d.colorHex, runId),
        world.walkPerson(id, routeToDoor(d), { speed: walkSpeed(), end: 'stand' }),
      ]);
      if (runId !== state.runId || landed.some((ok) => !ok)) return;

      state.carrier = id;
      state.tokenMode = 'carry';
      addLog(id, 'Ra cửa nhận hồ sơ từ khách hàng');
      await wait(320 / state.speed, runId);
      if (runId !== state.runId) return;
    } else {
      const from = DEPT_MAP[prev];
      setStatus(`${from.short} mang hồ sơ tới ${d.short}...`, 'running');
      state.carrier = prev;
      state.tokenMode = 'carry';
      addLog(prev, `Mang hồ sơ sang ${d.short}`);

      const route = deliveryRoute(from, d);
      const toDoor = routeToDoor(d);
      const senderWalk = world.walkPerson(prev, route, { speed: walkSpeed(), end: 'stand' });
      const lead = routeLength(route) / walkSpeed() * 1000
        - routeLength(toDoor) / walkSpeed() * 1000 - 200;
      const receiverWalk = wait(Math.max(250, lead), runId).then((ok) => (
        ok && runId === state.runId
          ? world.walkPerson(id, toDoor, { speed: walkSpeed(), end: 'stand' })
          : false
      ));
      const arrived = await Promise.all([senderWalk, receiverWalk]);
      if (runId !== state.runId || arrived.some((ok) => !ok)) return;

      const top = d.posZ < 0;
      world.facePerson(prev, top ? Math.PI : 0);
      world.facePerson(id, top ? 0 : Math.PI);
      state.carrier = id;
      addLog(id, `Nhận hồ sơ từ ${from.short}`);
      await wait(460 / state.speed, runId);
      if (runId !== state.runId) return;
    }

    const backRoute = routeToDoor(d).reverse();
    const carrierBack = world.walkPerson(id, backRoute, { speed: walkSpeed(), end: 'sit' });
    if (prev) {
      const from = DEPT_MAP[prev];
      world.walkPerson(prev, deliveryRoute(from, d).reverse(), { speed: walkSpeed(), end: 'sit' });
    }
    await carrierBack;
    if (runId !== state.runId) return;

    state.carrier = null;
    state.lastDept = id;
    state.tokenGoal = stopPoints[id].clone();
    state.tokenMode = 'glide';
    await wait(340 / state.speed, runId);
    if (runId !== state.runId) return;

    world.rooms[id].active = true;
    world.people[id].active = true;
    state.stats[id].in += 1;
    updateStatsUI(id);

    setStatus(`${d.short} đang xử lý hồ sơ`, 'running');
    showBubble(d, d.work);
    const worked = await wait(2100 / state.speed, runId);
    if (!worked) return;

    state.stats[id].out += 1;
    updateStatsUI(id);
    world.rooms[id].active = false;
    world.people[id].active = false;
    setStepState(id, 'done');
    addLog(id, '✔ ' + d.done);
    hideBubble();

    prev = id;
    const paused = await wait(380 / state.speed, runId);
    if (!paused) return;
  }

  setStatus('Hoàn tất quy trình', 'done');
  addLog(null, 'Toàn bộ hồ sơ đã được phê duyệt và lưu tại Kế toán');
  showToast('Quy trình khép kín hoàn tất · Hồ sơ đã được phê duyệt và lưu trữ', 4800);

  state.running = false;
  setRunButton(false);

  while (world.hasWalkers() && runId === state.runId) {
    const settled = await wait(200, runId);
    if (!settled) return;
  }
  await wait(1200, runId);
  if (runId !== state.runId) return;
  world.token.group.visible = false;
  await wait(420, runId);
  if (runId !== state.runId) return;
  resetTokenToEntry();
  setStatus('Sẵn sàng', 'idle');
}

// ------------------------------------------------------------ interaction

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pickDept(clientX, clientY) {
  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(world.pickables, false)[0];
  return hit ? hit.object.userData.deptId : null;
}

canvas.addEventListener('pointermove', (e) => {
  state.hovered = pickDept(e.clientX, e.clientY);
  canvas.classList.toggle('pointing', Boolean(state.hovered));
});

canvas.addEventListener('pointerleave', () => {
  state.hovered = null;
  canvas.classList.remove('pointing');
});

let pointerDown = null;
canvas.addEventListener('pointerdown', (e) => {
  pointerDown = { x: e.clientX, y: e.clientY };
});
canvas.addEventListener('pointerup', (e) => {
  if (!pointerDown) return;
  const moved = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 6) return;
  const id = pickDept(e.clientX, e.clientY);
  if (id) selectDept(id);
  else deselect();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') deselect();
});

ui.run.addEventListener('click', runFlow);

ui.speed.addEventListener('click', () => {
  state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
  ui.speed.textContent = `${state.speed}×`;
});

ui.rotate.addEventListener('click', () => {
  controls.autoRotate = !controls.autoRotate;
  ui.rotate.classList.toggle('active', controls.autoRotate);
  if (controls.autoRotate) camGoalActive = false;
});

ui.reset.addEventListener('click', () => {
  controls.autoRotate = false;
  ui.rotate.classList.remove('active');
  deselect();
  focusCamera(defaultPos(), DEFAULT_TARGET);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (state.selected) focusDeptCamera(DEPT_MAP[state.selected]);
  else focusCamera(defaultPos(), DEFAULT_TARGET);
});

// ------------------------------------------------------------ render loop

const clock = new THREE.Clock();

function animateRooms(t, dt) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
  for (const d of DEPARTMENTS) {
    const r = world.rooms[d.id];
    const focus = state.selected === d.id || state.hovered === d.id;
    const target = focus ? 0.9 : r.active ? 0.42 + 0.42 * pulse : 0;
    r.ring.material.opacity += (target - r.ring.material.opacity) * Math.min(1, dt * 9);
    r.ring.scale.setScalar(r.active ? 1 + 0.012 * Math.sin(t * 4) : 1);

    const glow = r.active ? 1.05 + 0.28 * pulse : d.id === 'hr' ? 0.7 + 0.16 * pulse : 0.42;
    for (const m of r.screens) {
      m.emissiveIntensity += (glow - m.emissiveIntensity) * Math.min(1, dt * 5);
    }

    const spriteMat = r.sprite.material;
    const labelScale = focus ? 1.06 : 1;
    r.sprite.scale.x += (4.9 * labelScale - r.sprite.scale.x) * Math.min(1, dt * 8);
    r.sprite.scale.y += (1.225 * labelScale - r.sprite.scale.y) * Math.min(1, dt * 8);
  }
}

function start() {
  buildChips();

  addLog(null, 'Mô hình văn phòng TTS.Co đã sẵn sàng');
  addLog('hr', 'AI Nhân sự đã chuẩn bị 2 đề xuất cho hôm nay');
  setStatus('Sẵn sàng', 'idle');

  setTimeout(() => {
    showToast('Bấm phòng Nhân sự để xem 2 đề xuất AI hôm nay · Bấm “Chạy quy trình” để mô phỏng dòng hồ sơ', 5600);
  }, 900);

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    world.update(t, dt);
    animateToken(t, dt);
    animateRooms(t, dt);
    updateTrails(dt);
    updateBubblePosition();

    if (camGoalActive) {
      const k = 1 - Math.exp(-dt * 3.4);
      camera.position.lerp(camGoal.pos, k);
      controls.target.lerp(camGoal.target, k);
      if (
        camera.position.distanceTo(camGoal.pos) < 0.08 &&
        controls.target.distanceTo(camGoal.target) < 0.05
      ) {
        camGoalActive = false;
      }
    }

    controls.update();
    renderer.render(scene, camera);
  });
}

start();

