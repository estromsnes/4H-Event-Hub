const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding team challenge tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Use serialize to ensure all operations run sequentially
db.serialize(() => {
    // Create team_challenge_sessions table
    db.run(`
        CREATE TABLE IF NOT EXISTS team_challenge_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL,
            started_by TEXT NOT NULL,
            session_start_time TEXT NOT NULL,
            timer_start_time TEXT,
            completion_time TEXT,
            time_limit_seconds INTEGER DEFAULT 120,
            status TEXT DEFAULT 'active',
            elapsed_time_seconds REAL,
            team_photo_path TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (team_name) REFERENCES teams(name)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating team_challenge_sessions table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ team_challenge_sessions table created successfully');
    });

    // Create indexes for team_challenge_sessions
    db.run(`CREATE INDEX IF NOT EXISTS idx_session_team ON team_challenge_sessions(team_name)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_session_team:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Index idx_session_team created');
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_session_status ON team_challenge_sessions(status)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_session_status:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Index idx_session_status created');
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_session_completion ON team_challenge_sessions(completion_time)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_session_completion:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Index idx_session_completion created');
    });

    // Create team_challenge_scans table
    db.run(`
        CREATE TABLE IF NOT EXISTS team_challenge_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            participant_code TEXT NOT NULL,
            scan_order INTEGER NOT NULL,
            scan_timestamp TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (session_id) REFERENCES team_challenge_sessions(id),
            FOREIGN KEY (participant_code) REFERENCES participants(participant_code),
            UNIQUE(session_id, participant_code)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating team_challenge_scans table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ team_challenge_scans table created successfully');
    });

    // Create index for team_challenge_scans
    db.run(`CREATE INDEX IF NOT EXISTS idx_challenge_scan_session ON team_challenge_scans(session_id)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_challenge_scan_session:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Index idx_challenge_scan_session created');
    });

    // Close database after all operations complete
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
            process.exit(1);
        }
        console.log('✅ Database migration complete!');
        console.log('');
        console.log('🏆 Team challenge tables ready!');
        console.log('   - team_challenge_sessions: Tracks challenge sessions');
        console.log('   - team_challenge_scans: Tracks individual scans within sessions');
    });
});
