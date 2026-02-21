const express = require('express');
const router = express.Router();

// GET all active teams
router.get('/', (req, res) => {
    const db = req.app.locals.db;

    db.all(
        'SELECT * FROM teams WHERE active = 1 ORDER BY name ASC',
        [],
        (err, rows) => {
            if (err) {
                console.error('Error fetching teams:', err);
                return res.status(500).json({ error: 'Failed to fetch teams' });
            }
            res.json(rows);
        }
    );
});

// GET team scoreboard (aggregate from all activities)
router.get('/scoreboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get all teams
        const teams = await new Promise((resolve, reject) => {
            db.all(
                'SELECT * FROM teams WHERE active = 1',
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Calculate points for each team
        const teamScores = await Promise.all(teams.map(async (team) => {
            // Quiz points
            const quizPoints = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COALESCE(SUM(score), 0) as total
                     FROM quiz_sessions
                     WHERE team_name = ?`,
                    [team.name],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row ? row.total : 0);
                    }
                );
            });

            // Scavenger hunt points (1 point per checkpoint scanned)
            const scavengerPoints = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) as total
                     FROM scavenger_scans ss
                     JOIN scavenger_sessions ses ON ss.session_id = ses.id
                     WHERE ses.team_name = ?`,
                    [team.name],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row ? row.total : 0);
                    }
                );
            });

            // Tic-tac-toe wins (3 points per win)
            const tttWins = await new Promise((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) as total
                     FROM tic_tac_toe_games
                     WHERE ((winner_code = player1_code AND player1_team = ?)
                            OR (winner_code = player2_code AND player2_team = ?))
                       AND status = 'completed'`,
                    [team.name, team.name],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row ? row.total : 0);
                    }
                );
            });

            const totalPoints = quizPoints + scavengerPoints + (tttWins * 3);

            return {
                name: team.name,
                description: team.description,
                quiz_points: quizPoints,
                scavenger_points: scavengerPoints,
                ttt_wins: tttWins,
                ttt_points: tttWins * 3,
                total_points: totalPoints
            };
        }));

        // Sort by total points descending
        teamScores.sort((a, b) => b.total_points - a.total_points);

        res.json(teamScores);
    } catch (err) {
        console.error('Error fetching scoreboard:', err);
        res.status(500).json({ error: 'Failed to fetch scoreboard' });
    }
});

// GET specific team by ID
router.get('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    db.get(
        'SELECT * FROM teams WHERE id = ? AND active = 1',
        [id],
        (err, row) => {
            if (err) {
                console.error('Error fetching team:', err);
                return res.status(500).json({ error: 'Failed to fetch team' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Team not found' });
            }

            res.json(row);
        }
    );
});

// POST create new team
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { name, description, max_members } = req.body;

    // Validate
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Team name is required' });
    }

    const maxMembersValue = max_members || 5;

    db.run(
        'INSERT INTO teams (name, description, max_members) VALUES (?, ?, ?)',
        [name.trim(), description || null, maxMembersValue],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Et lag med dette navnet eksisterer allerede' });
                }
                console.error('Error creating team:', err);
                return res.status(500).json({ error: 'Failed to create team' });
            }

            // Fetch and return the created team
            db.get(
                'SELECT * FROM teams WHERE id = ?',
                [this.lastID],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching created team:', err);
                        return res.status(500).json({ error: 'Team created but failed to fetch' });
                    }
                    res.status(201).json(row);
                }
            );
        }
    );
});

// PUT update team
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { name, description, max_members } = req.body;

    db.run(
        `UPDATE teams
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             max_members = COALESCE(?, max_members)
         WHERE id = ? AND active = 1`,
        [name, description, max_members, id],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Et lag med dette navnet eksisterer allerede' });
                }
                console.error('Error updating team:', err);
                return res.status(500).json({ error: 'Failed to update team' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Team not found' });
            }

            // Fetch and return updated team
            db.get(
                'SELECT * FROM teams WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching updated team:', err);
                        return res.status(500).json({ error: 'Updated but failed to fetch' });
                    }
                    res.json(row);
                }
            );
        }
    );
});

// DELETE team (soft delete)
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    // Check if any participants are using this team
    db.get(
        'SELECT COUNT(*) as count FROM participants WHERE team = (SELECT name FROM teams WHERE id = ?) AND active = 1',
        [id],
        (err, row) => {
            if (err) {
                console.error('Error checking team usage:', err);
                return res.status(500).json({ error: 'Failed to check team usage' });
            }

            if (row.count > 0) {
                return res.status(400).json({
                    error: `Kan ikke slette laget. ${row.count} deltaker(e) er tildelt dette laget.`
                });
            }

            // Soft delete the team
            db.run(
                'UPDATE teams SET active = 0 WHERE id = ?',
                [id],
                function(err) {
                    if (err) {
                        console.error('Error deleting team:', err);
                        return res.status(500).json({ error: 'Failed to delete team' });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({ error: 'Team not found' });
                    }

                    res.json({ message: 'Team deleted successfully' });
                }
            );
        }
    );
});

module.exports = router;
