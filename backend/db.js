const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create data directory if it doesn't exist
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(__dirname, 'data', 'waste.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.init();
            }
        });
    }

    init() {
        // Create logs table
        const createLogsTable = `
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class TEXT,
                wet_dry TEXT,
                confidence REAL,
                is_violation BOOLEAN,
                snapshot_url TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        this.db.run(createLogsTable, (err) => {
            if (err) {
                console.error('Error creating logs table:', err.message);
            } else {
                console.log('Logs table created or already exists');
            }
        });
    }

    insertLog(data) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO logs (class, wet_dry, confidence, is_violation, snapshot_url)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            this.db.run(sql, [
                data.class,
                data.wet_dry,
                data.confidence,
                data.is_violation,
                data.snapshot_url
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...data });
                }
            });
        });
    }

    getAllLogs() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM logs ORDER BY timestamp DESC LIMIT 100`;
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getBillingStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as total_items,
                    SUM(CASE WHEN is_violation = 1 THEN 1 ELSE 0 END) as incorrect_items
                FROM logs
                WHERE class IS NOT NULL
            `;
            
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Direct database access methods for server.js compatibility
    run(sql, params, callback) {
        return this.db.run(sql, params, callback);
    }

    all(sql, params, callback) {
        return this.db.all(sql, params, callback);
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = Database;