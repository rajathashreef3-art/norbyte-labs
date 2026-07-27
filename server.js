const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-Memory Data Store (Initialized with defaults)
let trackingRecords = {
  "NBY-2026-101": {
    id: "NBY-2026-101",
    projectName: "IoT Smart Solar Telemetry Grid",
    client: "Rahul · Model Engineering College",
    status: "In Progress",
    progress: 75,
    notes: "Firmware stress test completed cleanly. Telemetry MQTT feeds active. Preparing final presentation binder."
  },
  "NBY-2026-102": {
    id: "NBY-2026-102",
    projectName: "Edge AI Defect Inspector Node",
    client: "Anjali · NIT Calicut",
    status: "Hardware Assembly",
    progress: 40,
    notes: "Raspberry Pi camera interface mounted & OpenCV real-time inference script deployed."
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

// Get all tracking records (Admin)
app.get('/api/admin/tracking', (req, res) => {
  res.json(Object.values(trackingRecords));
});

// Create / Update tracking record
app.post('/api/admin/tracking', (req, res) => {
  const { id, projectName, client, status, progress, notes } = req.body;
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
    notes: notes || ''
  };

  res.json({ message: 'Record saved successfully', record: trackingRecords[cleanId] });
});

// Delete tracking record
app.delete('/api/admin/tracking/:id', (req, res) => {
  const id = req.params.id.toUpperCase();
  if (trackingRecords[id]) {
    delete trackingRecords[id];
    return res.json({ message: `Record ${id} deleted` });
  }
  res.status(404).json({ error: 'Record not found' });
});

// ── PITCHES API ───────────────────────────────
// Get all client pitches
app.get('/api/admin/pitches', (req, res) => {
  res.json(pitches);
});

// Create new pitch submission
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

// Delete pitch
app.delete('/api/admin/pitches/:id', (req, res) => {
  const id = req.params.id;
  pitches = pitches.filter(p => p.id !== id);
  res.json({ message: `Pitch ${id} deleted` });
});

// Fallback route to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ NorByte Labs Backend Server running on port ${PORT}`);
});
