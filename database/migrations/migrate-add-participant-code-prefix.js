const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding participant_code_prefix to event_info...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Add participant_code_prefix column to event_info table with default value 'SK'
db.run(`
    ALTER TABLE event_info ADD COLUMN participant_code_prefix TEXT DEFAULT 'SK'
`, (err) => {
    if (err) {
        // Column might already exist
        if (err.message.includes('duplicate column name')) {
            console.log('⚠️  Column participant_code_prefix already exists, skipping...');
        } else {
            console.error('❌ Error adding participant_code_prefix column:', err.message);
            db.close();
            process.exit(1);
        }
    } else {
        console.log('✅ participant_code_prefix column added successfully');
    }

    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        }
        console.log('✅ Database migration complete!');
        console.log('');
        console.log('🏷️  Participant code prefix can now be set in admin panel.');
        console.log('   Default prefix is "SK" for backwards compatibility.');
    });
});
