const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration: Add Tic-Tac-Toe tables...');

db.serialize(() => {
    // Create tic_tac_toe_games table
    db.run(`
        CREATE TABLE IF NOT EXISTS tic_tac_toe_games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player1_code TEXT NOT NULL,
            player1_name TEXT NOT NULL,
            player1_team TEXT,
            player2_code TEXT,
            player2_name TEXT,
            player2_team TEXT,
            board_state TEXT DEFAULT '["","","","","","","","",""]',
            current_turn INTEGER DEFAULT 1,
            starting_player INTEGER,
            status TEXT DEFAULT 'waiting_for_player2',
            winner_code TEXT,
            winner_name TEXT,
            result TEXT,
            created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            started_at TEXT,
            completed_at TEXT,
            FOREIGN KEY (player1_code) REFERENCES participants(participant_code),
            FOREIGN KEY (player2_code) REFERENCES participants(participant_code)
        )
    `, (err) => {
        if (err) {
            console.error('Error creating tic_tac_toe_games table:', err);
        } else {
            console.log('✓ Created tic_tac_toe_games table');
        }
    });

    // Create index for faster lookups
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_status
        ON tic_tac_toe_games(status)
    `, (err) => {
        if (err) {
            console.error('Error creating index:', err);
        } else {
            console.log('✓ Created index on status');
        }
    });

    db.run(`
        CREATE INDEX IF NOT EXISTS idx_tic_tac_toe_players
        ON tic_tac_toe_games(player1_code, player2_code)
    `, (err) => {
        if (err) {
            console.error('Error creating index:', err);
        } else {
            console.log('✓ Created index on players');
        }
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
    } else {
        console.log('Migration completed successfully!');
    }
});
