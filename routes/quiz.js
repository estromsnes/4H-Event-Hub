const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadsDir = path.join(__dirname, '..', 'uploads', 'quiz-images');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        cb(null, 'quiz-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ============================================================================
// ADMIN ENDPOINTS - Question Management
// ============================================================================

// GET /api/quiz/questions - Get all questions
router.get('/questions', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const questions = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM quiz_questions ORDER BY order_number ASC, id ASC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json(questions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ error: 'Kunne ikke hente spørsmål' });
    }
});

// GET /api/quiz/questions/count - Get count of active questions
router.get('/questions/count', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const result = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM quiz_questions WHERE active = 1`,
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json({ count: result.count });
    } catch (err) {
        console.error('Error counting questions:', err);
        res.status(500).json({ error: 'Kunne ikke telle spørsmål' });
    }
});

// POST /api/quiz/questions - Create new question
router.post('/questions', async (req, res) => {
    const db = req.app.locals.db;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds, order_number } = req.body;

    // Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
        return res.status(400).json({ error: 'Alle felter er påkrevd' });
    }

    // Validate correct_option (can be comma-separated like "A,C")
    const correctAnswers = correct_option.split(',').map(a => a.trim());
    for (const answer of correctAnswers) {
        if (!['A', 'B', 'C', 'D'].includes(answer)) {
            return res.status(400).json({ error: 'Riktig svar må være A, B, C eller D' });
        }
    }

    try {
        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO quiz_questions (question_text, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds, order_number)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [question_text, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds || 30, order_number || 999],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Fetch the created question
        const question = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_questions WHERE id = ?`,
                [result],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.status(201).json(question);
    } catch (err) {
        console.error('Error creating question:', err);
        res.status(500).json({ error: 'Kunne ikke opprette spørsmål' });
    }
});

// PUT /api/quiz/questions/:id - Update question
router.put('/questions/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds, order_number, active } = req.body;

    // Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
        return res.status(400).json({ error: 'Alle felter er påkrevd' });
    }

    // Validate correct_option (can be comma-separated like "A,C")
    const correctAnswers = correct_option.split(',').map(a => a.trim());
    for (const answer of correctAnswers) {
        if (!['A', 'B', 'C', 'D'].includes(answer)) {
            return res.status(400).json({ error: 'Riktig svar må være A, B, C eller D' });
        }
    }

    try {
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE quiz_questions
                 SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?,
                     correct_option = ?, time_limit_seconds = ?, order_number = ?, active = ?
                 WHERE id = ?`,
                [question_text, option_a, option_b, option_c, option_d, correct_option, time_limit_seconds || 30, order_number || 999, active !== undefined ? active : 1, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Fetch the updated question
        const question = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_questions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!question) {
            return res.status(404).json({ error: 'Spørsmål ikke funnet' });
        }

        res.json(question);
    } catch (err) {
        console.error('Error updating question:', err);
        res.status(500).json({ error: 'Kunne ikke oppdatere spørsmål' });
    }
});

// DELETE /api/quiz/questions/:id - Delete question
router.delete('/questions/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        // Get question to check for image
        const question = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_questions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!question) {
            return res.status(404).json({ error: 'Spørsmål ikke funnet' });
        }

        // Delete image file if exists
        if (question.image_path) {
            const imagePath = path.join(__dirname, '..', question.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete question
        await new Promise((resolve, reject) => {
            db.run(
                `DELETE FROM quiz_questions WHERE id = ?`,
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ message: 'Spørsmål slettet' });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ error: 'Kunne ikke slette spørsmål' });
    }
});

// POST /api/quiz/questions/:id/image - Upload question image
router.post('/questions/:id/image', upload.single('image'), async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: 'Ingen bilde lastet opp' });
    }

    try {
        // Get existing question
        const question = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_questions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!question) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Spørsmål ikke funnet' });
        }

        // Delete old image if exists
        if (question.image_path) {
            const oldImagePath = path.join(__dirname, '..', question.image_path);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Resize and optimize image
        const outputPath = req.file.path;
        await sharp(req.file.path)
            .resize(1200, 1200, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 })
            .toFile(outputPath + '.tmp');

        // Replace original with optimized version
        fs.unlinkSync(outputPath);
        fs.renameSync(outputPath + '.tmp', outputPath);

        // Update database with image path
        const imagePath = `/uploads/quiz-images/${req.file.filename}`;
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE quiz_questions SET image_path = ? WHERE id = ?`,
                [imagePath, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ image_path: imagePath });
    } catch (err) {
        console.error('Error uploading image:', err);
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Kunne ikke laste opp bilde' });
    }
});

