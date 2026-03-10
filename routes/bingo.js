const express = require('express');
const router = express.Router();
const { requireAdminToken } = require('./auth');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get bingo configuration
 */
async function getBingoConfig(db) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM bingo_config ORDER BY id DESC LIMIT 1', (err, row) => {
            if (err) reject(err);
            else resolve(row || {
                active: 0,
                time_limit_minutes: 60,
                points_per_task: 10,
                bonus_row_points: 50,
                bonus_full_card_points: 100,
                card_size: 5
            });
        });
    });
}

/**
 * Get participant by code
 */
async function getParticipant(db, participantCode) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
            [participantCode],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

/**
 * Get random tasks for bingo card (25 tasks for 5x5 grid)
 */
async function getRandomTasks(db, count = 25) {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT * FROM bingo_tasks WHERE active = 1 ORDER BY RANDOM() LIMIT ?',
            [count],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            }
        );
    });
}

/**
 * Get bingo card for participant
 */
async function getParticipantCard(db, participantCode) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM bingo_cards WHERE participant_code = ? ORDER BY created_at DESC LIMIT 1',
            [participantCode],
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

/**
 * Get completions for a card
 */
async function getCardCompletions(db, cardId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT bc.*, bt.task_text, bt.category,
                    p1.first_name as participant_first_name, p1.last_name as participant_last_name,
                    p2.first_name as matched_first_name, p2.last_name as matched_last_name
             FROM bingo_completions bc
             JOIN bingo_tasks bt ON bc.task_id = bt.id
             JOIN participants p1 ON bc.participant_code = p1.participant_code
             JOIN participants p2 ON bc.matched_participant_code = p2.participant_code
             WHERE bc.card_id = ?
             ORDER BY bc.completed_at ASC`,
            [cardId],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

/**
 * Get participant stats
 */
async function getParticipantStats(db, participantCode) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM bingo_stats WHERE participant_code = ?',
            [participantCode],
            (err, row) => {
                if (err) reject(err);
                else resolve(row || {
                    participant_code: participantCode,
                    tasks_completed: 0,
                    rows_completed: 0,
                    columns_completed: 0,
                    diagonals_completed: 0,
                    full_card_completed: 0,
                    total_points: 0
                });
            }
        );
    });
}

/**
 * Check for achievements (rows, columns, diagonals, full card)
 * Returns: { rows: [0,1,2...], columns: [0,1,2...], diagonals: [0,1], fullCard: boolean }
 */
function checkAchievements(completions, cardSize = 5) {
    // Create grid of completed positions
    const grid = Array(cardSize).fill(null).map(() => Array(cardSize).fill(false));

    // Mark center as free space (position 12 for 5x5)
    const centerPos = Math.floor(cardSize * cardSize / 2);
    const centerRow = Math.floor(centerPos / cardSize);
    const centerCol = centerPos % cardSize;
    grid[centerRow][centerCol] = true;

    // Mark completed positions
    completions.forEach(completion => {
        const row = Math.floor(completion.position_on_card / cardSize);
        const col = completion.position_on_card % cardSize;
        grid[row][col] = true;
    });

    const achievements = {
        rows: [],
        columns: [],
        diagonals: [],
        fullCard: false
    };

    // Check rows
    for (let row = 0; row < cardSize; row++) {
        if (grid[row].every(cell => cell === true)) {
            achievements.rows.push(row);
        }
    }

    // Check columns
    for (let col = 0; col < cardSize; col++) {
        if (grid.every(row => row[col] === true)) {
            achievements.columns.push(col);
        }
    }

    // Check diagonal (top-left to bottom-right)
    if (Array.from({ length: cardSize }, (_, i) => grid[i][i]).every(cell => cell === true)) {
        achievements.diagonals.push(0);
    }

    // Check diagonal (top-right to bottom-left)
    if (Array.from({ length: cardSize }, (_, i) => grid[i][cardSize - 1 - i]).every(cell => cell === true)) {
        achievements.diagonals.push(1);
    }

    // Check full card
    achievements.fullCard = grid.every(row => row.every(cell => cell === true));

    return achievements;
}

/**
 * Calculate points based on completions and achievements
 */
function calculatePoints(completions, achievements, config) {
    let points = completions.length * config.points_per_task;

    const totalAchievements = achievements.rows.length +
                              achievements.columns.length +
                              achievements.diagonals.length;

    points += totalAchievements * config.bonus_row_points;

    if (achievements.fullCard) {
        points += config.bonus_full_card_points;
    }

    return points;
}

/**
 * Update participant stats
 */
async function updateParticipantStats(db, participantCode, completions, achievements, totalPoints) {
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();

        db.run(
            `INSERT OR REPLACE INTO bingo_stats (
                participant_code,
                tasks_completed,
                rows_completed,
                columns_completed,
                diagonals_completed,
                full_card_completed,
                total_points,
                first_row_at,
                first_full_card_at,
                last_completion_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?,
                COALESCE((SELECT first_row_at FROM bingo_stats WHERE participant_code = ?), ?),
                COALESCE((SELECT first_full_card_at FROM bingo_stats WHERE participant_code = ?), ?),
                ?)`,
            [
                participantCode,
                completions.length,
                achievements.rows.length,
                achievements.columns.length,
                achievements.diagonals.length,
                achievements.fullCard ? 1 : 0,
                totalPoints,
                participantCode,
                (achievements.rows.length > 0 || achievements.columns.length > 0 || achievements.diagonals.length > 0) ? now : null,
                participantCode,
                achievements.fullCard ? now : null,
                now
            ],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// ============================================================================
// PARTICIPANT ENDPOINTS
// ============================================================================

/**
 * POST /api/bingo/start - Start or resume bingo card
 */
router.post('/start', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.body;

    if (!participant_code) {
        return res.status(400).json({ error: 'participant_code er påkrevd' });
    }

    try {
        // Get participant
        const participant = await getParticipant(db, participant_code);
        if (!participant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet' });
        }

        if (participant.no_show) {
            return res.status(403).json({ error: 'Du er markert som ikke møtt' });
        }

        // Get config
        const config = await getBingoConfig(db);

        // Check if bingo is active
        if (!config.active) {
            return res.status(400).json({ error: 'Bingo er ikke aktivert' });
        }

        // Check if participant already has a card
        const existingCard = await getParticipantCard(db, participant_code);

        if (existingCard) {
            // Resume existing card
            const cardLayout = JSON.parse(existingCard.card_layout);
            const tasks = await new Promise((resolve, reject) => {
                const placeholders = cardLayout.map(() => '?').join(',');
                db.all(
                    `SELECT * FROM bingo_tasks WHERE id IN (${placeholders})`,
                    cardLayout,
                    (err, rows) => {
                        if (err) reject(err);
                        else {
                            // Sort tasks to match card layout order
                            const sortedTasks = cardLayout.map(id => rows.find(t => t.id === id));
                            resolve(sortedTasks);
                        }
                    }
                );
            });

            const completions = await getCardCompletions(db, existingCard.id);
            const achievements = checkAchievements(completions, config.card_size);
            const stats = await getParticipantStats(db, participant_code);

            return res.json({
                card_id: existingCard.id,
                tasks,
                layout: cardLayout,
                completions: completions.map(c => ({
                    position: c.position_on_card,
                    task_id: c.task_id,
                    matched_participant: {
                        code: c.matched_participant_code,
                        name: `${c.matched_first_name} ${c.matched_last_name}`
                    },
                    completed_at: c.completed_at
                })),
                achievements,
                stats,
                config: {
                    card_size: config.card_size,
                    points_per_task: config.points_per_task,
                    bonus_row_points: config.bonus_row_points,
                    bonus_full_card_points: config.bonus_full_card_points,
                    time_limit_minutes: config.time_limit_minutes
                }
            });
        }

        // Create new card
        const tasks = await getRandomTasks(db, config.card_size * config.card_size);

        if (tasks.length < config.card_size * config.card_size) {
            return res.status(500).json({
                error: `Ikke nok oppgaver tilgjengelig. Trenger ${config.card_size * config.card_size}, fant bare ${tasks.length}`
            });
        }

        const cardLayout = tasks.map(t => t.id);

        const cardId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO bingo_cards (participant_code, card_layout)
                 VALUES (?, ?)`,
                [participant_code, JSON.stringify(cardLayout)],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Initialize stats
        await updateParticipantStats(db, participant_code, [], { rows: [], columns: [], diagonals: [], fullCard: false }, 0);

        res.status(201).json({
            card_id: cardId,
            tasks,
            layout: cardLayout,
            completions: [],
            achievements: { rows: [], columns: [], diagonals: [], fullCard: false },
            stats: {
                participant_code,
                tasks_completed: 0,
                rows_completed: 0,
                columns_completed: 0,
                diagonals_completed: 0,
                full_card_completed: 0,
                total_points: 0
            },
            config: {
                card_size: config.card_size,
                points_per_task: config.points_per_task,
                bonus_row_points: config.bonus_row_points,
                bonus_full_card_points: config.bonus_full_card_points,
                time_limit_minutes: config.time_limit_minutes
            }
        });

    } catch (err) {
        console.error('Error starting bingo:', err);
        res.status(500).json({ error: 'Kunne ikke starte bingo' });
    }
});

