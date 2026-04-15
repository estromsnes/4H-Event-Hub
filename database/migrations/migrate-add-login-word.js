const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔄 Starting migration: Add login_word column to participants table');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Run migration
db.serialize(() => {
    // Check if column already exists
    db.get("PRAGMA table_info(participants)", (err, row) => {
        if (err) {
            console.error('❌ Error checking table info:', err.message);
            db.close();
            process.exit(1);
        }
    });

    // Add login_word column (without UNIQUE constraint - SQLite doesn't support it in ALTER TABLE)
    // Uniqueness will be enforced by a unique index and application logic
    db.run(`
        ALTER TABLE participants
        ADD COLUMN login_word TEXT
    `, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️  Column login_word already exists, skipping...');
            } else {
                console.error('❌ Error adding login_word column:', err.message);
                db.close();
                process.exit(1);
            }
        } else {
            console.log('✅ Added login_word column to participants table');
        }

        // Create UNIQUE index on login_word for uniqueness enforcement and faster lookups
        db.run(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_login_word
            ON participants(login_word)
            WHERE login_word IS NOT NULL
        `, (err) => {
            if (err) {
                console.error('❌ Error creating index:', err.message);
                db.close();
                process.exit(1);
            }

            console.log('✅ Created index on login_word column');
            console.log('✅ Migration completed successfully!');
            console.log('');
            console.log('ℹ️  Note: Existing participants do not have login words.');
            console.log('   New participants will automatically get a login word assigned.');
            console.log('   You can delete old participants and create new ones to test.');

            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                    process.exit(1);
                }
                console.log('👋 Database connection closed');
                process.exit(0);
            });
        });
    });
});
