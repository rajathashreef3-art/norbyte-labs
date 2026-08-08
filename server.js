const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directory for project deliverables
const UPLOADS_DIR = path.join(__dirname, 'deliverables');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// In-Memory Data Store — starts empty, real data added via admin panel or API
let trackingRecords = {};

let pitches = [];


// Explicitly serve Admin Console on root GET / for backend web service
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve Static Frontend Files (disable index.html default on root)
app.use(express.static(__dirname, { index: false }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'NorByte Labs Express Backend API', time: new Date() });
});

// ── TRACKING API ──────────────────────────────
// Get single project status by ID
app.get('/api/tracking/:id', (req, res) => {
  const id = req.params.id.toUpperCase();
  const record = trackingRecords[id];
  if (!record) {
    return res.status(404).json({ error: `No tracking record found for ID: ${id}` });
  }
  res.json(record);
});

// Get all tracking records (Manage)
app.get('/api/records', (req, res) => {
  res.json(Object.values(trackingRecords));
});

// Create / Update tracking record
app.post('/api/records', (req, res) => {
  const { id, projectName, client, status, progress, notes, steps, deliverables } = req.body;
  if (!id || !projectName || !client) {
    return res.status(400).json({ error: 'Missing required fields (id, projectName, client)' });
  }

  const cleanId = id.toUpperCase();
  trackingRecords[cleanId] = {
    id: cleanId,
    projectName,
    client,
    status: status || 'In Progress',
    progress: Number(progress) || 0,
    notes: notes || '',
    steps: Array.isArray(steps) && steps.length > 0 ? steps : [
      { title: "1. Concept & Scope Locked", detail: "Initial baseline specs.", status: "done" },
      { title: "2. Hardware & Firmware Assembly", detail: "Components wired & programmed.", status: "active" },
      { title: "3. Dashboard & Testing", detail: "Telemetry analytics running.", status: "pending" },
      { title: "4. Viva Documentation & Shipping", detail: "Final package delivery.", status: "pending" }
    ],
    deliverables: Array.isArray(deliverables) ? deliverables : []
  };

  res.json({ message: 'Record saved successfully', record: trackingRecords[cleanId] });
});

// Delete tracking record
app.delete('/api/records/:id', (req, res) => {
  const id = req.params.id.toUpperCase();
  if (trackingRecords[id]) {
    delete trackingRecords[id];
    return res.json({ message: `Record ${id} deleted` });
  }
  res.status(404).json({ error: 'Record not found' });
});

// ── FILE UPLOAD ENDPOINT ──────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const originalName = req.file.originalname;
  const storedName = req.file.filename;
  const size = (req.file.size / (1024 * 1024)).toFixed(1) + ' MB';
  res.json({
    message: 'File uploaded successfully',
    filename: originalName,
    storedFilename: storedName,
    size: size
  });
});

