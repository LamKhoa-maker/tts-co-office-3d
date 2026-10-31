import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { DEPARTMENTS, DEPT_MAP, FLOW_ORDER, WORLD, ENTRY, LAW_GROUPS, DEPT_SCREENS, HIRE_LOOKS } from './data.js';
import { COMPANY, LEGAL_SOURCES, dayKey, formatViDate, formatViTime, getDailyPlan, loadAIState, loadReports, saveAIState, saveReports, setCompanyStaff } from './hr-ai.js';
import { loadBoard, loadNotifications, loadRoster, saveBoard, saveNotifications, saveRoster, loadTasks, saveTasks, makeId } from './staff-store.js';
import { SAMPLE_LABEL, PLAYBOOK, fmtVnd, getBusinessSnapshot, getSampleAlerts, getDashboardModel, getDepartmentKpis } from './business.js';
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

const roster = loadRoster();
const dismissed = {};
for (const d of DEPARTMENTS) {
  if (!Array.isArray(roster.extras[d.id])) roster.extras[d.id] = [];
  roster.extras[d.id] = roster.extras[d.id].slice(0, 2);
  const protectedIds = new Set(
    (d.staffList?.length ? d.staffList : [{ id: d.id }]).slice(1).map((m) => m.id)
  );
  const saved = Array.isArray(roster.dismissed[d.id]) ? roster.dismissed[d.id] : [];
  dismissed[d.id] = [...new Set(saved)].filter((id) => protectedIds.has(id));
}
const taskState = loadTasks();
const notifications = loadNotifications();
let reports = loadReports();

const world = buildWorld(scene, roster.extras, dismissed);

// ------------------------------------------------------------ controls

const DEFAULT_TARGET = new THREE.Vector3(0.5, 0.5, -3.3);
const VIEW_DIR = new THREE.Vector3(12, 44, 40).normalize();
const PORTRAIT_VIEW_DIR = new THREE.Vector3(10, 56, 28).normalize();

function viewDir() {
  const p = THREE.MathUtils.clamp((1.1 - camera.aspect) / 0.6, 0, 1);
  return VIEW_DIR.clone().lerp(PORTRAIT_VIEW_DIR, p).normalize();
}

function defaultDistance() {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const dH = 21.5 / (Math.tan(vFov / 2) * Math.max(camera.aspect, 0.45));
  const dV = 14 / Math.tan(vFov / 2);
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
controls.zoomSpeed = 2;

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
  selectedStaff: null,
  viewLocked: false,
  tokenMode: 'idle',
  lastDept: null,
  bubbleDept: null,
  stepStatus: Object.fromEntries(FLOW_ORDER.map((id) => [id, 'pending'])),
  stats: Object.fromEntries(DEPARTMENTS.map((d) => [d.id, { in: 0, out: 0 }])),
  panelTab: 'board',
  dashDay: dayKey(),
};

// ------------------------------------------------------------ HR AI

setCompanyStaff(staffTotal());
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
const STAFF_SIDE = { director: -1, hr: -1, accounting: 1 };

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
    new THREE.Vector3(ENTRY.x, 2.2, ENTRY.z - 3.4),
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
  lock: document.getElementById('btnLock'),
  rotate: document.getElementById('btnRotate'),
  reset: document.getElementById('btnReset'),
  card: document.getElementById('deptCard'),
  staffCount: document.getElementById('staffCount'),
  boardDate: document.getElementById('boardDate'),
  boardPanel: document.getElementById('boardPanel'),
  boardView: document.getElementById('boardView'),
  boardList: document.getElementById('boardList'),
  tabBoard: document.getElementById('tabBoard'),
  tabDash: document.getElementById('tabDash'),
  dashView: document.getElementById('dashView'),
  dashBody: document.getElementById('dashBody'),
  dashAsOf: document.getElementById('dashAsOf'),
  panelClose: document.getElementById('panelClose'),
  dashBtn: document.getElementById('btnDash'),
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

// ------------------------------------------------------------ daily board

let board = loadBoard(dayKey());

function syncBoardDay() {
  const key = dayKey();
  if (board.date !== key) board = loadBoard(key);
}

function boardDept(deptId) {
  let b = board.depts[deptId];
  if (!b || typeof b !== 'object') {
    b = { in: 0, out: 0, actions: [] };
    board.depts[deptId] = b;
  }
  b.in = Number(b.in) || 0;
  b.out = Number(b.out) || 0;
  if (!Array.isArray(b.actions)) b.actions = [];
  return b;
}

function addLog(deptId, text) {
  if (!deptId || !DEPT_MAP[deptId]) return;
  syncBoardDay();
  const b = boardDept(deptId);
  b.actions.unshift({ at: Date.now(), text: String(text ?? '').slice(0, 130) });
  b.actions = b.actions.slice(0, 8);
  saveBoard(board);
  renderBoard();
}

function boardBump(deptId, field, n = 1) {
  if (!deptId || !DEPT_MAP[deptId]) return;
  syncBoardDay();
  const b = boardDept(deptId);
  b[field] = (Number(b[field]) || 0) + n;
  saveBoard(board);
  renderBoard();
}

function deptTaskCounts(deptId) {
  const d = DEPT_MAP[deptId];
  const tasks = d ? membersOf(d).flatMap((m) => staffTasks(m.id)) : [];
  const done = tasks.filter((t) => t.done).length;
  return { open: tasks.length - done, done, total: tasks.length };
}

function aiCounts() {
  const done = new Set(aiState.done);
  const approved = new Set(aiState.approved);
  const total = aiPlan.tasks.length;
  const doneCount = aiPlan.tasks.filter((t) => done.has(t.id)).length;
  const approvedCount = aiPlan.tasks.filter((t) => approved.has(t.id) && !done.has(t.id)).length;
  return { total, done: doneCount, approved: approvedCount, open: total - doneCount - approvedCount };
}

function pendingProposalTasks() {
  const today = dayKey();
  const approved = new Set(aiState.approved);
  const done = new Set(aiState.done);
  const seen = new Set();
  const list = [];
  for (const r of reports.items) {
    if (dayKey(new Date(r.at)) !== today) continue;
    for (const t of r.tasks || []) {
      if (t.done || done.has(t.id) || approved.has(t.id) || seen.has(t.id)) continue;
      seen.add(t.id);
      list.push({ ...t, reportId: r.id });
    }
  }
  return list;
}

function workMetrics(deptId) {
  const c = deptTaskCounts(deptId);
  const waiting = pendingProposalTasks().length;
  if (deptId === 'hr') {
    const ai = aiCounts();
    return { doing: c.open + ai.approved, done: c.done + ai.done, waiting };
  }
  return { doing: c.open, done: c.done, waiting: deptId === 'director' ? waiting : 0 };
}

function boardHeadline(d) {
  const m = workMetrics(d.id);
  if (d.id === 'hr') return `${aiPlan.tasks.length} đề xuất · ${m.waiting} chờ duyệt`;
  if (d.id === 'director') return m.waiting ? `${m.waiting} chờ duyệt` : 'Không có việc chờ';
  const b = boardDept(d.id);
  return `${b.in} nhận · ${b.out} xong`;
}

function boardLineHTML(d) {
  if (d.id === 'hr') {
    const ai = aiCounts();
    return `AI <b>${ai.done}/${ai.total}</b> việc xong · <b>${ai.open}</b> chờ Giám đốc duyệt`;
  }
  const c = deptTaskCounts(d.id);
  if (!c.total) return d.id === 'director' ? 'Đề xuất AI đang chờ trên thẻ phòng' : 'Chưa giao việc';
  const open = membersOf(d).flatMap((m) => staffTasks(m.id)).filter((t) => !t.done);
  return `<b>${c.done}/${c.total}</b> việc xong${open.length ? ` · đang làm: ${esc(open[0].text)}` : ''}`;
}

function boardMetricsHTML(deptId) {
  const m = workMetrics(deptId);
  return `<div class="board-metrics">
    <span class="is-doing">Đang làm <b>${m.doing}</b></span>
    ${m.waiting ? `<span class="is-wait">Chờ duyệt <b>${m.waiting}</b></span>` : ''}
    <span class="is-done">Hoàn tất <b>${m.done}</b></span>
  </div>`;
}

