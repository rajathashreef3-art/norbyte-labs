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

    // Simulate async submission
    submitBtn.textContent = 'SUBMITTING...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      form.reset();
      submitBtn.textContent = 'SUBMIT PROJECT PITCH';
      submitBtn.disabled = false;
      submitBtn.style.opacity = '';
      successMsg.hidden = false;
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      setTimeout(() => {
        successMsg.hidden = true;
      }, 7000);
    }, 1200);
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
