const express = require('express');
const router = express.Router();

// GET all active sleeping rooms
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM sleeping_rooms WHERE active = 1 ORDER BY name ASC',
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching sleeping rooms:', err);
                return res.status(500).json({ error: 'Failed to fetch sleeping rooms' });
            }
            res.json(rows);
        }
    );
});

// GET specific sleeping room by ID
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.get(
        'SELECT * FROM sleeping_rooms WHERE id = ? AND active = 1',
        [id],
        (err, row) => {
            if (err) {
                console.error('Error fetching sleeping room:', err);
                return res.status(500).json({ error: 'Failed to fetch sleeping room' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Sleeping room not found' });
            }

            res.json(row);
        }
    );
});

// GET all participants in a specific room
router.get('/:id/participants', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.all(
        `SELECT p.* FROM participants p
         WHERE p.sleeping_room_id = ? AND p.active = 1
         ORDER BY p.last_name ASC, p.first_name ASC`,
        [id],
        (err, rows) => {
            if (err) {
                console.error('Error fetching participants in room:', err);
                return res.status(500).json({ error: 'Failed to fetch participants' });
            }
            res.json(rows);
        }
    );
});

// GET complete room report for printing (all rooms with participants)
router.get('/report/all', (req, res) => {
    const db = req.app.locals.db;

    // First get all active rooms
    db.all(
        'SELECT * FROM sleeping_rooms WHERE active = 1 ORDER BY name ASC',
        [],
        (err, rooms) => {
            if (err) {
                console.error('Error fetching rooms for report:', err);
                return res.status(500).json({ error: 'Failed to fetch rooms' });
            }

            // For each room, get participants
            const roomPromises = rooms.map(room => {
                return new Promise((resolve, reject) => {
                    db.all(
                        `SELECT p.* FROM participants p
                         WHERE p.sleeping_room_id = ? AND p.active = 1
                         ORDER BY p.last_name ASC, p.first_name ASC`,
                        [room.id],
                        (err, participants) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    ...room,
                                    participants: participants || [],
                                    occupancy: participants ? participants.length : 0
                                });
                            }
                        }
                    );
                });
            });

            Promise.all(roomPromises)
                .then(roomsWithParticipants => {
                    res.json(roomsWithParticipants);
                })
                .catch(err => {
                    console.error('Error fetching participants for report:', err);
                    res.status(500).json({ error: 'Failed to generate report' });
                });
        }
    );
});

// POST create new sleeping room
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { name, description, capacity, floor, notes } = req.body;

    // Validate
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    const capacityValue = capacity || 10;

    db.run(
        'INSERT INTO sleeping_rooms (name, description, capacity, floor, notes) VALUES (?, ?, ?, ?, ?)',
        [name.trim(), description || null, capacityValue, floor || null, notes || null],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Et soverom med dette navnet eksisterer allerede' });
                }
                console.error('Error creating sleeping room:', err);
                return res.status(500).json({ error: 'Failed to create sleeping room' });
            }

            // Fetch and return the created room
            db.get(
                'SELECT * FROM sleeping_rooms WHERE id = ?',
                [this.lastID],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching created room:', err);
                        return res.status(500).json({ error: 'Room created but failed to fetch' });
                    }
                    res.status(201).json(row);
                }
            );
        }
    );
});

// PUT update sleeping room
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, capacity, floor, notes } = req.body;

    db.run(
        `UPDATE sleeping_rooms
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             capacity = COALESCE(?, capacity),
             floor = COALESCE(?, floor),
             notes = COALESCE(?, notes)
         WHERE id = ? AND active = 1`,
        [name, description, capacity, floor, notes, id],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Et soverom med dette navnet eksisterer allerede' });
                }
                console.error('Error updating sleeping room:', err);
                return res.status(500).json({ error: 'Failed to update sleeping room' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Sleeping room not found' });
            }

            // Fetch and return updated room
            db.get(
                'SELECT * FROM sleeping_rooms WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated room:', err);
                        return res.status(500).json({ error: 'Updated but failed to fetch' });
                    }
                    res.json(row);
                }
            );
        }
    );
});

// DELETE sleeping room (soft delete)
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if any participants are assigned to this room
    db.get(
        'SELECT COUNT(*) as count FROM participants WHERE sleeping_room_id = ? AND active = 1',
        [id],
        (err, row) => {
            if (err) {
                console.error('Error checking room usage:', err);
                return res.status(500).json({ error: 'Failed to check room usage' });
            }

            if (row.count > 0) {
                return res.status(400).json({
                    error: `Kan ikke slette rommet. ${row.count} deltaker(e) er tildelt dette rommet.`
                });
            }

            // Soft delete the room
            db.run(
                'UPDATE sleeping_rooms SET active = 0 WHERE id = ?',
                [id],
                function(err) {
                    if (err) {
                        console.error('Error deleting sleeping room:', err);
                        return res.status(500).json({ error: 'Failed to delete sleeping room' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Sleeping room not found' });
                    }

                    res.json({ message: 'Sleeping room deleted successfully' });
                }
            );
        }
    );
});

module.exports = router;
