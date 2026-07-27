'use strict';

const request = require('supertest');

// The in-memory data store lives in module scope, so each test file/run gets a
// fresh copy by resetting the module registry and re-requiring the app.
let app;
beforeEach(() => {
  jest.resetModules();
  app = require('../server');
});

describe('GET /api/health', () => {
  it('returns ok status and service metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'NorByte Labs Express Backend API',
    });
    expect(res.body.time).toBeDefined();
  });
});

describe('GET /api/tracking/:id', () => {
  it('returns a seeded record', async () => {
    const res = await request(app).get('/api/tracking/NBY-2026-101');
    expect(res.status).toBe(200);
    expect(res.body.projectName).toBe('IoT Smart Solar Telemetry Grid');
  });

  it('normalizes the id to uppercase before lookup', async () => {
    const res = await request(app).get('/api/tracking/nby-2026-101');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('NBY-2026-101');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/tracking/NBY-9999-999');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/No tracking record found/);
  });
});

describe('GET /api/records', () => {
  it('returns the full list of records as an array', async () => {
    const res = await request(app).get('/api/records');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/records', () => {
  it('rejects a payload missing required fields with 400', async () => {
    const res = await request(app).post('/api/records').send({ id: 'NBY-X' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing required fields/);
  });

  it('creates a record and uppercases the id', async () => {
    const res = await request(app).post('/api/records').send({
      id: 'nby-2026-500',
      projectName: 'Test Rig',
      client: 'QA Team',
      progress: 55,
    });
    expect(res.status).toBe(200);
    expect(res.body.record.id).toBe('NBY-2026-500');
    expect(res.body.record.progress).toBe(55);

    const fetched = await request(app).get('/api/tracking/NBY-2026-500');
    expect(fetched.status).toBe(200);
  });

  it('injects default steps when none are supplied', async () => {
    const res = await request(app).post('/api/records').send({
      id: 'NBY-2026-501',
      projectName: 'No Steps',
      client: 'QA Team',
    });
    expect(res.body.record.steps).toHaveLength(4);
    expect(res.body.record.steps[0].title).toMatch(/Concept & Scope Locked/);
  });

  it('preserves supplied steps and deliverables', async () => {
    const steps = [{ title: 'Only Step', detail: 'x', status: 'active' }];
    const deliverables = [{ name: 'a.pdf', size: '1 MB', type: 'document' }];
    const res = await request(app).post('/api/records').send({
      id: 'NBY-2026-502',
      projectName: 'Custom',
      client: 'QA Team',
      steps,
      deliverables,
    });
    expect(res.body.record.steps).toEqual(steps);
    expect(res.body.record.deliverables).toEqual(deliverables);
  });

  it('coerces a non-numeric progress to 0', async () => {
    const res = await request(app).post('/api/records').send({
      id: 'NBY-2026-503',
      projectName: 'Bad Progress',
      client: 'QA Team',
      progress: 'not-a-number',
    });
    expect(res.body.record.progress).toBe(0);
  });
});

describe('DELETE /api/records/:id', () => {
  it('deletes an existing record', async () => {
    const res = await request(app).delete('/api/records/NBY-2026-101');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/);

    const fetched = await request(app).get('/api/tracking/NBY-2026-101');
    expect(fetched.status).toBe(404);
  });

  it('returns 404 when deleting an unknown record', async () => {
    const res = await request(app).delete('/api/records/NBY-0000-000');
    expect(res.status).toBe(404);
  });
});

describe('Pitches API', () => {
  it('lists seeded pitches', async () => {
    const res = await request(app).get('/api/pitches');
    expect(res.status).toBe(200);
    expect(res.body[0].id).toBe('PITCH-1001');
  });

  it('creates a pitch and prepends it to the list', async () => {
    const res = await request(app).post('/api/pitches').send({
      name: 'Test User',
      college: 'Test College',
      dept: 'CSE',
      brief: 'A brief',
    });
    expect(res.status).toBe(201);
    expect(res.body.pitch.name).toBe('Test User');
    expect(res.body.pitch.id).toMatch(/^PITCH-/);

    const list = await request(app).get('/api/pitches');
    expect(list.body[0].name).toBe('Test User');
  });

  it('applies default values for an empty pitch submission', async () => {
    const res = await request(app).post('/api/pitches').send({});
    expect(res.status).toBe(201);
    expect(res.body.pitch).toMatchObject({
      name: 'Anonymous Client',
      college: 'Unknown Institution',
      dept: 'Engineering',
      brief: 'No project description.',
    });
  });

  it('deletes a pitch by id', async () => {
    const res = await request(app).delete('/api/pitches/PITCH-1001');
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/pitches');
    expect(list.body.find((p) => p.id === 'PITCH-1001')).toBeUndefined();
  });
});

describe('GET /api/download/:recordId/:filename', () => {
  it('serves a text attachment with the requested filename', async () => {
    const res = await request(app).get('/api/download/NBY-2026-101/report.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('report.pdf');
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toMatch(/NORBYTE LABS/);
  });

  it('strips path-traversal segments from the filename', async () => {
    const res = await request(app).get(
      '/api/download/NBY-2026-101/..%2F..%2Fetc%2Fpasswd'
    );
    expect(res.status).toBe(200);
    // path.basename() must reduce the traversal attempt to a bare filename.
    expect(res.headers['content-disposition']).toContain('filename="passwd"');
    expect(res.headers['content-disposition']).not.toContain('..');
  });
});

describe('Fallback routing', () => {
  it('serves index.html for unmatched routes', async () => {
    const res = await request(app).get('/some/spa/route');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/<!DOCTYPE html>|<html/i);
  });
});
