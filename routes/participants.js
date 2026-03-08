const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Load login words
let loginWords = [];
try {
    const wordsPath = path.join(__dirname, '../data/login-words.json');
    const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
    loginWords = wordsData.words || [];
    console.log(`✅ Loaded ${loginWords.length} login words`);
} catch (error) {
    console.error('⚠️  Warning: Could not load login words:', error.message);
    // Fallback to a small list if file not found
    loginWords = ['EPLE', 'STOL', 'KATT', 'HUND', 'BALL', 'BOK'];
}

// Function to generate unique login word
function generateUniqueLoginWord(db, callback) {
    // Shuffle words array
    const shuffled = [...loginWords].sort(() => Math.random() - 0.5);

    // Try to find an unused word
    function tryWord(index) {
        if (index >= shuffled.length) {
            // All words used, generate a random one with number
            const randomWord = loginWords[Math.floor(Math.random() * loginWords.length)];
            const randomNum = Math.floor(Math.random() * 999);
            return callback(null, `${randomWord}${randomNum}`);
        }

        const word = shuffled[index];

        // Check if word is already used
        db.get(
            'SELECT login_word FROM participants WHERE login_word = ? AND active = 1',
            [word],
            (err, row) => {
                if (err) {
                    return callback(err);
                }

                if (!row) {
                    // Word is available
                    callback(null, word);
                } else {
                    // Word is taken, try next
                    tryWord(index + 1);
                }
            }
        );
    }

    tryWord(0);
}

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

