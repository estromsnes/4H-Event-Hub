const express = require('express');
const router = express.Router();

// GET all program items
router.get('/', async (req, res) => {
    const db = req.app.locals.db;

    try {
        db.all(
            'SELECT * FROM program WHERE active = 1 ORDER BY day_number, order_number, start_time',
            [],
            (err, rows) => {
                if (err) {
                    console.error('Error fetching program:', err);
                    return res.status(500).json({ error: 'Kunne ikke hente program' });
                }
                res.json(rows);
            }
        );
    } catch (err) {
        console.error('Error in GET /program:', err);
        res.status(500).json({ error: 'Kunne ikke hente program' });
    }
});

// POST create new program item
router.post('/', async (req, res) => {
    const db = req.app.locals.db;
    const { title, description, start_time, end_time, location, day_number, order_number } = req.body;

    if (!title || !start_time) {
        return res.status(400).json({ error: 'Tittel og starttid er påkrevd' });
    }

    try {
        db.run(
            `INSERT INTO program (title, description, start_time, end_time, location, day_number, order_number)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, description || '', start_time, end_time || null, location || '', day_number || 1, order_number || 999],
            function(err) {
                if (err) {
                    console.error('Error creating program item:', err);
                    return res.status(500).json({ error: 'Kunne ikke opprette programpost' });
                }
                res.json({ id: this.lastID, message: 'Programpost opprettet' });
            }
        );
    } catch (err) {
        console.error('Error in POST /program:', err);
        res.status(500).json({ error: 'Kunne ikke opprette programpost' });
    }
});

// PUT update program item
router.put('/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, description, start_time, end_time, location, day_number, order_number } = req.body;

    if (!title || !start_time) {
        return res.status(400).json({ error: 'Tittel og starttid er påkrevd' });
    }

    try {
        db.run(
            `UPDATE program SET
                title = ?,
                description = ?,
                start_time = ?,
                end_time = ?,
                location = ?,
                day_number = ?,
                order_number = ?
             WHERE id = ?`,
            [title, description || '', start_time, end_time || null, location || '', day_number || 1, order_number || 999, id],
            function(err) {
                if (err) {
                    console.error('Error updating program item:', err);
                    console.error('SQL Error details:', err.message);
                    console.error('Data being updated:', { title, description, start_time, end_time, location, day_number, order_number, id });
                    return res.status(500).json({
                        error: 'Kunne ikke oppdatere programpost',
                        details: err.message
                    });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Programpost ikke funnet' });
                }
                res.json({ message: 'Programpost oppdatert' });
            }
        );
    } catch (err) {
        console.error('Error in PUT /program:', err);
        res.status(500).json({ error: 'Kunne ikke oppdatere programpost' });
    }
});

// DELETE program item
router.delete('/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        db.run(
            'DELETE FROM program WHERE id = ?',
            [id],
            function(err) {
                if (err) {
                    console.error('Error deleting program item:', err);
                    return res.status(500).json({ error: 'Kunne ikke slette programpost' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Programpost ikke funnet' });
                }
                res.json({ message: 'Programpost slettet' });
            }
        );
    } catch (err) {
        console.error('Error in DELETE /program:', err);
        res.status(500).json({ error: 'Kunne ikke slette programpost' });
    }
});

module.exports = router;
