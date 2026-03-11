const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { generateCheckpointQR } = require('../utils/qr-generator');

// GET /api/scavenger/checkpoint-qr/:id - Get QR code image for a checkpoint
router.get('/checkpoint-qr/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        // Get checkpoint
        const checkpoint = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_checkpoints WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!checkpoint) {
            return res.status(404).json({ error: 'Checkpoint not found' });
        }

        // Check if QR code already exists
        const qrFilename = `checkpoint-${id}.png`;
        const qrPath = path.join(__dirname, '..', 'uploads', 'qr-codes', qrFilename);

        // If QR code doesn't exist, generate it
        if (!fs.existsSync(qrPath)) {
            console.log(`Generating new QR code for checkpoint ${id}`);
            await generateCheckpointQR(checkpoint.qr_code, checkpoint.id);
        }

        // Return the QR code image
        res.sendFile(qrPath);
    } catch (err) {
        console.error('Error serving checkpoint QR code:', err);
        res.status(500).json({ error: 'Failed to serve QR code' });
    }
});

// GET /api/scavenger/checkpoints - Get all checkpoints (admin)
router.get('/checkpoints', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const checkpoints = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM scavenger_checkpoints ORDER BY order_number ASC',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json(checkpoints);
    } catch (err) {
        console.error('Error fetching checkpoints:', err);
        res.status(500).json({ error: 'Kunne ikke hente checkpoints' });
    }
});

// POST /api/scavenger/checkpoints - Create new checkpoint
router.post('/checkpoints', async (req, res) => {
    const db = req.app.locals.db;
    const { name, clue, order_number } = req.body;

    if (!name || !clue) {
        return res.status(400).json({ error: 'Navn og ledetråd er påkrevd' });
    }

    try {
        // Generate unique QR code
        const qrCode = `CHECKPOINT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const checkpointId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO scavenger_checkpoints (name, clue, qr_code, order_number)
                 VALUES (?, ?, ?, ?)`,
                [name, clue, qrCode, order_number || 999],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        const checkpoint = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_checkpoints WHERE id = ?',
                [checkpointId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.status(201).json(checkpoint);
    } catch (err) {
        console.error('Error creating checkpoint:', err);
        res.status(500).json({ error: 'Kunne ikke opprette checkpoint' });
    }
});

// PUT /api/scavenger/checkpoints/:id - Update checkpoint
router.put('/checkpoints/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, clue, order_number, active } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE scavenger_checkpoints
                 SET name = ?, clue = ?, order_number = ?, active = ?
                 WHERE id = ?`,
                [name, clue, order_number, active ? 1 : 0, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        const checkpoint = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_checkpoints WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json(checkpoint);
    } catch (err) {
        console.error('Error updating checkpoint:', err);
        res.status(500).json({ error: 'Kunne ikke oppdatere checkpoint' });
    }
});

// DELETE /api/scavenger/checkpoints/:id - Delete checkpoint
router.delete('/checkpoints/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM scavenger_checkpoints WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ message: 'Checkpoint slettet' });
    } catch (err) {
        console.error('Error deleting checkpoint:', err);
        res.status(500).json({ error: 'Kunne ikke slette checkpoint' });
    }
});

// POST /api/scavenger/start - Start scavenger hunt for a team
router.post('/start', async (req, res) => {
    const db = req.app.locals.db;
    const { team_name } = req.body;

    if (!team_name) {
        return res.status(400).json({ error: 'Lagnavn er påkrevd' });
    }

    try {
        // Check if scavenger hunt is active
        const config = await getScavengerHuntConfig(db);
        if (!config.active) {
            return res.status(400).json({ error: 'QR Skattejakt er ikke aktivert' });
        }

        // Check if team already has a session (active or completed)
        const existingSession = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM scavenger_sessions
                 WHERE team_name = ? AND status IN ('active', 'completed')
                 ORDER BY created_at DESC LIMIT 1`,
                [team_name],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingSession) {
            // Return existing session
            const scans = await getSessionScans(db, existingSession.id);
            const checkpoints = await getActiveCheckpoints(db);

            return res.json({
                session: existingSession,
                scans: scans,
                total_checkpoints: checkpoints.length,
                found_checkpoints: scans.length
            });
        }

        // Create new session
        const sessionId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO scavenger_sessions (team_name, status)
                 VALUES (?, 'active')`,
                [team_name],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        const session = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_sessions WHERE id = ?',
                [sessionId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        const checkpoints = await getActiveCheckpoints(db);

        res.status(201).json({
            session: session,
            scans: [],
            total_checkpoints: checkpoints.length,
            found_checkpoints: 0
        });
    } catch (err) {
        console.error('Error starting scavenger hunt:', err);
        res.status(500).json({ error: 'Kunne ikke starte skattejakt' });
    }
});

// POST /api/scavenger/scan - Scan a checkpoint QR code
router.post('/scan', async (req, res) => {
    const db = req.app.locals.db;
    const { session_id, qr_code } = req.body;

    if (!session_id || !qr_code) {
        return res.status(400).json({ error: 'session_id og qr_code er påkrevd' });
    }

    try {
        // Get session
        const session = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_sessions WHERE id = ?',
                [session_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!session) {
            return res.status(404).json({ error: 'Session ikke funnet' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Session er ikke aktiv' });
        }

        // Find checkpoint by QR code
        const checkpoint = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_checkpoints WHERE qr_code = ? AND active = 1',
                [qr_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!checkpoint) {
            return res.status(404).json({ error: 'Ugyldig checkpoint QR-kode' });
        }

        // Check if already scanned
        const existingScan = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_scans WHERE session_id = ? AND checkpoint_id = ?',
                [session_id, checkpoint.id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingScan) {
            return res.status(400).json({ error: 'Denne checkpointen er allerede skannet!' });
        }

        // Record scan
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO scavenger_scans (session_id, checkpoint_id)
                 VALUES (?, ?)`,
                [session_id, checkpoint.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get updated scans and checkpoints
        const scans = await getSessionScans(db, session_id);
        const checkpoints = await getActiveCheckpoints(db);

        // Check if all checkpoints found
        const allFound = scans.length === checkpoints.length;
        let elapsedSeconds = null;

        if (allFound) {
            // Complete the session
            const startTime = new Date(session.start_time).getTime();
            const now = Date.now();
            elapsedSeconds = (now - startTime) / 1000;

            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE scavenger_sessions
                     SET status = 'completed',
                         end_time = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                         elapsed_seconds = ?
                     WHERE id = ?`,
                    [elapsedSeconds, session_id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.json({
            success: true,
            checkpoint: checkpoint,
            scans: scans,
            total_checkpoints: checkpoints.length,
            found_checkpoints: scans.length,
            completed: allFound,
            elapsed_seconds: elapsedSeconds
        });
    } catch (err) {
        console.error('Error scanning checkpoint:', err);
        res.status(500).json({ error: 'Kunne ikke registrere skanning' });
    }
});

// GET /api/scavenger/session/:team_name - Get current session for team
router.get('/session/:team_name', async (req, res) => {
    const db = req.app.locals.db;
    const { team_name } = req.params;

    try {
        const session = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM scavenger_sessions
                 WHERE team_name = ?
                 ORDER BY created_at DESC LIMIT 1`,
                [team_name],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!session) {
            return res.json({ session: null });
        }

        const scans = await getSessionScans(db, session.id);
        const checkpoints = await getActiveCheckpoints(db);

        res.json({
            session: session,
            scans: scans,
            total_checkpoints: checkpoints.length,
            found_checkpoints: scans.length
        });
    } catch (err) {
        console.error('Error fetching session:', err);
        res.status(500).json({ error: 'Kunne ikke hente session' });
    }
});

