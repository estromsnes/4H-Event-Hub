const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Fixing quiz_answers table to remove CHECK constraint...');

db.serialize(() => {
    // SQLite doesn't support DROP CONSTRAINT, so we need to recreate the table

    // Step 1: Create new table without the restrictive CHECK constraint
    db.run(`
        CREATE TABLE IF NOT EXISTS quiz_answers_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            selected_options TEXT NOT NULL,
            is_correct INTEGER NOT NULL,
            time_taken INTEGER,
            answered_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
            FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
            UNIQUE(session_id, question_id)
        )
    `, (err) => {
        if (err) {
            console.error('❌ Error creating new table:', err.message);
            return;
        }
        console.log('✅ Created new quiz_answers table without old selected_option column');

        // Step 2: Copy data from old table to new table
        // Use selected_options if available, otherwise use selected_option
        db.run(`
            INSERT INTO quiz_answers_new (id, session_id, question_id, selected_options, is_correct, time_taken, answered_at)
            SELECT id, session_id, question_id,
                   COALESCE(selected_options, selected_option) as selected_options,
                   is_correct, time_taken, answered_at
            FROM quiz_answers
        `, (err) => {
            if (err) {
                console.error('❌ Error copying data:', err.message);
                return;
            }
            console.log('✅ Copied data from old table');

            // Step 3: Drop old table
            db.run(`DROP TABLE quiz_answers`, (err) => {
                if (err) {
                    console.error('❌ Error dropping old table:', err.message);
                    return;
                }
                console.log('✅ Dropped old table');

                // Step 4: Rename new table to original name
                db.run(`ALTER TABLE quiz_answers_new RENAME TO quiz_answers`, (err) => {
                    if (err) {
                        console.error('❌ Error renaming table:', err.message);
                        return;
                    }
                    console.log('✅ Renamed new table to quiz_answers');

                    // Step 5: Recreate indexes
                    db.run(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(session_id)`, (err) => {
                        if (err) {
                            console.error('❌ Error creating index:', err.message);
                        } else {
                            console.log('✅ Recreated indexes');
                        }

                        console.log('');
                        console.log('✅ Migration completed successfully!');
                        console.log('   - Removed old selected_option column');
                        console.log('   - Removed CHECK constraint');
                        console.log('   - selected_options can now store comma-separated values');

                        db.close();
                    });
                });
            });
        });
    });
});
