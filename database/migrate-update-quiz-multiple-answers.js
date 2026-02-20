const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting quiz update migration (multiple answers + timer)...');

db.serialize(() => {
    // Add time_limit_seconds column to quiz_questions
    db.run(`
        ALTER TABLE quiz_questions
        ADD COLUMN time_limit_seconds INTEGER DEFAULT 30
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding time_limit_seconds:', err.message);
        } else {
            console.log('✅ Added time_limit_seconds column to quiz_questions');
        }
    });

    // Note: SQLite doesn't support changing column types easily, so we'll handle
    // correct_option as a comma-separated string (e.g., "A,C" for multiple answers)
    // The existing column stays as TEXT which is perfect for this

    // Add selected_options column to quiz_answers (to store multiple selections)
    db.run(`
        ALTER TABLE quiz_answers
        ADD COLUMN selected_options TEXT
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding selected_options:', err.message);
        } else {
            console.log('✅ Added selected_options column to quiz_answers');
        }
    });

    // Add time_taken column to quiz_answers (time in seconds to answer)
    db.run(`
        ALTER TABLE quiz_answers
        ADD COLUMN time_taken INTEGER
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding time_taken:', err.message);
        } else {
            console.log('✅ Added time_taken column to quiz_answers');
        }
    });

    // Add total_time column to quiz_sessions (total time in seconds)
    db.run(`
        ALTER TABLE quiz_sessions
        ADD COLUMN total_time INTEGER DEFAULT 0
    `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding total_time:', err.message);
        } else {
            console.log('✅ Added total_time column to quiz_sessions');
        }
    });

    console.log('✅ Quiz update migration completed!');
    console.log('');
    console.log('📝 Changes:');
    console.log('   - quiz_questions.time_limit_seconds (default 30)');
    console.log('   - quiz_questions.correct_option now supports multiple (e.g., "A,C")');
    console.log('   - quiz_answers.selected_options (stores multiple selections)');
    console.log('   - quiz_answers.time_taken (seconds to answer)');
    console.log('   - quiz_sessions.total_time (total quiz time)');

    db.close();
});
