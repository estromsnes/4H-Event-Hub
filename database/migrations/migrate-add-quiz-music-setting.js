/**
 * Migration: Add enable_quiz_music setting to event_info table
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Running migration: Add enable_quiz_music setting...');

db.serialize(() => {
    // Add enable_quiz_music column (default to 1 = enabled)
    db.run(`
        ALTER TABLE event_info
        ADD COLUMN enable_quiz_music INTEGER DEFAULT 1
    `, (err) => {
        if (err) {
            console.error('❌ Error adding enable_quiz_music column:', err.message);
        } else {
            console.log('✅ Added enable_quiz_music column to event_info');
        }
    });

    // Record migration
    db.run(`
        INSERT INTO migrations (name, applied_at)
        VALUES ('add-quiz-music-setting', datetime('now'))
    `, (err) => {
        if (err) {
            console.log('⚠️  Migration already recorded or migrations table does not exist');
        } else {
            console.log('✅ Migration recorded');
        }

        db.close(() => {
            console.log('✅ Migration complete!');
        });
    });
});
