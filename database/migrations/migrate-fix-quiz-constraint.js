const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Fixing quiz_questions CHECK constraint...');

db.serialize(() => {
    // SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table

    // Step 1: Create new table without the restrictive CHECK constraint
    db.run(`
        CREATE TABLE IF NOT EXISTS quiz_questions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_text TEXT NOT NULL,
            image_path TEXT,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option TEXT NOT NULL,
            time_limit_seconds INTEGER DEFAULT 30,
            order_number INTEGER DEFAULT 999,
            active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating new table:', err.message);
            return;
        }
        console.log('✅ Created new quiz_questions table without constraint');

        // Step 2: Copy data from old table to new table
        db.run(`
            INSERT INTO quiz_questions_new (id, question_text, image_path, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds, order_number, active, created_at)
            SELECT id, question_text, image_path, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds, order_number, active, created_at
            FROM quiz_questions
        `, (err) => {
            if (err) {
                console.error('❌ Error copying data:', err.message);
                return;
            }
            console.log('✅ Copied data from old table');

            // Step 3: Drop old table
            db.run(`DROP TABLE quiz_questions`, (err) => {
                if (err) {
                    console.error('❌ Error dropping old table:', err.message);
                    return;
                }
                console.log('✅ Dropped old table');

                // Step 4: Rename new table to original name
                db.run(`ALTER TABLE quiz_questions_new RENAME TO quiz_questions`, (err) => {
                    if (err) {
                        console.error('❌ Error renaming table:', err.message);
                        return;
                    }
                    console.log('✅ Renamed new table to quiz_questions');

                    // Step 5: Recreate indexes
                    db.run(`CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(active, order_number)`, (err) => {
                        if (err) {
                            console.error('❌ Error creating index:', err.message);
                        } else {
                            console.log('✅ Recreated indexes');
                        }

                        console.log('');
                        console.log('✅ Migration completed successfully!');
                        console.log('   correct_option can now store comma-separated values like "A,C"');

                        db.close();
                    });
                });
            });
        });
    });
});
