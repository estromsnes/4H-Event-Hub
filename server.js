const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const dbPath = path.join(__dirname, 'database', 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        console.error('   Please run "npm run init-db" to initialize the database first.');
        process.exit(1);
    }
    console.log('✅ Database connected');
});

// Enable WAL mode for better concurrent access
db.run('PRAGMA journal_mode=WAL;');

// Make database available to routes
app.locals.db = db;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
const participantsRouter = require('./routes/participants');
const qrRouter = require('./routes/qr');
const eventRouter = require('./routes/event');
const teamsRouter = require('./routes/teams');
const teamChallengeRouter = require('./routes/team-challenge');
const scavengerHuntRouter = require('./routes/scavenger-hunt');

app.use('/api/participants', participantsRouter);
app.use('/api/qr', qrRouter);
app.use('/api/event', eventRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/team-challenge', teamChallengeRouter);
app.use('/api/scavenger', scavengerHuntRouter);

// Root redirect to profile page (main interface)
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🎉 4H Event Hub server started!');
    console.log(`📍 Local:    http://localhost:${PORT}`);
    console.log(`📱 Profile:  http://localhost:${PORT}/profile.html`);
    console.log(`⚙️  Admin:    http://localhost:${PORT}/admin.html`);
    console.log('\n✨ Ready for camp participants!\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        process.exit(0);
    });
});
