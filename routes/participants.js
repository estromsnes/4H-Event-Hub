const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Configure multer for photo uploads
const storage = multer.memoryStorage(); // Use memory storage for processing with sharp
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed'));
        }
    }
});

// GET all participants
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM participants WHERE active = 1 ORDER BY registered_date DESC',
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching participants:', err);
                return res.status(500).json({ error: 'Failed to fetch participants' });
            }
            res.json(rows);
        }
    );
});

// GET general participant statistics
router.get('/stats', (req, res) => {
    const db = req.app.locals.db;

    db.get(
        `SELECT
            COUNT(*) as total_participants,
            COUNT(DISTINCT team) as total_teams
         FROM participants
         WHERE active = 1`,
        [],
        (err, row) => {
            if (err) {
                console.error('Error fetching statistics:', err);
                return res.status(500).json({ error: 'Failed to fetch statistics' });
            }
            res.json(row);
        }
    );
});

// GET participant statistics by role
router.get('/stats/roles', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        `SELECT
            role,
            COUNT(*) as count
         FROM participants
         WHERE active = 1 AND role IS NOT NULL AND role != ''
         GROUP BY role
         ORDER BY count DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching role statistics:', err);
                return res.status(500).json({ error: 'Failed to fetch statistics' });
            }

            // Convert to object for easier access
            const stats = {};
            rows.forEach(row => {
                stats[row.role] = row.count;
            });

            res.json(stats);
        }
    );
});

// GET specific participant by code
router.get('/:code', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    db.get(
        'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
        [code],
        (err, row) => {
            if (err) {
                console.error('Error fetching participant:', err);
                return res.status(500).json({ error: 'Failed to fetch participant' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            // Update last scan date
            db.run(
                'UPDATE participants SET last_scan_date = datetime("now") WHERE participant_code = ?',
                [code]
            );

            // Log the scan
            db.run(
                'INSERT INTO scan_log (participant_code) VALUES (?)',
                [code]
            );

            res.json(row);
        }
    );
});

// POST create new participant
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { participant_code, first_name, last_name, age, home_location, club, role, team, notes } = req.body;

    // Validate required fields
    if (!participant_code || !first_name || !last_name) {
        return res.status(400).json({
            error: 'Missing required fields: participant_code, first_name, last_name'
        });
    }

    // Check if participant_code already exists
    db.get(
        'SELECT participant_code FROM participants WHERE participant_code = ?',
        [participant_code],
        (err, existing) => {
            if (err) {
                console.error('Error checking participant:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (existing) {
                return res.status(409).json({ error: 'Participant code already exists' });
            }

            // Insert new participant
            db.run(
                `INSERT INTO participants (participant_code, first_name, last_name, age, home_location, club, role, team, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [participant_code, first_name, last_name, age, home_location, club, role, team, notes],
                function(err) {
                    if (err) {
                        console.error('Error creating participant:', err);
                        return res.status(500).json({ error: 'Failed to create participant' });
                    }

                    // Fetch and return the created participant
                    db.get(
                        'SELECT * FROM participants WHERE id = ?',
                        [this.lastID],
                        (err, row) => {
                            if (err) {
                                console.error('Error fetching created participant:', err);
                                return res.status(500).json({ error: 'Participant created but failed to fetch' });
                            }
                            res.status(201).json(row);
                        }
                    );
                }
            );
        }
    );
});

// PUT update participant
router.put('/:code', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;
    const { first_name, last_name, age, home_location, club, role, team, notes } = req.body;

    db.run(
        `UPDATE participants
         SET first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             age = COALESCE(?, age),
             home_location = COALESCE(?, home_location),
             club = COALESCE(?, club),
             role = COALESCE(?, role),
             team = COALESCE(?, team),
             notes = COALESCE(?, notes)
         WHERE participant_code = ? AND active = 1`,
        [first_name, last_name, age, home_location, club, role, team, notes, code],
        function(err) {
            if (err) {
                console.error('Error updating participant:', err);
                return res.status(500).json({ error: 'Failed to update participant' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            // Fetch and return updated participant
            db.get(
                'SELECT * FROM participants WHERE participant_code = ?',
                [code],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated participant:', err);
                        return res.status(500).json({ error: 'Updated but failed to fetch' });
                    }
                    res.json(row);
                }
            );
        }
    );
});

