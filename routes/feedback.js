const express = require('express');
const router = express.Router();

// POST submit new feedback
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { title, message, participant_code, is_anonymous } = req.body;

    // Validation
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Melding er påkrevd' });
    }

    // Message length limit (prevent abuse)
    if (message.length > 5000) {
        return res.status(400).json({ error: 'Meldingen er for lang (maks 5000 tegn)' });
    }

    // Title length limit if provided
    if (title && title.length > 200) {
        return res.status(400).json({ error: 'Tittel er for lang (maks 200 tegn)' });
    }

    // Determine if anonymous based on whether participant_code is provided
    const isAnonymous = !participant_code || participant_code.trim() === '' ? 1 : 0;
    const finalParticipantCode = isAnonymous ? null : participant_code;

    // If not anonymous, verify participant exists
    if (!isAnonymous) {
        db.get(
            'SELECT participant_code FROM participants WHERE participant_code = ? AND active = 1',
            [finalParticipantCode],
            (err, participant) => {
                if (err) {
                    console.error('Error checking participant:', err);
                    return res.status(500).json({ error: 'Feil ved innsending' });
                }

                if (!participant) {
                    return res.status(404).json({ error: 'Deltaker ikke funnet' });
                }

                // Insert feedback
                insertFeedback();
            }
        );
    } else {
        // Anonymous submission, insert directly
        insertFeedback();
    }

    function insertFeedback() {
        db.run(
            `INSERT INTO feedback (title, message, participant_code, is_anonymous, status)
             VALUES (?, ?, ?, ?, 'new')`,
            [title || null, message.trim(), finalParticipantCode, isAnonymous],
            function(err) {
                if (err) {
                    console.error('Error inserting feedback:', err);
                    return res.status(500).json({ error: 'Kunne ikke lagre tilbakemelding' });
                }

                // Fetch and return created feedback
                db.get(
                    'SELECT * FROM feedback WHERE id = ?',
                    [this.lastID],
                    (err, row) => {
                        if (err) {
                            console.error('Error fetching created feedback:', err);
                            return res.status(500).json({ error: 'Tilbakemelding lagret, men kunne ikke hentes' });
                        }
                        console.log(`✅ New feedback submitted (ID: ${this.lastID}, Anonymous: ${isAnonymous})`);
                        res.status(201).json(row);
                    }
                );
            }
        );
    }
});

// GET all feedback (admin only)
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        `SELECT
            f.*,
            p.first_name,
            p.last_name,
            p.age,
            p.club
         FROM feedback f
         LEFT JOIN participants p ON f.participant_code = p.participant_code AND p.active = 1
         WHERE f.active = 1
         ORDER BY f.submitted_at DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching feedback:', err);
                return res.status(500).json({ error: 'Kunne ikke hente tilbakemeldinger' });
            }
            res.json(rows);
        }
    );
});

// GET count of new/unread messages
router.get('/count/new', (req, res) => {
    const db = req.app.locals.db;

    db.get(
        `SELECT COUNT(*) as count
         FROM feedback
         WHERE status = 'new' AND active = 1`,
        [],
        (err, row) => {
            if (err) {
                console.error('Error counting new feedback:', err);
                return res.status(500).json({ error: 'Kunne ikke telle nye meldinger' });
            }
            res.json({ count: row.count });
        }
    );
});

// PUT mark feedback as read
router.put('/:id/read', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.run(
        `UPDATE feedback
         SET status = 'read', read_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND active = 1`,
        [id],
        function(err) {
            if (err) {
                console.error('Error marking feedback as read:', err);
                return res.status(500).json({ error: 'Kunne ikke oppdatere status' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Tilbakemelding ikke funnet' });
            }

            // Fetch updated feedback
            db.get(
                'SELECT * FROM feedback WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated feedback:', err);
                        return res.status(500).json({ error: 'Oppdatert, men kunne ikke hentes' });
                    }
                    res.json(row);
                }
            );
        }
    );
});

// PUT mark feedback as unread
router.put('/:id/unread', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.run(
        `UPDATE feedback
         SET status = 'new', read_at = NULL
         WHERE id = ? AND active = 1`,
        [id],
        function(err) {
            if (err) {
                console.error('Error marking feedback as unread:', err);
                return res.status(500).json({ error: 'Kunne ikke oppdatere status' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Tilbakemelding ikke funnet' });
            }

            // Fetch updated feedback
            db.get(
                'SELECT * FROM feedback WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated feedback:', err);
                        return res.status(500).json({ error: 'Oppdatert, men kunne ikke hentes' });
                    }
                    res.json(row);
                }
            );
        }
    );
});

// DELETE feedback (soft delete)
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.run(
        'UPDATE feedback SET active = 0 WHERE id = ? AND active = 1',
        [id],
        function(err) {
            if (err) {
                console.error('Error deleting feedback:', err);
                return res.status(500).json({ error: 'Kunne ikke slette tilbakemelding' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Tilbakemelding ikke funnet' });
            }

            res.json({ message: 'Tilbakemelding slettet' });
        }
    );
});

module.exports = router;
