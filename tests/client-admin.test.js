'use strict';

const { loadBrowserScript } = require('./helpers/loadBrowserScript');

describe('admin.js — authentication gate', () => {
  it('shows the login view and hides the dashboard when not authenticated', () => {
    const { document } = loadBrowserScript('admin.html', 'admin.js');
    expect(document.getElementById('login-view').hidden).toBe(false);
    expect(document.getElementById('dashboard-view').hidden).toBe(true);
    expect(document.getElementById('admin-logout-btn').hidden).toBe(true);
  });

  it('rejects a wrong passcode and reveals the error message', () => {
    const { document } = loadBrowserScript('admin.html', 'admin.js');
    document.getElementById('passcode-input').value = 'wrong-pin';
    document
      .getElementById('admin-auth-form')
      .dispatchEvent(new document.defaultView.Event('submit'));

    expect(document.getElementById('auth-error-msg').hidden).toBe(false);
    expect(document.getElementById('dashboard-view').hidden).toBe(true);
  });

  it('accepts the correct passcode and stores an authenticated session', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    document.getElementById('passcode-input').value = '1234';
    document
      .getElementById('admin-auth-form')
      .dispatchEvent(new window.Event('submit'));

    expect(window.sessionStorage.getItem('admin_authenticated')).toBe('true');
    expect(document.getElementById('login-view').hidden).toBe(true);
    expect(document.getElementById('dashboard-view').hidden).toBe(false);
  });
});

describe('admin.js — pitches localStorage seeding', () => {
  it('seeds a default pitch on first read', () => {
    const { window } = loadBrowserScript('admin.html', 'admin.js');
    const pitches = window.getLocalPitches();
    expect(pitches[0].id).toBe('PITCH-1001');
  });
});

describe('admin.js — convertPitchToProject', () => {
  it('prefills the record form from a pitch with a generated NBY id', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    window.convertPitchToProject(0); // default seeded pitch PITCH-1001

    expect(document.getElementById('record-id').value).toMatch(/^NBY-2026-\d+$/);
    expect(document.getElementById('record-client').value).toBe(
      'Siddharth Menon · GEC Thrissur'
    );
    expect(document.getElementById('record-status').value).toBe('Concept Locked');
    expect(document.getElementById('record-progress').value).toBe('10');
  });

  it('is a no-op for an out-of-range index', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    document.getElementById('record-id').value = 'UNCHANGED';
    window.convertPitchToProject(999);
    expect(document.getElementById('record-id').value).toBe('UNCHANGED');
  });
});

describe('admin.js — renderRecordsTable search filter', () => {
  it('renders all records when the filter is empty', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    const records = window.getLocalTrackingRecords();
    window.renderRecordsTable(records, '');
    const rows = document.querySelectorAll('#records-table-body tr');
    expect(rows.length).toBe(Object.keys(records).length);
  });

  it('filters records by a project-name substring (case-insensitive)', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    const records = window.getLocalTrackingRecords();
    window.renderRecordsTable(records, 'solar');
    const rows = document.querySelectorAll('#records-table-body tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toMatch(/Solar/);
  });

  it('renders no rows when nothing matches the filter', () => {
    const { window, document } = loadBrowserScript('admin.html', 'admin.js');
    const records = window.getLocalTrackingRecords();
    window.renderRecordsTable(records, 'zzz-no-match');
    expect(document.querySelectorAll('#records-table-body tr').length).toBe(0);
  });
});
