const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Directory for project deliverables
const UPLOADS_DIR = path.join(__dirname, 'deliverables');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-Memory Data Store (Initialized with dynamic steps and downloadable deliverables)
let trackingRecords = {
  "NBY-2026-101": {
    id: "NBY-2026-101",
    projectName: "IoT Smart Solar Telemetry Grid",
    client: "Rahul · Model Engineering College",
    status: "In Progress",
    progress: 75,
    notes: "Firmware stress test completed cleanly. Telemetry MQTT feeds active. Download Viva Report below.",
    steps: [
      { title: "1. IEEE Baseline & Architecture", detail: "System schematics & component selection locked.", status: "done" },
      { title: "2. Hardware Wiring & Firmware Flash", detail: "ESP32 microcontrollers programmed & sensor node wired.", status: "done" },
      { title: "3. Dashboard Telemetry & MQTT Setup", detail: "Real-time chart streaming connected to cloud broker.", status: "active" },
      { title: "4. Final Viva Binder & Shipping", detail: "Project report submission package generated.", status: "pending" }
    ],
    deliverables: [
      { name: "NorByte_Solar_Telemetry_Viva_Report_NBY-2026-101.pdf", size: "2.4 MB", type: "document" },
      { name: "NorByte_ESP32_Firmware_SourceCode_NBY-2026-101.zip", size: "1.8 MB", type: "code" },
      { name: "NorByte_Circuit_Schematics_NBY-2026-101.png", size: "850 KB", type: "image" }
    ]
  },
  "NBY-2026-102": {
    id: "NBY-2026-102",
    projectName: "Edge AI Defect Inspector Node",
    client: "Anjali · NIT Calicut",
    status: "Hardware Assembly",
    progress: 40,
    notes: "Raspberry Pi camera interface mounted & OpenCV real-time inference script deployed.",
    steps: [
      { title: "1. Problem Statement & Dataset Prep", detail: "Defect dataset annotated for edge model.", status: "done" },
      { title: "2. Hardware Mount & Enclosure", detail: "Camera jig 3D printed & mounted.", status: "active" },
      { title: "3. OpenCV Real-time Inference", detail: "Deploying TensorRT lightweight model.", status: "pending" },
      { title: "4. Final Report & Code Package", detail: "Documentation and viva presentation.", status: "pending" }
    ],
    deliverables: [
      { name: "NorByte_Edge_AI_Defect_System_Brief_NBY-2026-102.pdf", size: "1.2 MB", type: "document" }
    ]
  }
};

let pitches = [
  {
    id: "PITCH-1001",
    date: new Date().toISOString().split('T')[0],
    name: "Siddharth Menon",
    college: "GEC Thrissur",
    dept: "ECE",
    brief: "Need a LoRa-based environmental water quality telemetry node with custom dashboard for major project submission."
  }
];

// Serve Static Frontend Files
app.use(express.static(__dirname));

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

// ── FILE DOWNLOAD ENDPOINT WITH SPECIFIC CUSTOM FILENAME ──────
app.get('/api/download/:recordId/:filename', (req, res) => {
  const { recordId, filename } = req.params;
  const safeFilename = path.basename(filename);

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

// Serve admin console directly on root / and /admin route for backend web service
app.get(['/', '/admin', '/admin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Fallback route for static / client
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ NorByte Labs Server running on port ${PORT}`);
});
