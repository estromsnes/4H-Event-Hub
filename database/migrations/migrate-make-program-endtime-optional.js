const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Making program end_time optional...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// SQLite doesn't support ALTER COLUMN, so we need to:
// 1. Create new table with nullable end_time
// 2. Copy data from old table
// 3. Drop old table
// 4. Rename new table
// 5. Recreate index

db.serialize(() => {
    // Step 1: Create new table with nullable end_time
    db.run(`
        CREATE TABLE program_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_time TEXT NOT NULL,
            end_time TEXT,
            location TEXT,
            day_number INTEGER DEFAULT 1,
            order_number INTEGER DEFAULT 999,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating program_new table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ program_new table created');
    });

    // Step 2: Copy all data from old table
    db.run(`INSERT INTO program_new SELECT * FROM program`, (err) => {
        if (err) {
            console.error('❌ Error copying data:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Data copied to program_new table');
    });

    // Step 3: Drop old table
    db.run(`DROP TABLE program`, (err) => {
        if (err) {
            console.error('❌ Error dropping old table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Old program table dropped');
    });

    // Step 4: Rename new table
    db.run(`ALTER TABLE program_new RENAME TO program`, (err) => {
        if (err) {
            console.error('❌ Error renaming table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Table renamed to program');
    });

    // Step 5: Recreate index
    db.run(`CREATE INDEX IF NOT EXISTS idx_program_active ON program(active, day_number, order_number)`, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Index idx_program_active created');
    });

    // Verify the migration
    db.all(`PRAGMA table_info(program)`, [], (err, rows) => {
        if (err) {
            console.error('❌ Error verifying migration:', err.message);
        } else {
            console.log('✅ Migration verified');
            const endTimeField = rows.find(row => row.name === 'end_time');
            if (endTimeField && endTimeField.notnull === 0) {
                console.log('✅ end_time is now nullable (notnull = 0)');
            } else {
                console.warn('⚠️  Warning: end_time field might not be nullable');
            }
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            }
            console.log('✅ Database migration complete!');
            console.log('');
            console.log('🚀 Program items can now be created without end_time.');
        });
    });
});
