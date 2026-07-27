'use strict';

const { loadBrowserScript } = require('./helpers/loadBrowserScript');

const flush = () => new Promise((r) => setTimeout(r, 0));

/**
 * These tests document known output-escaping gaps. Cases written with
 * `test.failing` assert the DESIRED (secure) behavior that does NOT hold yet:
 * Jest reports them green while the gap exists, and flips them RED the moment
 * someone adds escaping — a tripwire that says "convert me to a normal test".
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

describe('XSS — known unescaped innerHTML sinks (tripwires)', () => {
  test.failing(
    'step titles rendered on the public tracker should be HTML-escaped',
    async () => {
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
      // Desired: the tag is inert text, not a real <b> element.
      expect(stepper.querySelector('b')).toBeNull();
    }
  );

  test.failing(
    'admin records table should HTML-escape the project name',
    () => {
      const { window, document } = loadBrowserScript('admin.html', 'admin.js');
      const records = {
        'NBY-XSS-ADM': {
          id: 'NBY-XSS-ADM',
          projectName: '<i>inject</i>',
          client: 'C',
          status: 'In Progress',
          progress: 20,
          notes: 'n',
        },
      };
      window.renderRecordsTable(records, '');
      const tbody = document.getElementById('records-table-body');
      // Desired: injected markup is inert text, not a real <i> element.
      expect(tbody.querySelector('i')).toBeNull();
    }
  );
});
