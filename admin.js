/* ═══════════════════════════════════════════════
   NORBYTE LABS — admin.js
   Full Standalone Management Console Logic
   ═══════════════════════════════════════════════ */

'use strict';

const API_BASE_URL = (window.location.hostname.includes('onrender.com') && !window.location.hostname.includes('norbyte-backend'))
  ? 'https://norbyte-backend.onrender.com'
  : '';

// ── HTML ESCAPING ─────────────────────────────
// Escape user-controlled values before injecting them into the records/pitches
// table innerHTML. Prevents stored-XSS via record or pitch fields.
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    notes: "Firmware stress test completed cleanly. Telemetry MQTT feeds active. Download Viva Report below.",
    steps: [
      { title: "1. IEEE Baseline & Architecture", detail: "System schematics & component selection locked.", status: "done" },
      { title: "2. Hardware Wiring & Firmware Flash", detail: "ESP32 microcontrollers programmed & sensor node wired.", status: "done" },
      { title: "3. Dashboard Telemetry & MQTT Setup", detail: "Real-time chart streaming connected to cloud broker.", status: "active" },
      { title: "4. Final Viva Binder & Shipping", detail: "Project report submission package generated.", status: "pending" }
    ],
    deliverables: [
      { name: "NorByte_Solar_Telemetry_Viva_Report_NBY-2026-101.pdf", size: "2.4 MB", type: "document" },
      { name: "NorByte_ESP32_Firmware_SourceCode_NBY-2026-101.zip", size: "1.8 MB", type: "code" }
    ]
  },
  "NBY-2026-102": {
    id: "NBY-2026-102",
    projectName: "Edge AI Defect Inspector Node",
    client: "Anjali · NIT Calicut",
    status: "Hardware Assembly",
    progress: 40,
    notes: "Raspberry Pi camera interface mounted & OpenCV real-time inference script deployed.",
    steps: [
      { title: "1. Problem Statement & Dataset Prep", detail: "Defect dataset annotated for edge model.", status: "done" },
      { title: "2. Hardware Mount & Enclosure", detail: "Camera jig 3D printed & mounted.", status: "active" },
      { title: "3. OpenCV Real-time Inference", detail: "Deploying TensorRT lightweight model.", status: "pending" },
      { title: "4. Final Report & Code Package", detail: "Documentation and viva presentation.", status: "pending" }
    ],
    deliverables: [
      { name: "NorByte_Edge_AI_Defect_System_Brief_NBY-2026-102.pdf", size: "1.2 MB", type: "document" }
    ]
  }
};

const DEFAULT_PITCHES_DATA = [
  {
    id: "PITCH-1001",
    date: new Date().toISOString().split('T')[0],
    name: "Siddharth Menon",
    college: "GEC Thrissur",
    dept: "ECE",
    brief: "Need a LoRa-based environmental water quality telemetry node with custom dashboard for major project submission."
  }
];

function getLocalTrackingRecords() {
  const stored = localStorage.getItem('norbyte_tracking');
  if (!stored) {
    localStorage.setItem('norbyte_tracking', JSON.stringify(DEFAULT_TRACKING_DATA));
    return DEFAULT_TRACKING_DATA;
  }
  return JSON.parse(stored);
}

function saveLocalTrackingRecords(records) {
  localStorage.setItem('norbyte_tracking', JSON.stringify(records));
}

function getLocalPitches() {
  const stored = localStorage.getItem('norbyte_pitches');
  if (!stored) {
    localStorage.setItem('norbyte_pitches', JSON.stringify(DEFAULT_PITCHES_DATA));
    return DEFAULT_PITCHES_DATA;
  }
  return JSON.parse(stored);
}

