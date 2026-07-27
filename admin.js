/* ═══════════════════════════════════════════════
   NORBYTE LABS — admin.js
   Full Standalone Management Console Logic
   ═══════════════════════════════════════════════ */

'use strict';

// ── THEME INITIALIZATION ──────────────────────
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark-theme');
} else {
  document.documentElement.classList.remove('dark-theme');
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// ── DEFAULT DATA SEEDS ────────────────────────
const DEFAULT_TRACKING_DATA = {
  "NBY-2026-101": {
    id: "NBY-2026-101",
    projectName: "IoT Smart Solar Telemetry Grid",
    client: "Rahul · Model Engineering College",
    status: "In Progress",
    progress: 75,
    notes: "Firmware stress test completed cleanly. Telemetry MQTT feeds active. Preparing final presentation binder."
  },
  "NBY-2026-102": {
    id: "NBY-2026-102",
    projectName: "Edge AI Defect Inspector Node",
    client: "Anjali · NIT Calicut",
    status: "Hardware Assembly",
    progress: 40,
    notes: "Raspberry Pi camera interface mounted & OpenCV real-time inference script deployed."
  }
};

const DEFAULT_PITCHES_DATA = [
  {
    id: "PITCH-1",
    date: "2026-07-27",
    name: "Siddharth Menon",
    college: "GEC Thrissur",
    dept: "ECE",
    brief: "Need a LoRa-based environmental water quality telemetry node with custom dashboard for major project submission."
  }
];

function getTrackingRecords() {
  const stored = localStorage.getItem('norbyte_tracking');
  if (!stored) {
    localStorage.setItem('norbyte_tracking', JSON.stringify(DEFAULT_TRACKING_DATA));
    return DEFAULT_TRACKING_DATA;
  }
  return JSON.parse(stored);
}

function saveTrackingRecords(records) {
  localStorage.setItem('norbyte_tracking', JSON.stringify(records));
}

function getPitches() {
  const stored = localStorage.getItem('norbyte_pitches');
  if (!stored) {
    localStorage.setItem('norbyte_pitches', JSON.stringify(DEFAULT_PITCHES_DATA));
    return DEFAULT_PITCHES_DATA;
  }
  return JSON.parse(stored);
}

function savePitches(pitches) {
  localStorage.setItem('norbyte_pitches', JSON.stringify(pitches));
}

// ── AUTHENTICATION MANAGEMENT ─────────────────
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const adminAuthForm = document.getElementById('admin-auth-form');
const passcodeInput = document.getElementById('passcode-input');
const authErrorMsg = document.getElementById('auth-error-msg');
const logoutBtn = document.getElementById('admin-logout-btn');

function checkAuth() {
  const isAuth = sessionStorage.getItem('admin_authenticated') === 'true';
  if (isAuth) {
    if (loginView) loginView.hidden = true;
    if (dashboardView) dashboardView.hidden = false;
    if (logoutBtn) logoutBtn.hidden = false;
    renderConsole();
  } else {
    if (loginView) loginView.hidden = false;
    if (dashboardView) dashboardView.hidden = true;
    if (logoutBtn) logoutBtn.hidden = true;
  }
}

if (adminAuthForm) {
  adminAuthForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = passcodeInput.value.trim();
    if (pin === '1234' || pin === 'admin123') {
      sessionStorage.setItem('admin_authenticated', 'true');
      authErrorMsg.hidden = true;
      checkAuth();
    } else {
      authErrorMsg.hidden = false;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_authenticated');
    checkAuth();
  });
}

// Initial Auth Check
checkAuth();


// ── CONSOLE RENDERER ──────────────────────────
function renderConsole() {
  const records = getTrackingRecords();
  const pitches = getPitches();

  // Metrics
  const recordList = Object.values(records);
  const totalCount = recordList.length;
  const completedCount = recordList.filter(r => r.progress === 100 || r.status === 'Completed & Shipped').length;
  const activeCount = totalCount - completedCount;
  const pitchCount = pitches.length;

  document.getElementById('metric-total').textContent = totalCount;
  document.getElementById('metric-active').textContent = activeCount;
  document.getElementById('metric-completed').textContent = completedCount;
  document.getElementById('metric-pitches').textContent = pitchCount;

  // Render Records Table
  renderRecordsTable(records);

  // Render Pitches Table
  renderPitchesTable(pitches);
}

