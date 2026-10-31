const ROSTER_KEY = 'tts-office-roster-v1';
const TASK_KEY = 'tts-office-tasks-v1';
const NOTIFY_KEY = 'tts-office-notify-v1';
const BOARD_KEY = 'tts-office-board-v1';

export function loadRoster() {
  try {
    const raw = JSON.parse(localStorage.getItem(ROSTER_KEY) || 'null');
    if (raw && raw.extras && typeof raw.extras === 'object') {
      return {
        extras: raw.extras,
        dismissed: raw.dismissed && typeof raw.dismissed === 'object' ? raw.dismissed : {},
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { extras: {}, dismissed: {} };
}

export function saveRoster(roster) {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch {
    /* storage unavailable */
  }
}

export function loadTasks() {
  try {
    const raw = JSON.parse(localStorage.getItem(TASK_KEY) || 'null');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
  } catch {
    /* ignore corrupt storage */
  }
  return {};
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
  } catch {
    /* storage unavailable */
  }
}

export function makeId(prefix = 's') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function loadNotifications() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIFY_KEY) || 'null');
    if (Array.isArray(raw)) {
      return raw.filter((n) => n && typeof n.deptId === 'string' && typeof n.text === 'string').slice(0, 40);
    }
  } catch {
    /* ignore corrupt storage */
  }
  return [];
}

export function saveNotifications(list) {
  try {
    localStorage.setItem(NOTIFY_KEY, JSON.stringify(list.slice(0, 40)));
  } catch {
    /* storage unavailable */
  }
}

export function loadBoard(dateKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(BOARD_KEY) || 'null');
    if (raw && raw.date === dateKey && raw.depts && typeof raw.depts === 'object') {
      return { date: raw.date, depts: raw.depts };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { date: dateKey, depts: {} };
}

export function saveBoard(board) {
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(board));
  } catch {
    /* storage unavailable */
  }
}