/**
 * GET /api/bingo/card/:participant_code - Get current card
 */
router.get('/card/:participant_code', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.params;

    try {
        const card = await getParticipantCard(db, participant_code);

        if (!card) {
            return res.status(404).json({ error: 'Ingen bingo-kort funnet' });
        }

        const config = await getBingoConfig(db);
        const cardLayout = JSON.parse(card.card_layout);

        const tasks = await new Promise((resolve, reject) => {
            const placeholders = cardLayout.map(() => '?').join(',');
            db.all(
                `SELECT * FROM bingo_tasks WHERE id IN (${placeholders})`,
                cardLayout,
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        const sortedTasks = cardLayout.map(id => rows.find(t => t.id === id));
                        resolve(sortedTasks);
                    }
                }
            );
        });

        const completions = await getCardCompletions(db, card.id);
        const achievements = checkAchievements(completions, config.card_size);
        const stats = await getParticipantStats(db, participant_code);

        res.json({
            card_id: card.id,
            tasks,
            layout: cardLayout,
            completions: completions.map(c => ({
                position: c.position_on_card,
                task_id: c.task_id,
                matched_participant: {
                    code: c.matched_participant_code,
                    name: `${c.matched_first_name} ${c.matched_last_name}`
                },
                completed_at: c.completed_at
            })),
            achievements,
            stats
        });

    } catch (err) {
        console.error('Error getting card:', err);
        res.status(500).json({ error: 'Kunne ikke hente bingo-kort' });
    }
});