function saveLocalPitches(pitches) {
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
async function renderConsole() {
  let records = getLocalTrackingRecords();
  let pitches = getLocalPitches();

  // Fetch live API records if available
  try {
    const resRecords = await fetch(`${API_BASE_URL}/api/records`);
    if (resRecords.ok) {
      const apiRecordsList = await resRecords.json();
      const recMap = {};
      apiRecordsList.forEach(r => { recMap[r.id] = r; });
      records = recMap;
      saveLocalTrackingRecords(records);
    }
  } catch (e) {
    console.warn("Express API offline, using local storage cache.");
  }

  try {
    const resPitches = await fetch(`${API_BASE_URL}/api/pitches`);
    if (resPitches.ok) {
      pitches = await resPitches.json();
      saveLocalPitches(pitches);
    }
  } catch (e) {}

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

  // Render Tables
  renderRecordsTable(records);
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
      <td><strong style="font-family:'JetBrains Mono', monospace;">${escapeHtml(rec.id)}</strong></td>
      <td><strong>${escapeHtml(rec.projectName)}</strong></td>
      <td>${escapeHtml(rec.client)}</td>
      <td><span class="status-badge ${rec.progress === 100 ? 'status-done' : 'status-in-progress'}">${escapeHtml(rec.status)}</span></td>
      <td><strong>${escapeHtml(rec.progress)}%</strong></td>
      <td style="max-width:240px; font-size:12px; color:var(--text-body);">${escapeHtml(rec.notes)}</td>
      <td>
        <div class="action-btns">
          <button type="button" class="btn-outline btn-sm" onclick="editRecord('${escapeHtml(rec.id)}')">EDIT</button>
          <button type="button" class="btn-outline btn-sm btn-danger" onclick="deleteRecord('${escapeHtml(rec.id)}')">DELETE</button>
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
      <td style="font-size:11px; font-family:'JetBrains Mono', monospace;">${escapeHtml(p.date || '2026-07-27')}</td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${escapeHtml(p.college)}</td>
      <td><span class="status-badge" style="background:var(--canvas); color:var(--text-primary);">${escapeHtml(p.dept)}</span></td>
      <td style="max-width:280px; font-size:12px;">${escapeHtml(p.brief)}</td>
      <td>
        <div class="action-btns">
          <button type="button" class="btn-primary btn-sm" onclick="convertPitchToProject(${idx})">CONVERT ➔</button>
          <button type="button" class="btn-outline btn-sm btn-danger" onclick="deletePitch('${p.id || idx}')">DELETE</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── DYNAMIC STEPS & FILES BUILDER UI ──────────
const stepsContainer = document.getElementById('steps-builder-container');
const filesContainer = document.getElementById('files-builder-container');
const addStepBtn = document.getElementById('add-step-btn');
const addFileBtn = document.getElementById('add-file-btn');

function addStepRow(title = '', detail = '', status = 'pending') {
  if (!stepsContainer) return;
  const row = document.createElement('div');
  row.className = 'step-builder-row';
  row.style.cssText = 'display:grid; grid-template-columns: 2fr 3fr 1fr 40px; gap:8px; align-items:center;';
  row.innerHTML = `
    <input type="text" class="step-title-in" placeholder="Step Title (e.g. 1. PCB Wiring)" value="${title}" required />
    <input type="text" class="step-detail-in" placeholder="Step details description..." value="${detail}" required />
    <select class="step-status-in">
      <option value="done" ${status === 'done' ? 'selected' : ''}>Done ✓</option>
      <option value="active" ${status === 'active' ? 'selected' : ''}>Active ⚡</option>
      <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending 📦</option>
    </select>
    <button type="button" class="btn-outline btn-sm btn-danger" onclick="this.parentElement.remove()" style="padding:8px;">&times;</button>
  `;
  stepsContainer.appendChild(row);
}

function addFileRow(filename = '', filetype = 'document', size = '1.5 MB') {
  if (!filesContainer) return;
  const row = document.createElement('div');
  row.className = 'file-builder-row';
  row.style.cssText = 'display:grid; grid-template-columns: 3fr 1fr 1fr 40px; gap:8px; align-items:center;';
  row.innerHTML = `
    <input type="text" class="file-name-in" placeholder="Specific Filename (e.g. NorByte_Report_NBY-101.pdf)" value="${filename}" required />
    <select class="file-type-in">
      <option value="document" ${filetype === 'document' ? 'selected' : ''}>📄 PDF/Doc</option>
      <option value="code" ${filetype === 'code' ? 'selected' : ''}>💻 Code ZIP</option>
      <option value="image" ${filetype === 'image' ? 'selected' : ''}>🖼️ Image</option>
    </select>
    <input type="text" class="file-size-in" placeholder="Size (e.g. 2.4 MB)" value="${size}" />
    <button type="button" class="btn-outline btn-sm btn-danger" onclick="this.parentElement.remove()" style="padding:8px;">&times;</button>
  `;
  filesContainer.appendChild(row);
}

if (addStepBtn) addStepBtn.addEventListener('click', () => addStepRow());
if (addFileBtn) addFileBtn.addEventListener('click', () => addFileRow());

// Initialize default form rows if empty
function initializeFormBuilders(rec = null) {
  if (!stepsContainer || !filesContainer) return;
  stepsContainer.innerHTML = '';
  filesContainer.innerHTML = '';

  if (rec && Array.isArray(rec.steps) && rec.steps.length > 0) {
    rec.steps.forEach(s => addStepRow(s.title, s.detail, s.status));
  } else {
    addStepRow('1. Concept & Scope Locked', 'IEEE baseline specs verified.', 'done');
    addStepRow('2. Hardware & Firmware Assembly', 'PCB layout wired & programmed.', 'done');
    addStepRow('3. Telemetry Dashboard & Testing', 'Real-time telemetry feeds connected.', 'active');
    addStepRow('4. Viva Documentation & Delivery', 'Complete project submission package.', 'pending');
  }

  if (rec && Array.isArray(rec.deliverables) && rec.deliverables.length > 0) {
    rec.deliverables.forEach(f => addFileRow(f.name, f.type, f.size));
  } else {
    addFileRow('NorByte_Project_Viva_Report_NBY-2026.pdf', 'document', '2.4 MB');
    addFileRow('NorByte_Firmware_SourceCode_NBY-2026.zip', 'code', '1.8 MB');
  }
}

initializeFormBuilders();


// ── RECORD FORM ACTIONS ───────────────────────
const recordForm = document.getElementById('record-manage-form');
const resetFormBtn = document.getElementById('reset-form-btn');
const searchInput = document.getElementById('search-records-input');

if (recordForm) {
  recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('record-id').value.trim().toUpperCase();
    const projectName = document.getElementById('record-title').value.trim();
    const client = document.getElementById('record-client').value.trim();
    const status = document.getElementById('record-status').value;
    const progress = parseInt(document.getElementById('record-progress').value, 10);
    const notes = document.getElementById('record-notes').value.trim();

    // Extract dynamic steps
    const stepRows = Array.from(document.querySelectorAll('.step-builder-row'));
    const steps = stepRows.map(row => ({
      title: row.querySelector('.step-title-in').value.trim(),
      detail: row.querySelector('.step-detail-in').value.trim(),
      status: row.querySelector('.step-status-in').value
    }));

    // Extract deliverables
    const fileRows = Array.from(document.querySelectorAll('.file-builder-row'));
    const deliverables = fileRows.map(row => ({
      name: row.querySelector('.file-name-in').value.trim(),
      type: row.querySelector('.file-type-in').value,
      size: row.querySelector('.file-size-in').value.trim() || '1.5 MB'
    }));

    const record = { id, projectName, client, status, progress, notes, steps, deliverables };

    // Post to API
    try {
      await fetch(`${API_BASE_URL}/api/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.warn("API post offline, saving to local storage.");
    }

    const records = getLocalTrackingRecords();
    records[id] = record;
    saveLocalTrackingRecords(records);

    await renderConsole();
    recordForm.reset();
    initializeFormBuilders();
    document.getElementById('form-panel-title').textContent = 'CREATE / UPDATE PROJECT TRACKING RECORD';
    alert(`Project Record [${id}] saved & published for consumer front-end!`);
  });
}

if (resetFormBtn) {
  resetFormBtn.addEventListener('click', () => {
    recordForm.reset();
    initializeFormBuilders();
    document.getElementById('form-panel-title').textContent = 'CREATE / UPDATE PROJECT TRACKING RECORD';
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    renderRecordsTable(getLocalTrackingRecords(), e.target.value);
  });
}

window.editRecord = function(id) {
  const records = getLocalTrackingRecords();
  const rec = records[id];
  if (!rec) return;

  document.getElementById('record-id').value = rec.id;
  document.getElementById('record-title').value = rec.projectName;
  document.getElementById('record-client').value = rec.client;
  document.getElementById('record-status').value = rec.status;
  document.getElementById('record-progress').value = rec.progress;
  document.getElementById('record-notes').value = rec.notes;

  initializeFormBuilders(rec);
  document.getElementById('form-panel-title').textContent = `EDITING RECORD: [${rec.id}]`;
  window.scrollTo({ top: 180, behavior: 'smooth' });
};

window.deleteRecord = async function(id) {
  if (confirm(`Delete project record ${id}?`)) {
    try {
      await fetch(`${API_BASE_URL}/api/records/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    const records = getLocalTrackingRecords();
    delete records[id];
    saveLocalTrackingRecords(records);
    await renderConsole();
  }
};

window.convertPitchToProject = function(index) {
  const pitches = getLocalPitches();
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

  initializeFormBuilders();
  window.scrollTo({ top: 180, behavior: 'smooth' });
};

window.deletePitch = async function(idOrIdx) {
  if (confirm('Delete this pitch inquiry?')) {
    try {
      await fetch(`${API_BASE_URL}/api/pitches/${encodeURIComponent(idOrIdx)}`, { method: 'DELETE' });
    } catch (e) {}

    let pitches = getLocalPitches();
    pitches = pitches.filter((p, i) => p.id !== idOrIdx && i !== Number(idOrIdx));
    saveLocalPitches(pitches);
    await renderConsole();
  }
};

const clearPitchesBtn = document.getElementById('clear-pitches-btn');
if (clearPitchesBtn) {
  clearPitchesBtn.addEventListener('click', () => {
    if (confirm('Clear all received pitches?')) {
      saveLocalPitches([]);
      renderConsole();
    }
  });
}

// ── MANUAL PITCH / INQUIRY ENTRY FOR ADMIN ────
const manualPitchForm = document.getElementById('manual-pitch-form');
if (manualPitchForm) {
  manualPitchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPitch = {
      id: `PITCH-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      name: document.getElementById('man-name').value.trim(),
      college: document.getElementById('man-college').value.trim(),
      dept: document.getElementById('man-dept').value,
      brief: document.getElementById('man-brief').value.trim()
    };

    try {
      await fetch(`${API_BASE_URL}/api/pitches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPitch)
      });
    } catch (err) {}

    const pitches = getLocalPitches();
    pitches.unshift(newPitch);
    saveLocalPitches(pitches);

    await renderConsole();
    manualPitchForm.reset();
    alert('Manual pitch inquiry logged successfully!');
  });
}
