// backend/waste_logs.js
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "waste_logs.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to open SQLite DB:", err.message);
  } else {
    console.log("✅ SQLite DB ready at", dbPath);
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class TEXT,
      wet_dry TEXT,
      confidence REAL,
      is_violation INTEGER,
      snapshot_url TEXT,
      timestamp TEXT
    )
  `);
});

module.exports = db;