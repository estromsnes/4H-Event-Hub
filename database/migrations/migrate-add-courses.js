const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding courses tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

db.serialize(() => {
    // Create courses table
    db.run(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            instructor TEXT,
            location TEXT,
            max_participants INTEGER DEFAULT 15,
            icon TEXT DEFAULT '📚',
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating courses table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ courses table created');
    });

    // Create participant_courses junction table
    db.run(`
        CREATE TABLE IF NOT EXISTS participant_courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            participant_code TEXT NOT NULL,
            course_id INTEGER NOT NULL,
            enrolled_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (participant_code) REFERENCES participants(participant_code) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            UNIQUE(participant_code, course_id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating participant_courses table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ participant_courses table created');

        // Create indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_participant_courses_participant ON participant_courses(participant_code)`, (err) => {
            if (err) console.error('❌ Error creating index:', err.message);
            else console.log('✅ Index idx_participant_courses_participant created');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_participant_courses_course ON participant_courses(course_id)`, (err) => {
            if (err) console.error('❌ Error creating index:', err.message);
            else console.log('✅ Index idx_participant_courses_course created');

            // Close database
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                    process.exit(1);
                }
                console.log('✅ Database migration complete!\n');
                console.log('📚 Courses tables ready!');
                console.log('   - courses: Stores course information');
                console.log('   - participant_courses: Links participants to courses\n');
                process.exit(0);
            });
        });
    });
});
