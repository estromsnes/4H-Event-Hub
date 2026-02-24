const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configure multer for team photo uploads
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

// POST /api/team-challenge/start - Start a new challenge session
router.post('/start', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.body;

    if (!participant_code) {
        return res.status(400).json({ error: 'participant_code is required' });
    }

    try {
        // Get participant info
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet' });
        }

        if (!participant.team || participant.team === '') {
            return res.status(400).json({ error: 'Du må være tildelt et lag for å delta i lagutfordringen' });
        }

        const teamName = participant.team;

        // Check if team already has an active session
        const activeSession = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM team_challenge_sessions
                 WHERE team_name = ? AND status = 'active'
                 ORDER BY created_at DESC
                 LIMIT 1`,
                [teamName],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // If we found an active session, return it
        if (activeSession) {
            const scans = await getSessionScans(db, activeSession.id);
            const teamMembers = await getTeamMembersWithStatus(db, teamName, scans);
            const activeMembers = teamMembers.filter(m => !m.no_show);

            // Calculate current points
            const currentPoints = calculatePoints(scans.length, activeMembers.length, false);

            console.log(`[Team Challenge] Resuming existing active session ${activeSession.id}`);
            return res.json({
                session_id: activeSession.id,
                team_name: teamName,
                status: 'in_progress',
                scans_required: activeMembers.length,
                scans_completed: scans.length,
                points: currentPoints,
                team_members: teamMembers
            });
        }

        // Create new session (no time limit)
        const sessionId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO team_challenge_sessions (
                    team_name, started_by, session_start_time
                ) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
                [teamName, participant_code],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Record first scan
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO team_challenge_scans (session_id, participant_code, scan_order)
                 VALUES (?, ?, 1)`,
                [sessionId, participant_code],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get team members with scan status
        const scans = await getSessionScans(db, sessionId);
        const teamMembers = await getTeamMembersWithStatus(db, teamName, scans);
        const activeMembers = teamMembers.filter(m => !m.no_show);

        // Calculate current points
        const currentPoints = calculatePoints(scans.length, activeMembers.length, false);

        res.status(201).json({
            session_id: sessionId,
            team_name: teamName,
            status: 'in_progress',
            scans_required: activeMembers.length,
            scans_completed: 1,
            points: currentPoints,
            team_members: teamMembers
        });

    } catch (err) {
        console.error('Error starting challenge:', err);
        res.status(500).json({ error: 'Kunne ikke starte utfordringen' });
    }
});

// POST /api/team-challenge/scan - Record a scan in active session
router.post('/scan', async (req, res) => {
    const db = req.app.locals.db;
    const { session_id, participant_code } = req.body;

    if (!session_id || !participant_code) {
        return res.status(400).json({ error: 'session_id og participant_code er påkrevd' });
    }

    try {
        // Get session
        const session = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM team_challenge_sessions WHERE id = ?',
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
            console.log(`[Team Challenge] ERROR: Session ${session_id} is not active. Status: ${session.status}`);
            return res.status(400).json({
                error: `Session er ikke aktiv (status: ${session.status})`,
                session_status: session.status
            });
        }

        // Get participant
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet' });
        }

        // Validate participant belongs to session's team
        if (participant.team !== session.team_name) {
            return res.status(400).json({
                error: `Du er på laget "${participant.team}", ikke "${session.team_name}"`
            });
        }

        // Check if already scanned (UNIQUE constraint will catch this too)
        const existingScan = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM team_challenge_scans WHERE session_id = ? AND participant_code = ?',
                [session_id, participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingScan) {
            return res.status(400).json({ error: 'Du har allerede skannet!' });
        }

        // Get current scans
        const scans = await getSessionScans(db, session_id);
        const scanOrder = scans.length + 1;

        // Record scan
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO team_challenge_scans (session_id, participant_code, scan_order)
                 VALUES (?, ?, ?)`,
                [session_id, participant_code, scanOrder],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get updated scans and team members
        const updatedScans = await getSessionScans(db, session_id);
        const teamMembers = await getTeamMembersWithStatus(db, session.team_name, updatedScans);

        // Check if all non-no-show team members have scanned
        const activeMembers = teamMembers.filter(m => !m.no_show);
        const allScanned = activeMembers.length > 0 && activeMembers.every(member => member.scanned);

        if (allScanned) {
            // Calculate points (no photo yet, so hasPhoto = false)
            const finalPoints = calculatePoints(updatedScans.length, activeMembers.length, false);

            // Mark session as completed and store points
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE team_challenge_sessions
                     SET status = 'completed',
                         completion_time = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                         points = ?
                     WHERE id = ?`,
                    [finalPoints, session_id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            return res.json({
                success: true,
                session_status: 'completed',
                scans_completed: updatedScans.length,
                scans_required: activeMembers.length,
                points: finalPoints,
                team_members: teamMembers,
                challenge_completed: true
            });
        }

        // Calculate current points (no photo yet)
        const currentPoints = calculatePoints(updatedScans.length, activeMembers.length, false);

        const response = {
            success: true,
            session_status: 'in_progress',
            scans_completed: updatedScans.length,
            scans_required: activeMembers.length,
            points: currentPoints,
            team_members: teamMembers,
            challenge_completed: false
        };

        res.json(response);

    } catch (err) {
        console.error('Error recording scan:', err);
        res.status(500).json({ error: 'Kunne ikke registrere skanning' });
    }
});