// DELETE /api/quiz/questions/:id/image - Delete question image
router.delete('/questions/:id/image', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        const question = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_questions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!question) {
            return res.status(404).json({ error: 'Spørsmål ikke funnet' });
        }

        if (question.image_path) {
            const imagePath = path.join(__dirname, '..', question.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Update database
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE quiz_questions SET image_path = NULL WHERE id = ?`,
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ message: 'Bilde slettet' });
    } catch (err) {
        console.error('Error deleting image:', err);
        res.status(500).json({ error: 'Kunne ikke slette bilde' });
    }
});

// ============================================================================
// PARTICIPANT ENDPOINTS - Quiz Taking
// ============================================================================

// POST /api/quiz/start - Start quiz session
router.post('/start', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.body;

    if (!participant_code) {
        return res.status(400).json({ error: 'Deltakerkode er påkrevd' });
    }

    try {
        // Look up participant to get team
        const participant = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM participants WHERE participant_code = ? AND active = 1`,
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!participant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet' });
        }

        if (!participant.team || participant.team === '') {
            return res.status(400).json({ error: 'Du må være tildelt et lag for å ta quizen' });
        }

        if (participant.role !== 'Deltaker') {
            return res.status(400).json({ error: 'Kun deltakere med rolle "Deltaker" kan ta quizen' });
        }

        const teamName = participant.team;

        // Check for existing active session
        const activeSession = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_sessions WHERE team_name = ? AND status = 'active'`,
                [teamName],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (activeSession) {
            // Return existing session
            const answeredCount = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) as count FROM quiz_answers WHERE session_id = ?`,
                    [activeSession.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row.count);
                    }
                );
            });

            return res.json({
                session_id: activeSession.id,
                team_name: activeSession.team_name,
                total_questions: activeSession.total_questions,
                answered_questions: answeredCount,
                status: 'resumed'
            });
        }

        // Count active questions
        const totalQuestions = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM quiz_questions WHERE active = 1`,
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                }
            );
        });

        if (totalQuestions === 0) {
            return res.status(400).json({ error: 'Ingen spørsmål tilgjengelig' });
        }

        // Create new session
        const sessionId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO quiz_sessions (team_name, total_questions)
                 VALUES (?, ?)`,
                [teamName, totalQuestions],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        res.status(201).json({
            session_id: sessionId,
            team_name: teamName,
            total_questions: totalQuestions,
            answered_questions: 0,
            status: 'new'
        });

    } catch (err) {
        console.error('Error starting quiz:', err);
        res.status(500).json({ error: 'Kunne ikke starte quiz' });
    }
});

