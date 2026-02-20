// Migration: Add scavenger hunt tables
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Migrating database: Adding scavenger hunt tables...');

db.serialize(() => {
    // Create scavenger_checkpoints table
    db.run(`
        CREATE TABLE IF NOT EXISTS scavenger_checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            clue TEXT NOT NULL,
            qr_code TEXT UNIQUE NOT NULL,
            order_number INTEGER NOT NULL,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating scavenger_checkpoints table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ scavenger_checkpoints table created successfully');
    });

    // Create scavenger_sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS scavenger_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'abandoned')),
            start_time TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            end_time TEXT,
            elapsed_seconds REAL,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating scavenger_sessions table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ scavenger_sessions table created successfully');
    });

    // Create scavenger_scans table
    db.run(`
        CREATE TABLE IF NOT EXISTS scavenger_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            checkpoint_id INTEGER NOT NULL,
            scanned_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (session_id) REFERENCES scavenger_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (checkpoint_id) REFERENCES scavenger_checkpoints(id) ON DELETE CASCADE,
            UNIQUE(session_id, checkpoint_id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating scavenger_scans table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ scavenger_scans table created successfully');
    });

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_scavenger_session_team ON scavenger_sessions(team_name)`, (err) => {
        if (err) {
            console.error('❌ Error creating index idx_scavenger_session_team:', err.message);
        } else {
            console.log('✅ Index idx_scavenger_session_team created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_scavenger_scan_session ON scavenger_scans(session_id)`, (err) => {
        if (err) {
            console.error('❌ Error creating index idx_scavenger_scan_session:', err.message);
        } else {
            console.log('✅ Index idx_scavenger_scan_session created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_scavenger_checkpoint_qr ON scavenger_checkpoints(qr_code)`, (err) => {
        if (err) {
            console.error('❌ Error creating index idx_scavenger_checkpoint_qr:', err.message);
            db.close();
            process.exit(1);
        } else {
            console.log('✅ Index idx_scavenger_checkpoint_qr created');
        }

        // Close database after all operations
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
                process.exit(1);
            }
            console.log('✅ Database migration complete!\n');
            console.log('🏆 Scavenger hunt tables ready!');
            console.log('   - scavenger_checkpoints: Stores checkpoint definitions');
            console.log('   - scavenger_sessions: Tracks team hunt sessions');
            console.log('   - scavenger_scans: Records checkpoint scans\n');
            process.exit(0);
        });
    });
});
