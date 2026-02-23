const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Import admin middleware
const { requireAdminToken } = require('./auth');

// Configure multer for selfie uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    }
});

// GET /api/selfie-chain/config - Get current configuration
router.get('/config', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const config = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!config) {
            return res.json({
                active: false,
                message: 'Selfie-chain not configured'
            });
        }

        res.json(config);
    } catch (err) {
        console.error('Error fetching selfie-chain config:', err);
        res.status(500).json({ error: 'Could not fetch configuration' });
    }
});

// GET /api/selfie-chain/status/:participantCode - Get participant's status
router.get('/status/:participantCode', async (req, res) => {
    const db = req.app.locals.db;
    const { participantCode } = req.params;

    try {
        // Check if participant exists and is not no-show
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1 AND (no_show IS NULL OR no_show = 0)',
                [participantCode],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet eller markert som no-show' });
        }

        // Get configuration
        const config = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!config || !config.active) {
            return res.json({
                active: false,
                message: 'Selfie-chain is not active'
            });
        }

        // Get participant's stats
        let stats = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM selfie_chain_stats WHERE participant_code = ?',
                [participantCode],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // If no stats, create initial entry
        if (!stats) {
            stats = {
                participant_code: participantCode,
                meetings_completed: 0,
                total_points: 0,
                chain_length: 0,
                started_at: null,
                last_meeting_at: null
            };
        }

        // Get current assignment
        const currentAssignment = await new Promise((resolve, reject) => {
            db.get(
                `SELECT a.*, p.first_name, p.last_name, p.age, p.club, p.profile_photo_path, p.home_location
                 FROM selfie_chain_assignments a
                 JOIN participants p ON a.target_code = p.participant_code
                 WHERE a.participant_code = ? AND a.completed = 0
                 ORDER BY a.created_at DESC
                 LIMIT 1`,
                [participantCode],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Calculate time remaining
        let timeRemaining = null;
        if (config.start_time && config.time_limit_minutes) {
            const startTime = new Date(config.start_time).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - startTime) / 60000;
            timeRemaining = Math.max(0, config.time_limit_minutes - elapsedMinutes);
        }

        res.json({
            active: true,
            participant: {
                participant_code: participant.participant_code,
                first_name: participant.first_name,
                last_name: participant.last_name,
                profile_photo_path: participant.profile_photo_path
            },
            config: {
                time_limit_minutes: config.time_limit_minutes,
                points_per_selfie: config.points_per_selfie,
                variant: config.variant
            },
            stats: stats,
            current_target: currentAssignment ? {
                participant_code: currentAssignment.target_code,
                first_name: currentAssignment.first_name,
                last_name: currentAssignment.last_name,
                age: currentAssignment.age,
                club: currentAssignment.club,
                home_location: currentAssignment.home_location,
                profile_photo_path: currentAssignment.profile_photo_path,
                hint: `${currentAssignment.age} år fra ${currentAssignment.club || currentAssignment.home_location || 'ukjent sted'}`
            } : null,
            time_remaining_minutes: timeRemaining,
            has_started: stats.started_at !== null
        });

    } catch (err) {
        console.error('Error fetching selfie-chain status:', err);
        res.status(500).json({ error: 'Could not fetch status' });
    }
});