// GET /api/scavenger/leaderboard - Get scavenger hunt leaderboard
router.get('/leaderboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const sessions = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM scavenger_sessions
                 WHERE status = 'completed'
                 ORDER BY elapsed_seconds ASC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        const totalCheckpoints = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as count FROM scavenger_checkpoints WHERE active = 1',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                }
            );
        });

        const leaderboard = sessions.map((session, index) => ({
            rank: index + 1,
            team_name: session.team_name,
            elapsed_seconds: session.elapsed_seconds,
            completed_at: session.end_time,
            checkpoints_found: totalCheckpoints
        }));

        res.json({
            leaderboard: leaderboard,
            total_checkpoints: totalCheckpoints
        });
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Kunne ikke hente resultattavle' });
    }
});

// GET /api/scavenger/live-scoreboard - Get live scoreboard (all active and completed hunts)
router.get('/live-scoreboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get all sessions (active and completed)
        const sessions = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM scavenger_sessions
                 WHERE status IN ('active', 'completed')
                 ORDER BY created_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        const totalCheckpoints = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as count FROM scavenger_checkpoints WHERE active = 1',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                }
            );
        });

        // Get checkpoint counts for each session
        const scoreboard = await Promise.all(sessions.map(async (session) => {
            const scans = await getSessionScans(db, session.id);

            // Calculate elapsed time
            let elapsedSeconds;
            if (session.status === 'completed') {
                elapsedSeconds = session.elapsed_seconds;
            } else {
                // Calculate current elapsed time for active sessions
                const startTime = new Date(session.start_time).getTime();
                const now = Date.now();
                elapsedSeconds = (now - startTime) / 1000;
            }

            // Get team photo path
            const teamPhoto = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT team_photo_path FROM participants WHERE team = ? AND active = 1 AND team_photo_path IS NOT NULL LIMIT 1',
                    [session.team_name],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row ? row.team_photo_path : null);
                    }
                );
            });

            return {
                team_name: session.team_name,
                checkpoints_found: scans.length,
                total_checkpoints: totalCheckpoints,
                elapsed_seconds: elapsedSeconds,
                status: session.status,
                start_time: session.start_time,
                completed_at: session.end_time,
                team_photo_path: teamPhoto
            };
        }));

        // Sort by checkpoints found (descending), then by time (ascending)
        scoreboard.sort((a, b) => {
            if (b.checkpoints_found !== a.checkpoints_found) {
                return b.checkpoints_found - a.checkpoints_found;
            }
            return a.elapsed_seconds - b.elapsed_seconds;
        });

        res.json({
            scoreboard: scoreboard,
            total_checkpoints: totalCheckpoints,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Error fetching live scoreboard:', err);
        res.status(500).json({ error: 'Kunne ikke hente live scoreboard' });
    }
});

