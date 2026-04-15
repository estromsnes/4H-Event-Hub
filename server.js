require('dotenv').config();
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Generate unique admin access key for this session
const ADMIN_ACCESS_KEY = crypto.randomBytes(16).toString('hex');
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

// Database connection
const dbPath = path.join(__dirname, 'data', 'data.db');
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

// Active sessions tracking for concurrent users metric
const activeSessions = new Map();
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Clean up inactive sessions every minute
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, lastActivity] of activeSessions.entries()) {
        if (now - lastActivity > SESSION_TIMEOUT) {
            activeSessions.delete(sessionId);
        }
    }
}, 60 * 1000);

// Make active sessions available to routes
app.locals.activeSessions = activeSessions;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving (before session tracking to avoid tracking static files)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Track user activity middleware - ONLY for API routes and HTML pages
app.use((req, res, next) => {
    // Skip session tracking for static files
    const isStaticFile = /\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|map)$/i.test(req.path);

    if (isStaticFile) {
        return next();
    }

    // Generate or get session ID from header/cookie
    let sessionId = req.headers['x-session-id'];

    if (!sessionId) {
        // Generate new session ID
        sessionId = crypto.randomBytes(16).toString('hex');
    }

    // Update last activity time
    activeSessions.set(sessionId, Date.now());

    // Send session ID back to client
    res.setHeader('X-Session-ID', sessionId);

    next();
});

// Routes
const authRouter = require('./routes/auth');
const participantsRouter = require('./routes/participants');
const qrRouter = require('./routes/qr');
const eventRouter = require('./routes/event');
const teamsRouter = require('./routes/teams');
const coursesRouter = require('./routes/courses');
const sleepingRoomsRouter = require('./routes/sleeping-rooms');
const teamChallengeRouter = require('./routes/team-challenge');
const scavengerHuntRouter = require('./routes/scavenger-hunt');
const ticTacToeRouter = require('./routes/tic-tac-toe');
const quizRouter = require('./routes/quiz');
const programRouter = require('./routes/program');
const photoChallengesRouter = require('./routes/photo-challenges');
const adminRouter = require('./routes/admin');
const statisticsRouter = require('./routes/statistics');
const feedbackRouter = require('./routes/feedback');
const selfieChainRouter = require('./routes/selfie-chain');
const bingoRouter = require('./routes/bingo');
const participantMessagesRouter = require('./routes/participant-messages');
const activitiesRouter = require('./routes/activities');

// Set admin credentials for auth router
authRouter.setAdminCredentials(ADMIN_ACCESS_KEY, ADMIN_PIN);

// Get admin token middleware
const requireAdminToken = authRouter.requireAdminToken;

app.use('/api/auth', authRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/qr', qrRouter);
app.use('/api/event', eventRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/sleeping-rooms', sleepingRoomsRouter);
app.use('/api/team-challenge', teamChallengeRouter);
app.use('/api/scavenger', scavengerHuntRouter);
app.use('/api/tic-tac-toe', ticTacToeRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/program', programRouter);
app.use('/api/photo-challenges', photoChallengesRouter);
app.use('/api/admin', requireAdminToken, adminRouter); // Protected with admin token
app.use('/api/statistics', statisticsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/selfie-chain', selfieChainRouter);
app.use('/api/bingo', bingoRouter);
app.use('/api/participant-messages', participantMessagesRouter);
app.use('/api/activities', activitiesRouter);

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

// Heartbeat endpoint (session is already updated by middleware)
app.get('/api/heartbeat', (req, res) => {
    res.json({ status: 'ok' });
});

// Get local network URL for QR code
app.get('/api/local-url', (req, res) => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();

    // Find local IP address
    let localIP = 'localhost';

    for (const name of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
        if (localIP !== 'localhost') break;
    }

    const url = `http://${localIP}:${PORT}`;

    res.json({
        url: url,
        ip: localIP,
        port: PORT
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

// Start server only if this file is run directly (not imported)
if (require.main === module) {
    const server = app.listen(PORT, () => {
        console.log('🎉 4H Event Hub server started!');
        console.log(`📍 Local:    http://localhost:${PORT}`);
        console.log(`📱 Profile:  http://localhost:${PORT}/profile.html`);
        console.log(`⚙️  Admin:    http://localhost:${PORT}/admin.html`);
        console.log('\n🔐 Admin PIN: ' + ADMIN_PIN);
        console.log('   (QR-koden finner du inne i admin-panelet etter innlogging)');
        console.log('\n✨ Ready for camp participants!\n');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down gracefully...');
        server.close(() => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                }
                process.exit(0);
            });
        });
    });
}

// Export for testing
module.exports = {
    app,
    db,
    ADMIN_ACCESS_KEY,
    ADMIN_PIN
};
