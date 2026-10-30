const ROSTER_KEY = 'tts-office-roster-v1';
const TASK_KEY = 'tts-office-tasks-v1';

export function loadRoster() {
  try {
    const raw = JSON.parse(localStorage.getItem(ROSTER_KEY) || 'null');
    if (raw && raw.extras && typeof raw.extras === 'object') {
      return { extras: raw.extras };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { extras: {} };
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