// DELETE /api/scavenger/scan/:id - Delete a scan (admin)
router.delete('/scan/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        // Get the scan to find session info
        const scan = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_scans WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!scan) {
            return res.status(404).json({ error: 'Skanning ikke funnet' });
        }

        // Get the session
        const session = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM scavenger_sessions WHERE id = ?',
                [scan.session_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Delete the scan
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM scavenger_scans WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // If session was completed, mark it as active again
        if (session && session.status === 'completed') {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE scavenger_sessions
                     SET status = 'active',
                         end_time = NULL,
                         elapsed_seconds = NULL
                     WHERE id = ?`,
                    [session.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.json({ success: true, message: 'Skanning slettet' });
    } catch (err) {
        console.error('Error deleting scan:', err);
        res.status(500).json({ error: 'Kunne ikke slette skanning' });
    }
});

// Helper function: Get all scans for a session with checkpoint details
async function getSessionScans(db, sessionId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT s.*, c.name, c.qr_code, c.order_number
             FROM scavenger_scans s
             JOIN scavenger_checkpoints c ON s.checkpoint_id = c.id
             WHERE s.session_id = ?
             ORDER BY s.scanned_at ASC`,
            [sessionId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

// Helper function: Get all active checkpoints
async function getActiveCheckpoints(db) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM scavenger_checkpoints WHERE active = 1 ORDER BY order_number ASC',
            [],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

// GET /api/scavenger-hunt/participant/:code/stats - Get participant scavenger hunt stats
router.get('/participant/:code/stats', async (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    try {
        // First get participant's team
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT team FROM participants WHERE participant_code = ?',
                [code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant || !participant.team) {
            return res.json({ checkpointsFound: 0 });
        }

        // Get scavenger hunt stats for the team
        const stats = await new Promise((resolve, reject) => {
            db.get(
                `SELECT
                    COUNT(DISTINCT sc.checkpoint_id) as checkpointsFound
                FROM scavenger_scans sc
                JOIN scavenger_sessions ss ON sc.session_id = ss.id
                WHERE ss.team_name = ?`,
                [participant.team],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row || { checkpointsFound: 0 });
                }
            );
        });

        res.json(stats);

    } catch (err) {
        console.error('Error fetching participant scavenger hunt stats:', err);
        res.status(500).json({ error: 'Kunne ikke hente statistikk' });
    }
});

// ============================================================================
// ADMIN CONFIGURATION ENDPOINTS
// ============================================================================

// Helper function to get scavenger hunt configuration
async function getScavengerHuntConfig(db) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM scavenger_hunt_config ORDER BY id DESC LIMIT 1', (err, row) => {
            if (err) reject(err);
            else resolve(row || { active: 1 });
        });
    });
}

// GET /api/scavenger/admin/config - Get scavenger hunt configuration
router.get('/admin/config', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const config = await getScavengerHuntConfig(db);
        res.json(config);
    } catch (err) {
        console.error('Error fetching scavenger hunt config:', err);
        res.status(500).json({ error: 'Kunne ikke hente konfigurasjon' });
    }
});

// POST /api/scavenger/admin/config - Update scavenger hunt configuration
router.post('/admin/config', async (req, res) => {
    const db = req.app.locals.db;
    const { active } = req.body;

    if (typeof active !== 'number' || (active !== 0 && active !== 1)) {
        return res.status(400).json({ error: 'Active må være 0 eller 1' });
    }

    try {
        // Check if config exists
        const existingConfig = await getScavengerHuntConfig(db);

        if (existingConfig && existingConfig.id) {
            // Update existing config
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE scavenger_hunt_config SET active = ? WHERE id = ?',
                    [active, existingConfig.id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        } else {
            // Insert new config
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO scavenger_hunt_config (active) VALUES (?)',
                    [active],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        const updatedConfig = await getScavengerHuntConfig(db);
        res.json(updatedConfig);
    } catch (err) {
        console.error('Error updating scavenger hunt config:', err);
        res.status(500).json({ error: 'Kunne ikke oppdatere konfigurasjon' });
    }
});

module.exports = router;