// POST /api/selfie-chain/start - Start participating in selfie-chain
router.post('/start', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.body;

    if (!participant_code) {
        return res.status(400).json({ error: 'participant_code is required' });
    }

    try {
        // Check if participant exists and is not no-show
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1 AND (no_show IS NULL OR no_show = 0)',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet eller markert som no-show' });
        }

        // Check if selfie-chain is active
        const config = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!config || !config.active) {
            return res.status(400).json({ error: 'Selfie-chain is not active' });
        }

        // Check if already has stats
        let stats = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM selfie_chain_stats WHERE participant_code = ?',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Create stats if doesn't exist
        if (!stats) {
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO selfie_chain_stats (participant_code, started_at)
                     VALUES (?, datetime('now'))`,
                    [participant_code],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        } else if (!stats.started_at) {
            // Update started_at if not set
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE selfie_chain_stats SET started_at = datetime('now')
                     WHERE participant_code = ?`,
                    [participant_code],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Check if already has an assignment
        let assignment = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM selfie_chain_assignments WHERE participant_code = ? AND completed = 0',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // If no assignment, create one
        if (!assignment) {
            // Find a random target that:
            // 1. Is not the participant themselves
            // 2. Has not been targeted by this participant before
            // 3. Is active
            // 4. Preferably hasn't been targeted by many others yet
            const target = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT p.participant_code, p.first_name, p.last_name, p.age, p.club, p.home_location, p.profile_photo_path,
                            COUNT(a.id) as times_targeted
                     FROM participants p
                     LEFT JOIN selfie_chain_assignments a ON p.participant_code = a.target_code
                     WHERE p.active = 1
                       AND (p.no_show IS NULL OR p.no_show = 0)
                       AND p.participant_code != ?
                       AND p.participant_code NOT IN (
                           SELECT target_code FROM selfie_chain_assignments WHERE participant_code = ?
                       )
                     GROUP BY p.participant_code
                     ORDER BY times_targeted ASC, RANDOM()
                     LIMIT 1`,
                    [participant_code, participant_code],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (!target) {
                return res.status(400).json({ error: 'No available targets found' });
            }

            // Create assignment
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO selfie_chain_assignments (participant_code, target_code, chain_position)
                     VALUES (?, ?, 1)`,
                    [participant_code, target.participant_code],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            // Return the target
            return res.json({
                started: true,
                target: {
                    participant_code: target.participant_code,
                    first_name: target.first_name,
                    last_name: target.last_name,
                    age: target.age,
                    club: target.club,
                    home_location: target.home_location,
                    profile_photo_path: target.profile_photo_path,
                    hint: `${target.age} år fra ${target.club || target.home_location || 'ukjent sted'}`
                }
            });
        }

        // Already has assignment, return it
        const targetInfo = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1 AND (no_show IS NULL OR no_show = 0)',
                [assignment.target_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json({
            started: true,
            already_started: true,
            target: {
                participant_code: targetInfo.participant_code,
                first_name: targetInfo.first_name,
                last_name: targetInfo.last_name,
                age: targetInfo.age,
                club: targetInfo.club,
                home_location: targetInfo.home_location,
                profile_photo_path: targetInfo.profile_photo_path,
                hint: `${targetInfo.age} år fra ${targetInfo.club || targetInfo.home_location || 'ukjent sted'}`
            }
        });

    } catch (err) {
        console.error('Error starting selfie-chain:', err);
        res.status(500).json({ error: 'Could not start selfie-chain' });
    }
});