// DELETE (soft delete) participant
router.delete('/:code', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    db.run(
        'UPDATE participants SET active = 0 WHERE participant_code = ? AND active = 1',
        [code],
        function(err) {
            if (err) {
                console.error('Error deleting participant:', err);
                return res.status(500).json({ error: 'Failed to delete participant' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            res.json({ message: 'Participant deleted successfully' });
        }
    );
});

// POST upload profile photo
router.post('/:code/photo', upload.single('photo'), async (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: 'No photo file provided' });
    }

    try {
        // Check if participant exists
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
                [code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        // Process image with sharp
        const filename = `${code}.jpg`;
        const filepath = path.join(__dirname, '..', 'uploads', 'profile-photos', filename);

        await sharp(req.file.buffer)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(filepath);

        // Update database with photo path
        const photoPath = `/uploads/profile-photos/${filename}`;
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE participants SET profile_photo_path = ? WHERE participant_code = ?',
                [photoPath, code],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            message: 'Photo uploaded successfully',
            photo_path: photoPath
        });

    } catch (err) {
        console.error('Error uploading photo:', err);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// DELETE participant photo
router.delete('/:code/photo', async (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    try {
        // Get participant to find photo path
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
                [code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        if (!participant.profile_photo_path) {
            return res.status(404).json({ error: 'No photo to delete' });
        }

        // Delete photo file from filesystem
        const filepath = path.join(__dirname, '..', 'uploads', 'profile-photos', `${code}.jpg`);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        // Update database to remove photo path
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE participants SET profile_photo_path = NULL WHERE participant_code = ?',
                [code],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ message: 'Photo deleted successfully' });

    } catch (err) {
        console.error('Error deleting photo:', err);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// GET scan history for a participant
router.get('/:code/scans', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    db.all(
        'SELECT * FROM scan_log WHERE participant_code = ? ORDER BY scan_timestamp DESC LIMIT 50',
        [code],
        (err, rows) => {
            if (err) {
                console.error('Error fetching scan history:', err);
                return res.status(500).json({ error: 'Failed to fetch scan history' });
            }
            res.json(rows);
        }
    );
});

// POST mark participant as no-show (admin only)
router.post('/:code/no-show', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    // Check if participant exists
    db.get(
        'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
        [code],
        (err, participant) => {
            if (err) {
                console.error('Error fetching participant:', err);
                return res.status(500).json({ error: 'Failed to fetch participant' });
            }

            if (!participant) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            // Mark participant as no-show
            db.run(
                'UPDATE participants SET no_show = 1, no_show_marked_at = datetime("now") WHERE participant_code = ? AND active = 1',
                [code],
                function(err) {
                    if (err) {
                        console.error('Error marking participant as no-show:', err);
                        return res.status(500).json({ error: 'Failed to mark participant as no-show' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Participant not found' });
                    }

                    // Fetch and return updated participant
                    db.get(
                        'SELECT * FROM participants WHERE participant_code = ?',
                        [code],
                        (err, row) => {
                            if (err) {
                                console.error('Error fetching updated participant:', err);
                                return res.status(500).json({ error: 'Marked as no-show but failed to fetch' });
                            }
                            res.json(row);
                        }
                    );
                }
            );
        }
    );
});

// DELETE remove no-show status (admin only)
router.delete('/:code/no-show', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    // Check if participant exists
    db.get(
        'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
        [code],
        (err, participant) => {
            if (err) {
                console.error('Error fetching participant:', err);
                return res.status(500).json({ error: 'Failed to fetch participant' });
            }

            if (!participant) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            // Remove no-show status
            db.run(
                'UPDATE participants SET no_show = 0, no_show_marked_at = NULL WHERE participant_code = ? AND active = 1',
                [code],
                function(err) {
                    if (err) {
                        console.error('Error removing no-show status:', err);
                        return res.status(500).json({ error: 'Failed to remove no-show status' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Participant not found' });
                    }

                    // Fetch and return updated participant
                    db.get(
                        'SELECT * FROM participants WHERE participant_code = ?',
                        [code],
                        (err, row) => {
                            if (err) {
                                console.error('Error fetching updated participant:', err);
                                return res.status(500).json({ error: 'Removed no-show but failed to fetch' });
                            }
                            res.json(row);
                        }
                    );
                }
            );
        }
    );
});

// POST confirm participant (participant confirms their own information)
router.post('/:code/confirm', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    // Check if participant exists and is not already confirmed
    db.get(
        'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
        [code],
        (err, participant) => {
            if (err) {
                console.error('Error fetching participant:', err);
                return res.status(500).json({ error: 'Failed to fetch participant' });
            }

            if (!participant) {
                return res.status(404).json({ error: 'Participant not found' });
            }

            if (participant.confirmed === 1) {
                return res.status(400).json({ error: 'Participant already confirmed' });
            }

            // Update participant as confirmed
            db.run(
                'UPDATE participants SET confirmed = 1, confirmed_at = datetime("now") WHERE participant_code = ? AND active = 1',
                [code],
                function(err) {
                    if (err) {
                        console.error('Error confirming participant:', err);
                        return res.status(500).json({ error: 'Failed to confirm participant' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Participant not found' });
                    }

                    // Fetch and return updated participant
                    db.get(
                        'SELECT * FROM participants WHERE participant_code = ?',
                        [code],
                        (err, row) => {
                            if (err) {
                                console.error('Error fetching confirmed participant:', err);
                                return res.status(500).json({ error: 'Confirmed but failed to fetch' });
                            }
                            res.json(row);
                        }
                    );
                }
            );
        }
    );
});

// POST /api/participants/:code/print - Print participant info to receipt printer
router.post('/:code/print', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    // Only run on Linux
    if (os.platform() !== 'linux') {
        return res.status(400).json({ error: 'Printer støttes kun på Linux' });
    }

    // Get event name first
    db.get('SELECT event_name FROM event_info WHERE active = 1 LIMIT 1', [], (err, event) => {
        const eventName = event && event.event_name ? event.event_name : '4H Event Hub';

        // Get participant info
        db.get(
            `SELECT participant_code, first_name, last_name, age, club, role, team
             FROM participants
             WHERE participant_code = ? AND active = 1`,
            [code],
            (err, participant) => {
            if (err) {
                console.error('Error fetching participant:', err);
                return res.status(500).json({ error: 'Kunne ikke hente deltaker' });
            }

            if (!participant) {
                return res.status(404).json({ error: 'Deltaker ikke funnet' });
            }

            // Get participant's courses
            db.all(
                `SELECT c.name, c.instructor, c.location
                 FROM courses c
                 JOIN participant_courses pc ON c.id = pc.course_id
                 WHERE pc.participant_code = ? AND c.active = 1
                 ORDER BY c.name`,
                [code],
                (err, courses) => {
                    if (err) {
                        console.error('Error fetching courses:', err);
                        // Continue without courses rather than failing
                        courses = [];
                    }

                    // Prepare data for printing
                    const printData = {
                        event_name: eventName,
                        participant_code: participant.participant_code,
                        first_name: participant.first_name,
                        last_name: participant.last_name,
                        age: participant.age,
                        club: participant.club,
                        role: participant.role,
                        team: participant.team,
                        courses: courses || []
                    };

                    // Execute print command
                    const pythonPath = '/home/kasse/printer_env/bin/python3';
                    const printerScript = '/home/kasse/print_participant.py';
                    const jsonData = JSON.stringify(printData);

                    const command = `echo '${jsonData.replace(/'/g, "'\\''")}' | sudo ${pythonPath} ${printerScript}`;

                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            console.error('Print error:', error);
                            console.error('stderr:', stderr);
                            return res.status(500).json({
                                error: 'Utskrift feilet',
                                details: stderr || error.message
                            });
                        }

                        console.log('✅ Printed participant:', participant.first_name, participant.last_name);
                        res.json({
                            message: 'Deltaker skrevet ut',
                            participant: {
                                name: `${participant.first_name} ${participant.last_name}`,
                                code: participant.participant_code
                            }
                        });
                    });
                }
            );
        }
    );
    });
});

module.exports = router;