function boardDeptHTML(d) {
  const b = boardDept(d.id);
  const feed = b.actions.slice(0, 2)
    .map((a) => `<li><time>${formatViTime(a.at)}</time><span>${esc(a.text)}</span></li>`)
    .join('');
  return `<li class="board-dept" style="--c:${d.color}">
    <div class="board-head">
      <span class="board-dot"></span>
      <strong>${d.icon} ${esc(d.short)}</strong>
      <span class="board-count">${boardHeadline(d)}</span>
    </div>
    <div class="board-line">${boardLineHTML(d)}</div>
    ${boardMetricsHTML(d.id)}
    ${feed ? `<ul class="board-feed">${feed}</ul>` : '<p class="board-empty">Chưa ghi nhận hoạt động hôm nay.</p>'}
  </li>`;
}

function renderBoard() {
  if (!ui.boardList) return;
  syncBoardDay();
  if (ui.boardDate) {
    ui.boardDate.textContent = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
  ui.boardList.innerHTML = DEPARTMENTS.map(boardDeptHTML).join('');
  queueDashRefresh();
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

// ------------------------------------------------------------ notifications

function reportResolved(report) {
  if (!report || !Array.isArray(report.tasks)) return true;
  const approved = new Set(aiState.approved);
  const done = new Set(aiState.done);
  return report.tasks.every((t) => t.done || approved.has(t.id) || done.has(t.id));
}

function proposalOpen(n) {
  if (n.kind !== 'proposal') return false;
  const report = reports.items.find((r) => r.id === n.reportId);
  if (!report) return false;
  return dayKey(new Date(report.at)) === dayKey() && !reportResolved(report);
}

function unreadCount(deptId) {
  return notifications.reduce((n, x) => {
    if (x.deptId !== deptId) return n;
    if (!x.read) return n + 1;
    return n + (proposalOpen(x) ? 1 : 0);
  }, 0);
}

function deptNotifs(deptId) {
  return notifications.filter((n) => n.deptId === deptId);
}

function notifyDept(deptId, from, text, fromDept = null, extra = null) {
  if (!DEPT_MAP[deptId]) return;
  notifications.unshift({
    id: makeId('n'),
    deptId,
    from,
    fromDept,
    text: String(text).slice(0, 160),
    at: Date.now(),
    read: false,
    ...(extra && typeof extra === 'object' ? extra : {}),
  });
  saveNotifications(notifications);
  syncNotifUI(deptId);
}

function syncNotifUI(deptId) {
  const chip = chips[deptId];
  if (chip) {
    let badge = chip.querySelector('.chip-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'chip-badge';
      chip.appendChild(badge);
    }
    const n = unreadCount(deptId);
    badge.textContent = n > 9 ? '9+' : String(n);
    badge.hidden = n === 0;
  }
  if (world.setRoomNotif) world.setRoomNotif(deptId, unreadCount(deptId));
  if (state.selected === deptId && !state.selectedStaff) refreshNotifPanel(deptId);
}

function syncAllNotifs() {
  for (const d of DEPARTMENTS) syncNotifUI(d.id);
}

function notifPanelHTML(d) {
  const items = deptNotifs(d.id).slice(0, 5);
  if (!items.length) return '';
  const pending = items.filter(proposalOpen).length;
  const unread = items.filter((n) => !n.read && !proposalOpen(n)).length;
  const status = [
    pending ? `${pending} chờ duyệt` : '',
    unread ? `${unread} tin mới` : '',
  ].filter(Boolean).join(' · ') || `${items.length} tin`;
  return `<div class="notif-panel">
    <div class="notif-head">
      <h3><span class="notif-bell">🔔</span>Thông báo tại phòng</h3>
      <span>${status}</span>
    </div>
    <ul class="notif-list">
      ${items.map((n) => {
        const src = n.fromDept ? DEPT_MAP[n.fromDept] : null;
        const open = proposalOpen(n);
        return `<li class="${n.read && !open ? '' : 'is-new'}${open ? ' is-pending' : ''}">
          <span class="notif-dot" style="background:${src ? src.color : '#e11d48'}"></span>
          <div class="notif-body">
            <div class="notif-meta">
              <strong>${esc(n.from)}</strong>
              <time>${formatViTime(n.at)}</time>
              ${open ? '<span class="notif-flag">Chờ duyệt</span>' : ''}
            </div>
            <p>${esc(n.text)}</p>
          </div>
        </li>`;
      }).join('')}
    </ul>
  </div>`;
}

function refreshNotifPanel(deptId) {
  const slot = ui.card.querySelector('.notif-slot');
  const d = DEPT_MAP[deptId];
  if (!slot || !d) return;
  slot.innerHTML = notifPanelHTML(d);
}

function markDeptNotifsRead(deptId) {
  let changed = false;
  for (const n of notifications) {
    if (n.deptId !== deptId || n.read) continue;
    if (proposalOpen(n)) continue;
    n.read = true;
    changed = true;
  }
  if (!changed) return;
  saveNotifications(notifications);
  syncNotifUI(deptId);
}

function settleProposalNotices() {
  let changed = false;
  for (const n of notifications) {
    if (n.kind !== 'proposal' || n.read || proposalOpen(n)) continue;
    n.read = true;
    changed = true;
  }
  if (!changed) return;
  saveNotifications(notifications);
  syncNotifUI('director');
}


// ------------------------------------------------------------ dept card

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function membersOf(d) {
  const base = d.staffList?.length ? d.staffList : [{ id: d.id, name: d.staff, role: d.role }];
  const gone = new Set(dismissed[d.id] || []);
  const kept = base.filter((m, i) => i === 0 || !gone.has(m.id));
  const ids = new Set(kept.map((m) => m.id));
  const extras = (roster.extras[d.id] || []).filter((m) => m && !ids.has(m.id));
  return [...kept, ...extras].slice(0, 3);
}

function staffTotal() {
  return DEPARTMENTS.reduce((n, d) => n + membersOf(d).length, 0);
}

function updateStaffCount() {
  const n = staffTotal();
  setCompanyStaff(n);
  if (ui.staffCount) ui.staffCount.textContent = n;
}

function staffListHTML(d, activeId = null) {
  const members = membersOf(d);
  const rows = members.map((m) => `
    <button type="button" class="staff staff-btn${m.id === activeId ? ' is-open' : ''}" data-staff-id="${m.id}">
      <span class="staff-row"><strong>${esc(m.name)}</strong><span>${esc(m.role)}</span></span>
      ${m.scope ? `<em class="staff-scope">${esc(m.scope)}</em>` : ''}
      <span class="staff-more">Xem nhiệm vụ ›</span>
    </button>`).join('');
  const hire = members.length < 3
    ? `<button type="button" class="hire-btn" data-hire="${d.id}">＋ Tuyển thêm nhân sự</button>`
    : `<p class="staff-full">Phòng đã đủ 3 nhân sự</p>`;
  return `<div class="staff-list">${rows}${hire}</div>`;
}

function lawBlockHTML(key) {
  const g = LAW_GROUPS[key];
  if (!g) return '';
  return `<details class="law-box">
      <summary><span>${g.label}</span><b>${g.docs.length} văn bản</b></summary>
      <p>${g.note}</p>
      <ul>${g.docs.map((doc) => `<li><b>${doc.code}${doc.ref ? ` · ${doc.ref}` : ''}</b><span>${doc.note}</span></li>`).join('')}</ul>
    </details>`;
}

function lawStackHTML(d) {
  const blocks = membersOf(d).filter((m) => m.lawGroup).map((m) => lawBlockHTML(m.lawGroup)).join('');
  return blocks ? `<div class="law-stack">${blocks}</div>` : '';
}

function setDeptActive(id, on) {
  const d = DEPT_MAP[id];
  if (!d) return;
  world.rooms[id].active = on;
  for (const m of membersOf(d)) {
    const p = world.people[m.id];
    if (p) p.active = on;
  }
}

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
    <div class="notif-slot">${notifPanelHTML(d)}</div>
    ${d.id === 'director' ? directorSummaryHTML() : ''}
    ${staffListHTML(d)}
    <p class="desc">${d.desc}</p>
    <div class="duties">${d.duties.map((x) => `<span>${x}</span>`).join('')}</div>
    ${playbookHTML(d.id)}
    ${lawStackHTML(d)}
    <div class="stats">
      <div><strong id="statIn">${state.stats[d.id].in}</strong><span>Hồ sơ nhận</span></div>
      <div><strong id="statOut">${state.stats[d.id].out}</strong><span>Hoàn tất</span></div>
    </div>`;
  if (d.id === 'director') appendDirectorInbox();
}

function renderHRCard(d) {
  const plan = syncAI();
  const doneSet = new Set(aiState.done);
  const approvedSet = new Set(aiState.approved);
  const doneCount = plan.tasks.filter((t) => doneSet.has(t.id)).length;
  const approvedCount = plan.tasks.filter((t) => approvedSet.has(t.id)).length;

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
    <div class="notif-slot">${notifPanelHTML(d)}</div>
    ${staffListHTML(d)}
    ${lawStackHTML(d)}
    ${playbookHTML('hr')}
    <div class="ai-panel">
      <div class="ai-head">
        <span class="ai-badge"><span class="ai-dot"></span>AI NHÂN SỰ</span>
        <span class="ai-date">${formatViDate(plan.date)}</span>
      </div>
      <p class="ai-summary">Công ty thành lập ${COMPANY.label} · đang ở tháng thứ ${plan.months + 1} · đọc ${LEGAL_SOURCES.length} văn bản · xếp hạng ${plan.tasks.length} việc theo mức khẩn cấp</p>
      <p class="ai-report"><span class="ai-report-ico">⏱</span>Báo cáo tự động <b>09:00</b> hằng ngày tới Giám đốc · <span class="ai-report-next">${reportScheduleText()}</span></p>
      <ol class="ai-tasks">
        ${plan.tasks.map((t) => `
          <li class="ai-task ${doneSet.has(t.id) ? 'is-done' : ''}" data-task="${t.id}">
            <span class="ai-rank" title="Thứ tự ưu tiên">${t.rank}</span>
            <button class="ai-check" type="button" aria-pressed="${doneSet.has(t.id)}" aria-label="Đánh dấu hoàn thành">${doneSet.has(t.id) ? '✓' : ''}</button>
            <div class="ai-task-body">
              <span class="ai-pri ${t.level}">${t.priorityLabel}</span>
              ${approvedSet.has(t.id) ? '<span class="ai-approved">Giám đốc đã duyệt</span>' : ''}
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
        <span class="ai-progress">${doneCount}/${plan.tasks.length} hoàn thành${approvedCount ? ` · ${approvedCount} đã duyệt` : ''}</span>
        <button class="ai-send" type="button">Gửi báo cáo ngay</button>
      </div>
      <details class="ai-sources">
        <summary>Nguồn AI đã đọc (${LEGAL_SOURCES.length})</summary>
        <ul>${LEGAL_SOURCES.map((s) => `<li><b>${s.code}</b> — ${s.name}. <span>${s.note}</span></li>`).join('')}</ul>
      </details>
      <p class="ai-note">Nội dung mô phỏng phục vụ trình diễn, cần đối chiếu văn bản pháp luật hiện hành trước khi áp dụng.</p>
    </div>`;
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  const take = parts.slice(-2).map((p) => p[0] || '');
  return (take.join('') || '?').toUpperCase();
}

function staffTasks(staffId) {
  if (!Array.isArray(taskState[staffId])) taskState[staffId] = [];
  return taskState[staffId];
}

function taskHTML(staffId, t) {
  return `<li class="task${t.done ? ' is-done' : ''}" data-task-id="${t.id}">
    <button class="task-check" type="button" data-staff="${staffId}" data-task-id="${t.id}" aria-pressed="${t.done}" aria-label="Đánh dấu hoàn thành">${t.done ? '✓' : ''}</button>
    <span class="task-text">${esc(t.text)}</span>
    <button class="task-del" type="button" data-staff="${staffId}" data-task-id="${t.id}" aria-label="Xoá việc">×</button>
  </li>`;
}

function secretaryPanelHTML() {
  const opts = DEPARTMENTS.filter((d) => d.id !== 'director')
    .map((d) => `<option value="${d.id}">${d.icon} ${esc(d.name)}</option>`)
    .join('');
  return `<div class="msg-panel">
    <div class="msg-head">
      <h3>Giám đốc giao thư ký</h3>
      <span class="msg-tag">Thư ký đi bộ</span>
    </div>
    <p class="msg-hint">Giám đốc giao thông điệp — thư ký rời bàn, đi bộ sang từng phòng để đưa tin rồi quay về.</p>
    <form class="msg-form">
      <label>Gửi tới<select name="to">
        <option value="all">Toàn bộ phòng ban</option>${opts}
      </select></label>
      <label>Nội dung<textarea name="text" rows="2" maxlength="140" placeholder="VD: Rà soát BOQ dự án trước 16h hôm nay" required></textarea></label>
      <button type="submit">Giao thư ký đưa tin</button>
    </form>
    <p class="msg-status" aria-live="polite"></p>
  </div>`;
}

const SECRETARY_ID = 'director-secretary';
let messageBusy = false;

function secretaryStartPath() {
  const d = DEPT_MAP.director;
  return [
    floorPoint(4.55, -11.5),
    floorPoint(4.55, -12.5),
    floorPoint(2.8, -12.5),
    floorPoint(2.8, -8.3),
    floorPoint(0, -8.3),
    floorPoint(0, innerDoorZ(d)),
    floorPoint(0, outerDoorZ(d)),
  ];
}

function secretaryTargetPath(fromX, to) {
  return [
    floorPoint(fromX, WORLD.corridorZ),
    floorPoint(to.posX, WORLD.corridorZ),
    floorPoint(to.posX, outerDoorZ(to)),
    floorPoint(to.posX, innerDoorZ(to)),
  ];
}

function secretaryHomePath(fromX) {
  const d = DEPT_MAP.director;
  return [
    floorPoint(fromX, WORLD.corridorZ),
    floorPoint(0, WORLD.corridorZ),
    floorPoint(0, outerDoorZ(d)),
    floorPoint(0, innerDoorZ(d)),
    floorPoint(0, -8.3),
    floorPoint(2.8, -8.3),
    floorPoint(2.8, -12.5),
    floorPoint(4.55, -12.5),
    floorPoint(4.55, -11.5),
  ];
}

async function sendSecretaryMessage(form) {
  if (messageBusy) return;
  const data = new FormData(form);
  const text = String(data.get('text') || '').trim().slice(0, 140);
  const to = String(data.get('to') || 'all');
  if (!text) return;
  if (state.running) {
    showToast('Đang chạy quy trình — thử lại sau khi quy trình kết thúc', 3200);
    return;
  }
  if (!world.people[SECRETARY_ID]) {
    showToast('Thư ký không còn trong phòng Giám đốc', 3000);
    return;
  }
  if (world.hasWalkers()) {
    showToast('Đang có nhân sự di chuyển — thử lại sau giây lát', 3000);
    return;
  }

  const targets = (to === 'all'
    ? DEPARTMENTS.filter((d) => d.id !== 'director')
    : DEPARTMENTS.filter((d) => d.id === to))
    .slice()
    .sort((a, b) => a.posX - b.posX);
  if (!targets.length) return;

  messageBusy = true;
  const flowAtStart = state.runId;
  const btn = form.querySelector('button');
  const status = ui.card.querySelector('.msg-status');
  const label = btn ? btn.textContent : '';
  const names = targets.map((d) => d.short).join(', ');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Thư ký đang đi...';
  }
  if (status) status.textContent = `Thư ký nhận chỉ đạo và bắt đầu đi tới ${names}...`;

  const task = {
    id: makeId('t'),
    text: `Đưa thông điệp tới ${names}: ${text}`.slice(0, 90),
    done: false,
    at: Date.now(),
  };
  staffTasks(SECRETARY_ID).unshift(task);
  saveTasks(taskState);
  addLog('director', `Giao thư ký đưa tin tới ${names}`);

  let delivered = 0;
  let cancelled = false;
  try {
    setStatus('Thư ký nhận chỉ đạo từ Giám đốc...', 'running');
    cancelled = !(await world.walkPerson(SECRETARY_ID, secretaryStartPath(), {
      speed: walkSpeed(), end: 'stand',
    }));
    let x = 0;
    for (const d of targets) {
      if (cancelled || state.runId !== flowAtStart) break;
      setStatus(`Thư ký đang đi tới ${d.short}...`, 'running');
      cancelled = !(await world.walkPerson(SECRETARY_ID, secretaryTargetPath(x, d), {
        speed: walkSpeed(), end: 'stand',
      }));
      if (cancelled) break;
      x = d.posX;
      notifyDept(d.id, 'Thư ký Giám đốc', text, 'director');
      addLog(d.id, `Thư ký Giám đốc đưa tin: ${text}`);
      delivered += 1;
      showToast(`Thư ký đã đưa thông điệp tại ${d.short}`, 2200);
      await new Promise((r) => setTimeout(r, 340 / state.speed));
    }

    if (!cancelled && state.runId === flowAtStart) {
      setStatus('Thư ký đang quay về phòng Giám đốc...', 'running');
      cancelled = !(await world.walkPerson(SECRETARY_ID, secretaryHomePath(x), {
        speed: walkSpeed(), end: 'sit',
      }));
    }
  } finally {
    if (cancelled && world.people[SECRETARY_ID] && !world.people[SECRETARY_ID].walk) {
      world.parkPerson(SECRETARY_ID);
    }
    const rec = staffTasks(SECRETARY_ID).find((t) => t.id === task.id);
    if (rec) {
      rec.done = delivered === targets.length;
      saveTasks(taskState);
    }
    messageBusy = false;
    if (!state.running) setStatus('Sẵn sàng', 'idle');
    if (btn && form.isConnected) {
      btn.disabled = false;
      btn.textContent = label;
    }
    const msgText = delivered === targets.length
      ? `✓ Thư ký đã đưa tin tới ${names} lúc ${formatViTime(Date.now())}`
      : delivered
        ? `Lượt đi bị ngắt — đã đưa tin tới ${delivered}/${targets.length} phòng`
        : 'Lượt đi bị ngắt — thông điệp chưa được giao';
    if (delivered === targets.length) {
      showToast(`Thư ký đã đưa tin tới ${targets.length} phòng`, 3800);
      if (form.isConnected) form.reset();
    }
    if (state.selected === 'director' && state.selectedStaff === SECRETARY_ID) {
      const m = membersOf(DEPT_MAP.director).find((x2) => x2.id === SECRETARY_ID);
      if (m) renderStaffCard(DEPT_MAP.director, m);
    }
    const liveStatus = ui.card.querySelector('.msg-status');
    if (liveStatus) liveStatus.textContent = msgText;
    renderBoard();
  }
}

let dismissArm = null;

function clearDismissArm() {
  if (dismissArm) clearTimeout(dismissArm.timer);
  dismissArm = null;
}

function renderStaffCard(d, m) {
  clearDismissArm();
  const tasks = staffTasks(m.id);
  const openCount = tasks.filter((t) => !t.done).length;
  const hasLaw = Boolean(m.lawGroup && LAW_GROUPS[m.lawGroup]);
  const primaryId = (d.staffList?.length ? d.staffList[0] : { id: d.id }).id;
  const isPrimary = m.id === primaryId;

  ui.card.classList.remove('is-ai');
  ui.card.innerHTML = `
    <button class="close" type="button" aria-label="Đóng">×</button>
    <button class="staff-back" type="button" data-back="${d.id}">‹ ${esc(d.short)}</button>
    <div class="card-head">
      <div class="avatar" style="background:${d.color}">${esc(initials(m.name))}</div>
      <div>
        <span class="tag" style="color:${d.color}">${esc(m.role)}</span>
        <h2>${esc(m.name)}</h2>
      </div>
    </div>
    <p class="staff-room">${d.icon} ${esc(d.name)}</p>
    ${m.scope ? `<div class="duties"><span>${esc(m.scope)}</span></div>` : ''}
    ${m.duty === 'secretary' ? secretaryPanelHTML() : ''}
    ${hasLaw ? `<div class="law-stack">${lawBlockHTML(m.lawGroup)}</div>` : `<p class="desc">${esc(d.desc)}</p>`}
    <div class="task-panel">
      <div class="task-head">
        <h3>Việc được giao</h3>
        <span class="task-count">${tasks.length ? `${openCount}/${tasks.length} chưa xong` : 'Chưa có việc'}</span>
      </div>
      ${tasks.length
        ? `<ul class="task-list">${tasks.map((t) => taskHTML(m.id, t)).join('')}</ul>`
        : '<p class="task-empty">Chưa giao việc nào cho nhân sự này.</p>'}
      <form class="task-form" data-staff="${m.id}">
        <input name="task" type="text" maxlength="90" placeholder="Giao việc mới..." autocomplete="off" required>
        <button type="submit">Giao</button>
      </form>
    </div>
    <div class="staff-danger">
      <button class="dismiss-btn" type="button" data-dismiss="${m.id}" ${isPrimary ? 'disabled' : ''}>Cho thôi việc</button>
      <p class="dismiss-note">${isPrimary
        ? 'Nhân sự chính gắn với quy trình hồ sơ của phòng nên không thể cho thôi việc.'
        : 'Xoá nhân sự khỏi phòng, bàn làm việc 3D và toàn bộ việc đã giao.'}</p>
    </div>`;
}

function renderRecruitCard(d) {
  const count = membersOf(d).length;
  ui.card.classList.remove('is-ai');
  ui.card.innerHTML = `
    <button class="close" type="button" aria-label="Đóng">×</button>
    <button class="staff-back" type="button" data-back="${d.id}">‹ ${esc(d.short)}</button>
    <div class="card-head">
      <div class="avatar" style="background:${d.color}">＋</div>
      <div>
        <span class="tag" style="color:${d.color}">Tuyển dụng</span>
        <h2>Thêm nhân sự · ${esc(d.short)}</h2>
      </div>
    </div>
    <p class="desc">Phòng đang có ${count}/3 nhân sự. Nhân sự mới được kê thêm bàn làm việc riêng trong mô hình 3D, nhận việc và thông báo như các nhân sự khác. Phần “Phụ trách” chỉ là mô tả trên hồ sơ — nghiệp vụ chuyên biệt vẫn cần lập trình thêm.</p>
    <form class="recruit-form" data-dept="${d.id}">
      <label>Họ tên<input name="name" type="text" maxlength="40" placeholder="VD: Nguyễn Văn An" autocomplete="off" required></label>
      <label>Chức danh<input name="role" type="text" maxlength="40" placeholder="VD: Chuyên viên hồ sơ" autocomplete="off" required></label>
      <label>Phụ trách<input name="scope" type="text" maxlength="60" placeholder="VD: Hồ sơ dự án & lưu trữ" autocomplete="off"></label>
      <button type="submit" class="btn primary">Tuyển vào phòng</button>
    </form>`;
}

function selectStaff(d, staffId) {
  const m = membersOf(d).find((x) => x.id === staffId);
  if (!m) return;
  state.selected = d.id;
  state.selectedStaff = m.id;
  hideToast();
  renderStaffCard(d, m);
  ui.card.classList.remove('hidden');
  markDeptNotifsRead(d.id);
}

function selectRecruit(deptId) {
  const d = DEPT_MAP[deptId];
  if (!d) return;
  if (membersOf(d).length >= 3) {
    showToast('Mỗi phòng tối đa 3 nhân sự', 2600);
    return;
  }
  state.selected = d.id;
  state.selectedStaff = null;
  hideToast();
  renderRecruitCard(d);
  ui.card.classList.remove('hidden');
}

function hireStaff(form) {
  const d = DEPT_MAP[form.dataset.dept];
  if (!d) return;
  if (membersOf(d).length >= 3) {
    showToast('Mỗi phòng tối đa 3 nhân sự', 2600);
    return;
  }
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim().slice(0, 40);
  const role = String(data.get('role') || '').trim().slice(0, 40);
  const scope = String(data.get('scope') || '').trim().slice(0, 60);
  if (!name || !role) return;

  const slot = membersOf(d).length - 1;
  const member = {
    id: makeId(d.id),
    name,
    role,
    scope,
    hired: true,
    screen: DEPT_SCREENS[d.id],
    look: HIRE_LOOKS[slot % HIRE_LOOKS.length],
  };

  roster.extras[d.id].push(member);
  if (!world.addStaffMember(d, member)) {
    roster.extras[d.id].pop();
    showToast('Phòng đã đủ nhân sự', 2600);
    return;
  }
  saveRoster(roster);
  updateStaffCount();
  addLog(d.id, `Tuyển mới ${name} — ${role}`);
  showToast(`${name} đã vào ${d.short} · Đã kê thêm bàn làm việc`, 4200);
  selectStaff(d, member.id);
}

function armDismiss(staffId) {
  const btn = ui.card.querySelector('.dismiss-btn');
  if (!btn || btn.disabled) return;
  if (dismissArm && dismissArm.id === staffId) {
    clearDismissArm();
    dismissStaff(staffId);
    return;
  }
  clearDismissArm();
  dismissArm = {
    id: staffId,
    timer: setTimeout(() => {
      dismissArm = null;
      const b = ui.card.querySelector('.dismiss-btn');
      if (b) {
        b.classList.remove('is-confirm');
        b.textContent = 'Cho thôi việc';
      }
    }, 4000),
  };
  btn.classList.add('is-confirm');
  btn.textContent = 'Bấm lần nữa để xác nhận';
}

function dismissStaff(staffId) {
  const d = DEPT_MAP[state.selected];
  if (!d) return;
  const m = membersOf(d).find((x) => x.id === staffId);
  if (!m) return;
  if (state.running) {
    showToast('Đang chạy quy trình — dừng lại trước khi cho thôi việc', 3200);
    return;
  }
  if (world.hasWalkers()) {
    showToast('Nhân sự đang di chuyển — thử lại sau giây lát', 3200);
    return;
  }
  const baseSecondary = (d.staffList || []).slice(1).some((x) => x.id === staffId);
  const isExtra = (roster.extras[d.id] || []).some((x) => x.id === staffId);
  if (!baseSecondary && !isExtra) return;

  if (!world.removeStaffMember(d.id, staffId)) {
    showToast('Không thể xoá nhân sự này khỏi mô hình', 3000);
    return;
  }
  if (isExtra) roster.extras[d.id] = roster.extras[d.id].filter((x) => x.id !== staffId);
  if (baseSecondary) {
    dismissed[d.id] = [...new Set([...(dismissed[d.id] || []), staffId])];
    roster.dismissed[d.id] = dismissed[d.id];
  }
  saveRoster(roster);
  delete taskState[staffId];
  saveTasks(taskState);
  updateStaffCount();
  addLog(d.id, `Cho ${m.name} thôi việc — ${m.role}`);
  showToast(`Đã cho ${m.name} thôi việc · Đã xoá bàn làm việc và việc được giao`, 4600);
  selectDept(d.id);
}

function rerenderStaff(staffId) {
  const d = DEPT_MAP[state.selected];
  if (!d) return;
  const m = membersOf(d).find((x) => x.id === staffId);
  if (m) renderStaffCard(d, m);
}

function addStaffTask(staffId, text) {
  const clean = String(text || '').trim().slice(0, 90);
  if (!clean) return;
  staffTasks(staffId).unshift({ id: makeId('t'), text: clean, done: false, at: Date.now() });
  saveTasks(taskState);
  rerenderStaff(staffId);
  const d = DEPT_MAP[state.selected];
  const m = d ? membersOf(d).find((x) => x.id === staffId) : null;
  addLog(d ? d.id : null, `Giao việc cho ${m ? m.name : 'nhân sự'}: ${clean}`);
  if (d) notifyDept(d.id, 'Điều hành', `Giao việc cho ${m ? m.name : 'nhân sự'}: ${clean}`);
  showToast(`Đã giao việc cho ${m ? m.name : 'nhân sự'}`, 2600);
  const input = ui.card.querySelector('.task-form input');
  if (input) input.focus();
}

function toggleStaffTask(staffId, taskId) {
  const tasks = staffTasks(staffId);
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;
  t.done = !t.done;
  saveTasks(taskState);

  const li = ui.card.querySelector(`.task[data-task-id="${taskId}"]`);
  if (li) {
    li.classList.toggle('is-done', t.done);
    const btn = li.querySelector('.task-check');
    btn.setAttribute('aria-pressed', String(t.done));
    btn.textContent = t.done ? '✓' : '';
  }
  const count = ui.card.querySelector('.task-count');
  if (count) {
    const open = tasks.filter((x) => !x.done).length;
    count.textContent = `${open}/${tasks.length} chưa xong`;
  }
  renderBoard();
}

function removeStaffTask(staffId, taskId) {
  const tasks = staffTasks(staffId);
  const i = tasks.findIndex((x) => x.id === taskId);
  if (i < 0) return;
  tasks.splice(i, 1);
  saveTasks(taskState);
  rerenderStaff(staffId);
  renderBoard();
}

function toggleAITask(li) {
  const id = li.dataset.task;
  const doneSet = new Set(aiState.done);
  if (doneSet.has(id)) doneSet.delete(id);
  else doneSet.add(id);
  aiState.done = [...doneSet];
  saveAIState(aiState);
  settleProposalNotices();

  const isDone = doneSet.has(id);
  li.classList.toggle('is-done', isDone);
  const btn = li.querySelector('.ai-check');
  btn.setAttribute('aria-pressed', String(isDone));
  btn.textContent = isDone ? '✓' : '';
  const count = aiPlan.tasks.filter((t) => doneSet.has(t.id)).length;
  const approved = aiPlan.tasks.filter((t) => aiState.approved.includes(t.id)).length;
  ui.card.querySelector('.ai-progress').textContent = `${count}/${aiPlan.tasks.length} hoàn thành${approved ? ` · ${approved} đã duyệt` : ''}`;
  renderBoard();
}

// ------------------------------------------------------------ daily reports

function docsProcessedToday() {
  return Object.values(state.stats).reduce((n, s) => n + s.in, 0);
}

function reportScheduleText() {
  const now = new Date();
  const key = dayKey(now);
  if (reports.lastAuto === key) {
    const sent = reports.items.find((r) => r.auto && dayKey(new Date(r.at)) === key);
    return sent ? `hôm nay đã gửi lúc ${formatViTime(sent.at)}` : 'hôm nay đã gửi';
  }
  const nine = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  if (now < nine) {
    const mins = Math.max(1, Math.round((nine - now) / 60000));
    return `còn ${Math.floor(mins / 60)} giờ ${mins % 60} phút nữa`;
  }
  return 'sẽ gửi bù cho mốc 09:00';
}

function refreshReportSchedule() {
  const el = ui.card.querySelector('.ai-report-next');
  if (el) el.textContent = reportScheduleText();
}

function buildReport({ auto = false, late = 0 } = {}) {
  const plan = syncAI();
  const doneSet = new Set(aiState.done);
  return {
    id: makeId('r'),
    at: Date.now(),
    auto,
    late,
    staff: staffTotal(),
    docs: docsProcessedToday(),
    total: plan.tasks.length,
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      level: t.level,
      priorityLabel: t.priorityLabel,
      rank: t.rank,
      done: doneSet.has(t.id),
    })),
  };
}

function sendDirectorReport({ auto = false, late = 0 } = {}) {
  const report = buildReport({ auto, late });
  reports.items.unshift(report);
  reports.items = reports.items.slice(0, 12);
  saveReports(reports);

  aiState.sentAt = report.at;
  saveAIState(aiState);

  const lead = report.tasks[0] ? `ưu tiên 1: ${report.tasks[0].title}` : 'chưa có việc';
  notifyDept('director', auto ? 'AI Nhân sự · 09:00' : 'AI Nhân sự', `Đề xuất ${report.total} việc chờ Giám đốc duyệt — ${lead}`, 'hr', {
    kind: 'proposal',
    reportId: report.id,
  });
  addLog('hr', `${auto ? '09:00 · ' : ''}AI Nhân sự gửi báo cáo ${report.total} việc tới Giám đốc`);

  if (state.selected === 'director' && !state.selectedStaff) renderCard(DEPT_MAP.director);
  if (state.selected === 'hr' && !state.selectedStaff) refreshReportSchedule();

  return report;
}

function sendHRProposal() {
  sendDirectorReport();
  showToast('Đã gửi báo cáo tới Giám đốc · Bấm phòng Giám đốc để xem', 4200);
}

function autoReportTick() {
  const now = new Date();
  const key = dayKey(now);
  if (reports.lastAuto === key) return;
  const nine = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
  if (now < nine) return;

  reports.lastAuto = key;
  const late = Math.round((now - nine) / 60000);
  const report = sendDirectorReport({ auto: true, late });
  saveReports(reports);
  showToast(
    late > 5
      ? `AI Nhân sự đã gửi báo cáo 09:00 (bù lúc ${formatViTime(report.at)}) tới Giám đốc`
      : '09:00 · AI Nhân sự đã gửi báo cáo công việc tới Giám đốc',
    5200
  );
}

function approveProposal(reportId, taskId = null) {
  const report = reports.items.find((r) => r.id === reportId);
  if (!report) return;
  const approved = new Set(aiState.approved);
  const done = new Set(aiState.done);
  const picked = report.tasks.filter((t) => (
    (!taskId || t.id === taskId)
    && !t.done
    && !done.has(t.id)
    && !approved.has(t.id)
  ));
  if (!picked.length) return;
  for (const t of picked) approved.add(t.id);
  aiState.approved = [...approved];
  saveAIState(aiState);
  settleProposalNotices();

  const label = picked.length === 1 ? `đề xuất: ${picked[0].title}` : `${picked.length} đề xuất AI Nhân sự`;
  addLog('director', `Giám đốc duyệt ${label}`);
  notifyDept('hr', 'Giám đốc', `Đã duyệt ${label}`, 'director');
  showToast(`Đã duyệt ${label}`, 3200);

  if (state.selected === 'director' && !state.selectedStaff) {
    const top = ui.card.scrollTop;
    renderCard(DEPT_MAP.director);
    ui.card.scrollTop = top;
  }
}

function appendDirectorInbox() {
  const today = dayKey();
  const doneSet = new Set(aiState.done);
  const approvedSet = new Set(aiState.approved);
  const pendingCount = reports.items
    .filter((r) => dayKey(new Date(r.at)) === today && !reportResolved(r)).length;
  const box = document.createElement('div');
  box.className = 'inbox';
  box.innerHTML = `
    <div class="live-strip"><span class="live-dot"></span>Báo cáo thời gian thực · ${staffTotal()} nhân sự · ${docsProcessedToday()} hồ sơ hôm nay · ${pendingCount} đề xuất chờ duyệt</div>`;

  const list = reports.items.slice(0, 2);
  if (!list.length) {
    box.insertAdjacentHTML('beforeend', `
      <div class="inbox-head">
        <span class="tag" style="color:#0d9488">Đề xuất từ Nhân sự</span>
        <span class="inbox-time">09:00 hằng ngày</span>
      </div>
      <p class="inbox-note">Chưa có đề xuất. AI Nhân sự sẽ gửi lúc 09:00.</p>`);
    ui.card.appendChild(box);
    return;
  }

  const html = list.map((r) => {
    const isToday = dayKey(new Date(r.at)) === today;
    const timeLabel = r.auto
      ? `09:00${r.late > 5 ? ` · gửi bù ${formatViTime(r.at)}` : ''}`
      : formatViTime(r.at);
    const isDone = (t) => (isToday ? (t.done || doneSet.has(t.id)) : t.done);
    const isApproved = (t) => isToday && approvedSet.has(t.id);
    const pending = r.tasks.filter((t) => !isDone(t) && !isApproved(t));
    const doneCount = r.tasks.filter(isDone).length;
    const approvedCount = r.tasks.filter((t) => isApproved(t) && !isDone(t)).length;
    return `<div class="inbox-head">
        <span class="tag" style="color:#0d9488">${r.auto ? 'Đề xuất 09:00' : 'Đề xuất tức thời'}</span>
        <span class="inbox-time">${timeLabel}${isToday ? '' : ` · ${formatViDate(new Date(r.at))}`}</span>
      </div>
      <ol class="inbox-list">
        ${r.tasks.map((t) => {
          const done = isDone(t);
          const approved = isApproved(t);
          let state = '<span class="inbox-state is-pending">Chờ xử lý</span>';
          if (done) state = '<span class="inbox-state is-done">Đã xong</span>';
          else if (approved) state = '<span class="inbox-state is-approved">Đã duyệt</span>';
          else if (isToday) state = '<button class="inbox-approve" type="button" data-report="' + r.id + '" data-task="' + t.id + '">Duyệt</button><span class="inbox-state is-pending">Chờ duyệt</span>';
          return `<li class="${done ? 'is-done' : ''}" data-task="${t.id}">
            <span class="inbox-rank" data-level="${t.level}">${t.rank}</span>
            <span>${esc(t.title)}</span>
            ${state}
          </li>`;
        }).join('')}
      </ol>
      <p class="inbox-note">${r.staff} nhân sự · ${r.docs} hồ sơ hôm nay · ${doneCount}/${r.total} việc AI đã xong${approvedCount ? ` · ${approvedCount} việc đã duyệt` : ''}</p>
      ${isToday && pending.length ? `<div class="inbox-actions">
        <button class="inbox-approve-all" type="button" data-report="${r.id}">Duyệt tất cả (${pending.length})</button>
        <span>Đọc thông báo không làm mất đề xuất — chỉ khi duyệt thì đề xuất mới được xử lý.</span>
      </div>` : ''}`;
  }).join('');
  box.insertAdjacentHTML('beforeend', html);
  ui.card.appendChild(box);
}

// ------------------------------------------------------------ operations dashboard

let dashFrame = null;

function liveOps(now = new Date()) {
  const pendingList = pendingProposalTasks();
  const ai = aiCounts();
  const tasksByDept = {};
  const deptRows = [];
  let staffOpen = 0;
  let staffDone = 0;
  for (const d of DEPARTMENTS) {
    const c = deptTaskCounts(d.id);
    tasksByDept[d.id] = c;
    staffOpen += c.open;
    staffDone += c.done;
    deptRows.push({ id: d.id, short: d.short, color: d.color, open: c.open, done: c.done });
  }
  const latest = reports.items[0] || null;
  return {
    now,
    docsToday: docsProcessedToday(),
    staffTotal: staffTotal(),
    pendingApprovals: pendingList.length,
    pendingList,
    tasksOpen: staffOpen + ai.approved,
    tasksDone: staffDone + ai.done,
    tasksByDept,
    deptRows,
    ai,
    hr: { open: ai.open, done: ai.done, total: ai.total },
    lastReportAt: latest && dayKey(new Date(latest.at)) === dayKey(now) ? latest.at : null,
  };
}

function dashRowsHTML(rows = []) {
  return `<div class="dash-rows">${rows.map((r) => `
    <div class="dash-row${r.tone ? ` is-${r.tone}` : ''}">
      <div class="dash-row-top"><span>${esc(r.label)}</span><b>${esc(r.value)}</b></div>
      <p>${esc(r.note || '')}${r.sample ? '<em class="dash-sample is-mini">mẫu</em>' : ''}</p>
    </div>`).join('')}</div>`;
}

function dashDeptsHTML(depts = []) {
  const total = depts.reduce((n, d) => n + d.open + d.done, 0);
  if (!total) {
    return '<p class="dash-empty">Chưa có việc được giao — duyệt đề xuất AI hoặc giao việc trong thẻ phòng.</p>';
  }
  const max = Math.max(1, ...depts.map((d) => d.open + d.done));
  return `<div class="dash-depts">${depts.map((d) => `
    <div class="dash-dept" style="--c:${d.color}">
      <span class="dash-dept-dot"></span>
      <span class="dash-dept-name">${esc(d.short)}</span>
      <span class="dash-dept-bar"><i style="width:${Math.round(((d.open + d.done) / max) * 100)}%"></i></span>
      <b>${d.open}</b>
    </div>`).join('')}</div>`;
}

const ALERT_LEVEL_LABEL = { urgent: 'Gấp', high: 'Ưu tiên', medium: 'Theo dõi' };

function dashAlertsHTML(alerts = []) {
  if (!alerts.length) return '<p class="dash-empty">Không có cảnh báo cần quyết.</p>';
  return `<ul class="dash-alert-list">${alerts.map((a) => `
    <li class="dash-alert is-${a.level}">
      <div class="dash-alert-top">
        <span class="dash-alert-level">${ALERT_LEVEL_LABEL[a.level] || 'Theo dõi'}</span>
        <strong>${esc(a.title)}</strong>
      </div>
      <p>${esc(a.detail)}</p>
      <em>${esc(a.meta)}</em>
    </li>`).join('')}</ul>`;
}

function dashCadenceHTML(cadence = []) {
  return `<ul class="dash-cadence">${cadence.map((c) => `
    <li>
      <time>${esc(c.when)}</time>
      <div><b>${esc(c.owner)}</b><span>${esc(c.text)}</span></div>
    </li>`).join('')}</ul>`;
}

function dashboardHTML(model) {
  return `
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Kết quả kinh doanh</h3><span>Quy mô &amp; thu tiền</span></div>
      <div class="dash-hero">${model.hero.map((t) => `
        <div class="dash-tile${t.tone ? ` is-${t.tone}` : ''}">
          <span>${esc(t.label)}</span>
          <strong>${esc(t.value)}</strong>
          <em>${esc(t.note)}</em>
        </div>`).join('')}</div>
    </section>
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Kinh doanh</h3><span>Pipeline &amp; hợp đồng</span></div>
      ${dashRowsHTML(model.sales.rows)}
    </section>
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Tài chính</h3><span>Công nợ &amp; thuế</span></div>
      <div class="dash-aging">${model.finance.aging.map((a) => `
        <div class="dash-aging-row${a.key === 'current' ? '' : ` is-${a.key}`}">
          <div class="dash-aging-head"><span>${esc(a.label)}</span><b>${fmtVnd(a.value)}</b></div>
          <div class="dash-bar"><i style="width:${a.pct}%"></i></div>
        </div>`).join('')}</div>
      ${dashRowsHTML(model.finance.rows)}
    </section>
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Vận hành hôm nay</h3><span>Dữ liệu thực</span></div>
      ${dashRowsHTML(model.ops.rows)}
      <div class="dash-sub">Việc đang làm theo phòng</div>
      ${dashDeptsHTML(model.ops.depts)}
    </section>
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Nhân sự &amp; pháp lý</h3><span>Định biên 8 người</span></div>
      ${dashRowsHTML(model.people.rows)}
    </section>
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Cần quyết hôm nay</h3><span>${model.alerts.length} cảnh báo</span></div>
      ${dashAlertsHTML(model.alerts)}
    </section>
    <section class="dash-sec">
      <div class="dash-sec-title"><h3>Nhịp điều hành</h3><span>Báo cáo định kỳ</span></div>
      ${dashCadenceHTML(model.cadence)}
    </section>`;
}

function renderDashboard({ force = false } = {}) {
  if (!ui.dashBody) return;
  if (!force && state.panelTab !== 'dash') return;
  const now = new Date();
  const live = liveOps(now);
  const model = getDashboardModel(live, now);
  const scroll = ui.dashBody.scrollTop;
  if (ui.dashAsOf) ui.dashAsOf.textContent = `Cập nhật ${formatViTime(now)}`;
  ui.dashBody.innerHTML = dashboardHTML(model);
  ui.dashBody.scrollTop = scroll;
}

function queueDashRefresh() {
  if (dashFrame) return;
  dashFrame = requestAnimationFrame(() => {
    dashFrame = null;
    renderDashboard();
  });
}

function setPanelTab(tab) {
  state.panelTab = tab === 'dash' ? 'dash' : 'board';
  const dash = state.panelTab === 'dash';
  if (ui.tabBoard) ui.tabBoard.setAttribute('aria-selected', String(!dash));
  if (ui.tabDash) ui.tabDash.setAttribute('aria-selected', String(dash));
  ui.boardView?.classList.toggle('hidden', dash);
  ui.dashView?.classList.toggle('hidden', !dash);
  ui.boardPanel?.classList.toggle('is-dash', dash);
  if (dash) renderDashboard({ force: true });
}

function openPanel(tab = 'dash') {
  setPanelTab(tab);
  ui.boardPanel?.classList.add('is-open');
  ui.dashBtn?.setAttribute('aria-expanded', 'true');
  if (window.matchMedia('(max-width: 980px)').matches) deselect();
  renderDashboard({ force: true });
}

function closePanelSheet() {
  ui.boardPanel?.classList.remove('is-open');
  ui.dashBtn?.setAttribute('aria-expanded', 'false');
}

function directorSummaryHTML() {
  const now = new Date();
  const live = liveOps(now);
  const snapshot = getBusinessSnapshot(now);
  const alerts = getSampleAlerts(snapshot, live, now);
  const top = alerts[0];
  return `<div class="kpi-block">
    <div class="kpi-head"><span>Điều hành</span><em class="dash-sample">${SAMPLE_LABEL}</em></div>
    <div class="kpi-grid">
      <div class="kpi-tile"><span>Hợp đồng ký mới</span><b>${fmtVnd(snapshot.signedValue)}</b></div>
      <div class="kpi-tile is-bad"><span>Công nợ quá hạn</span><b>${fmtVnd(snapshot.overdue)}</b></div>
      <div class="kpi-tile${live.pendingApprovals ? ' is-warn' : ''}"><span>Việc chờ duyệt</span><b>${live.pendingApprovals}</b></div>
      <div class="kpi-tile"><span>Hồ sơ hôm nay</span><b>${live.docsToday}</b></div>
    </div>
    ${top
      ? `<p class="kpi-alert is-${top.level}"><b>${esc(top.title)}</b><span>${esc(top.detail)}</span></p>`
      : '<p class="kpi-alert is-ok">Không có cảnh báo ưu tiên.</p>'}
    <button class="dash-open" type="button" data-open-dash>Mở dashboard điều hành ›</button>
  </div>`;
}

function playbookHTML(deptId) {
  const playbook = PLAYBOOK[deptId];
  if (!playbook) return '';
  const kpis = getDepartmentKpis(liveOps(), new Date())[deptId] || [];
  return `<div class="playbook">
    <div class="pb-head"><h3>Quy trình vận hành</h3><span>4 bước</span></div>
    <ol class="pb-steps">${playbook.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="pb-head"><h3>Chỉ số kiểm soát</h3><span>${kpis.length} chỉ số</span></div>
    <div class="pb-kpis">${kpis.map((k) => `
      <div class="pb-kpi${k.tone ? ` is-${k.tone}` : ''}">
        <span>${esc(k.label)}</span>
        <b>${esc(k.value)}</b>
        ${k.sample ? '<em class="pb-sample">mẫu</em>' : ''}
      </div>`).join('')}</div>
  </div>`;
}

function updateStatsUI(id) {
  if (state.selected !== id) return;
  const inEl = document.getElementById('statIn');
  const outEl = document.getElementById('statOut');
  if (inEl) inEl.textContent = state.stats[id].in;
  if (outEl) outEl.textContent = state.stats[id].out;
}

function focusDeptCamera(d) {
  if (state.viewLocked) return;
  const target = new THREE.Vector3(d.posX, 0.9, d.posZ + 0.3);
  const dist = THREE.MathUtils.clamp(defaultDistance() * 0.44, 19, 64);
  focusCamera(target.clone().addScaledVector(viewDir(), dist), target);
}

function selectDept(id, focus = true) {
  clearDismissArm();
  state.selected = id;
  state.selectedStaff = null;
  hideToast();
  const d = DEPT_MAP[id];
  renderCard(d);
  ui.card.classList.remove('hidden');
  if (ui.boardPanel?.classList.contains('is-open')) closePanelSheet();
  markDeptNotifsRead(id);

  if (focus) {
    if (controls.autoRotate) {
      controls.autoRotate = false;
      ui.rotate.classList.remove('active');
    }
    focusDeptCamera(d);
  }
}

function deselect() {
  clearDismissArm();
  state.selected = null;
  state.selectedStaff = null;
  ui.card.classList.add('hidden');
}

function setViewLocked(on) {
  state.viewLocked = on;
  controls.enabled = true;
  controls.enableRotate = !on;
  controls.enablePan = false;
  controls.enableZoom = true;
  ui.lock.classList.toggle('active', on);
  ui.lock.setAttribute('aria-pressed', String(on));
  ui.lock.title = on ? 'Mở khoá góc nhìn' : 'Khoá góc nhìn ban đầu · vẫn thu phóng được';
  ui.rotate.disabled = on;
  if (on) {
    controls.autoRotate = false;
    ui.rotate.classList.remove('active');
    deselect();
    focusCamera(defaultPos(), DEFAULT_TARGET);
    showToast('Đã khoá góc nhìn · Cuộn hoặc chụm 2 ngón để thu phóng', 3200);
  } else {
    showToast('Đã mở khoá góc nhìn · Kéo chuột để xoay tự do', 2400);
  }
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
  DEPARTMENTS.forEach((d) => setDeptActive(d.id, false));
  world.resetPeople();
  state.carrier = null;
  state.tokenGoal = null;
  for (const id of DEPARTMENTS.map((d) => d.id)) updateStatsUI(id);
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
    setDeptActive(id, false);
  }
  world.resetPeople();
  clearTrails();
  resetTokenToEntry();
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
      notifyDept(id, 'Khách hàng', 'Hồ sơ dự án vừa được gửi tới phòng — cần tiếp nhận và xử lý');
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
      notifyDept(id, from.short, `Hồ sơ vừa được chuyển tới từ ${from.short} — cần xử lý`, prev);
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

    setDeptActive(id, true);
    state.stats[id].in += 1;
    boardBump(id, 'in');
    updateStatsUI(id);

    setStatus(`${d.short} đang xử lý hồ sơ`, 'running');
    showBubble(d, d.work);
    const worked = await wait(2100 / state.speed, runId);
    if (!worked) return;

    state.stats[id].out += 1;
    boardBump(id, 'out');
    updateStatsUI(id);
    setDeptActive(id, false);
    setStepState(id, 'done');
    addLog(id, '✔ ' + d.done);
    hideBubble();

    prev = id;
    const paused = await wait(380 / state.speed, runId);
    if (!paused) return;
  }

  setStatus('Hoàn tất quy trình', 'done');
  addLog('accounting', 'Toàn bộ hồ sơ đã được phê duyệt và lưu tại Kế toán');
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

function castAt(clientX, clientY) {
  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(pointer, camera);
}

function pickDept(clientX, clientY) {
  castAt(clientX, clientY);
  const hit = raycaster.intersectObjects(world.pickables, false)[0];
  return hit ? hit.object.userData.deptId : null;
}

function pickStaff(clientX, clientY) {
  castAt(clientX, clientY);
  const hit = raycaster.intersectObjects(world.staffPickables, false)[0];
  return hit ? { deptId: hit.object.userData.deptId, staffId: hit.object.userData.staffId } : null;
}

canvas.addEventListener('pointermove', (e) => {
  const staff = pickStaff(e.clientX, e.clientY);
  state.hovered = staff ? staff.deptId : pickDept(e.clientX, e.clientY);
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
  const staff = pickStaff(e.clientX, e.clientY);
  if (staff) {
    selectStaff(DEPT_MAP[staff.deptId], staff.staffId);
    return;
  }
  const id = pickDept(e.clientX, e.clientY);
  if (id) selectDept(id);
  else deselect();
});

window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (ui.boardPanel?.classList.contains('is-open')) {
    closePanelSheet();
    return;
  }
  deselect();
});

ui.card.addEventListener('click', (e) => {
  const close = e.target.closest('.close');
  if (close) { deselect(); return; }

  const openDash = e.target.closest('[data-open-dash]');
  if (openDash) { openPanel('dash'); return; }

  const dismissBtn = e.target.closest('.dismiss-btn');
  if (dismissBtn) { armDismiss(dismissBtn.dataset.dismiss); return; }

  const staffBtn = e.target.closest('.staff-btn');
  if (staffBtn) {
    const d = DEPT_MAP[state.selected];
    if (d) selectStaff(d, staffBtn.dataset.staffId);
    return;
  }

  const hireBtn = e.target.closest('.hire-btn');
  if (hireBtn) { selectRecruit(hireBtn.dataset.hire); return; }

  const backBtn = e.target.closest('.staff-back');
  if (backBtn) { selectDept(backBtn.dataset.back); return; }

  const check = e.target.closest('.task-check');
  if (check) { toggleStaffTask(check.dataset.staff, check.dataset.taskId); return; }

  const del = e.target.closest('.task-del');
  if (del) { removeStaffTask(del.dataset.staff, del.dataset.taskId); return; }

  const approveOne = e.target.closest('.inbox-approve');
  if (approveOne) { approveProposal(approveOne.dataset.report, approveOne.dataset.task); return; }

  const approveAll = e.target.closest('.inbox-approve-all');
  if (approveAll) { approveProposal(approveAll.dataset.report); return; }

  const aiCheck = e.target.closest('.ai-check');
  if (aiCheck) { toggleAITask(aiCheck.closest('.ai-task')); return; }

  if (e.target.closest('.ai-send')) sendHRProposal();
});

ui.card.addEventListener('submit', (e) => {
  const taskForm = e.target.closest('.task-form');
  if (taskForm) {
    e.preventDefault();
    const input = taskForm.querySelector('input');
    if (input) addStaffTask(taskForm.dataset.staff, input.value);
    return;
  }
  const recruitForm = e.target.closest('.recruit-form');
  if (recruitForm) {
    e.preventDefault();
    hireStaff(recruitForm);
    return;
  }
  const msgForm = e.target.closest('.msg-form');
  if (msgForm) {
    e.preventDefault();
    sendSecretaryMessage(msgForm);
  }
});

ui.run.addEventListener('click', runFlow);

ui.tabBoard?.addEventListener('click', () => setPanelTab('board'));
ui.tabDash?.addEventListener('click', () => setPanelTab('dash'));
ui.panelClose?.addEventListener('click', closePanelSheet);
ui.dashBtn?.addEventListener('click', () => {
  if (ui.boardPanel?.classList.contains('is-open')) closePanelSheet();
  else openPanel('dash');
});

ui.speed.addEventListener('click', () => {
  state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
  ui.speed.textContent = `${state.speed}×`;
});

ui.lock.addEventListener('click', () => setViewLocked(!state.viewLocked));

ui.rotate.addEventListener('click', () => {
  if (state.viewLocked) return;
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
  updateStaffCount();
  syncAllNotifs();

  renderBoard();
  if (!boardDept('hr').actions.length) {
    addLog('hr', `AI Nhân sự xếp hạng ${aiPlan.tasks.length} việc ưu tiên hôm nay`);
  }
  setStatus('Sẵn sàng', 'idle');

  setTimeout(() => {
    showToast('Bấm một phòng rồi bấm từng nhân sự để xem nhiệm vụ · “Chạy quy trình” để mô phỏng dòng hồ sơ', 5600);
  }, 900);

  // báo cáo 09:00: gửi bù ngay khi mở trang sau mốc 9h, sau đó kiểm tra mỗi 20 giây
  setTimeout(() => {
    autoReportTick();
    setInterval(autoReportTick, 20000);
  }, 6500);
  setInterval(refreshReportSchedule, 15000);
  setInterval(() => {
    const key = dayKey();
    if (key === state.dashDay) return;
    state.dashDay = key;
    syncAI();
    syncBoardDay();
    renderBoard();
    renderDashboard({ force: true });
  }, 20000);

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