// POST /api/selfie-chain/complete - Complete a selfie meeting
router.post('/complete', upload.single('photo'), async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code, target_code } = req.body;

    if (!participant_code || !target_code) {
        return res.status(400).json({ error: 'participant_code and target_code are required' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'Photo is required' });
    }

    try {
        // Verify both participants exist and are not no-show
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1 AND (no_show IS NULL OR no_show = 0)',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        const target = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1 AND (no_show IS NULL OR no_show = 0)',
                [target_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant || !target) {
            return res.status(404).json({ error: 'En eller begge deltakere ikke funnet eller markert som no-show' });
        }

        // Verify this is the current assignment
        const assignment = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM selfie_chain_assignments
                 WHERE participant_code = ? AND target_code = ? AND completed = 0`,
                [participant_code, target_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!assignment) {
            return res.status(400).json({ error: 'This is not your current assignment' });
        }

        // Get config for points
        const config = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const pointsPerSelfie = config ? config.points_per_selfie : 50;

        // Check if time has expired
        if (config && config.time_limit_minutes && config.start_time) {
            const startTime = new Date(config.start_time).getTime();
            const now = Date.now();
            const elapsedMinutes = (now - startTime) / 60000;
            const timeRemaining = config.time_limit_minutes - elapsedMinutes;

            if (timeRemaining <= 0) {
                return res.status(403).json({
                    error: 'Tiden er ute! Du kan ikke lenger fullføre selfies.',
                    time_expired: true
                });
            }
        }

        // Save photo
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'selfie-chain');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `${participant_code}_${target_code}_${Date.now()}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(req.file.buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(filepath);

        const photoPath = `/uploads/selfie-chain/${filename}`;

        // Mark assignment as completed
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE selfie_chain_assignments
                 SET completed = 1, completed_at = datetime('now'), photo_path = ?, points_earned = ?
                 WHERE id = ?`,
                [photoPath, pointsPerSelfie, assignment.id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Record meeting
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO selfie_chain_meetings (from_participant, to_participant, photo_path, points_earned)
                 VALUES (?, ?, ?, ?)`,
                [participant_code, target_code, photoPath, pointsPerSelfie],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Update stats
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE selfie_chain_stats
                 SET meetings_completed = meetings_completed + 1,
                     total_points = total_points + ?,
                     chain_length = chain_length + 1,
                     last_meeting_at = datetime('now')
                 WHERE participant_code = ?`,
                [pointsPerSelfie, participant_code],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get updated stats
        const updatedStats = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM selfie_chain_stats WHERE participant_code = ?',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Create next assignment
        const nextTarget = await new Promise((resolve, reject) => {
            db.get(
                `SELECT p.participant_code, p.first_name, p.last_name, p.age, p.club, p.home_location, p.profile_photo_path,
                        COUNT(a.id) as times_targeted
                 FROM participants p
                 LEFT JOIN selfie_chain_assignments a ON p.participant_code = a.target_code
                 WHERE p.active = 1
                   AND (p.no_show IS NULL OR p.no_show = 0)
                   AND p.participant_code != ?
                   AND p.participant_code NOT IN (
                       SELECT target_code FROM selfie_chain_assignments WHERE participant_code = ?
                   )
                 GROUP BY p.participant_code
                 ORDER BY times_targeted ASC, RANDOM()
                 LIMIT 1`,
                [participant_code, participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (nextTarget) {
            const nextPosition = assignment.chain_position + 1;
            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO selfie_chain_assignments (participant_code, target_code, chain_position)
                     VALUES (?, ?, ?)`,
                    [participant_code, nextTarget.participant_code, nextPosition],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.json({
            success: true,
            points_earned: pointsPerSelfie,
            total_points: updatedStats.total_points,
            meetings_completed: updatedStats.meetings_completed,
            photo_path: photoPath,
            next_target: nextTarget ? {
                participant_code: nextTarget.participant_code,
                first_name: nextTarget.first_name,
                last_name: nextTarget.last_name,
                age: nextTarget.age,
                club: nextTarget.club,
                home_location: nextTarget.home_location,
                profile_photo_path: nextTarget.profile_photo_path,
                hint: `${nextTarget.age} år fra ${nextTarget.club || nextTarget.home_location || 'ukjent sted'}`
            } : null,
            chain_complete: !nextTarget
        });

    } catch (err) {
        console.error('Error completing selfie meeting:', err);
        res.status(500).json({ error: 'Could not complete meeting' });
    }
});