/**
 * POST /api/bingo/scan - Record task completion
 */
router.post('/scan', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code, scanned_code, task_id, position } = req.body;

    if (!participant_code || !scanned_code || !task_id || position === undefined) {
        return res.status(400).json({
            error: 'participant_code, scanned_code, task_id, og position er påkrevd'
        });
    }

    try {
        // Get config
        const config = await getBingoConfig(db);

        if (!config.active) {
            return res.status(400).json({ error: 'Bingo er ikke aktivert' });
        }

        // Validate participants
        const participant = await getParticipant(db, participant_code);
        const scannedParticipant = await getParticipant(db, scanned_code);

        if (!participant || !scannedParticipant) {
            return res.status(404).json({ error: 'Deltaker ikke funnet' });
        }

        if (participant_code === scanned_code) {
            return res.status(400).json({ error: 'Du kan ikke scanne deg selv' });
        }

        // Get card
        const card = await getParticipantCard(db, participant_code);

        if (!card) {
            return res.status(404).json({ error: 'Bingo-kort ikke funnet' });
        }

        // Verify task is on card at correct position
        const cardLayout = JSON.parse(card.card_layout);
        if (cardLayout[position] !== task_id) {
            return res.status(400).json({ error: 'Oppgaven matcher ikke posisjonen på kortet' });
        }

        // Check if already completed
        const existingCompletion = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM bingo_completions WHERE card_id = ? AND task_id = ?',
                [card.id, task_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingCompletion) {
            return res.status(400).json({ error: 'Denne oppgaven er allerede fullført' });
        }

        // Record completion
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO bingo_completions (
                    card_id, task_id, participant_code, matched_participant_code, position_on_card
                ) VALUES (?, ?, ?, ?, ?)`,
                [card.id, task_id, participant_code, scanned_code, position],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get updated completions and check achievements
        const completions = await getCardCompletions(db, card.id);
        const achievements = checkAchievements(completions, config.card_size);
        const totalPoints = calculatePoints(completions, achievements, config);

        // Update stats
        await updateParticipantStats(db, participant_code, completions, achievements, totalPoints);

        // Detect new achievements
        const newAchievements = [];
        if (achievements.rows.length > 0 && completions.length === (achievements.rows[0] + 1) * config.card_size) {
            newAchievements.push({ type: 'row', index: achievements.rows[0] });
        }
        if (achievements.columns.length > 0 && !newAchievements.find(a => a.type === 'row')) {
            newAchievements.push({ type: 'column', index: achievements.columns[0] });
        }
        if (achievements.diagonals.length > 0 && !newAchievements.find(a => a.type === 'row' || a.type === 'column')) {
            newAchievements.push({ type: 'diagonal', index: achievements.diagonals[0] });
        }
        if (achievements.fullCard) {
            newAchievements.push({ type: 'full_card' });
        }

        res.json({
            success: true,
            message: 'Oppgave fullført!',
            points_earned: config.points_per_task,
            total_points: totalPoints,
            matched_participant: {
                code: scanned_code,
                name: `${scannedParticipant.first_name} ${scannedParticipant.last_name}`
            },
            achievements: newAchievements,
            stats: {
                tasks_completed: completions.length,
                rows_completed: achievements.rows.length,
                columns_completed: achievements.columns.length,
                diagonals_completed: achievements.diagonals.length,
                full_card_completed: achievements.fullCard
            }
        });

    } catch (err) {
        console.error('Error recording scan:', err);
        res.status(500).json({ error: 'Kunne ikke registrere scanning' });
    }
});

/**
 * GET /api/bingo/status/:participant_code - Get participant status
 */
router.get('/status/:participant_code', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.params;

    try {
        const stats = await getParticipantStats(db, participant_code);
        const config = await getBingoConfig(db);

        res.json({
            stats,
            config: {
                active: config.active,
                time_limit_minutes: config.time_limit_minutes,
                start_time: config.start_time,
                end_time: config.end_time
            }
        });

    } catch (err) {
        console.error('Error getting status:', err);
        res.status(500).json({ error: 'Kunne ikke hente status' });
    }
});

/**
 * GET /api/bingo/leaderboard - Get leaderboard
 */
router.get('/leaderboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const leaderboard = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    bs.*,
                    p.first_name,
                    p.last_name,
                    p.age,
                    p.team,
                    p.club,
                    p.profile_photo_path
                 FROM bingo_stats bs
                 JOIN participants p ON bs.participant_code = p.participant_code
                 WHERE p.active = 1 AND p.no_show = 0
                 ORDER BY
                    bs.full_card_completed DESC,
                    bs.first_full_card_at ASC,
                    (bs.rows_completed + bs.columns_completed + bs.diagonals_completed) DESC,
                    bs.tasks_completed DESC,
                    bs.total_points DESC,
                    bs.first_row_at ASC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            rank: index + 1,
            participant_code: entry.participant_code,
            first_name: entry.first_name,
            last_name: entry.last_name,
            age: entry.age,
            team: entry.team,
            club: entry.club,
            profile_photo_path: entry.profile_photo_path,
            tasks_completed: entry.tasks_completed,
            rows_completed: entry.rows_completed,
            columns_completed: entry.columns_completed,
            diagonals_completed: entry.diagonals_completed,
            full_card_completed: entry.full_card_completed,
            total_points: entry.total_points,
            first_row_at: entry.first_row_at,
            first_full_card_at: entry.first_full_card_at
        }));

        res.json(rankedLeaderboard);

    } catch (err) {
        console.error('Error getting leaderboard:', err);
        res.status(500).json({ error: 'Kunne ikke hente resultatliste' });
    }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * GET /api/bingo/admin/config - Get configuration
 */
router.get('/admin/config', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;

    try {
        const config = await getBingoConfig(db);
        res.json(config);
    } catch (err) {
        console.error('Error getting config:', err);
        res.status(500).json({ error: 'Kunne ikke hente konfigurasjon' });
    }
});

/**
 * POST /api/bingo/admin/config - Update configuration
 */
router.post('/admin/config', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;
    const {
        active,
        time_limit_minutes,
        points_per_task,
        bonus_row_points,
        bonus_full_card_points,
        start_time,
        end_time
    } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE bingo_config SET
                    active = COALESCE(?, active),
                    time_limit_minutes = COALESCE(?, time_limit_minutes),
                    points_per_task = COALESCE(?, points_per_task),
                    bonus_row_points = COALESCE(?, bonus_row_points),
                    bonus_full_card_points = COALESCE(?, bonus_full_card_points),
                    start_time = COALESCE(?, start_time),
                    end_time = COALESCE(?, end_time)
                 WHERE id = (SELECT MAX(id) FROM bingo_config)`,
                [active, time_limit_minutes, points_per_task, bonus_row_points, bonus_full_card_points, start_time, end_time],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        const config = await getBingoConfig(db);
        res.json({ success: true, config });

    } catch (err) {
        console.error('Error updating config:', err);
        res.status(500).json({ error: 'Kunne ikke oppdatere konfigurasjon' });
    }
});

