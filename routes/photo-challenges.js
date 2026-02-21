const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/photo-challenges');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'challenge-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// GET all challenges (active only for participants, all for admin)
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const showAll = req.query.admin === 'true';

    const query = showAll
        ? 'SELECT * FROM photo_challenges ORDER BY order_number ASC, id ASC'
        : 'SELECT * FROM photo_challenges WHERE active = 1 ORDER BY order_number ASC, id ASC';

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error fetching challenges:', err);
            return res.status(500).json({ error: 'Failed to fetch challenges' });
        }
        res.json(rows);
    });
});

// GET specific challenge
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.get('SELECT * FROM photo_challenges WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching challenge:', err);
            return res.status(500).json({ error: 'Failed to fetch challenge' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Challenge not found' });
        }
        res.json(row);
    });
});

// POST create new challenge (admin)
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { title, description, points, icon, active, order_number } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    db.run(
        `INSERT INTO photo_challenges (title, description, points, icon, active, order_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description || null, points || 10, icon || '📸', active !== undefined ? active : 1, order_number || 0],
        function(err) {
            if (err) {
                console.error('Error creating challenge:', err);
                return res.status(500).json({ error: 'Failed to create challenge' });
            }
            res.json({
                message: 'Challenge created successfully',
                id: this.lastID
            });
        }
    );
});

// PUT update challenge (admin)
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, description, points, icon, active, order_number } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    db.run(
        `UPDATE photo_challenges
         SET title = ?, description = ?, points = ?, icon = ?, active = ?, order_number = ?
         WHERE id = ?`,
        [title, description || null, points || 10, icon || '📸', active !== undefined ? active : 1, order_number || 0, id],
        function(err) {
            if (err) {
                console.error('Error updating challenge:', err);
                return res.status(500).json({ error: 'Failed to update challenge' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Challenge not found' });
            }
            res.json({ message: 'Challenge updated successfully' });
        }
    );
});

// DELETE challenge (admin)
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Delete associated submissions first
    db.run('DELETE FROM photo_submissions WHERE challenge_id = ?', [id], (err) => {
        if (err) {
            console.error('Error deleting submissions:', err);
            return res.status(500).json({ error: 'Failed to delete submissions' });
        }

        // Then delete the challenge
        db.run('DELETE FROM photo_challenges WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting challenge:', err);
                return res.status(500).json({ error: 'Failed to delete challenge' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Challenge not found' });
            }
            res.json({ message: 'Challenge deleted successfully' });
        });
    });
});

// GET all submissions (admin)
router.get('/submissions/all', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        `SELECT ps.*, pc.title as challenge_title, pc.points as max_points, pc.icon
         FROM photo_submissions ps
         JOIN photo_challenges pc ON ps.challenge_id = pc.id
         ORDER BY ps.submitted_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching submissions:', err);
                return res.status(500).json({ error: 'Failed to fetch submissions' });
            }
            res.json(rows);
        }
    );
});

// GET submissions by team
router.get('/submissions/team/:teamName', (req, res) => {
    const db = req.app.locals.db;
    const { teamName } = req.params;

    db.all(
        `SELECT ps.*, pc.title as challenge_title, pc.points as max_points, pc.icon
         FROM photo_submissions ps
         JOIN photo_challenges pc ON ps.challenge_id = pc.id
         WHERE ps.team_name = ?
         ORDER BY pc.order_number ASC, pc.id ASC`,
        [teamName],
        (err, rows) => {
            if (err) {
                console.error('Error fetching team submissions:', err);
                return res.status(500).json({ error: 'Failed to fetch submissions' });
            }
            res.json(rows);
        }
    );
});

