'use strict';

const request = require('supertest');
const app = require('../server');

async function runAllTests() {
  console.log('🚀 Running NorByte Labs API Validation Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${name}\n     ${err.message}`);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    if (res.status !== 200 || res.body.status !== 'ok') throw new Error(`Unexpected body: ${JSON.stringify(res.body)}`);
  });

  // 2. GET Tracking
  await test('GET /api/tracking/:id', async () => {
    const res = await request(app).get('/api/tracking/NBY-2026-101');
    if (res.status !== 200 || !res.body.projectName) throw new Error(`Status ${res.status}`);
  });

  // 3. POST Records
  await test('POST /api/records', async () => {
    const res = await request(app).post('/api/records').send({
      id: 'NBY-TEST-999',
      projectName: 'Test Project',
      client: 'Tester'
    });
    if (res.status !== 200 || res.body.record.id !== 'NBY-TEST-999') throw new Error(`Status ${res.status}`);
  });

  // 4. Enrollments API GET
  await test('GET /api/enrollments', async () => {
    const res = await request(app).get('/api/enrollments');
    if (res.status !== 200 || !Array.isArray(res.body)) throw new Error(`Status ${res.status}`);
  });

  // 5. Enrollments API POST (Standard Dept & WhatsApp link)
  await test('POST /api/enrollments (ECE, 3 members, WhatsApp link)', async () => {
    const res = await request(app).post('/api/enrollments').send({
      topic: 'IoT Solar Telemetry Grid',
      college: 'Model Engineering College',
      district: 'Ernakulam',
      department: 'ECE',
      contact: '+91 9876543210',
      teamMembers: ['Rahul Nair (Lead)', 'Ananya S.', 'Vipin K.']
    });

    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.body.enrollment || !res.body.enrollment.id.startsWith('NBY-REG-')) throw new Error('Invalid enrollment ID');
    if (!res.body.whatsappUrl || !res.body.whatsappUrl.includes('wa.me/916238734386')) throw new Error('Invalid WhatsApp URL');
  });

  // 6. Enrollments API POST (Custom Dept "Other", capped 5 team members)
  await test('POST /api/enrollments (Other department, 5 team members limit)', async () => {
    const res = await request(app).post('/api/enrollments').send({
      topic: 'AI Vision Defect Inspection',
      college: 'NIT Calicut',
      district: 'Kozhikode',
      department: 'Other',
      departmentOther: 'Robotics Engineering',
      contact: '+91 9123456789',
      teamMembers: ['Member 1', 'Member 2', 'Member 3', 'Member 4', 'Member 5', 'Member 6 Extra']
    });

    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    if (res.body.enrollment.department !== 'Other (Robotics Engineering)') throw new Error(`Dept mismatch: ${res.body.enrollment.department}`);
    if (res.body.enrollment.teamMembers.length !== 5) throw new Error(`Team length is ${res.body.enrollment.teamMembers.length}, expected 5`);
  });

  console.log(`\n========================================`);
  console.log(`RESULT: ${passed} Passed, ${failed} Failed.`);
  console.log(`========================================`);

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runAllTests();
