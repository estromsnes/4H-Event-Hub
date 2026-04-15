const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Removing duplicate Bingo tasks...\n');

// Delete duplicate tasks (ID 31-60)
db.run('DELETE FROM bingo_tasks WHERE id > 30', function(err) {
    if (err) {
        console.error('❌ Error removing duplicates:', err.message);
        db.close();
        process.exit(1);
    }

    console.log(`✅ Removed ${this.changes} duplicate tasks`);

    // Verify remaining tasks
    db.all('SELECT COUNT(*) as count FROM bingo_tasks', (err, rows) => {
        if (err) {
            console.error('❌ Error counting tasks:', err.message);
        } else {
            console.log(`✅ Remaining tasks: ${rows[0].count}`);
        }

        // Show sample of remaining tasks
        db.all('SELECT id, task_text FROM bingo_tasks ORDER BY id LIMIT 5', (err, tasks) => {
            if (err) {
                console.error('❌ Error fetching tasks:', err.message);
            } else {
                console.log('\n📋 Sample of remaining tasks:');
                tasks.forEach(task => {
                    console.log(`   ${task.id}. ${task.task_text}`);
                });
            }

            db.close(() => {
                console.log('\n✅ Done!\n');
            });
        });
    });
});