// GET /api/quiz/session/:id/question - Get next unanswered question
router.get('/session/:id/question', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        // Verify session exists and is active
        const session = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_sessions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!session) {
            return res.status(404).json({ error: 'Økten ikke funnet' });
        }

        if (session.status === 'completed') {
            return res.status(400).json({ error: 'Quiz er allerede fullført' });
        }

        // Get answered question IDs
        const answeredIds = await new Promise((resolve, reject) => {
            db.all(
                `SELECT question_id FROM quiz_answers WHERE session_id = ?`,
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(r => r.question_id));
                }
            );
        });

        // Get next unanswered question
        let query = `SELECT id, question_text, image_path, option_a, option_b, option_c, option_d, correct_option, order_number, time_limit_seconds
                     FROM quiz_questions
                     WHERE active = 1`;

        if (answeredIds.length > 0) {
            query += ` AND id NOT IN (${answeredIds.join(',')})`;
        }

        query += ` ORDER BY order_number ASC, id ASC LIMIT 1`;

        const question = await new Promise((resolve, reject) => {
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!question) {
            return res.status(404).json({ error: 'Ingen flere spørsmål', all_completed: true });
        }

        // Calculate progress
        const questionNumber = answeredIds.length + 1;
        const isLastQuestion = questionNumber === session.total_questions;

        // Check if multiple choice (more than one correct answer)
        const correctAnswers = question.correct_option
            ? question.correct_option.split(',').map(a => a.trim()).filter(a => a)
            : ['A'];
        const isMultipleChoice = correctAnswers.length > 1;

        // Debug log
        console.log(`Question ${question.id}: correct_option="${question.correct_option}", parsed=${correctAnswers.length} answers, isMultipleChoice=${isMultipleChoice}`);

        res.json({
            question_id: question.id,
            question_text: question.question_text,
            image_path: question.image_path,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            time_limit_seconds: question.time_limit_seconds || 30,
            is_multiple_choice: isMultipleChoice,
            question_number: questionNumber,
            total_questions: session.total_questions,
            is_last_question: isLastQuestion
        });

    } catch (err) {
        console.error('Error fetching question:', err);
        res.status(500).json({ error: 'Kunne ikke hente spørsmål' });
    }
});

// POST /api/quiz/session/:id/answer - Submit answer
router.post('/session/:id/answer', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { question_id, selected_options, time_taken } = req.body;

    if (!question_id || selected_options === undefined || selected_options === null) {
        return res.status(400).json({ error: 'Spørsmål-ID og valgte alternativer er påkrevd' });
    }

    // Normalize selected_options to array (allow empty arrays)
    let selectedArray;
    if (Array.isArray(selected_options)) {
        selectedArray = selected_options;
    } else if (typeof selected_options === 'string' && selected_options.trim() === '') {
        selectedArray = [];
    } else if (typeof selected_options === 'string') {
        selectedArray = selected_options.split(',');
    } else {
        selectedArray = [];
    }

    // Validate all selected options (skip if empty - timer expired)
    for (const opt of selectedArray) {
        const trimmed = opt.trim();
        if (trimmed && !['A', 'B', 'C', 'D'].includes(trimmed)) {
            return res.status(400).json({ error: 'Ugyldig alternativ' });
        }
    }

    // Filter out empty strings and create final string
    const filteredArray = selectedArray.filter(opt => opt.trim() !== '');
    const selectedOptionsStr = filteredArray.sort().join(',');

    try {
        // Verify session
        const session = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_sessions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!session) {
            return res.status(404).json({ error: 'Økten ikke funnet' });
        }

        if (session.status === 'completed') {
            return res.status(400).json({ error: 'Quiz er allerede fullført' });
        }

        // Check if already answered
        const existingAnswer = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_answers WHERE session_id = ? AND question_id = ?`,
                [id, question_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingAnswer) {
            return res.status(400).json({ error: 'Dette spørsmålet er allerede besvart' });
        }

        // Get question to check correct answer
        const question = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_questions WHERE id = ?`,
                [question_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!question) {
            return res.status(404).json({ error: 'Spørsmål ikke funnet' });
        }

        // Check if answer is correct (must match ALL correct answers, no more, no less)
        const correctAnswersStr = question.correct_option;
        const isCorrect = selectedOptionsStr === correctAnswersStr ? 1 : 0;

        // Save answer
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO quiz_answers (session_id, question_id, selected_options, is_correct, time_taken)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, question_id, selectedOptionsStr, isCorrect, time_taken || null],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Update total_time in session if time_taken is provided
        if (time_taken) {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE quiz_sessions SET total_time = total_time + ? WHERE id = ?`,
                    [time_taken, id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Get progress
        const progress = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as answered, SUM(is_correct) as correct
                 FROM quiz_answers WHERE session_id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        const allCompleted = progress.answered >= session.total_questions;

        // If completed, update session
        if (allCompleted) {
            await new Promise((resolve, reject) => {
                db.run(
                    `UPDATE quiz_sessions
                     SET status = 'completed',
                         end_time = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
                         correct_answers = ?,
                         score = ?
                     WHERE id = ?`,
                    [progress.correct || 0, progress.correct || 0, id],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.json({
            questions_answered: progress.answered,
            total_questions: session.total_questions,
            all_completed: allCompleted
        });

    } catch (err) {
        console.error('Error submitting answer:', err);
        res.status(500).json({ error: 'Kunne ikke lagre svar' });
    }
});

// GET /api/quiz/session/:id/results - Get quiz results
router.get('/session/:id/results', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        const session = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM quiz_sessions WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!session) {
            return res.status(404).json({ error: 'Økten ikke funnet' });
        }

        // Get all questions with answer status
        const results = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    q.id,
                    q.question_text,
                    q.option_a,
                    q.option_b,
                    q.option_c,
                    q.option_d,
                    q.correct_option,
                    a.selected_options,
                    a.is_correct
                 FROM quiz_questions q
                 LEFT JOIN quiz_answers a ON q.id = a.question_id AND a.session_id = ?
                 WHERE q.active = 1
                 ORDER BY q.order_number ASC, q.id ASC`,
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        res.json({
            session_id: session.id,
            team_name: session.team_name,
            total_questions: session.total_questions,
            correct_answers: session.correct_answers,
            score: session.score,
            total_time: session.total_time || 0,
            status: session.status,
            completed_at: session.end_time,
            questions: results.map(r => ({
                question_id: r.id,
                question_text: r.question_text,
                option_a: r.option_a,
                option_b: r.option_b,
                option_c: r.option_c,
                option_d: r.option_d,
                correct_option: r.correct_option,
                selected_options: r.selected_options,
                is_correct: r.is_correct === 1
            }))
        });

    } catch (err) {
        console.error('Error fetching results:', err);
        res.status(500).json({ error: 'Kunne ikke hente resultater' });
    }
});