/**
 * GET /api/bingo/admin/tasks - Get all tasks
 */
router.get('/admin/tasks', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const tasks = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM bingo_tasks ORDER BY order_number ASC, created_at ASC',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json(tasks);

    } catch (err) {
        console.error('Error getting tasks:', err);
        res.status(500).json({ error: 'Kunne ikke hente oppgaver' });
    }
});

/**
 * POST /api/bingo/admin/tasks - Create new task
 */
router.post('/admin/tasks', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;
    const { task_text, category } = req.body;

    if (!task_text) {
        return res.status(400).json({ error: 'task_text er påkrevd' });
    }

    try {
        const maxOrder = await new Promise((resolve, reject) => {
            db.get(
                'SELECT MAX(order_number) as max_order FROM bingo_tasks',
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row?.max_order || 0);
                }
            );
        });

        const taskId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO bingo_tasks (task_text, category, order_number)
                 VALUES (?, ?, ?)`,
                [task_text, category || 'Annet', maxOrder + 1],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        const task = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM bingo_tasks WHERE id = ?',
                [taskId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.status(201).json(task);

    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ error: 'Kunne ikke opprette oppgave' });
    }
});

/**
 * PUT /api/bingo/admin/tasks/:id - Update task
 */
router.put('/admin/tasks/:id', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { task_text, category, active, order_number } = req.body;

    try {
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE bingo_tasks SET
                    task_text = COALESCE(?, task_text),
                    category = COALESCE(?, category),
                    active = COALESCE(?, active),
                    order_number = COALESCE(?, order_number)
                 WHERE id = ?`,
                [task_text, category, active, order_number, id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        const task = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM bingo_tasks WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!task) {
            return res.status(404).json({ error: 'Oppgave ikke funnet' });
        }

        res.json(task);

    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ error: 'Kunne ikke oppdatere oppgave' });
    }
});

