'use strict';

const { loadBrowserScript } = require('./helpers/loadBrowserScript');

const flush = () => new Promise((r) => setTimeout(r, 0));

/**
 * Output-escaping regression tests. The innerHTML sinks in script.js/admin.js
 * are now routed through escapeHtml(), so these assert the secure behavior
 * directly. If escaping is ever removed, these go red.
 */

describe('XSS — safe sinks (should stay passing)', () => {
  it('renders tracking notes via textContent, so HTML is not parsed', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({
      id: 'NBY-SAFE',
      projectName: 'Safe',
      client: 'C',
      status: 'In Progress',
      progress: 10,
      notes: '<img src=x onerror="window.__xss=1">',
      steps: [],
      deliverables: [],
    });
    await window.performTrackingLookup('NBY-SAFE');
    await flush();

    const notesEl = document.getElementById('res-notes-text');
    // textContent sink => the markup is shown literally, no <img> element made.
    expect(notesEl.querySelector('img')).toBeNull();
    expect(notesEl.textContent).toContain('<img');
  });
});

describe('XSS — escaped innerHTML sinks', () => {
  it('escapes HTML in step titles on the public tracker', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({
      id: 'NBY-XSS-STEP',
      projectName: 'P',
      client: 'C',
      status: 'In Progress',
      progress: 50,
      notes: 'n',
      steps: [{ title: '<b>pwn</b>', detail: 'd', status: 'active' }],
      deliverables: [],
    });
    await window.performTrackingLookup('NBY-XSS-STEP');
    await flush();

    const stepper = document.getElementById('dynamic-timeline-stepper');
    expect(stepper.querySelector('b')).toBeNull();
    expect(stepper.textContent).toContain('<b>pwn</b>');
  });

  it('escapes HTML in deliverable filenames', async () => {
    const { window, document } = loadBrowserScript('index.html', 'script.js');
    window.saveTrackingRecord({
      id: 'NBY-XSS-FILE',
      projectName: 'P',
      client: 'C',
      status: 'In Progress',
      progress: 50,
      notes: 'n',
      steps: [],
      deliverables: [{ name: '<img src=x onerror=alert(1)>.pdf', size: '1 MB', type: 'document' }],
    });
    await window.performTrackingLookup('NBY-XSS-FILE');
    await flush();

    const list = document.getElementById('res-deliverables-list');
    expect(list.querySelector('img')).toBeNull();
  });

  it('escapes HTML in the admin records table', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    window.renderRecordsTable(
      {
        'NBY-XSS-ADM': {
          id: 'NBY-XSS-ADM',
          projectName: '<i>inject</i>',
          client: '<u>c</u>',
          status: 'In Progress',
          progress: 20,
          notes: '<script>bad()</script>',
        },
      },
      ''
    );
    const tbody = document.getElementById('records-table-body');
    expect(tbody.querySelector('i')).toBeNull();
    expect(tbody.querySelector('u')).toBeNull();
    expect(tbody.querySelector('script')).toBeNull();
  });

  it('escapes HTML in the admin pitches table', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    window.renderPitchesTable([
      {
        id: 'PITCH-XSS',
        date: '2026-07-27',
        name: '<b>evil</b>',
        college: 'C',
        dept: 'ECE',
        brief: '<img src=x onerror=alert(1)>',
      },
    ]);
    const tbody = document.getElementById('pitches-table-body');
    expect(tbody.querySelector('b')).toBeNull();
    expect(tbody.querySelector('img')).toBeNull();
  });
});