// GET /api/selfie-chain/my-chain/:participantCode - Get participant's complete chain
router.get('/my-chain/:participantCode', async (req, res) => {
    const db = req.app.locals.db;
    const { participantCode } = req.params;

    try {
        const chain = await new Promise((resolve, reject) => {
            db.all(
                `SELECT a.*, p.first_name, p.last_name, p.profile_photo_path
                 FROM selfie_chain_assignments a
                 JOIN participants p ON a.target_code = p.participant_code
                 WHERE a.participant_code = ? AND a.completed = 1
                 ORDER BY a.chain_position ASC`,
                [participantCode],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json({
            participant_code: participantCode,
            chain_length: chain.length,
            chain: chain.map((item, index) => ({
                position: index + 1,
                participant_code: item.target_code,
                first_name: item.first_name,
                last_name: item.last_name,
                profile_photo_path: item.profile_photo_path,
                photo_path: item.photo_path,
                completed_at: item.completed_at,
                points_earned: item.points_earned
            }))
        });

    } catch (err) {
        console.error('Error fetching chain:', err);
        res.status(500).json({ error: 'Could not fetch chain' });
    }
});

// GET /api/selfie-chain/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const leaderboard = await new Promise((resolve, reject) => {
            db.all(
                `SELECT s.*, p.first_name, p.last_name, p.team, p.profile_photo_path
                 FROM selfie_chain_stats s
                 JOIN participants p ON s.participant_code = p.participant_code
                 WHERE s.started_at IS NOT NULL
                 ORDER BY s.total_points DESC, s.meetings_completed DESC
                 LIMIT 50`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json({
            leaderboard: leaderboard.map((item, index) => ({
                rank: index + 1,
                participant_code: item.participant_code,
                name: `${item.first_name} ${item.last_name}`,
                team: item.team,
                profile_photo_path: item.profile_photo_path,
                meetings_completed: item.meetings_completed,
                total_points: item.total_points,
                chain_length: item.chain_length
            }))
        });

    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Could not fetch leaderboard' });
    }
});

// ========================================
// ADMIN ENDPOINTS
// ========================================

// POST /api/selfie-chain/admin/update-config - Update configuration
router.post('/admin/update-config', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;
    const { active, time_limit_minutes, points_per_selfie, variant } = req.body;

    try {
        // Get current config
        const currentConfig = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!currentConfig) {
            return res.status(404).json({ error: 'No configuration found' });
        }

        // Update configuration
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE selfie_chain_config
                 SET active = ?,
                     time_limit_minutes = ?,
                     points_per_selfie = ?,
                     variant = ?,
                     start_time = CASE WHEN ? = 1 AND active = 0 THEN datetime('now') ELSE start_time END,
                     end_time = CASE WHEN ? = 0 AND active = 1 THEN datetime('now') ELSE end_time END
                 WHERE id = ?`,
                [
                    active !== undefined ? active : currentConfig.active,
                    time_limit_minutes !== undefined ? time_limit_minutes : currentConfig.time_limit_minutes,
                    points_per_selfie !== undefined ? points_per_selfie : currentConfig.points_per_selfie,
                    variant !== undefined ? variant : currentConfig.variant,
                    active,
                    active,
                    currentConfig.id
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });

        // Get updated config
        const updatedConfig = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config WHERE id = ?', [currentConfig.id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        console.log(`[Admin] Selfie-chain config updated:`, updatedConfig);
        res.json({
            success: true,
            config: updatedConfig
        });

    } catch (err) {
        console.error('Error updating config:', err);
        res.status(500).json({ error: 'Could not update configuration' });
    }
});

// POST /api/selfie-chain/admin/extend-time - Extend time limit
router.post('/admin/extend-time', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
        return res.status(400).json({ error: 'minutes must be a positive number' });
    }

    try {
        // Get current config
        const currentConfig = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!currentConfig) {
            return res.status(404).json({ error: 'No configuration found' });
        }

        // Update time limit
        const newTimeLimit = currentConfig.time_limit_minutes + minutes;

        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE selfie_chain_config SET time_limit_minutes = ? WHERE id = ?',
                [newTimeLimit, currentConfig.id],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });

        console.log(`[Admin] Extended selfie-chain time by ${minutes} minutes. New limit: ${newTimeLimit}`);
        res.json({
            success: true,
            old_limit: currentConfig.time_limit_minutes,
            new_limit: newTimeLimit,
            added_minutes: minutes
        });

    } catch (err) {
        console.error('Error extending time:', err);
        res.status(500).json({ error: 'Could not extend time' });
    }
});

// GET /api/selfie-chain/admin/stats - Get admin statistics
router.get('/admin/stats', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get overall stats
        const overallStats = await new Promise((resolve, reject) => {
            db.get(
                `SELECT
                    COUNT(DISTINCT participant_code) as total_participants,
                    SUM(meetings_completed) as total_meetings,
                    SUM(total_points) as total_points,
                    AVG(meetings_completed) as avg_meetings_per_participant,
                    MAX(meetings_completed) as max_meetings
                 FROM selfie_chain_stats
                 WHERE started_at IS NOT NULL`,
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Get top performers
        const topPerformers = await new Promise((resolve, reject) => {
            db.all(
                `SELECT s.*, p.first_name, p.last_name, p.team
                 FROM selfie_chain_stats s
                 JOIN participants p ON s.participant_code = p.participant_code
                 WHERE s.started_at IS NOT NULL
                 ORDER BY s.total_points DESC
                 LIMIT 10`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Get all meetings for network visualization
        const allMeetings = await new Promise((resolve, reject) => {
            db.all(
                `SELECT a.participant_code as from_participant,
                        a.target_code as to_participant,
                        p1.first_name as from_first_name, p1.last_name as from_last_name,
                        p2.first_name as to_first_name, p2.last_name as to_last_name,
                        a.photo_path,
                        a.points_earned,
                        a.completed_at as created_at
                 FROM selfie_chain_assignments a
                 JOIN participants p1 ON a.participant_code = p1.participant_code
                 JOIN participants p2 ON a.target_code = p2.participant_code
                 WHERE a.completed = 1
                 ORDER BY a.completed_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Get config
        const config = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM selfie_chain_config ORDER BY id DESC LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json({
            overall: overallStats,
            topPerformers: topPerformers.map(p => ({
                participant_code: p.participant_code,
                name: `${p.first_name} ${p.last_name}`,
                team: p.team,
                meetings_completed: p.meetings_completed,
                total_points: p.total_points,
                chain_length: p.chain_length
            })),
            network: allMeetings.map(m => ({
                from: m.from_participant,
                to: m.to_participant,
                from_name: `${m.from_first_name} ${m.from_last_name}`,
                to_name: `${m.to_first_name} ${m.to_last_name}`,
                photo_path: m.photo_path,
                points: m.points_earned,
                timestamp: m.created_at
            })),
            config: config
        });

    } catch (err) {
        console.error('Error fetching admin stats:', err);
        res.status(500).json({ error: 'Could not fetch statistics' });
    }
});