// GET /api/team-challenge/session/:session_id - Get session status
router.get('/session/:session_id', async (req, res) => {
    const db = req.app.locals.db;
    const { session_id } = req.params;

    try {
        const session = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM team_challenge_sessions WHERE id = ?',
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

        const scans = await getSessionScans(db, session_id);
        const teamMembers = await getTeamMembersWithStatus(db, session.team_name, scans);
        const activeMembers = teamMembers.filter(m => !m.no_show);

        // Calculate current points
        const hasPhoto = session.team_photo_path !== null;
        const currentPoints = session.points || calculatePoints(scans.length, activeMembers.length, hasPhoto);

        res.json({
            session_id: session.id,
            team_name: session.team_name,
            status: session.status,
            scans_completed: scans.length,
            scans_required: activeMembers.length,
            points: currentPoints,
            completion_time: session.completion_time,
            team_photo_path: session.team_photo_path,
            team_members: teamMembers
        });

    } catch (err) {
        console.error('Error fetching session:', err);
        res.status(500).json({ error: 'Kunne ikke hente session-status' });
    }
});

// POST /api/team-challenge/session/:session_id/photo - Upload team photo
router.post('/session/:session_id/photo', upload.single('photo'), async (req, res) => {
    const db = req.app.locals.db;
    const { session_id } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: 'Ingen bilde-fil ble sendt' });
    }

    try {
        // Get session
        const session = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM team_challenge_sessions WHERE id = ?',
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

        if (session.status !== 'completed') {
            return res.status(400).json({ error: 'Kan bare laste opp bilde for fullførte utfordringer' });
        }

        // Create directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'team-photos');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Process image with sharp
        // Use team name for filename (sanitized) so retakes overwrite old photo
        const sanitizedTeamName = session.team_name.replace(/[^a-zA-Z0-9-]/g, '_');
        const filename = `team-${sanitizedTeamName}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(req.file.buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(filepath);

        // Update ALL participants on this team with the photo path
        const photoPath = `/uploads/team-photos/${filename}`;
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE participants SET team_photo_path = ? WHERE team = ? AND active = 1',
                [photoPath, session.team_name],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Add 30 points bonus for team photo
        const newPoints = (session.points || 0) + 30;

        // Update the session with photo path and bonus points
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE team_challenge_sessions SET team_photo_path = ?, points = ? WHERE id = ?',
                [photoPath, newPoints, session_id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            message: 'Lagbilde lastet opp!',
            photo_path: photoPath,
            points_earned: 30,
            total_points: newPoints
        });

    } catch (err) {
        console.error('Error uploading team photo:', err);
        res.status(500).json({ error: 'Kunne ikke laste opp lagbilde' });
    }
});

// GET /api/team-challenge/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
    const db = req.app.locals.db;
    const sortBy = req.query.sortBy || 'highest'; // 'highest' (points) or 'first' (completion time)

    try {
        // Get event start datetime
        const event = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM event_info WHERE active = 1 ORDER BY created_date DESC LIMIT 1',
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        const eventStartDatetime = event ? event.start_datetime : null;
        const eventStarted = eventStartDatetime ? new Date(eventStartDatetime) <= new Date() : false;

        // Get completed sessions
        const completedSessions = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM team_challenge_sessions
                 WHERE status = 'completed'
                 ORDER BY completion_time ASC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        // Filter and process sessions
        let rankedTeams = [];

        for (const session of completedSessions) {
            // Skip sessions completed before event start
            if (eventStartDatetime) {
                const completionTime = new Date(session.completion_time);
                const eventStart = new Date(eventStartDatetime);

                if (completionTime < eventStart) {
                    continue; // Skip this session
                }
            }

            // Get team member count (only "Deltaker" role)
            const teamMembers = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT COUNT(*) as count FROM participants WHERE team = ? AND active = 1 AND role = 'Deltaker'`,
                    [session.team_name],
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows[0].count);
                    }
                );
            });

            // Calculate minutes after event start
            let minutesAfterStart = null;
            if (eventStartDatetime) {
                const completionTime = new Date(session.completion_time).getTime();
                const eventStart = new Date(eventStartDatetime).getTime();
                minutesAfterStart = (completionTime - eventStart) / 60000; // Convert to minutes
            }

            rankedTeams.push({
                team_name: session.team_name,
                completion_time: session.completion_time,
                points: session.points || 0,
                team_photo_path: session.team_photo_path,
                member_count: teamMembers,
                minutes_after_start: minutesAfterStart
            });
        }

        // Sort based on criteria
        if (sortBy === 'highest') {
            // Sort by points (highest first) - descending
            rankedTeams.sort((a, b) => b.points - a.points);
        } else {
            // Sort by completion_time (first to complete) - ascending
            rankedTeams.sort((a, b) => new Date(a.completion_time) - new Date(b.completion_time));
        }

        // Assign ranks
        rankedTeams = rankedTeams.map((team, index) => ({
            rank: index + 1,
            ...team
        }));

        res.json({
            event_started: eventStarted,
            event_start_datetime: eventStartDatetime,
            completed_teams: rankedTeams,
            total_completed: rankedTeams.length
        });

    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Kunne ikke hente resultattavle' });
    }
});

