const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

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

module.exports = router;
