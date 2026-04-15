const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding confirmed field to participants...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

db.serialize(() => {
    // Add confirmed column to participants table
    db.run(`ALTER TABLE participants ADD COLUMN confirmed INTEGER DEFAULT 0`, (err) => {
        if (err) {
            // Column might already exist, check if error is about duplicate column
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️  Column "confirmed" already exists');
            } else {
                console.error('❌ Error adding confirmed column:', err.message);
                db.close();
                process.exit(1);
            }
        } else {
            console.log('✅ Added "confirmed" column to participants table');
        }

        // Add confirmed_at column to track when participant was confirmed
        db.run(`ALTER TABLE participants ADD COLUMN confirmed_at TEXT`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('ℹ️  Column "confirmed_at" already exists');
                } else {
                    console.error('❌ Error adding confirmed_at column:', err.message);
                    db.close();
                    process.exit(1);
                }
            } else {
                console.log('✅ Added "confirmed_at" column to participants table');
            }

            // Verify migration
            db.all("PRAGMA table_info(participants)", [], (err, columns) => {
                if (err) {
                    console.error('❌ Error verifying migration:', err.message);
                } else {
                    const hasConfirmed = columns.some(col => col.name === 'confirmed');
                    const hasConfirmedAt = columns.some(col => col.name === 'confirmed_at');

                    if (hasConfirmed && hasConfirmedAt) {
                        console.log('✅ Migration successful! Columns verified.');
                    } else {
                        console.log('⚠️  Warning: Migration may not have completed correctly');
                    }
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
});
