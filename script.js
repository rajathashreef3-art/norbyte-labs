/* ═══════════════════════════════════════════════
   NEXORA LABS — script.js
   Handles: nav scroll state, hamburger menu,
   department tab switching, FAQ accordion,
   scroll reveal (IntersectionObserver),
   form submission feedback.
═══════════════════════════════════════════════ */

'use strict';

// ── THEME INITIALIZATION & TOGGLE ─────────────
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');

// Apply stored theme or fallback to system preference
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


// ── NAV SCROLL STATE ──────────────────────────
const nav = document.getElementById('top-nav');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  lastScroll = y;
}, { passive: true });

// ── HAMBURGER MENU ────────────────────────────
const hamburger = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close on mobile link click
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });
});

// ── DEPARTMENT TABS ───────────────────────────
const tabs = document.querySelectorAll('.dept-tab');
const panels = document.querySelectorAll('.dept-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('aria-controls');

    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    panels.forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });

    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(target);
    if (panel) {
      panel.classList.add('active');
      panel.hidden = false;
    }
  });
});

// ── FAQ ACCORDION ─────────────────────────────
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const btn = item.querySelector('.faq-q');
  const answer = item.querySelector('.faq-a');

  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Close all
    faqItems.forEach(fi => {
      fi.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      fi.querySelector('.faq-a').hidden = true;
    });

    // Open clicked if it was closed
    if (!isOpen) {
      btn.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
    }
  });
});

// ── SCROLL REVEAL ─────────────────────────────
// Respects prefers-reduced-motion automatically via CSS.
// IntersectionObserver approach: no window.scroll listener.
const revealItems = document.querySelectorAll('.reveal-item');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, idx) => {
    if (entry.isIntersecting) {
      // Staggered delay based on position within sibling group
      const siblings = entry.target.parentElement
        ? Array.from(entry.target.parentElement.querySelectorAll('.reveal-item'))
        : [];
      const order = siblings.indexOf(entry.target);
      const delay = Math.min(order * 80, 320);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px'
});

revealItems.forEach(el => revealObserver.observe(el));

// ── FORM SUBMISSION ───────────────────────────
const form = document.getElementById('project-pitch-form');
const successMsg = document.getElementById('form-success-msg');
const submitBtn = document.getElementById('submit-pitch-btn');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Save pitch to API & local storage
    const newPitch = {
      id: `PITCH-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      name: document.getElementById('field-name')?.value || 'Anonymous Client',
      college: document.getElementById('field-college')?.value || 'Unknown Institution',
      dept: document.getElementById('field-dept')?.value || 'Engineering',
      brief: document.getElementById('field-brief')?.value || 'No details provided.'
    };

    fetch(`${API_BASE_URL}/api/pitches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPitch)
    }).catch(e => console.warn('API pitch post offline, saved locally'));

    const storedPitches = JSON.parse(localStorage.getItem('norbyte_pitches') || '[]');
    storedPitches.unshift(newPitch);
    localStorage.setItem('norbyte_pitches', JSON.stringify(storedPitches));

    submitBtn.textContent = 'SUBMITTING...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = 'SUBMIT PROJECT PITCH ⚡';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      successMsg.hidden = false;
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(() => {
        successMsg.hidden = true;
      }, 7000);
    }, 1000);
  });
}

// ── ACTIVE NAV LINK HIGHLIGHTING ─────────────
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--text-primary)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));


// ═══════════════════════════════════════════════
// LIVE PROJECT TRACKING & ADMIN SYSTEM
// ═══════════════════════════════════════════════

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

function getTrackingRecords() {
  const stored = localStorage.getItem('norbyte_tracking');
  if (!stored) {
    localStorage.setItem('norbyte_tracking', JSON.stringify(DEFAULT_TRACKING_DATA));
    return DEFAULT_TRACKING_DATA;
  }
  return JSON.parse(stored);
}

function saveTrackingRecord(record) {
  const records = getTrackingRecords();
  records[record.id] = record;
  localStorage.setItem('norbyte_tracking', JSON.stringify(records));
}

