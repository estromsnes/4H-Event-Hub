const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔄 Adding points column to team_challenge_sessions table...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to database');
});

// Add points column to team_challenge_sessions
db.run(`
    ALTER TABLE team_challenge_sessions
    ADD COLUMN points INTEGER DEFAULT 0
`, (err) => {
    if (err) {
        // Column might already exist
        if (err.message.includes('duplicate column')) {
            console.log('✅ Points column already exists');
        } else {
            console.error('❌ Error adding points column:', err.message);
            db.close();
            process.exit(1);
        }
    } else {
        console.log('✅ Points column added successfully');
    }

    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Migration completed successfully!');
        }
    });
});