/**
 * DELETE /api/bingo/admin/tasks/:id - Delete task
 */
router.delete('/admin/tasks/:id', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        // Check if task is used in any cards
        const usageCount = await new Promise((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) as count FROM bingo_completions WHERE task_id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row.count);
                }
            );
        });

        if (usageCount > 0) {
            return res.status(400).json({
                error: `Kan ikke slette oppgave som er brukt i ${usageCount} fullføringer`
            });
        }

        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM bingo_tasks WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({ success: true, message: 'Oppgave slettet' });

    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ error: 'Kunne ikke slette oppgave' });
    }
});

/**
 * GET /api/bingo/admin/stats - Get comprehensive statistics
 */
router.get('/admin/stats', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Overall stats
        const overallStats = await new Promise((resolve, reject) => {
            db.get(
                `SELECT
                    COUNT(DISTINCT bs.participant_code) as total_participants,
                    AVG(bs.tasks_completed) as avg_tasks_completed,
                    SUM(bs.rows_completed) as total_rows,
                    SUM(bs.columns_completed) as total_columns,
                    SUM(bs.diagonals_completed) as total_diagonals,
                    SUM(bs.full_card_completed) as total_full_cards,
                    MAX(bs.total_points) as highest_points
                 FROM bingo_stats bs
                 JOIN participants p ON bs.participant_code = p.participant_code
                 WHERE p.no_show = 0`,
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Most popular tasks
        const popularTasks = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    bt.id,
                    bt.task_text,
                    bt.category,
                    COUNT(*) as completion_count
                 FROM bingo_completions bc
                 JOIN bingo_tasks bt ON bc.task_id = bt.id
                 GROUP BY bt.id
                 ORDER BY completion_count DESC
                 LIMIT 10`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Completion timeline
        const timeline = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    DATE(completed_at) as date,
                    COUNT(*) as completions
                 FROM bingo_completions
                 GROUP BY DATE(completed_at)
                 ORDER BY date ASC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Top performers
        const topPerformers = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    bs.*,
                    p.first_name,
                    p.last_name
                 FROM bingo_stats bs
                 JOIN participants p ON bs.participant_code = p.participant_code
                 WHERE p.no_show = 0
                 ORDER BY bs.total_points DESC
                 LIMIT 10`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json({
            overall: {
                totalParticipants: overallStats.total_participants || 0,
                avgTasksCompleted: parseFloat(overallStats.avg_tasks_completed || 0).toFixed(1),
                totalRows: overallStats.total_rows || 0,
                totalColumns: overallStats.total_columns || 0,
                totalDiagonals: overallStats.total_diagonals || 0,
                totalFullCards: overallStats.total_full_cards || 0,
                highestPoints: overallStats.highest_points || 0
            },
            popularTasks,
            timeline,
            topPerformers
        });

    } catch (err) {
        console.error('Error getting stats:', err);
        res.status(500).json({ error: 'Kunne ikke hente statistikk' });
    }
});

/**
 * POST /api/bingo/admin/reset - Reset all bingo data
 */
router.post('/admin/reset', requireAdminToken, async (req, res) => {
    const db = req.app.locals.db;

    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM bingo_completions', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM bingo_cards', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM bingo_stats', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, message: 'Alle bingo-data er nullstilt' });

    } catch (err) {
        console.error('Error resetting bingo:', err);
        res.status(500).json({ error: 'Kunne ikke nullstille bingo' });
    }
});

module.exports = router;