// GET /api/quiz/leaderboard - Get team rankings
router.get('/leaderboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get event start time
        const event = await new Promise((resolve, reject) => {
            db.get(
                `SELECT start_datetime FROM event_info WHERE active = 1 LIMIT 1`,
                [],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Get all completed sessions (sort by score DESC, then total_time ASC - faster is better)
        const sessions = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM quiz_sessions WHERE status = 'completed' ORDER BY score DESC, total_time ASC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Filter by event start time if exists
        let filteredSessions = sessions;
        if (event && event.start_datetime) {
            const eventStart = new Date(event.start_datetime);
            filteredSessions = sessions.filter(session => {
                const completionTime = new Date(session.end_time);
                return completionTime >= eventStart;
            });
        }

        // Get team photos (from first participant in each team)
        const teamsWithPhotos = await Promise.all(filteredSessions.map(async (session) => {
            const participant = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT team_photo_path FROM participants
                     WHERE team = ? AND team_photo_path IS NOT NULL
                     LIMIT 1`,
                    [session.team_name],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            return {
                ...session,
                team_photo_path: participant ? participant.team_photo_path : null
            };
        }));

        // Add rank
        const leaderboard = teamsWithPhotos.map((session, index) => ({
            rank: index + 1,
            team_name: session.team_name,
            score: session.score,
            correct_answers: session.correct_answers,
            total_questions: session.total_questions,
            total_time: session.total_time || 0,
            completed_at: session.end_time,
            team_photo_path: session.team_photo_path
        }));

        res.json({ leaderboard });

    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Kunne ikke hente resultattavle' });
    }
});

module.exports = router;
