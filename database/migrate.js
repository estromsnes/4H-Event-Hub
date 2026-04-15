/**
 * Database Migration Runner
 * Automatically runs all pending migrations
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'data.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found. Please run "npm run init-db" first.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
});

// Enable WAL mode
db.run('PRAGMA journal_mode=WAL;');

/**
 * Check if database has been initialized with base tables
 */
function checkDatabaseInitialized() {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='participants'",
            [],
            (err, row) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            }
        );
    });
}

/**
 * Create migrations tracking table if it doesn't exist
 */
function createMigrationsTable() {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                executed_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            )
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Get list of executed migrations
 */
function getExecutedMigrations() {
    return new Promise((resolve, reject) => {
        db.all('SELECT name FROM migrations ORDER BY id', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(row => row.name));
        });
    });
}

/**
 * Mark migration as executed
 */
function markMigrationAsExecuted(name) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO migrations (name) VALUES (?)', [name], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

/**
 * Run a single migration file
 */
async function runMigration(filename) {
    return new Promise((resolve, reject) => {
        const migrationPath = path.join(__dirname, 'migrations', filename);

        // Create a child process to run the migration
        const { spawn } = require('child_process');
        const child = spawn('node', [migrationPath], {
            stdio: 'inherit'
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Migration ${filename} failed with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Main migration runner
 */
async function runMigrations() {
    try {
        console.log('\n🔄 Running database migrations...\n');

        // Check if database is initialized
        const isInitialized = await checkDatabaseInitialized();
        if (!isInitialized) {
            console.error('❌ Database not initialized. Please run "npm run init-db" first.\n');
            db.close();
            process.exit(1);
        }

        // Create migrations tracking table
        await createMigrationsTable();

        // Get list of executed migrations
        const executedMigrations = await getExecutedMigrations();

        // Get all migration files
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.startsWith('migrate-') && file.endsWith('.js'))
            .sort(); // Run in alphabetical order

        if (migrationFiles.length === 0) {
            console.log('✅ No migration files found\n');
            db.close();
            return;
        }

        // Filter out already executed migrations
        const pendingMigrations = migrationFiles.filter(
            file => !executedMigrations.includes(file)
        );

        if (pendingMigrations.length === 0) {
            console.log('✅ All migrations up to date\n');
            db.close();
            return;
        }

        console.log(`📋 Found ${pendingMigrations.length} pending migration(s):\n`);
        pendingMigrations.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file}`);
        });
        console.log('');

        // Run each pending migration
        for (const filename of pendingMigrations) {
            console.log(`▶️  Running: ${filename}`);
            try {
                await runMigration(filename);
                await markMigrationAsExecuted(filename);
                console.log(`✅ Completed: ${filename}\n`);
            } catch (err) {
                console.error(`❌ Failed: ${filename}`);
                console.error(`   Error: ${err.message}\n`);
                db.close();
                process.exit(1);
            }
        }

        console.log('✅ All migrations completed successfully\n');
        db.close();

    } catch (err) {
        console.error('❌ Migration error:', err);
        db.close();
        process.exit(1);
    }
}

// Run migrations
runMigrations();