// POST /api/selfie-chain/admin/reset - Reset all selfie-chain data
router.post('/admin/reset', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Delete all data
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM selfie_chain_assignments', [], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM selfie_chain_meetings', [], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM selfie_chain_stats', [], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        // Reset config
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE selfie_chain_config
                 SET active = 0, start_time = NULL, end_time = NULL`,
                [],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });

        // Delete all selfie photos
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'selfie-chain');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            for (const file of files) {
                fs.unlinkSync(path.join(uploadsDir, file));
            }
        }

        console.log('[Admin] Selfie-chain reset completed');
        res.json({
            success: true,
            message: 'Selfie-chain has been reset'
        });

    } catch (err) {
        console.error('Error resetting selfie-chain:', err);
        res.status(500).json({ error: 'Could not reset selfie-chain' });
    }
});

// GET /api/selfie-chain/stats - Get statistics
router.get('/stats', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get total participants who started
        const totalParticipants = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(DISTINCT participant_code) as count FROM selfie_chain_stats WHERE started_at IS NOT NULL',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.count || 0);
                }
            );
        });

        // Get total meetings completed
        const totalMeetings = await new Promise((resolve, reject) => {
            db.get(
                'SELECT SUM(meetings_completed) as total FROM selfie_chain_stats',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.total || 0);
                }
            );
        });

        // Get total points earned
        const totalPoints = await new Promise((resolve, reject) => {
            db.get(
                'SELECT SUM(total_points) as total FROM selfie_chain_stats',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.total || 0);
                }
            );
        });

        // Get average meetings per participant
        const avgMeetings = totalParticipants > 0 ? (totalMeetings / totalParticipants).toFixed(1) : 0;

        // Get top 5 participants
        const topParticipants = await new Promise((resolve, reject) => {
            db.all(
                `SELECT s.*, p.first_name, p.last_name
                 FROM selfie_chain_stats s
                 JOIN participants p ON s.participant_code = p.participant_code
                 WHERE s.started_at IS NOT NULL
                 ORDER BY s.total_points DESC, s.meetings_completed DESC
                 LIMIT 5`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Get completion rate (participants who met everyone vs total who started)
        const completedAll = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(DISTINCT a.participant_code) as count
                 FROM selfie_chain_assignments a
                 WHERE NOT EXISTS (
                     SELECT 1 FROM selfie_chain_assignments a2
                     WHERE a2.participant_code = a.participant_code AND a2.completed = 0
                 )`,
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.count || 0);
                }
            );
        });

        const completionRate = totalParticipants > 0 ? ((completedAll / totalParticipants) * 100).toFixed(1) : 0;

        res.json({
            total_participants: totalParticipants,
            total_meetings: totalMeetings,
            total_points: totalPoints,
            avg_meetings: avgMeetings,
            completion_rate: completionRate,
            top_participants: topParticipants.map(p => ({
                name: `${p.first_name} ${p.last_name}`,
                meetings: p.meetings_completed,
                points: p.total_points
            }))
        });

    } catch (err) {
        console.error('Error fetching selfie-chain stats:', err);
        res.status(500).json({ error: 'Could not fetch statistics' });
    }
});

module.exports = router;