// Global Demo Chip Helper
window.fillTrackingId = function(id) {
  const input = document.getElementById('tracking-id-input');
  if (input) {
    input.value = id;
    performTrackingLookup(id);
  }
};

document.getElementById('chip-1')?.addEventListener('click', () => fillTrackingId('NBY-2026-101'));
document.getElementById('chip-2')?.addEventListener('click', () => fillTrackingId('NBY-2026-102'));

const trackingForm = document.getElementById('tracking-search-form');
const trackingIdInput = document.getElementById('tracking-id-input');
const resultBox = document.getElementById('tracking-result-box');
const notFoundBox = document.getElementById('tracking-not-found');

if (trackingForm) {
  trackingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const queryId = trackingIdInput.value.trim().toUpperCase();
    performTrackingLookup(queryId);
  });
}

const API_BASE_URL = (window.location.hostname.includes('onrender.com') && !window.location.hostname.includes('norbyte-backend'))
  ? 'https://norbyte-backend.onrender.com'
  : '';

async function performTrackingLookup(id) {
  let record = null;

  // Try API first
  try {
    const res = await fetch(`${API_BASE_URL}/api/tracking/${encodeURIComponent(id)}`);
    if (res.ok) {
      record = await res.json();
    }
  } catch (e) {
    console.warn("Backend API unavailable, using local store");
  }

  // Fallback to local storage
  if (!record) {
    const records = getTrackingRecords();
    record = records[id];
  }

  if (!record) {
    if (resultBox) resultBox.hidden = true;
    if (notFoundBox) {
      document.getElementById('not-found-id').textContent = id;
      notFoundBox.hidden = false;
    }
    return;
  }

  if (notFoundBox) notFoundBox.hidden = true;
  if (resultBox) {
    document.getElementById('res-project-name').textContent = record.projectName;
    document.getElementById('res-client-name').textContent = record.client;
    
    const badge = document.getElementById('res-status-badge');
    badge.textContent = record.status.toUpperCase();
    badge.className = `status-badge ${record.progress === 100 ? 'status-done' : 'status-in-progress'}`;

    document.getElementById('res-progress-pct').textContent = `${record.progress}%`;
    document.getElementById('res-progress-fill').style.width = `${record.progress}%`;
    document.getElementById('res-notes-text').textContent = record.notes;

    // Render dynamic steps (supports 3, 4, 5, 6+ custom steps)
    const stepperEl = document.getElementById('dynamic-timeline-stepper');
    if (stepperEl) {
      stepperEl.innerHTML = '';
      const stepList = record.steps || [
        { title: "1. Concept & Scope Locked", detail: "IEEE baseline architecture & specs.", status: "done" },
        { title: "2. Hardware & Firmware Assembly", detail: "Microcontroller programmed & board wired.", status: "done" },
        { title: "3. Dashboard & Telemetry Setup", detail: "Real-time analytics streams connected.", status: "active" },
        { title: "4. Viva Documentation & Shipping", detail: "Complete project package dispatched.", status: "pending" }
      ];

      stepList.forEach((step, idx) => {
        const stepDiv = document.createElement('div');
        const isDone = step.status === 'done' || record.progress >= ((idx + 1) * (100 / stepList.length));
        const isActive = step.status === 'active' || (!isDone && record.progress >= (idx * (100 / stepList.length)));
        
        stepDiv.className = `timeline-step ${isDone ? 'step-done' : (isActive ? 'step-active' : '')}`;
        stepDiv.innerHTML = `
          <div class="step-icon">${isDone ? '✓' : (isActive ? '⚡' : '📦')}</div>
          <div class="step-details">
            <h4>${step.title}</h4>
            <p>${step.detail}</p>
          </div>
        `;
        stepperEl.appendChild(stepDiv);
      });
    }

    // Render deliverables download list with specific filenames
    const delivListEl = document.getElementById('res-deliverables-list');
    const delivSecEl = document.getElementById('res-deliverables-section');
    if (delivListEl && delivSecEl) {
      delivListEl.innerHTML = '';
      const deliverables = record.deliverables || [];
      if (deliverables.length === 0) {
        delivSecEl.hidden = true;
      } else {
        delivSecEl.hidden = false;
        deliverables.forEach(file => {
          const item = document.createElement('div');
          item.className = 'deliverable-item';
          const fileIcon = file.type === 'code' ? '💻' : (file.type === 'image' ? '🖼️' : '📄');
          const downloadUrl = `${API_BASE_URL}/api/download/${record.id}/${encodeURIComponent(file.name)}`;
          item.innerHTML = `
            <div class="deliverable-info">
              <span>${fileIcon}</span>
              <span>${file.name}</span>
              <span style="color:var(--text-muted); font-size:11px;">(${file.size || '1.5 MB'})</span>
            </div>
            <a href="${downloadUrl}" download="${file.name}" class="deliverable-dl-btn">DOWNLOAD 📥</a>
          `;
          delivListEl.appendChild(item);
        });
      }
    }

    resultBox.hidden = false;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ── ADMIN PORTAL HANDLERS ────────────────────
const adminOpenBtn = document.getElementById('admin-open-btn');
const adminCloseBtn = document.getElementById('admin-close-btn');
const adminModal = document.getElementById('admin-modal');
const adminLoginForm = document.getElementById('admin-login-form');
const adminPinInput = document.getElementById('admin-pin-input');
const adminLoginError = document.getElementById('admin-login-error');
const adminLoginView = document.getElementById('admin-login-view');
const adminDashboardView = document.getElementById('admin-dashboard-view');
const adminLogoutBtn = document.getElementById('admin-logout-btn');
const adminRecordForm = document.getElementById('admin-record-form');
const adminTableBody = document.getElementById('admin-records-tbody');

if (adminOpenBtn && adminModal) {
  adminOpenBtn.addEventListener('click', () => {
    adminModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
}

if (adminCloseBtn && adminModal) {
  adminCloseBtn.addEventListener('click', () => {
    adminModal.hidden = true;
    document.body.style.overflow = '';
  });
}

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = adminPinInput.value.trim();
    if (pin === '1234' || pin === 'admin123') {
      adminLoginError.hidden = true;
      adminLoginView.hidden = true;
      adminDashboardView.hidden = false;
      renderAdminTable();
    } else {
      adminLoginError.hidden = false;
    }
  });
}

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', () => {
    adminDashboardView.hidden = true;
    adminLoginView.hidden = false;
    adminPinInput.value = '';
  });
}