// POST submit photo for challenge
router.post('/submit', upload.single('photo'), async (req, res) => {
    const db = req.app.locals.db;
    const { challengeId, teamName, participantCode } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
    }

    if (!challengeId || !teamName || !participantCode) {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Process image with sharp (compress and remove EXIF)
        const processedPath = req.file.path.replace(path.extname(req.file.path), '_processed.jpg');

        await sharp(req.file.path)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(processedPath);

        // Delete original file
        fs.unlinkSync(req.file.path);

        // Move processed file to original path
        fs.renameSync(processedPath, req.file.path);

        const imagePath = '/uploads/photo-challenges/' + path.basename(req.file.path);

        // Check if team has already submitted for this challenge
        db.get(
            'SELECT id, status, image_path, points_awarded FROM photo_submissions WHERE challenge_id = ? AND team_name = ?',
            [challengeId, teamName],
            (err, existing) => {
                if (err) {
                    console.error('Error checking existing submission:', err);
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({ error: 'Failed to submit photo' });
                }

                if (existing) {
                    // Check if submission has been reviewed and approved - if so, don't allow replacement
                    // Allow replacement if: status is 'rejected' OR points_awarded is 0 or NULL OR status is 'pending'
                    const isApproved = existing.status !== 'rejected' && existing.points_awarded > 0;
                    if (existing.status === 'reviewed' && isApproved) {
                        fs.unlinkSync(req.file.path);
                        return res.status(400).json({ error: 'Cannot replace an approved submission' });
                    }

                    // Submission exists - allow replacement (either pending or rejected)
                    // Delete old image file if it exists
                    if (existing.image_path) {
                        const oldImagePath = path.join(__dirname, '..', 'public', existing.image_path);
                        if (fs.existsSync(oldImagePath)) {
                            try {
                                fs.unlinkSync(oldImagePath);
                            } catch (deleteErr) {
                                console.error('Error deleting old image:', deleteErr);
                            }
                        }
                    }

                    // Update existing submission with new image
                    // Reset to pending status if it was previously reviewed and rejected
                    db.run(
                        `UPDATE photo_submissions
                         SET image_path = ?,
                             participant_code = ?,
                             status = 'pending',
                             points_awarded = NULL,
                             admin_comment = NULL,
                             reviewed_at = NULL,
                             submitted_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                         WHERE id = ?`,
                        [imagePath, participantCode, existing.id],
                        function(err) {
                            if (err) {
                                console.error('Error updating submission:', err);
                                fs.unlinkSync(req.file.path);
                                return res.status(500).json({ error: 'Failed to update photo' });
                            }
                            res.json({
                                message: 'Photo replaced successfully',
                                id: existing.id,
                                imagePath: imagePath
                            });
                        }
                    );
                } else {
                    // No existing submission - insert new one
                    db.run(
                        `INSERT INTO photo_submissions (challenge_id, team_name, participant_code, image_path, status)
                         VALUES (?, ?, ?, ?, 'pending')`,
                        [challengeId, teamName, participantCode, imagePath],
                        function(err) {
                            if (err) {
                                console.error('Error creating submission:', err);
                                fs.unlinkSync(req.file.path);
                                return res.status(500).json({ error: 'Failed to submit photo' });
                            }
                            res.json({
                                message: 'Photo submitted successfully',
                                id: this.lastID,
                                imagePath: imagePath
                            });
                        }
                    );
                }
            }
        );
    } catch (error) {
        console.error('Error processing image:', error);
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to process image' });
    }
});

// PUT review submission (admin - award points)
router.put('/submissions/:id/review', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { points_awarded, status, admin_comment } = req.body;

    db.run(
        `UPDATE photo_submissions
         SET points_awarded = ?, status = ?, admin_comment = ?,
             reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`,
        [points_awarded !== undefined ? points_awarded : null, status || 'reviewed', admin_comment || null, id],
        function(err) {
            if (err) {
                console.error('Error reviewing submission:', err);
                return res.status(500).json({ error: 'Failed to review submission' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Submission not found' });
            }
            res.json({ message: 'Submission reviewed successfully' });
        }
    );
});

// GET leaderboard - total points by team
router.get('/leaderboard/teams', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        `SELECT
            team_name,
            COUNT(*) as submissions_count,
            SUM(CASE WHEN points_awarded IS NOT NULL THEN points_awarded ELSE 0 END) as total_points,
            COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count
         FROM photo_submissions
         GROUP BY team_name
         ORDER BY total_points DESC, reviewed_count DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching leaderboard:', err);
                return res.status(500).json({ error: 'Failed to fetch leaderboard' });
            }
            res.json(rows);
        }
    );
});

module.exports = router;
