const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding teams table...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Create teams table
db.run(`
    CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        max_members INTEGER DEFAULT 5,
        created_date TEXT DEFAULT (datetime('now')),
        active INTEGER DEFAULT 1
    )
`, (err) => {
    if (err) {
        console.error('❌ Error creating teams table:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('✅ teams table created successfully');

    // Insert the 25 creative team names
    const teams = [
        'Glade Geiter',
        'Spreke Sauer',
        'Raske Rever',
        'Modige Melkekyr',
        'Flinke Flaggermus',
        'Sultne Smågriser',
        'Kule Kaniner',
        'Tøffe Traktorer',
        'Ville Vannhjul',
        'Smarte Snegler',
        'Greie Griser',
        'Stolte Høner',
        'Lure Lam',
        'Friske Froer',
        'Rare Reinsdyr',
        'Sprø Spader',
        'Kloke Kyllinger',
        'Raske Rådyr',
        'Vennlige Villsvin',
        'Sterke Storker',
        'Snille Sauegjeter',
        'Frekke Fjøsnisser',
        'Tøffe Turteldue',
        'Glade Grisunger',
        'Rare Rompetroll'
    ];

    const insertStmt = db.prepare('INSERT OR IGNORE INTO teams (name) VALUES (?)');

    teams.forEach(teamName => {
        insertStmt.run(teamName);
    });

    insertStmt.finalize((err) => {
        if (err) {
            console.error('❌ Error inserting teams:', err.message);
        } else {
            console.log('✅ Default teams inserted successfully');
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            }
            console.log('✅ Database migration complete!');
            console.log('');
            console.log('🚀 You can now manage teams in the admin panel.');
        });
    });
});
