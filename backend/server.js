require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Database = require('./db');

const app = express();
const port = process.env.PORT || 4000;
const mlUrl = process.env.ML_URL || 'http://localhost:5001';
const penaltyRate = parseInt(process.env.PENALTY_PER_INCORRECT) || 10;

// Initialize database
const db = new Database();

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
    const mlRes = await axios.get(`${process.env.ML_URL}/live`);
    const data = mlRes.data;

    // Build snapshot URL if exists
    let snapshotUrl = null;
    if (data.snapshot_path) {
      const filename = data.snapshot_path.split("\\").pop().split("/").pop();
      // Store relative path for database
      snapshotUrl = `snapshots/${filename}`;
    }

    // Log into DB
    db.run(
      `INSERT INTO logs (class, wet_dry, confidence, is_violation, snapshot_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.class || null,
        data.wet_dry || null,
        data.confidence || 0,
        data.is_violation ? 1 : 0,
        snapshotUrl
      ]
    );

    return res.json({
      ...data,
      snapshot_path: snapshotUrl ? `http://localhost:${port}/${snapshotUrl}` : null
    });

  } catch (err) {
    console.error("Error fetching from ML service:", err);
    return res.status(500).json({ error: "ML service error" });
  }
});

app.get("/logs", (req, res) => {
  db.all(
    "SELECT * FROM logs ORDER BY timestamp DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error querying logs:", err);
        return res.status(500).json({ error: "DB error" });
      }

      const result = rows.map((row) => ({
        id: row.id,
        class: row.class,
        wet_dry: row.wet_dry,
        confidence: row.confidence,
        is_violation: !!row.is_violation,
        snapshot_path: row.snapshot_url ? `http://localhost:${port}/${row.snapshot_url}` : null,
        timestamp: row.timestamp,
      }));

      res.json(result);
    }
  );
});

app.get('/billing', async (req, res) => {
    try {
        const stats = await db.getBillingStats();
        const totalPenalty = (stats.incorrect_items || 0) * penaltyRate;
        
        res.json({
            total_items: stats.total_items || 0,
            incorrect_items: stats.incorrect_items || 0,
            total_penalty: totalPenalty,
            currency: "INR"
        });
    } catch (error) {
        console.error('Error fetching billing stats:', error.message);
        res.status(500).json({ error: 'Failed to fetch billing data' });
    }
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
app.listen(port, () => {
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET /live - Live detection data`);
    console.log(`   GET /logs - Detection logs`);
    console.log(`   GET /billing - Billing information`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close();
    process.exit(0);
});