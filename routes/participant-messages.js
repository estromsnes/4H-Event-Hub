const express = require('express');
const router = express.Router();

// ============================================
// POST - Submit new message
// ============================================
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { sender_code, recipient_code, title, message, is_anonymous } = req.body;

    // Validation
    if (!recipient_code || !recipient_code.trim()) {
        return res.status(400).json({ error: 'Mottaker er påkrevd' });
    }

    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Melding er påkrevd' });
    }

    if (message.length > 5000) {
        return res.status(400).json({ error: 'Meldingen er for lang (maks 5000 tegn)' });
    }

    if (title && title.length > 200) {
        return res.status(400).json({ error: 'Tittel er for lang (maks 200 tegn)' });
    }

    // Determine anonymity
    const isAnonymous = !sender_code || sender_code.trim() === '' || is_anonymous === 1 ? 1 : 0;
    const finalSenderCode = isAnonymous ? null : sender_code;

    // Verify recipient exists
    db.get(
        'SELECT participant_code FROM participants WHERE participant_code = ? AND active = 1',
        [recipient_code],
        (err, recipient) => {
            if (err) {
                console.error('Error checking recipient:', err);
                return res.status(500).json({ error: 'Feil ved innsending' });
            }

            if (!recipient) {
                return res.status(404).json({ error: 'Mottaker ikke funnet' });
            }

            // If not anonymous, verify sender exists
            if (!isAnonymous) {
                db.get(
                    'SELECT participant_code FROM participants WHERE participant_code = ? AND active = 1',
                    [finalSenderCode],
                    (err, sender) => {
                        if (err) {
                            console.error('Error checking sender:', err);
                            return res.status(500).json({ error: 'Feil ved innsending' });
                        }

                        if (!sender) {
                            return res.status(404).json({ error: 'Avsender ikke funnet' });
                        }

                        insertMessage();
                    }
                );
            } else {
                insertMessage();
            }
        }
    );

    function insertMessage() {
        db.run(
            `INSERT INTO participant_messages (
                sender_code, sender_is_anonymous, recipient_code, title, message, status
            ) VALUES (?, ?, ?, ?, ?, 'pending')`,
            [finalSenderCode, isAnonymous, recipient_code, title || null, message.trim()],
            function(err) {
                if (err) {
                    console.error('Error inserting message:', err);
                    return res.status(500).json({ error: 'Kunne ikke lagre melding' });
                }

                db.get(
                    'SELECT * FROM participant_messages WHERE id = ?',
                    [this.lastID],
                    (err, row) => {
                        if (err) {
                            console.error('Error fetching created message:', err);
                            return res.status(500).json({ error: 'Melding lagret, men kunne ikke hentes' });
                        }
                        console.log(`✅ New message submitted (ID: ${this.lastID}, Anonymous: ${isAnonymous}, Recipient: ${recipient_code})`);
                        res.status(201).json(row);
                    }
                );
            }
        );
    }
});

// ============================================
// GET - All messages for admin (with filters)
// ============================================
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const { status, recipient } = req.query;

    let query = `
        SELECT
            m.*,
            s.first_name as sender_first_name,
            s.last_name as sender_last_name,
            s.club as sender_club,
            r.first_name as recipient_first_name,
            r.last_name as recipient_last_name,
            r.club as recipient_club
        FROM participant_messages m
        LEFT JOIN participants s ON m.sender_code = s.participant_code AND s.active = 1
        LEFT JOIN participants r ON m.recipient_code = r.participant_code AND r.active = 1
        WHERE m.active = 1
    `;

    const params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query += ' AND m.status = ?';
        params.push(status);
    }

    if (recipient) {
        query += ' AND m.recipient_code = ?';
        params.push(recipient);
    }

    query += ' ORDER BY m.submitted_at DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ error: 'Kunne ikke hente meldinger' });
        }
        res.json(rows);
    });
});

