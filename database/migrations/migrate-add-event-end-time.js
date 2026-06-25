const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding end_datetime to event_info...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Add end_datetime column to event_info table
db.run(`
    ALTER TABLE event_info ADD COLUMN end_datetime TEXT
`, (err) => {
    if (err) {
        // Column might already exist
        if (err.message.includes('duplicate column name')) {
            console.log('⚠️  Column end_datetime already exists, skipping...');
        } else {
            console.error('❌ Error adding end_datetime column:', err.message);
            db.close();
            process.exit(1);
        }
    } else {
        console.log('✅ end_datetime column added successfully');
    }

    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        }
        console.log('✅ Database migration complete!');
        console.log('');
        console.log('📅 Event end datetime can now be saved in admin panel.');
    });
});