if (adminRecordForm) {
  adminRecordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const record = {
      id: document.getElementById('adm-track-id').value.trim().toUpperCase(),
      projectName: document.getElementById('adm-project-name').value.trim(),
      client: document.getElementById('adm-client').value.trim(),
      status: document.getElementById('adm-status').value,
      progress: parseInt(document.getElementById('adm-progress').value, 10),
      notes: document.getElementById('adm-notes').value.trim()
    };

    saveTrackingRecord(record);
    renderAdminTable();
    adminRecordForm.reset();
    alert(`Record ${record.id} saved successfully!`);
  });
}

function renderAdminTable() {
  if (!adminTableBody) return;
  const records = getTrackingRecords();
  adminTableBody.innerHTML = '';

  Object.values(records).forEach(rec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${rec.id}</strong></td>
      <td>${rec.projectName}</td>
      <td>${rec.client}</td>
      <td><span class="status-badge ${rec.progress === 100 ? 'status-done' : 'status-in-progress'}">${rec.status}</span></td>
      <td>${rec.progress}%</td>
      <td>
        <button type="button" class="btn-outline" style="padding:4px 10px; font-size:11px;" onclick="populateEditRecord('${rec.id}')">EDIT</button>
      </td>
    `;
    adminTableBody.appendChild(tr);
  });
}

window.populateEditRecord = function(id) {
  const records = getTrackingRecords();
  const rec = records[id];
  if (!rec) return;

  document.getElementById('adm-track-id').value = rec.id;
  document.getElementById('adm-project-name').value = rec.projectName;
  document.getElementById('adm-client').value = rec.client;
  document.getElementById('adm-status').value = rec.status;
  document.getElementById('adm-progress').value = rec.progress;
  document.getElementById('adm-notes').value = rec.notes;
};

