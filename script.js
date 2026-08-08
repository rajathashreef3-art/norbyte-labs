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

// ── DEPARTMENT TABS (INSTANT DELEGATED CLICK) ─
document.addEventListener('click', (e) => {
  const tab = e.target.closest('.dept-tab');
  if (!tab) return;

  const targetId = tab.getAttribute('aria-controls');
  const allTabs = document.querySelectorAll('.dept-tab');
  const allPanels = document.querySelectorAll('.dept-panel');

  allTabs.forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  allPanels.forEach(p => {
    p.classList.remove('active');
    p.hidden = true;
  });

  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');

  const panel = document.getElementById(targetId);
  if (panel) {
    panel.classList.add('active');
    panel.hidden = false;
  }
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

// ── DEPARTMENT TOGGLE (ECE, CSE, EEE, OTHER) ────
const deptRadios = document.querySelectorAll('input[name="department"]');
const customDeptWrap = document.getElementById('field-dept-other-wrap');
const customDeptInput = document.getElementById('field-dept-other');

if (deptRadios.length > 0) {
  deptRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'Other' && radio.checked) {
        if (customDeptWrap) customDeptWrap.hidden = false;
        if (customDeptInput) customDeptInput.required = true;
      } else {
        if (customDeptWrap) customDeptWrap.hidden = true;
        if (customDeptInput) {
          customDeptInput.required = false;
          customDeptInput.value = '';
        }
      }
    });
  });
}

// ── DYNAMIC TEAM MEMBERS BUILDER (UP TO 5) ──────
const teamMembersList = document.getElementById('team-members-list');
const addTeamMemberBtn = document.getElementById('add-team-member-btn');
const teamLimitMsg = document.getElementById('team-limit-msg');

function updateTeamMemberIndexes() {
  if (!teamMembersList) return;
  const rows = teamMembersList.querySelectorAll('.team-member-row');
  rows.forEach((row, idx) => {
    const tag = row.querySelector('.member-tag');
    if (tag) {
      tag.textContent = idx === 0 ? 'Member 1 (Lead)' : `Member ${idx + 1}`;
    }
  });

  const count = rows.length;
  if (addTeamMemberBtn) {
    if (count >= 5) {
      addTeamMemberBtn.style.display = 'none';
      if (teamLimitMsg) teamLimitMsg.hidden = false;
    } else {
      addTeamMemberBtn.style.display = '';
      if (teamLimitMsg) teamLimitMsg.hidden = true;
    }
  }
}

if (addTeamMemberBtn && teamMembersList) {
  addTeamMemberBtn.addEventListener('click', () => {
    const currentRows = teamMembersList.querySelectorAll('.team-member-row');
    if (currentRows.length >= 5) return;

    const newIndex = currentRows.length + 1;
    const row = document.createElement('div');
    row.className = 'team-member-row';
    row.innerHTML = `
      <span class="member-tag">Member ${newIndex}</span>
      <input type="text" class="team-member-input" placeholder="Full Name (Member ${newIndex})" required />
      <button type="button" class="btn-outline btn-sm btn-danger btn-remove-member" title="Remove member">&times;</button>
    `;

    row.querySelector('.btn-remove-member').addEventListener('click', () => {
      row.remove();
      updateTeamMemberIndexes();
    });

    teamMembersList.appendChild(row);
    updateTeamMemberIndexes();
  });
}

