const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding event_info table...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create event_info table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS event_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    event_description TEXT,
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    organizer_name TEXT,
    organizer_club TEXT,
    organizer_contact TEXT,
    logo_path TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now')),
    active INTEGER DEFAULT 1
);
`;

db.run(createTableSQL, (err) => {
    if (err) {
        console.error('❌ Error creating event_info table:', err.message);
        process.exit(1);
    }

    console.log('✅ event_info table created successfully');

    // Check if table is empty and insert default event
    db.get('SELECT COUNT(*) as count FROM event_info', [], (err, row) => {
        if (err) {
            console.error('❌ Error checking table:', err.message);
        } else if (row.count === 0) {
            // Insert default event
            const insertSQL = `
                INSERT INTO event_info (
                    event_name,
                    event_description,
                    location,
                    organizer_club
                ) VALUES (?, ?, ?, ?)
            `;

            db.run(insertSQL, [
                '4H Leir 2026',
                'Velkommen til 4H leir! Her møtes barn og unge for morsomme aktiviteter, læring og sosialt samvær.',
                'Folkvang Eina',
                'Skautrollet 4H'
            ], (err) => {
                if (err) {
                    console.error('❌ Error inserting default event:', err.message);
                } else {
                    console.log('✅ Default event created');
                }

                closeDatabase();
            });
        } else {
            console.log('ℹ️  Event info already exists');
            closeDatabase();
        }
    });
});

function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        } else {
            console.log('✅ Database migration complete!');
            console.log('\n🚀 You can now manage event information in the admin panel.\n');
        }
    });
}
