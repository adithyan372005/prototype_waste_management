require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const db = require('./waste_logs');

const app = express();
const ML_URL = process.env.ML_URL || "http://127.0.0.1:5001";
const PORT = process.env.PORT || 4000;
const BASE_MONTHLY_FEE = Number(process.env.BASE_MONTHLY_FEE || 1350);
const PENALTY_PER_VIOLATION = Number(process.env.PENALTY_PER_VIOLATION || 50);

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true
}));
app.use(express.json());

// Create snapshots directory
const snapshotsDir = path.join(__dirname, 'snapshots');
if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir);
}

// Serve static files (snapshots)
app.use("/snapshots", express.static(path.join(__dirname, "snapshots")));

// Routes
app.get("/live", async (req, res) => {
  try {
    const mlRes = await axios.get(`${ML_URL}/live`);
    const data = mlRes.data || {};

    const {
      class: cls,
      wet_dry,
      confidence,
      is_violation,
      snapshot_path,
    } = data;

    let snapshotUrl = null;
    if (snapshot_path) {
      const filename = path.basename(snapshot_path);
      snapshotUrl = `${ML_URL}/snapshots/${filename}`;
    }

    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO logs (class, wet_dry, confidence, is_violation, snapshot_url, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cls || null, wet_dry || null, confidence || 0, is_violation ? 1 : 0, snapshotUrl, timestamp],
      (err) => {
        if (err) {
          console.error("Error inserting log:", err.message);
        }
      }
    );

    return res.json({
      class: cls,
      wet_dry,
      confidence,
      is_violation,
      snapshot_url: snapshotUrl,
      timestamp,
    });
  } catch (err) {
    console.error("Error fetching from ML service:", err.message);
    return res.status(500).json({ error: "ML service error" });
  }
});

app.get("/logs", (req, res) => {
  db.all(
    `SELECT id, class, wet_dry, confidence, is_violation, snapshot_url, timestamp
     FROM logs
     ORDER BY datetime(timestamp) DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error reading logs:", err.message);
        return res.status(500).json({ error: "DB error" });
      }
      res.json(rows);
    }
  );
});

app.get("/billing", (req, res) => {
  db.all(
    `SELECT COUNT(*) AS vcount
     FROM logs
     WHERE is_violation = 1`,
    [],
    (err, rows) => {
      if (err) {
        console.error("Error reading violations:", err.message);
        return res.status(500).json({ error: "DB error" });
      }
      const violationCount = rows[0]?.vcount || 0;
      const penaltyTotal = violationCount * PENALTY_PER_VIOLATION;
      const baseFee = BASE_MONTHLY_FEE;
      const totalBill = baseFee + penaltyTotal;

      res.json({
        base_fee: baseFee,
        violation_count: violationCount,
        penalty_per_violation: PENALTY_PER_VIOLATION,
        penalty_total: penaltyTotal,
        total_bill: totalBill,
      });
    }
  );
});

app.get('/health', (req, res) => {
    res.json({ status: 'running', service: 'Waste Detection Backend' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET /live - Live detection data`);
    console.log(`   GET /logs - Detection logs`);
    console.log(`   GET /billing - Billing information`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down gracefully...');
    db.close();
    process.exit(0);
});