// ── REGISTRATION FORM SUBMISSION & WHATSAPP MODAL ──
const regForm = document.getElementById('project-registration-form');
const enrollModal = document.getElementById('enrollment-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const doneModalBtn = document.getElementById('done-modal-btn');
const copyRefBtn = document.getElementById('copy-ref-btn');
const modalWaBtn = document.getElementById('modal-whatsapp-btn');

if (regForm) {
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!regForm.checkValidity()) {
      regForm.reportValidity();
      return;
    }

    const submitBtn = document.getElementById('submit-enrollment-btn');
    if (submitBtn) {
      submitBtn.textContent = 'REGISTERING ENROLLMENT...';
      submitBtn.disabled = true;
    }

    // Extract values
    const topic = document.getElementById('field-topic')?.value || '';
    const college = document.getElementById('field-college')?.value || '';
    const district = document.getElementById('field-district')?.value || '';
    const contact = document.getElementById('field-phone')?.value || '';

    const selectedDeptRadio = document.querySelector('input[name="department"]:checked');
    let deptValue = selectedDeptRadio ? selectedDeptRadio.value : 'ECE';
    const deptOtherVal = customDeptInput ? customDeptInput.value : '';

    const memberInputs = Array.from(document.querySelectorAll('.team-member-input'));
    const teamMembers = memberInputs.map(inEl => inEl.value.trim()).filter(Boolean);

    const payload = {
      topic,
      college,
      district,
      department: deptValue,
      departmentOther: deptOtherVal,
      contact,
      teamMembers
    };

    let regResult = null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        regResult = await res.json();
      }
    } catch (err) {
      console.warn("API enrollments offline, generating local enrollment object:", err);
    }

    // Fallback if offline
    if (!regResult) {
      const regId = `NBY-REG-${Date.now().toString().slice(-4)}`;
      const finalDeptStr = deptValue === 'Other' && deptOtherVal ? `Other (${deptOtherVal})` : deptValue;
      const waMsg = `Hi NorByte Labs! 👋 I registered for Project Assistance.\n\n` +
        `📌 Ref ID: ${regId}\n` +
        `💡 Topic: ${topic}\n` +
        `🎓 College: ${college} (${district})\n` +
        `⚡ Dept: ${finalDeptStr}\n` +
        `👥 Team Members: ${teamMembers.join(', ')}\n` +
        `📞 Contact: ${contact}\n\n` +
        `Please guide us on starting the project and webinar details!`;

      regResult = {
        enrollment: {
          id: regId,
          topic,
          college,
          district,
          department: finalDeptStr,
          contact,
          teamMembers
        },
        whatsappUrl: `https://wa.me/916238734386?text=${encodeURIComponent(waMsg)}`
      };
    }

    // Save to localStorage
    const localEnrollments = JSON.parse(localStorage.getItem('norbyte_enrollments') || '[]');
    localEnrollments.unshift(regResult.enrollment);
    localStorage.setItem('norbyte_enrollments', JSON.stringify(localEnrollments));

    // Reset button & form
    if (submitBtn) {
      submitBtn.textContent = 'REGISTER FOR PROJECT ASSISTANCE ⚡';
      submitBtn.disabled = false;
    }

    regForm.reset();
    if (customDeptWrap) customDeptWrap.hidden = true;
    
    // Reset team members list back to Member 1 Lead
    if (teamMembersList) {
      teamMembersList.innerHTML = `
        <div class="team-member-row">
          <span class="member-tag">Member 1 (Lead)</span>
          <input type="text" class="team-member-input" placeholder="Full Name (Lead Student)" required />
        </div>
      `;
      updateTeamMemberIndexes();
    }

    // Show Post-Registration WhatsApp Modal
    if (enrollModal && regResult.enrollment) {
      const en = regResult.enrollment;
      document.getElementById('modal-ref-id').textContent = en.id;
      document.getElementById('modal-topic-text').textContent = en.topic;
      document.getElementById('modal-college-text').textContent = `${en.college} · ${en.district}`;
      document.getElementById('modal-dept-team-text').textContent = `${en.department} · ${en.teamMembers.length} Member(s)`;
      
      if (modalWaBtn) {
        modalWaBtn.href = regResult.whatsappUrl;
      }

      enrollModal.hidden = false;
      enrollModal.setAttribute('aria-hidden', 'false');
    }
  });
}

// Modal closing helpers
function closeEnrollmentModal() {
  if (enrollModal) {
    enrollModal.hidden = true;
    enrollModal.setAttribute('aria-hidden', 'true');
  }
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeEnrollmentModal);
if (doneModalBtn) doneModalBtn.addEventListener('click', closeEnrollmentModal);

if (enrollModal) {
  enrollModal.addEventListener('click', (e) => {
    if (e.target === enrollModal) closeEnrollmentModal();
  });
}

if (copyRefBtn) {
  copyRefBtn.addEventListener('click', () => {
    const refCode = document.getElementById('modal-ref-id')?.textContent || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refCode);
      copyRefBtn.textContent = 'Copied! ✓';
      setTimeout(() => { copyRefBtn.textContent = 'Copy Ref Code 📋'; }, 2500);
    }
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

function getTrackingRecords() {
  const stored = localStorage.getItem('norbyte_tracking');
  if (!stored) return {};
  return JSON.parse(stored);
}

function saveTrackingRecord(record) {
  const records = getTrackingRecords();
  records[record.id] = record;
  localStorage.setItem('norbyte_tracking', JSON.stringify(records));
}


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
  // 1. INSTANT zero-delay render from local storage / seed memory
  const localRecords = getTrackingRecords();
  let record = localRecords[id];

  if (record) {
    renderTrackingResult(record);
  }

  // 2. Async background API fetch (with 2.5s fast timeout to prevent cold-start hanging)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE_URL}/api/tracking/${encodeURIComponent(id)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const apiRecord = await res.json();
      renderTrackingResult(apiRecord);
      // Cache for future instant lookups
      localRecords[id] = apiRecord;
      saveTrackingRecords(localRecords);
      return;
    }
  } catch (e) {
    // API offline or cold-start timeout — local record already rendered instantly
  }

  // If neither local nor API has the record
  if (!record) {
    if (resultBox) resultBox.hidden = true;
    if (notFoundBox) {
      document.getElementById('not-found-id').textContent = id;
      notFoundBox.hidden = false;
    }
  }
}

function renderTrackingResult(record) {
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
