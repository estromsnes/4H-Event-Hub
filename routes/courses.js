const express = require('express');
const router = express.Router();

// GET all courses (including inactive for admin)
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM courses ORDER BY name ASC',
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching courses:', err);
                return res.status(500).json({ error: 'Failed to fetch courses' });
            }
            res.json(rows);
        }
    );
});

// POST create a new course
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { name, description, instructor, location, max_participants, icon, active } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Course name is required' });
    }

    db.run(
        `INSERT INTO courses (name, description, instructor, location, max_participants, icon, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, description || null, instructor || null, location || null, max_participants || 15, icon || '📚', active !== undefined ? active : 1],
        function(err) {
            if (err) {
                console.error('Error creating course:', err);
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'A course with this name already exists' });
                }
                return res.status(500).json({ error: 'Failed to create course' });
            }
            res.json({
                message: 'Course created successfully',
                id: this.lastID
            });
        }
    );
});

// POST enroll participant in a course
router.post('/enroll', (req, res) => {
    const db = req.app.locals.db;
    const { participantCode, courseId } = req.body;

    if (!participantCode || !courseId) {
        return res.status(400).json({ error: 'Participant code and course ID are required' });
    }

    // Check if already enrolled
    db.get(
        'SELECT * FROM participant_courses WHERE participant_code = ? AND course_id = ?',
        [participantCode, courseId],
        (err, row) => {
            if (err) {
                console.error('Error checking enrollment:', err);
                return res.status(500).json({ error: 'Failed to check enrollment' });
            }

            if (row) {
                return res.status(400).json({ error: 'Already enrolled in this course' });
            }

            // Enroll participant
            db.run(
                'INSERT INTO participant_courses (participant_code, course_id) VALUES (?, ?)',
                [participantCode, courseId],
                (err) => {
                    if (err) {
                        console.error('Error enrolling participant:', err);
                        return res.status(500).json({ error: 'Failed to enroll participant' });
                    }
                    res.json({ message: 'Successfully enrolled in course' });
                }
            );
        }
    );
});

// DELETE unenroll participant from a course
router.delete('/unenroll', (req, res) => {
    const db = req.app.locals.db;
    const { participantCode, courseId } = req.body;

    if (!participantCode || !courseId) {
        return res.status(400).json({ error: 'Participant code and course ID are required' });
    }

    db.run(
        'DELETE FROM participant_courses WHERE participant_code = ? AND course_id = ?',
        [participantCode, courseId],
        function(err) {
            if (err) {
                console.error('Error unenrolling participant:', err);
                return res.status(500).json({ error: 'Failed to unenroll participant' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Enrollment not found' });
            }

            res.json({ message: 'Successfully unenrolled from course' });
        }
    );
});

// PUT update an existing course
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, instructor, location, max_participants, icon, active } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Course name is required' });
    }

    db.run(
        `UPDATE courses
         SET name = ?, description = ?, instructor = ?, location = ?,
             max_participants = ?, icon = ?, active = ?
         WHERE id = ?`,
        [name, description || null, instructor || null, location || null,
         max_participants || 15, icon || '📚', active !== undefined ? active : 1, id],
        function(err) {
            if (err) {
                console.error('Error updating course:', err);
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'A course with this name already exists' });
                }
                return res.status(500).json({ error: 'Failed to update course' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Course not found' });
            }

            res.json({ message: 'Course updated successfully' });
        }
    );
});

// DELETE a course
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    // First delete all enrollments for this course
    db.run(
        'DELETE FROM participant_courses WHERE course_id = ?',
        [id],
        (err) => {
            if (err) {
                console.error('Error deleting course enrollments:', err);
                return res.status(500).json({ error: 'Failed to delete course enrollments' });
            }

            // Then delete the course
            db.run(
                'DELETE FROM courses WHERE id = ?',
                [id],
                function(err) {
                    if (err) {
                        console.error('Error deleting course:', err);
                        return res.status(500).json({ error: 'Failed to delete course' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Course not found' });
                    }

                    res.json({ message: 'Course deleted successfully' });
                }
            );
        }
    );
});

// GET specific course by ID
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.get(
        'SELECT * FROM courses WHERE id = ?',
        [id],
        (err, row) => {
            if (err) {
                console.error('Error fetching course:', err);
                return res.status(500).json({ error: 'Failed to fetch course' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Course not found' });
            }

            res.json(row);
        }
    );
});

// GET participants in a specific course
router.get('/:id/participants', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.all(
        `SELECT p.*, pc.enrolled_at
         FROM participants p
         JOIN participant_courses pc ON p.participant_code = pc.participant_code
         WHERE pc.course_id = ? AND p.active = 1
         ORDER BY p.last_name, p.first_name`,
        [id],
        (err, rows) => {
            if (err) {
                console.error('Error fetching course participants:', err);
                return res.status(500).json({ error: 'Failed to fetch course participants' });
            }
            res.json(rows);
        }
    );
});

// GET courses for a specific participant
router.get('/participant/:participantCode', (req, res) => {
    const db = req.app.locals.db;
    const { participantCode } = req.params;

    db.all(
        `SELECT c.*, pc.enrolled_at
         FROM courses c
         JOIN participant_courses pc ON c.id = pc.course_id
         WHERE pc.participant_code = ? AND c.active = 1
         ORDER BY c.name`,
        [participantCode],
        (err, rows) => {
            if (err) {
                console.error('Error fetching participant courses:', err);
                return res.status(500).json({ error: 'Failed to fetch participant courses' });
            }
            res.json(rows);
        }
    );
});

module.exports = router;
