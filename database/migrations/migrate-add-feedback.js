const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding feedback table...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create feedback table
db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        message TEXT NOT NULL,
        participant_code TEXT DEFAULT NULL,
        is_anonymous INTEGER DEFAULT 1,
        status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read')),
        submitted_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        read_at TEXT DEFAULT NULL,
        active INTEGER DEFAULT 1,
        FOREIGN KEY (participant_code) REFERENCES participants(participant_code) ON DELETE SET NULL
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating feedback table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ feedback table created successfully');

    // Create indexes for performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)`, (err) => {
        if (err) {
            console.error('❌ Error creating status index:', err.message);
        } else {
            console.log('✅ Index idx_feedback_status created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_active ON feedback(active)`, (err) => {
        if (err) {
            console.error('❌ Error creating active index:', err.message);
        } else {
            console.log('✅ Index idx_feedback_active created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON feedback(submitted_at DESC)`, (err) => {
        if (err) {
            console.error('❌ Error creating submitted_at index:', err.message);
        } else {
            console.log('✅ Index idx_feedback_submitted_at created');
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            }
            console.log('✅ Database migration complete!');
            console.log('');
            console.log('💬 Feedback feature is now ready!');
            console.log('   - Supports anonymous and identified submissions');
            console.log('   - Title (optional) + Message (required)');
            console.log('   - Status tracking (new/read)');
            console.log('   - Soft delete support');
        });
    });
});
