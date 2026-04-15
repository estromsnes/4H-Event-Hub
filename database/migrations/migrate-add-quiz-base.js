const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding Quiz tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create quiz_questions table
db.run(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT NOT NULL,
        image_path TEXT,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
        order_number INTEGER DEFAULT 999,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating quiz_questions table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ quiz_questions table created');

    // Create index on active and order_number
    db.run(`CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(active, order_number)`, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
        } else {
            console.log('✅ Index idx_quiz_questions_active created');
        }
    });
});

// Create quiz_sessions table
db.run(`
    CREATE TABLE IF NOT EXISTS quiz_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_name TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
        start_time TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        end_time TEXT,
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating quiz_sessions table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ quiz_sessions table created');

    // Create indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_team ON quiz_sessions(team_name)`, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
        } else {
            console.log('✅ Index idx_quiz_sessions_team created');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON quiz_sessions(status)`, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
        } else {
            console.log('✅ Index idx_quiz_sessions_status created');
        }
    });
});

// Create quiz_answers table
db.run(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_option TEXT NOT NULL CHECK(selected_option IN ('A', 'B', 'C', 'D')),
        is_correct INTEGER NOT NULL,
        answered_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
        UNIQUE(session_id, question_id)
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating quiz_answers table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ quiz_answers table created');

    // Create index
    db.run(`CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(session_id)`, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
        } else {
            console.log('✅ Index idx_quiz_answers_session created');
        }

        // Close database after all operations
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
                process.exit(1);
            }
            console.log('✅ Database migration completed successfully');
            console.log('');
        });
    });
});
