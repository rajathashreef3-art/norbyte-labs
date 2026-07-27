'use strict';

const { loadBrowserScript } = require('./helpers/loadBrowserScript');

// A flushed microtask/timer helper: performTrackingLookup awaits a fetch that
// rejects, then reads from localStorage synchronously.
const flush = () => new Promise((r) => setTimeout(r, 0));

describe('script.js — theme initialization', () => {
  it('applies the saved dark theme on load', () => {
    const { document } = loadBrowserScript('index.html', 'script.js', {
      seedLocalStorage: { theme: 'dark' },
    });
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('defaults to light theme when nothing is saved', () => {
    const { document } = loadBrowserScript('index.html', 'script.js');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });
});

describe('script.js — tracking record localStorage seeding', () => {
  it('seeds default tracking data into localStorage on first read', () => {
    const { window } = loadBrowserScript('index.html', 'script.js');
    const records = window.getTrackingRecords();
    expect(records['NBY-2026-101']).toBeDefined();
    expect(window.localStorage.getItem('norbyte_tracking')).toContain('NBY-2026-101');
  });

  it('round-trips a saved record', () => {
    const { window } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({ id: 'NBY-TEST', projectName: 'RT', progress: 10 });
    const records = window.getTrackingRecords();
    expect(records['NBY-TEST'].projectName).toBe('RT');
  });
});

describe('script.js — performTrackingLookup rendering', () => {
  it('renders a found record into the result box (API-offline fallback)', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    await window.performTrackingLookup('NBY-2026-101');
    await flush();

    expect(document.getElementById('tracking-result-box').hidden).toBe(false);
    expect(document.getElementById('res-project-name').textContent).toBe(
      'IoT Smart Solar Telemetry Grid'
    );
    expect(document.getElementById('res-progress-pct').textContent).toBe('75%');
    expect(document.getElementById('res-status-badge').className).toContain(
      'status-in-progress'
    );
  });

  it('shows the not-found box for an unknown id', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    await window.performTrackingLookup('NBY-DOES-NOT-EXIST');
    await flush();

    expect(document.getElementById('tracking-not-found').hidden).toBe(false);
    expect(document.getElementById('not-found-id').textContent).toBe(
      'NBY-DOES-NOT-EXIST'
    );
  });

  it('marks the status badge done when progress is 100', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({
      id: 'NBY-DONE',
      projectName: 'Finished',
      client: 'C',
      status: 'Completed & Shipped',
      progress: 100,
      notes: 'n',
    });
    await window.performTrackingLookup('NBY-DONE');
    await flush();
    expect(document.getElementById('res-status-badge').className).toContain(
      'status-done'
    );
  });

  it('renders one timeline step element per step with correct done/active icons', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({
      id: 'NBY-STEPS',
      projectName: 'Stepper',
      client: 'C',
      status: 'In Progress',
      progress: 50,
      notes: 'n',
      steps: [
        { title: 'A', detail: 'a', status: 'done' },
        { title: 'B', detail: 'b', status: 'active' },
        { title: 'C', detail: 'c', status: 'pending' },
      ],
    });
    await window.performTrackingLookup('NBY-STEPS');
    await flush();

    const steps = document.querySelectorAll('#dynamic-timeline-stepper .timeline-step');
    expect(steps.length).toBe(3);
    expect(steps[0].className).toContain('step-done');
    expect(steps[0].querySelector('.step-icon').textContent).toBe('✓');
  });

  it('hides the deliverables section when a record has no deliverables', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({
      id: 'NBY-NODELIV',
      projectName: 'NoFiles',
      client: 'C',
      status: 'In Progress',
      progress: 20,
      notes: 'n',
      steps: [],
      deliverables: [],
    });
    await window.performTrackingLookup('NBY-NODELIV');
    await flush();
    expect(document.getElementById('res-deliverables-section').hidden).toBe(true);
  });
});