// Records Table Render
function renderRecordsTable(records, filter = '') {
  const tbody = document.getElementById('records-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filterLower = filter.toLowerCase();

  Object.values(records).forEach(rec => {
    if (filterLower && !rec.id.toLowerCase().includes(filterLower) && !rec.client.toLowerCase().includes(filterLower) && !rec.projectName.toLowerCase().includes(filterLower)) {
      return;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong style="font-family:'JetBrains Mono', monospace;">${rec.id}</strong></td>
      <td><strong>${rec.projectName}</strong></td>
      <td>${rec.client}</td>
      <td><span class="status-badge ${rec.progress === 100 ? 'status-done' : 'status-in-progress'}">${rec.status}</span></td>
      <td><strong>${rec.progress}%</strong></td>
      <td style="max-width:240px; font-size:12px; color:var(--text-body);">${rec.notes}</td>
      <td>
        <div class="action-btns">
          <button type="button" class="btn-outline btn-sm" onclick="editRecord('${rec.id}')">EDIT</button>
          <button type="button" class="btn-outline btn-sm btn-danger" onclick="deleteRecord('${rec.id}')">DELETE</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Pitches Table Render
function renderPitchesTable(pitches) {
  const tbody = document.getElementById('pitches-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (pitches.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No client pitches recorded yet.</td></tr>`;
    return;
  }

  pitches.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size:11px; font-family:'JetBrains Mono', monospace;">${p.date || '2026-07-27'}</td>
      <td><strong>${p.name}</strong></td>
      <td>${p.college}</td>
      <td><span class="status-badge" style="background:var(--canvas); color:var(--text-primary);">${p.dept}</span></td>
      <td style="max-width:280px; font-size:12px;">${p.brief}</td>
      <td>
        <div class="action-btns">
          <button type="button" class="btn-primary btn-sm" onclick="convertPitchToProject('${idx}')">CONVERT ➔</button>
          <button type="button" class="btn-outline btn-sm btn-danger" onclick="deletePitch(${idx})">DELETE</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── RECORD FORM ACTIONS ───────────────────────
const recordForm = document.getElementById('record-manage-form');
const resetFormBtn = document.getElementById('reset-form-btn');
const searchInput = document.getElementById('search-records-input');

if (recordForm) {
  recordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('record-id').value.trim().toUpperCase();
    const projectName = document.getElementById('record-title').value.trim();
    const client = document.getElementById('record-client').value.trim();
    const status = document.getElementById('record-status').value;
    const progress = parseInt(document.getElementById('record-progress').value, 10);
    const notes = document.getElementById('record-notes').value.trim();

    const records = getTrackingRecords();
    records[id] = { id, projectName, client, status, progress, notes };
    saveTrackingRecords(records);
    renderConsole();
    recordForm.reset();
    document.getElementById('form-panel-title').textContent = 'CREATE / UPDATE PROJECT TRACKING RECORD';
    alert(`Project Tracking Record [${id}] published successfully!`);
  });
}

if (resetFormBtn) {
  resetFormBtn.addEventListener('click', () => {
    recordForm.reset();
    document.getElementById('form-panel-title').textContent = 'CREATE / UPDATE PROJECT TRACKING RECORD';
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    renderRecordsTable(getTrackingRecords(), e.target.value);
  });
}

window.editRecord = function(id) {
  const records = getTrackingRecords();
  const rec = records[id];
  if (!rec) return;

  document.getElementById('record-id').value = rec.id;
  document.getElementById('record-title').value = rec.projectName;
  document.getElementById('record-client').value = rec.client;
  document.getElementById('record-status').value = rec.status;
  document.getElementById('record-progress').value = rec.progress;
  document.getElementById('record-notes').value = rec.notes;
  document.getElementById('form-panel-title').textContent = `EDITING RECORD: [${rec.id}]`;
  window.scrollTo({ top: 180, behavior: 'smooth' });
};

window.deleteRecord = function(id) {
  if (confirm(`Are you sure you want to delete tracking record ${id}?`)) {
    const records = getTrackingRecords();
    delete records[id];
    saveTrackingRecords(records);
    renderConsole();
  }
};

window.convertPitchToProject = function(index) {
  const pitches = getPitches();
  const p = pitches[index];
  if (!p) return;

  const nextNum = Math.floor(100 + Math.random() * 900);
  const newId = `NBY-2026-${nextNum}`;

  document.getElementById('record-id').value = newId;
  document.getElementById('record-title').value = p.brief.substring(0, 40) + '...';
  document.getElementById('record-client').value = `${p.name} · ${p.college}`;
  document.getElementById('record-status').value = 'Concept Locked';
  document.getElementById('record-progress').value = 10;
  document.getElementById('record-notes').value = `Initial brief received from ${p.dept} department pitch form.`;

  window.scrollTo({ top: 180, behavior: 'smooth' });
};

window.deletePitch = function(index) {
  if (confirm('Delete this client pitch inquiry?')) {
    const pitches = getPitches();
    pitches.splice(index, 1);
    savePitches(pitches);
    renderConsole();
  }
};

const clearPitchesBtn = document.getElementById('clear-pitches-btn');
if (clearPitchesBtn) {
  clearPitchesBtn.addEventListener('click', () => {
    if (confirm('Clear all received pitches?')) {
      savePitches([]);
      renderConsole();
    }
  });
}