// ============================================
// GET - Count pending messages (for badge)
// ============================================
router.get('/count/pending', (req, res) => {
    const db = req.app.locals.db;

    db.get(
        `SELECT COUNT(*) as count
         FROM participant_messages
         WHERE status = 'pending' AND active = 1`,
        [],
        (err, row) => {
            if (err) {
                console.error('Error counting pending messages:', err);
                return res.status(500).json({ error: 'Kunne ikke telle meldinger' });
            }
            res.json({ count: row.count });
        }
    );
});

// ============================================
// GET - Approved messages for a recipient
// ============================================
router.get('/recipient/:code', (req, res) => {
    const db = req.app.locals.db;
    const { code } = req.params;

    db.all(
        `SELECT
            m.id,
            m.sender_code,
            m.sender_is_anonymous,
            m.title,
            m.message,
            m.submitted_at,
            s.first_name as sender_first_name,
            s.last_name as sender_last_name
        FROM participant_messages m
        LEFT JOIN participants s ON m.sender_code = s.participant_code AND s.active = 1
        WHERE m.recipient_code = ? AND m.status = 'approved' AND m.active = 1
        ORDER BY m.submitted_at DESC`,
        [code],
        (err, rows) => {
            if (err) {
                console.error('Error fetching recipient messages:', err);
                return res.status(500).json({ error: 'Kunne ikke hente meldinger' });
            }
            res.json(rows);
        }
    );
});

// ============================================
// PUT - Approve message
// ============================================
router.put('/:id/approve', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.run(
        `UPDATE participant_messages
         SET status = 'approved', reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND active = 1`,
        [id],
        function(err) {
            if (err) {
                console.error('Error approving message:', err);
                return res.status(500).json({ error: 'Kunne ikke godkjenne melding' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Melding ikke funnet' });
            }

            db.get(
                'SELECT * FROM participant_messages WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated message:', err);
                        return res.status(500).json({ error: 'Godkjent, men kunne ikke hentes' });
                    }
                    console.log(`✅ Message ${id} approved`);
                    res.json(row);
                }
            );
        }
    );
});

// ============================================
// PUT - Reject message
// ============================================
router.put('/:id/reject', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { admin_notes } = req.body;

    db.run(
        `UPDATE participant_messages
         SET status = 'rejected',
             admin_notes = ?,
             reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ? AND active = 1`,
        [admin_notes || null, id],
        function(err) {
            if (err) {
                console.error('Error rejecting message:', err);
                return res.status(500).json({ error: 'Kunne ikke avvise melding' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Melding ikke funnet' });
            }

            db.get(
                'SELECT * FROM participant_messages WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated message:', err);
                        return res.status(500).json({ error: 'Avvist, men kunne ikke hentes' });
                    }
                    console.log(`✅ Message ${id} rejected`);
                    res.json(row);
                }
            );
        }
    );
});

// ============================================
// PUT - Reset to pending (undo approve/reject)
// ============================================
router.put('/:id/reset', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.run(
        `UPDATE participant_messages
         SET status = 'pending', admin_notes = NULL, reviewed_at = NULL
         WHERE id = ? AND active = 1`,
        [id],
        function(err) {
            if (err) {
                console.error('Error resetting message:', err);
                return res.status(500).json({ error: 'Kunne ikke tilbakestille melding' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Melding ikke funnet' });
            }

            db.get(
                'SELECT * FROM participant_messages WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated message:', err);
                        return res.status(500).json({ error: 'Tilbakestilt, men kunne ikke hentes' });
                    }
                    console.log(`✅ Message ${id} reset to pending`);
                    res.json(row);
                }
            );
        }
    );
});

// ============================================
// DELETE - Soft delete message
// ============================================
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.run(
        'UPDATE participant_messages SET active = 0 WHERE id = ? AND active = 1',
        [id],
        function(err) {
            if (err) {
                console.error('Error deleting message:', err);
                return res.status(500).json({ error: 'Kunne ikke slette melding' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Melding ikke funnet' });
            }

            console.log(`✅ Message ${id} deleted (soft)`);
            res.json({ message: 'Melding slettet' });
        }
    );
});

module.exports = router;
