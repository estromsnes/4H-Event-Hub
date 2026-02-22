const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding allow_qr_upload to event_info...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Add allow_qr_upload column
const alterTableSQL = `
ALTER TABLE event_info ADD COLUMN allow_qr_upload INTEGER DEFAULT 0;
`;

db.run(alterTableSQL, (err) => {
    if (err) {
        // Column might already exist
        if (err.message.includes('duplicate column name')) {
            console.log('ℹ️  Column allow_qr_upload already exists');
            closeDatabase();
        } else {
            console.error('❌ Error adding column:', err.message);
            process.exit(1);
        }
    } else {
        console.log('✅ Column allow_qr_upload added successfully (default: 0 = hidden)');
        closeDatabase();
    }
});

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database migration complete!');
            console.log('\n🚀 QR upload button visibility can now be controlled in admin panel.\n');
        }
    });
}
