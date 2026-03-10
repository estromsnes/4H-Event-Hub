const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding bingo tables...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

db.serialize(() => {
    // Tabell for bingo konfigurasjon
    db.run(`CREATE TABLE IF NOT EXISTS bingo_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        active INTEGER DEFAULT 0,
        start_time TEXT,
        end_time TEXT,
        time_limit_minutes INTEGER DEFAULT 60,
        points_per_task INTEGER DEFAULT 10,
        bonus_row_points INTEGER DEFAULT 50,
        bonus_full_card_points INTEGER DEFAULT 100,
        card_size INTEGER DEFAULT 5,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating bingo_config table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created bingo_config table');
    });

    // Tabell for bingo oppgaver
    db.run(`CREATE TABLE IF NOT EXISTS bingo_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_text TEXT NOT NULL,
        category TEXT,
        active INTEGER DEFAULT 1,
        order_number INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating bingo_tasks table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created bingo_tasks table');
    });

    // Tabell for bingo kort (hver deltaker får sitt kort)
    db.run(`CREATE TABLE IF NOT EXISTS bingo_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        participant_code TEXT NOT NULL,
        card_layout TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (participant_code) REFERENCES participants(participant_code)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating bingo_cards table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created bingo_cards table');
    });

    // Tabell for fullførte oppgaver
    db.run(`CREATE TABLE IF NOT EXISTS bingo_completions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER NOT NULL,
        task_id INTEGER NOT NULL,
        participant_code TEXT NOT NULL,
        matched_participant_code TEXT NOT NULL,
        completed_at TEXT DEFAULT (datetime('now')),
        position_on_card INTEGER NOT NULL,
        FOREIGN KEY (card_id) REFERENCES bingo_cards(id),
        FOREIGN KEY (task_id) REFERENCES bingo_tasks(id),
        FOREIGN KEY (participant_code) REFERENCES participants(participant_code),
        FOREIGN KEY (matched_participant_code) REFERENCES participants(participant_code),
        UNIQUE(card_id, task_id)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating bingo_completions table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created bingo_completions table');
    });

    // Tabell for deltakers statistikk
    db.run(`CREATE TABLE IF NOT EXISTS bingo_stats (
        participant_code TEXT PRIMARY KEY,
        tasks_completed INTEGER DEFAULT 0,
        rows_completed INTEGER DEFAULT 0,
        columns_completed INTEGER DEFAULT 0,
        diagonals_completed INTEGER DEFAULT 0,
        full_card_completed INTEGER DEFAULT 0,
        total_points INTEGER DEFAULT 0,
        first_row_at TEXT,
        first_full_card_at TEXT,
        last_completion_at TEXT,
        FOREIGN KEY (participant_code) REFERENCES participants(participant_code)
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating bingo_stats table:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('✅ Created bingo_stats table');
    });

    // Opprett indexes for ytelse
    db.run(`CREATE INDEX IF NOT EXISTS idx_bingo_completions_card
            ON bingo_completions(card_id)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_bingo_completions_card:', err.message);
        } else {
            console.log('✅ Created index idx_bingo_completions_card');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_bingo_completions_participant
            ON bingo_completions(participant_code)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_bingo_completions_participant:', err.message);
        } else {
            console.log('✅ Created index idx_bingo_completions_participant');
        }
    });

    db.run(`CREATE INDEX IF NOT EXISTS idx_bingo_cards_participant
            ON bingo_cards(participant_code)`, (err) => {
        if (err) {
            console.error('❌ Error creating idx_bingo_cards_participant:', err.message);
        } else {
            console.log('✅ Created index idx_bingo_cards_participant');
        }
    });

    // Sett inn default konfigurasjon
    db.run(`INSERT INTO bingo_config (active, time_limit_minutes, points_per_task, bonus_row_points, bonus_full_card_points, card_size)
            SELECT 0, 60, 10, 50, 100, 5
            WHERE NOT EXISTS (SELECT 1 FROM bingo_config)`, (err) => {
        if (err) {
            console.error('❌ Error inserting default config:', err.message);
        } else {
            console.log('✅ Inserted default bingo configuration');
        }
    });

    // Sett inn eksempel-oppgaver
    const sampleTasks = [
        { text: 'Finn noen som har vært på nordisk leir', category: '4H-erfaring' },
        { text: 'Finn noen som kan spille gitar', category: 'Hobbyer' },
        { text: 'Finn noen som har vært på skautrollet 4H før', category: '4H-erfaring' },
        { text: 'Finn noen som liker å bake', category: 'Interesser' },
        { text: 'Finn noen som har hund', category: 'Personlig' },
        { text: 'Finn noen som kommer fra en annen kommune', category: 'Personlig' },
        { text: 'Finn noen som liker å synge', category: 'Hobbyer' },
        { text: 'Finn noen som har vært klubbleder', category: '4H-erfaring' },
        { text: 'Finn noen som kan si alfabetet baklengs', category: 'Annet' },
        { text: 'Finn noen som har samme favorittfarge som deg', category: 'Personlig' },
        { text: 'Finn noen som liker å lese', category: 'Interesser' },
        { text: 'Finn noen som er god på fotball', category: 'Hobbyer' },
        { text: 'Finn noen som har vært på leir mer enn 3 ganger', category: '4H-erfaring' },
        { text: 'Finn noen som liker å tegne', category: 'Hobbyer' },
        { text: 'Finn noen som har søsken', category: 'Personlig' },
        { text: 'Finn noen som spiller et instrument', category: 'Hobbyer' },
        { text: 'Finn noen som har vært i utlandet', category: 'Personlig' },
        { text: 'Finn noen som liker å være ute i naturen', category: 'Interesser' },
        { text: 'Finn noen som kan gjøre et trylletriks', category: 'Annet' },
        { text: 'Finn noen som liker å lage mat', category: 'Interesser' },
        { text: 'Finn noen som har vært på fjelltur', category: 'Interesser' },
        { text: 'Finn noen som kan snakke mer enn to språk', category: 'Annet' },
        { text: 'Finn noen som liker å danse', category: 'Hobbyer' },
        { text: 'Finn noen som har kjæledyr', category: 'Personlig' },
        { text: 'Finn noen som er god på matte', category: 'Annet' },
        { text: 'Finn noen som har samme fødselsdag som deg', category: 'Personlig' },
        { text: 'Finn noen som liker å se på film', category: 'Interesser' },
        { text: 'Finn noen som kan hoppe paradis', category: 'Annet' },
        { text: 'Finn noen som liker å sy eller strikke', category: 'Hobbyer' },
        { text: 'Finn noen som har tatt 4H-sertifikat', category: '4H-erfaring' }
    ];

    const insertTask = db.prepare(`INSERT INTO bingo_tasks (task_text, category, order_number) VALUES (?, ?, ?)`);

    sampleTasks.forEach((task, index) => {
        insertTask.run(task.text, task.category, index + 1, (err) => {
            if (err) {
                console.error(`❌ Error inserting task "${task.text}":`, err.message);
            }
        });
    });

    insertTask.finalize((err) => {
        if (err) {
            console.error('❌ Error finalizing task insertion:', err.message);
        } else {
            console.log(`✅ Inserted ${sampleTasks.length} sample bingo tasks`);
        }

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
                process.exit(1);
            }
            console.log('✅ Database migration completed successfully!');
            console.log('🎉 Bingo tables and sample data ready to use');
        });
    });
});
