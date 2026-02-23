const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding selfie-chain tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

db.serialize(() => {
    // Tabell for selfie-chain konfigurasjon
    db.run(`CREATE TABLE IF NOT EXISTS selfie_chain_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 0,
        start_time TEXT,
        end_time TEXT,
        time_limit_minutes INTEGER DEFAULT 120,
        points_per_selfie INTEGER DEFAULT 50,
        variant TEXT DEFAULT 'linear',
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating selfie_chain_config table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created selfie_chain_config table');
    });

    // Tabell for deltakers oppgaver i selfie-kjeden
    db.run(`CREATE TABLE IF NOT EXISTS selfie_chain_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_code TEXT NOT NULL,
        target_code TEXT NOT NULL,
        photo_path TEXT,
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        chain_position INTEGER,
        points_earned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (participant_code) REFERENCES participants(participant_code),
        FOREIGN KEY (target_code) REFERENCES participants(participant_code)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating selfie_chain_assignments table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created selfie_chain_assignments table');
    });

    // Tabell for alle selfie-møter (for visualisering av nettverk)
    db.run(`CREATE TABLE IF NOT EXISTS selfie_chain_meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_participant TEXT NOT NULL,
        to_participant TEXT NOT NULL,
        photo_path TEXT NOT NULL,
        points_earned INTEGER DEFAULT 50,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (from_participant) REFERENCES participants(participant_code),
        FOREIGN KEY (to_participant) REFERENCES participants(participant_code)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating selfie_chain_meetings table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created selfie_chain_meetings table');
    });

    // Tabell for deltakers total statistikk
    db.run(`CREATE TABLE IF NOT EXISTS selfie_chain_stats (
        participant_code TEXT PRIMARY KEY,
        meetings_completed INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        chain_length INTEGER DEFAULT 0,
        started_at TEXT,
        last_meeting_at TEXT,
        FOREIGN KEY (participant_code) REFERENCES participants(participant_code)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating selfie_chain_stats table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created selfie_chain_stats table');
    });

    // Insert default config if not exists
    db.run(`INSERT INTO selfie_chain_config (active, time_limit_minutes, points_per_selfie, variant)
            SELECT 0, 120, 50, 'linear'
            WHERE NOT EXISTS (SELECT 1 FROM selfie_chain_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default config:', err.message);
        } else {
            console.log('✅ Inserted default configuration');
        }

        // Verify migration
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'selfie_chain%'", [], (err, tables) => {
            if (err) {
                console.error('❌ Error verifying migration:', err.message);
            } else {
                console.log('✅ Migration successful! Tables created:');
                tables.forEach(table => console.log(`   - ${table.name}`));
            }

            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database connection closed');
                    console.log('\n🚀 Migration complete!');
                }
            });
        });
    });
});
