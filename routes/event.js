const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configure multer for logo uploads
const storage = multer.memoryStorage();
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

// GET active event info
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.get(
        'SELECT * FROM event_info WHERE active = 1 ORDER BY created_date DESC LIMIT 1',
        [],
        (err, row) => {
            if (err) {
                console.error('Error fetching event info:', err);
                return res.status(500).json({ error: 'Failed to fetch event info' });
            }

            if (!row) {
                return res.status(404).json({ error: 'No active event found' });
            }

            res.json(row);
        }
    );
});

// GET specific event by ID
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.get(
        'SELECT * FROM event_info WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                console.error('Error fetching event:', err);
                return res.status(500).json({ error: 'Failed to fetch event' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Event not found' });
            }

            res.json(row);
        }
    );
});

// POST create or update event info
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const {
        event_name,
        event_description,
        location,
        start_date,
        end_date,
        start_datetime,
        end_datetime,
        organizer_name,
        organizer_club,
        organizer_contact,
        allow_qr_upload,
        enable_quiz_music,
        participant_code_prefix
    } = req.body;

    // Validate required fields
    if (!event_name) {
        return res.status(400).json({
            error: 'Missing required field: event_name'
        });
    }

    // First, set all events to inactive
    db.run('UPDATE event_info SET active = 0', [], (err) => {
        if (err) {
            console.error('Error deactivating events:', err);
            return res.status(500).json({ error: 'Failed to update events' });
        }

        // Insert new active event
        db.run(
            `INSERT INTO event_info (
                event_name, event_description, location, start_date, end_date, start_datetime, end_datetime,
                organizer_name, organizer_club, organizer_contact, allow_qr_upload, enable_quiz_music, participant_code_prefix, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                event_name,
                event_description,
                location,
                start_date,
                end_date,
                start_datetime,
                end_datetime,
                organizer_name,
                organizer_club,
                organizer_contact,
                allow_qr_upload || 0,
                enable_quiz_music !== undefined ? enable_quiz_music : 1,
                participant_code_prefix || 'SK'
            ],
            function(err) {
                if (err) {
                    console.error('Error creating event:', err);
                    return res.status(500).json({ error: 'Failed to create event' });
                }

                // Fetch and return the created event
                db.get(
                    'SELECT * FROM event_info WHERE id = ?',
                    [this.lastID],
                    (err, row) => {
                        if (err) {
                            console.error('Error fetching created event:', err);
                            return res.status(500).json({ error: 'Event created but failed to fetch' });
                        }
                        res.status(201).json(row);
                    }
                );
            }
        );
    });
});

// PUT update event
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const {
        event_name,
        event_description,
        location,
        start_date,
        end_date,
        start_datetime,
        end_datetime,
        organizer_name,
        organizer_club,
        organizer_contact,
        allow_qr_upload,
        enable_quiz_music,
        participant_code_prefix,
        wifi_ssid,
        wifi_password
    } = req.body;

    db.run(
        `UPDATE event_info
         SET event_name = COALESCE(?, event_name),
             event_description = COALESCE(?, event_description),
             location = COALESCE(?, location),
             start_date = COALESCE(?, start_date),
             end_date = COALESCE(?, end_date),
             start_datetime = COALESCE(?, start_datetime),
             end_datetime = COALESCE(?, end_datetime),
             organizer_name = COALESCE(?, organizer_name),
             organizer_club = COALESCE(?, organizer_club),
             organizer_contact = COALESCE(?, organizer_contact),
             allow_qr_upload = COALESCE(?, allow_qr_upload),
             enable_quiz_music = COALESCE(?, enable_quiz_music),
             participant_code_prefix = COALESCE(?, participant_code_prefix),
             wifi_ssid = COALESCE(?, wifi_ssid),
             wifi_password = COALESCE(?, wifi_password),
             updated_date = datetime('now')
         WHERE id = ?`,
        [
            event_name,
            event_description,
            location,
            start_date,
            end_date,
            start_datetime,
            end_datetime,
            organizer_name,
            organizer_club,
            organizer_contact,
            allow_qr_upload,
            enable_quiz_music,
            participant_code_prefix,
            wifi_ssid,
            wifi_password,
            id
        ],
        function(err) {
            if (err) {
                console.error('Error updating event:', err);
                return res.status(500).json({ error: 'Failed to update event' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Event not found' });
            }

            // Fetch and return updated event
            db.get(
                'SELECT * FROM event_info WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated event:', err);
                        return res.status(500).json({ error: 'Updated but failed to fetch' });
                    }
                    res.json(row);
                }
            );
        }
    );
});

// POST upload event logo
router.post('/:id/logo', upload.single('logo'), async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: 'No logo file provided' });
    }

    try {
        // Check if event exists
        const event = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM event_info WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'event-logos');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Process image with sharp
        const filename = `event-${id}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        await sharp(req.file.buffer)
            .resize(400, 400, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(filepath);

        // Update database with logo path
        const logoPath = `/uploads/event-logos/${filename}`;
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE event_info SET logo_path = ?, updated_date = datetime("now") WHERE id = ?',
                [logoPath, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            message: 'Logo uploaded successfully',
            logo_path: logoPath
        });

    } catch (err) {
        console.error('Error uploading logo:', err);
        res.status(500).json({ error: 'Failed to upload logo' });
    }
});

module.exports = router;