// POST /api/teams/photo - Upload team photo from admin panel
router.post('/teams/photo', upload.single('photo'), async (req, res) => {
    const db = req.app.locals.db;
    const { team_name } = req.body;

    if (!team_name) {
        return res.status(400).json({ error: 'team_name er påkrevd' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'Ingen bilde-fil ble sendt' });
    }

    try {
        // Verify team exists (check if there are any active participants on this team)
        const teamExists = await new Promise((resolve, reject) => {
            db.get(
                'SELECT COUNT(*) as count FROM participants WHERE team = ? AND active = 1',
                [team_name],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row && row.count > 0);
                }
            );
        });

        if (!teamExists) {
            return res.status(404).json({ error: 'Laget finnes ikke' });
        }

        // Create directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'team-photos');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Process image with sharp
        // Use team name for filename (sanitized) so retakes overwrite old photo
        const sanitizedTeamName = team_name.replace(/[^a-zA-Z0-9-]/g, '_');
        const filename = `team-${sanitizedTeamName}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        // Delete old photo if it exists
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        await sharp(req.file.buffer)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(filepath);

        // Update ALL participants on this team with the photo path
        const photoPath = `/uploads/team-photos/${filename}`;
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE participants SET team_photo_path = ? WHERE team = ? AND active = 1',
                [photoPath, team_name],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            message: 'Lagbilde lastet opp!',
            photo_path: photoPath
        });

    } catch (err) {
        console.error('Error uploading team photo from admin:', err);
        res.status(500).json({ error: 'Kunne ikke laste opp lagbilde' });
    }
});

// DELETE /api/teams/:teamName/photo - Delete team photo from admin panel
router.delete('/teams/:teamName/photo', async (req, res) => {
    const db = req.app.locals.db;
    const teamName = decodeURIComponent(req.params.teamName);

    try {
        // Get current photo path
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT team_photo_path FROM participants WHERE team = ? AND active = 1 AND team_photo_path IS NOT NULL LIMIT 1',
                [teamName],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant || !participant.team_photo_path) {
            return res.status(404).json({ error: 'Ingen lagbilde funnet' });
        }

        // Delete the file
        const photoPath = participant.team_photo_path;
        const filename = path.basename(photoPath);
        const filepath = path.join(__dirname, '..', 'uploads', 'team-photos', filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        // Update ALL participants on this team - set team_photo_path to NULL
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE participants SET team_photo_path = NULL WHERE team = ? AND active = 1',
                [teamName],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Also clear from sessions for backwards compatibility
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE team_challenge_sessions SET team_photo_path = NULL WHERE team_name = ?',
                [teamName],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            message: 'Lagbilde slettet!'
        });

    } catch (err) {
        console.error('Error deleting team photo from admin:', err);
        res.status(500).json({ error: 'Kunne ikke slette lagbilde' });
    }
});

// Helper function: Get all scans for a session
async function getSessionScans(db, sessionId) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM team_challenge_scans WHERE session_id = ? ORDER BY scan_order ASC',
            [sessionId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

// Helper function: Get team members with scan status
async function getTeamMembersWithStatus(db, teamName, scans) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM participants WHERE team = ? AND active = 1 AND role = 'Deltaker' ORDER BY
                CASE WHEN no_show = 1 THEN 1 ELSE 0 END,
                first_name, last_name`,
            [teamName],
            (err, rows) => {
                if (err) {
                    console.error('[Team Challenge] Error fetching team members:', err);
                    reject(err);
                } else {
                    const scannedCodes = new Set(scans.map(s => s.participant_code));
                    // Include all participants, but mark no-show status
                    const members = rows.map(p => ({
                        participant_code: p.participant_code,
                        first_name: p.first_name,
                        last_name: p.last_name,
                        profile_photo_path: p.profile_photo_path,
                        no_show: p.no_show === 1,
                        scanned: scannedCodes.has(p.participant_code)
                    }));
                    resolve(members);
                }
            }
        );
    });
}

// Helper function: Calculate points for team challenge
// 20 points per person who scans
// +50 bonus if all team members scan
// +30 bonus for team photo
function calculatePoints(scannedCount, totalMembers, hasPhoto) {
    const basePoints = scannedCount * 20;
    const allScannedBonus = (scannedCount === totalMembers && totalMembers > 0) ? 50 : 0;
    const photoBonus = hasPhoto ? 30 : 0;
    return basePoints + allScannedBonus + photoBonus;
}

module.exports = router;
