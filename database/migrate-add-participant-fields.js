const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');

console.log('🔧 Migrating database: Adding club, role, and team fields to participants...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Add new columns
const migrations = [
    'ALTER TABLE participants ADD COLUMN club TEXT',
    'ALTER TABLE participants ADD COLUMN role TEXT',
    'ALTER TABLE participants ADD COLUMN team TEXT'
];

let completed = 0;

migrations.forEach((sql, index) => {
    db.run(sql, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log(`ℹ️  Column already exists (${index + 1}/${migrations.length})`);
            } else {
                console.error(`❌ Error running migration ${index + 1}:`, err.message);
            }
        } else {
            console.log(`✅ Migration ${index + 1}/${migrations.length} completed`);
        }

        completed++;

        if (completed === migrations.length) {
            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                } else {
                    console.log('✅ Database migration complete!');
                    console.log('\n🚀 You can now use club, role, and team fields for participants.\n');
                }
            });
        }
    });
});
