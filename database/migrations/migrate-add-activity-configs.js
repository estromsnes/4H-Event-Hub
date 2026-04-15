const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding activity config tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

db.serialize(() => {
    // Quiz config table
    db.run(`CREATE TABLE IF NOT EXISTS quiz_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating quiz_config table:', err.message);
        } else {
            console.log('✅ Created quiz_config table');
        }
    });

    // Scavenger hunt config table
    db.run(`CREATE TABLE IF NOT EXISTS scavenger_hunt_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating scavenger_hunt_config table:', err.message);
        } else {
            console.log('✅ Created scavenger_hunt_config table');
        }
    });

    // Tic tac toe config table
    db.run(`CREATE TABLE IF NOT EXISTS tic_tac_toe_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating tic_tac_toe_config table:', err.message);
        } else {
            console.log('✅ Created tic_tac_toe_config table');
        }
    });

    // Team challenge config table
    db.run(`CREATE TABLE IF NOT EXISTS team_challenge_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating team_challenge_config table:', err.message);
        } else {
            console.log('✅ Created team_challenge_config table');
        }
    });

    // Photo challenges config table (global enable/disable)
    db.run(`CREATE TABLE IF NOT EXISTS photo_challenges_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating photo_challenges_config table:', err.message);
        } else {
            console.log('✅ Created photo_challenges_config table');
        }
    });

    // Insert default configurations (one row for each activity, only if table is empty)
    db.run(`INSERT INTO quiz_config (active)
            SELECT 1
            WHERE NOT EXISTS (SELECT 1 FROM quiz_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default quiz_config:', err.message);
        } else {
            console.log('✅ Inserted default quiz configuration');
        }
    });

    db.run(`INSERT INTO scavenger_hunt_config (active)
            SELECT 1
            WHERE NOT EXISTS (SELECT 1 FROM scavenger_hunt_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default scavenger_hunt_config:', err.message);
        } else {
            console.log('✅ Inserted default scavenger hunt configuration');
        }
    });

    db.run(`INSERT INTO tic_tac_toe_config (active)
            SELECT 1
            WHERE NOT EXISTS (SELECT 1 FROM tic_tac_toe_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default tic_tac_toe_config:', err.message);
        } else {
            console.log('✅ Inserted default tic tac toe configuration');
        }
    });

    db.run(`INSERT INTO team_challenge_config (active)
            SELECT 1
            WHERE NOT EXISTS (SELECT 1 FROM team_challenge_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default team_challenge_config:', err.message);
        } else {
            console.log('✅ Inserted default team challenge configuration');
        }
    });

    db.run(`INSERT INTO photo_challenges_config (active)
            SELECT 1
            WHERE NOT EXISTS (SELECT 1 FROM photo_challenges_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default photo_challenges_config:', err.message);
        } else {
            console.log('✅ Inserted default photo challenges configuration');
        }
    });

    // Update existing bingo_config table to set default active = 1 if not set
    db.run(`UPDATE bingo_config SET active = 1 WHERE active IS NULL OR active = 0`, (err) => {
        if (err) {
            console.error('❌ Error updating bingo_config:', err.message);
        } else {
            console.log('✅ Updated existing bingo configuration (set active = 1)');
        }
    });

    // Update existing selfie_chain_config table to set default active = 1 if not set
    db.run(`UPDATE selfie_chain_config SET active = 1 WHERE active IS NULL OR active = 0`, (err) => {
        if (err) {
            console.error('❌ Error updating selfie_chain_config:', err.message);
        } else {
            console.log('✅ Updated existing selfie chain configuration (set active = 1)');
        }

        // Close database after all operations
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
                process.exit(1);
            }
            console.log('✅ Database migration completed successfully!');
            console.log('🎉 Activity config tables ready to use');
        });
    });
});
