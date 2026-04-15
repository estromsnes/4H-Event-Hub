const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding photo challenges tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

db.serialize(() => {
    // Create photo_challenges table
    db.run(`
        CREATE TABLE IF NOT EXISTS photo_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            points INTEGER DEFAULT 10,
            icon TEXT DEFAULT '📸',
            active INTEGER DEFAULT 1,
            order_number INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating photo_challenges table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ photo_challenges table created');
    });

    // Create photo_submissions table
    db.run(`
        CREATE TABLE IF NOT EXISTS photo_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER NOT NULL,
            team_name TEXT NOT NULL,
            participant_code TEXT NOT NULL,
            image_path TEXT NOT NULL,
            points_awarded INTEGER DEFAULT NULL,
            status TEXT DEFAULT 'pending',
            admin_comment TEXT,
            submitted_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            reviewed_at TEXT DEFAULT NULL,
            FOREIGN KEY (challenge_id) REFERENCES photo_challenges(id) ON DELETE CASCADE,
            FOREIGN KEY (participant_code) REFERENCES participants(participant_code) ON DELETE CASCADE,
            UNIQUE(challenge_id, team_name)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating photo_submissions table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ photo_submissions table created');

        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_photo_submissions_challenge ON photo_submissions(challenge_id)`, (err) => {
            if (err) console.error('❌ Error creating index:', err.message);
            else console.log('✅ Index idx_photo_submissions_challenge created');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_photo_submissions_team ON photo_submissions(team_name)`, (err) => {
            if (err) console.error('❌ Error creating index:', err.message);
            else console.log('✅ Index idx_photo_submissions_team created');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_photo_submissions_status ON photo_submissions(status)`, (err) => {
            if (err) console.error('❌ Error creating index:', err.message);
            else console.log('✅ Index idx_photo_submissions_status created');

            // Close database
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                    process.exit(1);
                }
                console.log('✅ Database migration complete!\n');
                console.log('📸 Photo challenges tables ready!');
                console.log('   - photo_challenges: Stores challenge definitions');
                console.log('   - photo_submissions: Stores team submissions with images\n');
                process.exit(0);
            });
        });
    });
});
