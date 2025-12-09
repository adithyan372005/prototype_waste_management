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
app.use('/snapshots', express.static(snapshotsDir));

// Routes
app.get('/live', async (req, res) => {
    try {
        // Fetch from ML service
        const response = await axios.get(`${mlUrl}/live`);
        const mlData = response.data;
        
        // Add snapshot URL if violation detected
        let snapshotUrl = null;
        if (mlData.is_violation && mlData.class) {
            // Copy snapshot from ML service to backend snapshots
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `violation_${timestamp}.jpg`;
            snapshotUrl = `http://localhost:4000/snapshots/${filename}`;
            
            // Note: In a real implementation, you'd copy the actual snapshot file
            // For now, we'll just create the URL
        }
        
        // Prepare data for database
        const logData = {
            class: mlData.class,
            wet_dry: mlData.wet_dry,
            confidence: mlData.confidence,
            is_violation: mlData.is_violation,
            snapshot_url: snapshotUrl
        };
        
        // Save to database only if we have a detection
        if (mlData.class) {
            await db.insertLog(logData);
        }
        
        // Return the ML data with snapshot URL
        const responseData = {
            ...mlData,
            snapshot_url: snapshotUrl
        };
        
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching from ML service:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch detection data',
            class: null,
            wet_dry: null,
            confidence: 0,
            is_violation: false
        });
    }
});

app.get('/logs', async (req, res) => {
    try {
        const logs = await db.getAllLogs();
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error.message);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
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