// GET specific participant by code or login word
router.get('/:code', (req, res) => {
    const db = req.app.locals.db;
    let { code } = req.params;

    // Decode URL encoding and handle plus signs (SK+2026+001 → SK-2026-001)
    code = decodeURIComponent(code).replace(/\+/g, '-').trim().toUpperCase();

    // Determine if this looks like a login word (letters only, no digits, 3-10 chars) or participant code
    const isLoginWord = /^[A-ZÆØÅ]+$/.test(code) && code.length >= 3 && code.length <= 10;

    // Build query based on input type
    let query, params;
    if (isLoginWord) {
        // Search by login_word
        query = 'SELECT * FROM participants WHERE UPPER(login_word) = ? AND active = 1';
        params = [code];
    } else {
        // Search by participant_code
        query = 'SELECT * FROM participants WHERE participant_code = ? AND active = 1';
        params = [code];
    }

    db.get(query, params, (err, row) => {
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
            [row.participant_code]
        );

        // Log the scan
        db.run(
            'INSERT INTO scan_log (participant_code) VALUES (?)',
            [row.participant_code]
        );

        res.json(row);
    });
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

            // Generate unique login word
            generateUniqueLoginWord(db, (err, loginWord) => {
                if (err) {
                    console.error('Error generating login word:', err);
                    return res.status(500).json({ error: 'Failed to generate login word' });
                }

                console.log(`✅ Generated login word "${loginWord}" for ${first_name} ${last_name}`);

                // Insert new participant with login word
                db.run(
                    `INSERT INTO participants (participant_code, first_name, last_name, age, home_location, club, role, team, notes, login_word)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [participant_code, first_name, last_name, age, home_location, club, role, team, notes, loginWord],
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
            });
        }
    );
});

// PUT update participant
router.put('/:code', (req, res) => {
    const db = req.app.locals.db;
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');
    const { first_name, last_name, age, home_location, club, role, team, notes } = req.body;

    db.run(
        `UPDATE participants
         SET first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             age = COALESCE(?, age),
             home_location = COALESCE(?, home_location),
             club = COALESCE(?, club),
             role = COALESCE(?, role),
             team = ?,
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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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

// POST /api/participants/:code/regenerate-login-word - Generate a new login word for participant
router.post('/:code/regenerate-login-word', (req, res) => {
    const db = req.app.locals.db;
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

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

            // Generate new unique login word
            generateUniqueLoginWord(db, (err, newLoginWord) => {
                if (err) {
                    console.error('Error generating login word:', err);
                    return res.status(500).json({ error: 'Failed to generate login word' });
                }

                // Update participant with new login word
                db.run(
                    'UPDATE participants SET login_word = ? WHERE participant_code = ? AND active = 1',
                    [newLoginWord, code],
                    function(err) {
                        if (err) {
                            console.error('Error updating login word:', err);
                            return res.status(500).json({ error: 'Failed to update login word' });
                        }

                        if (this.changes === 0) {
                            return res.status(404).json({ error: 'Participant not found' });
                        }

                        console.log(`✅ Regenerated login word for ${participant.first_name} ${participant.last_name}: ${newLoginWord}`);

                        res.json({
                            success: true,
                            login_word: newLoginWord,
                            participant_code: code
                        });
                    }
                );
            });
        }
    );
});

// POST /api/participants/:code/print - Print participant info to receipt printer
router.post('/:code/print', (req, res) => {
    const db = req.app.locals.db;
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');

    // Check platform
    const isWindows = os.platform() === 'win32';
    const isLinux = os.platform() === 'linux';

    if (!isWindows && !isLinux) {
        return res.status(400).json({ error: 'Printer støttes kun på Windows og Linux' });
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
                    const jsonData = JSON.stringify(printData);
                    let command;

                    if (isLinux) {
                        // Linux command
                        const pythonPath = '/home/kasse/printer_env/bin/python3';
                        const printerScript = '/home/kasse/print_participant.py';
                        command = `echo '${jsonData.replace(/'/g, "'\\''")}' | sudo ${pythonPath} ${printerScript}`;

                    } else {
                        // Windows command
                        const printerScript = path.join(__dirname, '..', 'utils', 'print_participant_win.py');
                        const pythonPath = process.env.VIRTUAL_ENV
                            ? path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python.exe')
                            : 'python';

                        // Escape quotes for Windows
                        const escapedJson = jsonData.replace(/"/g, '\\"');
                        command = `echo "${escapedJson}" | ${pythonPath} "${printerScript}"`;
                    }

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

// PUT update participant's sleeping room assignment
router.put('/:code/sleeping-room', (req, res) => {
    const db = req.app.locals.db;
    let { code } = req.params;
    code = decodeURIComponent(code).replace(/\+/g, '-');
    const { sleepingRoomId } = req.body;

    // If sleepingRoomId is null, unassign from room
    if (sleepingRoomId === null || sleepingRoomId === undefined || sleepingRoomId === '') {
        db.run(
            'UPDATE participants SET sleeping_room_id = NULL WHERE participant_code = ? AND active = 1',
            [code],
            function(err) {
                if (err) {
                    console.error('Error unassigning room:', err);
                    return res.status(500).json({ error: 'Failed to unassign room' });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Participant not found' });
                }

                res.json({ message: 'Room unassigned successfully', sleepingRoomId: null });
            }
        );
        return;
    }

    // Verify that the room exists and is active
    db.get(
        'SELECT * FROM sleeping_rooms WHERE id = ? AND active = 1',
        [sleepingRoomId],
        (err, room) => {
            if (err) {
                console.error('Error fetching room:', err);
                return res.status(500).json({ error: 'Failed to verify room' });
            }

            if (!room) {
                return res.status(404).json({ error: 'Sleeping room not found' });
            }

            // Check current occupancy (optional - soft limit)
            db.get(
                'SELECT COUNT(*) as count FROM participants WHERE sleeping_room_id = ? AND active = 1',
                [sleepingRoomId],
                (err, result) => {
                    if (err) {
                        console.error('Error checking occupancy:', err);
                        // Continue anyway
                    }

                    const currentOccupancy = result ? result.count : 0;
                    const warning = currentOccupancy >= room.capacity ? 'Room is at or over capacity' : null;

                    // Update participant's room assignment
                    db.run(
                        'UPDATE participants SET sleeping_room_id = ? WHERE participant_code = ? AND active = 1',
                        [sleepingRoomId, code],
                        function(err) {
                            if (err) {
                                console.error('Error assigning room:', err);
                                return res.status(500).json({ error: 'Failed to assign room' });
                            }

                            if (this.changes === 0) {
                                return res.status(404).json({ error: 'Participant not found' });
                            }

                            res.json({
                                message: 'Room assigned successfully',
                                sleepingRoomId: sleepingRoomId,
                                roomName: room.name,
                                warning: warning
                            });
                        }
                    );
                }
            );
        }
    );
});

module.exports = router;
