const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');

console.log('🔧 Migrating database: Adding no_show field to participants...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

db.serialize(() => {
    // Add no_show column to participants table
    db.run(`ALTER TABLE participants ADD COLUMN no_show INTEGER DEFAULT 0`, (err) => {
        if (err) {
            // Column might already exist, check if error is about duplicate column
            if (err.message.includes('duplicate column name')) {
                console.log('ℹ️  Column "no_show" already exists');
            } else {
                console.error('❌ Error adding no_show column:', err.message);
                db.close();
                process.exit(1);
            }
        } else {
            console.log('✅ Added "no_show" column to participants table');
        }

        // Add no_show_marked_at column to track when participant was marked as no-show
        db.run(`ALTER TABLE participants ADD COLUMN no_show_marked_at TEXT`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('ℹ️  Column "no_show_marked_at" already exists');
                } else {
                    console.error('❌ Error adding no_show_marked_at column:', err.message);
                    db.close();
                    process.exit(1);
                }
            } else {
                console.log('✅ Added "no_show_marked_at" column to participants table');
            }

            // Verify migration
            db.all("PRAGMA table_info(participants)", [], (err, columns) => {
                if (err) {
                    console.error('❌ Error verifying migration:', err.message);
                } else {
                    const hasNoShow = columns.some(col => col.name === 'no_show');
                    const hasNoShowMarkedAt = columns.some(col => col.name === 'no_show_marked_at');

                    if (hasNoShow && hasNoShowMarkedAt) {
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
