const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const schemaPath = path.join(__dirname, 'schema.sql');

console.log('🔧 Initializing 4H Event Hub Database...');

// Check if database already exists
const dbExists = fs.existsSync(dbPath);

if (dbExists) {
    console.log('ℹ️  Database already exists at:', dbPath);
    console.log('   To reinitialize, delete data.db and run this script again.');
} else {
    console.log('✨ Creating new database at:', dbPath);
}

// Create/open database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Database connection established');
});

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode=WAL;', (err) => {
    if (err) {
        console.error('⚠️  Warning: Could not enable WAL mode:', err.message);
    } else {
        console.log('✅ WAL mode enabled');
    }
});

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Error creating tables:', err.message);
        process.exit(1);
    }
    console.log('✅ Database tables created successfully');

    // Verify tables were created
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('❌ Error verifying tables:', err.message);
        } else {
            console.log('📋 Tables in database:', tables.map(t => t.name).join(', '));
        }

        // Close database
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✅ Database initialization complete!');
                console.log('\n🚀 Next steps:');
                console.log('   1. Run "npm start" to start the server');
                console.log('   2. Open http://localhost:3000/admin.html to add participants');
                console.log('   3. Print QR codes for participants');
                console.log('   4. Open http://localhost:3000/profile.html on your touchscreen\n');
            }
        });
    });
});
