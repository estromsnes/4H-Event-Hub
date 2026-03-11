const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding participant_messages table...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create participant_messages table
db.run(`
    CREATE TABLE IF NOT EXISTS participant_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        -- Sender information
        sender_code TEXT,
        sender_is_anonymous INTEGER DEFAULT 0,

        -- Recipient information
        recipient_code TEXT NOT NULL,

        -- Message content
        title TEXT,
        message TEXT NOT NULL,

        -- Moderation status
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),

        -- Admin review
        admin_notes TEXT DEFAULT NULL,
        reviewed_at TEXT DEFAULT NULL,
        reviewed_by TEXT DEFAULT NULL,

        -- Timestamps
        submitted_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

        -- Soft delete
        active INTEGER DEFAULT 1,

        -- Foreign keys
        FOREIGN KEY (sender_code) REFERENCES participants(participant_code) ON DELETE SET NULL,
        FOREIGN KEY (recipient_code) REFERENCES participants(participant_code) ON DELETE CASCADE
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating participant_messages table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ participant_messages table created successfully');

    // Create indexes
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_messages_status ON participant_messages(status)',
        'CREATE INDEX IF NOT EXISTS idx_messages_recipient ON participant_messages(recipient_code)',
        'CREATE INDEX IF NOT EXISTS idx_messages_sender ON participant_messages(sender_code)',
        'CREATE INDEX IF NOT EXISTS idx_messages_submitted_at ON participant_messages(submitted_at DESC)',
        'CREATE INDEX IF NOT EXISTS idx_messages_active ON participant_messages(active)'
    ];

    let completed = 0;
    indexes.forEach((indexSQL, i) => {
        db.run(indexSQL, (err) => {
            if (err) {
                console.error(`❌ Error creating index ${i + 1}:`, err.message);
            } else {
                console.log(`✅ Index ${i + 1} created`);
            }
            completed++;
            if (completed === indexes.length) {
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    }
                    console.log('✅ Database migration complete!');
                    console.log('');
                    console.log('💬 Participant messaging feature is now ready!');
                    console.log('   - Participants can send messages to each other');
                    console.log('   - Supports anonymous and identified messages');
                    console.log('   - Title (optional) + Message (required)');
                    console.log('   - Admin moderation required (pending/approved/rejected)');
                    console.log('   - Approved messages visible on profile page');
                    console.log('   - Soft delete support');
                });
            }
        });
    });
});
