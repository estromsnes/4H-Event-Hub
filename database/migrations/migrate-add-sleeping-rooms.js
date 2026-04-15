const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding sleeping_rooms table and participant room assignments...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create sleeping_rooms table
db.run(`
    CREATE TABLE IF NOT EXISTS sleeping_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        capacity INTEGER DEFAULT 10,
        floor TEXT,
        notes TEXT,
        created_date TEXT DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating sleeping_rooms table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ sleeping_rooms table created successfully');

    // Create index on active column
    db.run('CREATE INDEX IF NOT EXISTS idx_sleeping_rooms_active ON sleeping_rooms(active)', (err) => {
        if (err) {
            console.error('❌ Error creating index on sleeping_rooms:', err.message);
        } else {
            console.log('✅ Index created on sleeping_rooms.active');
        }
    });

    // Insert default rooms
    const defaultRooms = [
        { name: 'Miks 1', description: 'Fellesrom 1', capacity: 10, floor: '1. etasje' },
        { name: 'Miks 2', description: 'Fellesrom 2', capacity: 10, floor: '1. etasje' },
        { name: 'Gutter 1', description: 'Gutterom 1', capacity: 8, floor: '2. etasje' },
        { name: 'Jenter 1', description: 'Jenterom 1', capacity: 8, floor: '2. etasje' }
    ];

    const insertStmt = db.prepare('INSERT OR IGNORE INTO sleeping_rooms (name, description, capacity, floor) VALUES (?, ?, ?, ?)');

    defaultRooms.forEach(room => {
        insertStmt.run(room.name, room.description, room.capacity, room.floor);
    });

    insertStmt.finalize((err) => {
        if (err) {
            console.error('❌ Error inserting default rooms:', err.message);
        } else {
            console.log('✅ Default rooms inserted successfully');
        }

        // Add sleeping_room_id column to participants table
        db.run(`
            ALTER TABLE participants ADD COLUMN sleeping_room_id INTEGER REFERENCES sleeping_rooms(id)
        `, (err) => {
            if (err) {
                // Check if column already exists
                if (err.message.includes('duplicate column name')) {
                    console.log('⚠️  Column sleeping_room_id already exists in participants table');
                } else {
                    console.error('❌ Error adding sleeping_room_id to participants:', err.message);
                    db.close();
                    process.exit(1);
                }
            } else {
                console.log('✅ Column sleeping_room_id added to participants table');
            }

            // Create index on sleeping_room_id
            db.run('CREATE INDEX IF NOT EXISTS idx_participants_sleeping_room ON participants(sleeping_room_id)', (err) => {
                if (err) {
                    console.error('❌ Error creating index on participants.sleeping_room_id:', err.message);
                } else {
                    console.log('✅ Index created on participants.sleeping_room_id');
                }

                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    }
                    console.log('✅ Database migration complete!');
                    console.log('');
                    console.log('🚀 You can now manage sleeping rooms in the admin panel.');
                });
            });
        });
    });
});
