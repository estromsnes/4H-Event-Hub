const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding program table...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create program table
db.run(`
    CREATE TABLE IF NOT EXISTS program (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT,
        day_number INTEGER DEFAULT 1,
        order_number INTEGER DEFAULT 999,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating program table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ program table created successfully');

    // Create index
    db.run(`CREATE INDEX IF NOT EXISTS idx_program_active ON program(active, day_number, order_number)`, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
        } else {
            console.log('✅ Index idx_program_active created');
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            }
            console.log('✅ Database migration complete!');
            console.log('');
            console.log('🚀 You can now manage program in the admin panel.');
        });
    });
});