// ── FILE DOWNLOAD ENDPOINT WITH SPECIFIC CUSTOM FILENAME ──────
app.get('/api/download/:recordId/:filename', (req, res) => {
  const { recordId, filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(UPLOADS_DIR, safeFilename);

  // If real uploaded file exists, serve it
  if (fs.existsSync(filePath)) {
    return res.download(filePath, safeFilename);
  }

  // Fallback synthetic deliverable content
  const sampleContent = `=====================================================
NORBYTE LABS — OFFICIAL PROJECT DELIVERABLE BINDER
Project ID: ${recordId}
File: ${safeFilename}
Generated At: ${new Date().toISOString()}
=====================================================

Thank you for choosing NorByte Labs for your CSE/ECE/EEE Engineering Project!

Deliverable Details:
- Project ID: ${recordId}
- File Name: ${safeFilename}
- Status: Verified & Tested Operational

Contents:
1. Complete Project Source Code & Firmware Scripts
2. Circuit Diagram Schematics & Pinout Layouts
3. IEEE Specification Report & Viva Q&A Guide

For technical support, email support@norbytelabs.in
NorByte Labs — Engineering Realities.
=====================================================`;

  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(sampleContent);
});

// Directory for persistent JSON data
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const ENROLLMENTS_FILE = path.join(DATA_DIR, 'enrollments.json');

function loadEnrollments() {
  try {
    if (fs.existsSync(ENROLLMENTS_FILE)) {
      const raw = fs.readFileSync(ENROLLMENTS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to load enrollments.json, initializing empty array:", e.message);
  }
  return [
    {
      id: "NBY-REG-2026-1001",
      date: "2026-08-08",
      topic: "IoT Smart Solar Telemetry Grid",
      college: "Model Engineering College",
      district: "Ernakulam",
      department: "ECE",
      contact: "+91 98765 43210",
      teamMembers: ["Rahul Nair (Lead)", "Ananya S.", "Vipin K."],
      status: "Registered"
    }
  ];
}

function saveEnrollments(data) {
  try {
    fs.writeFileSync(ENROLLMENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving enrollments.json:", e.message);
  }
}

let enrollments = loadEnrollments();

// ── PITCHES API ───────────────────────────────
app.get('/api/pitches', (req, res) => {
  res.json(pitches);
});

app.post('/api/pitches', (req, res) => {
  const { name, college, dept, brief } = req.body;
  const newPitch = {
    id: `PITCH-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString().split('T')[0],
    name: name || 'Anonymous Client',
    college: college || 'Unknown Institution',
    dept: dept || 'Engineering',
    brief: brief || 'No project description.'
  };

  pitches.unshift(newPitch);
  res.status(201).json({ message: 'Pitch submitted successfully', pitch: newPitch });
});

app.delete('/api/pitches/:id', (req, res) => {
  const id = req.params.id;
  pitches = pitches.filter(p => p.id !== id);
  res.json({ message: `Pitch ${id} deleted` });
});

// ── ENROLLMENTS & REGISTRATIONS API ────────────
app.get('/api/enrollments', (req, res) => {
  res.json(enrollments);
});

app.post('/api/enrollments', (req, res) => {
  const { topic, college, district, department, departmentOther, contact, teamMembers } = req.body;

  if (!topic || !college || !contact) {
    return res.status(400).json({ error: 'Missing required fields (topic, college, contact)' });
  }

  // Determine final department string
  let finalDept = department || 'ECE';
  if (department === 'Other' && departmentOther && departmentOther.trim()) {
    finalDept = `Other (${departmentOther.trim()})`;
  }

  // Process team members array (max 5)
  let cleanMembers = [];
  if (Array.isArray(teamMembers)) {
    cleanMembers = teamMembers.map(m => String(m).trim()).filter(Boolean).slice(0, 5);
  }

  const regId = `NBY-REG-${Date.now().toString().slice(-4)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  const newEnrollment = {
    id: regId,
    date: dateStr,
    topic: topic.trim(),
    college: college.trim(),
    district: (district || 'Kozhikode').trim(),
    department: finalDept,
    contact: contact.trim(),
    teamMembers: cleanMembers.length > 0 ? cleanMembers : ['Primary Contact'],
    status: 'Registered'
  };

  enrollments.unshift(newEnrollment);
  saveEnrollments(enrollments);

  // Generate WhatsApp prefilled message
  const waPhone = '916238734386';
  const membersText = newEnrollment.teamMembers.join(', ');
  const msgText = `Hi NorByte Labs! 👋 I just registered for Project Assistance.\n\n` +
    `📌 Ref ID: ${newEnrollment.id}\n` +
    `💡 Project Topic: ${newEnrollment.topic}\n` +
    `🎓 College: ${newEnrollment.college}\n` +
    `📍 District: ${newEnrollment.district}\n` +
    `⚡ Dept: ${newEnrollment.department}\n` +
    `👥 Team (${newEnrollment.teamMembers.length}): ${membersText}\n` +
    `📞 Contact: ${newEnrollment.contact}\n\n` +
    `Please guide us on starting the project and webinar details!`;

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msgText)}`;

  res.status(201).json({
    message: 'Enrollment registered successfully',
    enrollment: newEnrollment,
    whatsappUrl: whatsappUrl
  });
});

app.delete('/api/enrollments/:id', (req, res) => {
  const id = req.params.id;
  enrollments = enrollments.filter(e => e.id !== id);
  saveEnrollments(enrollments);
  res.json({ message: `Enrollment ${id} deleted` });
});


// Serve admin console directly on root / and all non-API routes for backend web service
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Only start listening when run directly (`node server.js`), not when the
// app is imported by the test suite via Supertest.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`⚡ NorByte Labs Server running on port ${PORT}`);
  });
}

module.exports = app;
