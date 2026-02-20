// Migration: Add team_photo_path to participants table
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting migration: Add team_photo_path to participants...');

db.serialize(() => {
    // Add team_photo_path column to participants table
    db.run(`ALTER TABLE participants ADD COLUMN team_photo_path TEXT`, (err) => {
        if (err) {
            // Column might already exist
            if (err.message.includes('duplicate column name')) {
                console.log('✅ team_photo_path column already exists');
            } else {
                console.error('❌ Error adding team_photo_path column:', err.message);
                db.close();
                process.exit(1);
            }
        } else {
            console.log('✅ team_photo_path column added successfully');
        }

        // Migrate existing team photos from sessions to participants
        db.all(`
            SELECT DISTINCT team_name, team_photo_path
            FROM team_challenge_sessions
            WHERE team_photo_path IS NOT NULL
            AND status = 'completed'
            ORDER BY completion_time DESC
        `, [], (err, rows) => {
            if (err) {
                console.error('❌ Error fetching existing team photos:', err.message);
                db.close();
                process.exit(1);
            }

            if (rows.length === 0) {
                console.log('✅ No existing team photos to migrate');
                db.close();
                console.log('\n✅ Migration completed successfully!');
                process.exit(0);
                return;
            }

            // Group by team_name and get the most recent photo for each team
            const teamPhotos = {};
            rows.forEach(row => {
                if (!teamPhotos[row.team_name]) {
                    teamPhotos[row.team_name] = row.team_photo_path;
                }
            });

            let completed = 0;
            const totalTeams = Object.keys(teamPhotos).length;

            Object.entries(teamPhotos).forEach(([teamName, photoPath]) => {
                db.run(`
                    UPDATE participants
                    SET team_photo_path = ?
                    WHERE team = ? AND active = 1
                `, [photoPath, teamName], (err) => {
                    if (err) {
                        console.error(`❌ Error migrating photo for team "${teamName}":`, err.message);
                    } else {
                        console.log(`✅ Migrated photo for team "${teamName}"`);
                    }

                    completed++;
                    if (completed === totalTeams) {
                        db.close();
                        console.log('\n✅ Migration completed successfully!');
                        console.log(`   Migrated photos for ${totalTeams} teams`);
                        process.exit(0);
                    }
                });
            });
        });
    });
});
