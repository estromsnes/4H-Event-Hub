const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding WiFi fields to event_info table...\n');

db.serialize(() => {
    // Check if columns already exist
    db.all(`PRAGMA table_info(event_info)`, (err, columns) => {
        if (err) {
            console.error('❌ Error checking table structure:', err.message);
            db.close();
            process.exit(1);
        }

        const columnNames = columns.map(col => col.name);
        const hasWifiSSID = columnNames.includes('wifi_ssid');
        const hasWifiPassword = columnNames.includes('wifi_password');

        if (hasWifiSSID && hasWifiPassword) {
            console.log('ℹ️  WiFi columns already exist. Nothing to do.');
            db.close();
            return;
        }

        // Add wifi_ssid column if it doesn't exist
        if (!hasWifiSSID) {
            db.run(`ALTER TABLE event_info ADD COLUMN wifi_ssid TEXT`, (err) => {
                if (err) {
                    console.error('❌ Error adding wifi_ssid column:', err.message);
                } else {
                    console.log('✅ Added wifi_ssid column to event_info');
                }
            });
        }

        // Add wifi_password column if it doesn't exist
        if (!hasWifiPassword) {
            db.run(`ALTER TABLE event_info ADD COLUMN wifi_password TEXT`, (err) => {
                if (err) {
                    console.error('❌ Error adding wifi_password column:', err.message);
                } else {
                    console.log('✅ Added wifi_password column to event_info');
                }

                // Close database after last operation
                setTimeout(() => {
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('\n✅ Migration complete!');
                        }
                    });
                }, 100);
            });
        } else {
            // If only wifi_ssid was added, close after a delay
            setTimeout(() => {
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    } else {
                        console.log('\n✅ Migration complete!');
                    }
                });
            }, 100);
        }
    });
});
