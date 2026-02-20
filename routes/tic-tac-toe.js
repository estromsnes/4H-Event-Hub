const express = require('express');
const router = express.Router();

// POST /api/tic-tac-toe/start - Start a new game (player 1 scans)
router.post('/start', async (req, res) => {
    const db = req.app.locals.db;
    const { participant_code } = req.body;

    if (!participant_code) {
        return res.status(400).json({ error: 'participant_code er påkrevd' });
    }

    try {
        // Get participant info
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
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

        // Check if player already has a waiting game
        const existingGame = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM tic_tac_toe_games
                 WHERE player1_code = ? AND status = 'waiting_for_player2'
                 ORDER BY created_at DESC LIMIT 1`,
                [participant_code],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (existingGame) {
            // Return existing game
            return res.json({
                game_id: existingGame.id,
                status: 'waiting_for_player2',
                player1: {
                    code: existingGame.player1_code,
                    name: existingGame.player1_name,
                    team: existingGame.player1_team
                }
            });
        }

        // Create new game
        const gameId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO tic_tac_toe_games (
                    player1_code, player1_name, player1_team
                ) VALUES (?, ?, ?)`,
                [participant_code, `${participant.first_name} ${participant.last_name}`, participant.team],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        res.status(201).json({
            game_id: gameId,
            status: 'waiting_for_player2',
            player1: {
                code: participant_code,
                name: `${participant.first_name} ${participant.last_name}`,
                team: participant.team
            }
        });

    } catch (err) {
        console.error('Error starting game:', err);
        res.status(500).json({ error: 'Kunne ikke starte spill' });
    }
});

// POST /api/tic-tac-toe/join - Join a game (player 2 scans)
router.post('/join', async (req, res) => {
    const db = req.app.locals.db;
    const { game_id, participant_code } = req.body;

    if (!game_id || !participant_code) {
        return res.status(400).json({ error: 'game_id og participant_code er påkrevd' });
    }

    try {
        // Get game
        const game = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM tic_tac_toe_games WHERE id = ?',
                [game_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!game) {
            return res.status(404).json({ error: 'Spill ikke funnet' });
        }

        if (game.status !== 'waiting_for_player2') {
            return res.status(400).json({ error: 'Spillet er allerede startet eller fullført' });
        }

        if (game.player1_code === participant_code) {
            return res.status(400).json({ error: 'Du kan ikke spille mot deg selv!' });
        }

        // Get participant info
        const participant = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM participants WHERE participant_code = ? AND active = 1',
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

        // Randomly decide who starts (1 or 2)
        const startingPlayer = Math.random() < 0.5 ? 1 : 2;

        // Update game with player 2 and start it
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE tic_tac_toe_games
                 SET player2_code = ?,
                     player2_name = ?,
                     player2_team = ?,
                     status = 'in_progress',
                     starting_player = ?,
                     current_turn = ?,
                     started_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
                 WHERE id = ?`,
                [
                    participant_code,
                    `${participant.first_name} ${participant.last_name}`,
                    participant.team,
                    startingPlayer,
                    startingPlayer,
                    game_id
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get updated game
        const updatedGame = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM tic_tac_toe_games WHERE id = ?',
                [game_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json({
            game_id: updatedGame.id,
            status: 'in_progress',
            player1: {
                code: updatedGame.player1_code,
                name: updatedGame.player1_name,
                team: updatedGame.player1_team,
                symbol: 'X'
            },
            player2: {
                code: updatedGame.player2_code,
                name: updatedGame.player2_name,
                team: updatedGame.player2_team,
                symbol: 'O'
            },
            board: JSON.parse(updatedGame.board_state),
            current_turn: updatedGame.current_turn,
            starting_player: updatedGame.starting_player
        });

    } catch (err) {
        console.error('Error joining game:', err);
        res.status(500).json({ error: 'Kunne ikke bli med i spill' });
    }
});

// POST /api/tic-tac-toe/move - Make a move
router.post('/move', async (req, res) => {
    const db = req.app.locals.db;
    const { game_id, participant_code, position } = req.body;

    if (!game_id || !participant_code || position === undefined) {
        return res.status(400).json({ error: 'game_id, participant_code og position er påkrevd' });
    }

    if (position < 0 || position > 8) {
        return res.status(400).json({ error: 'Ugyldig posisjon (må være 0-8)' });
    }

    try {
        // Get game
        const game = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM tic_tac_toe_games WHERE id = ?',
                [game_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!game) {
            return res.status(404).json({ error: 'Spill ikke funnet' });
        }

        if (game.status !== 'in_progress') {
            return res.status(400).json({ error: 'Spillet er ikke i gang' });
        }

        // Determine which player is making the move
        let playerNumber;
        if (participant_code === game.player1_code) {
            playerNumber = 1;
        } else if (participant_code === game.player2_code) {
            playerNumber = 2;
        } else {
            return res.status(403).json({ error: 'Du er ikke med i dette spillet' });
        }

        // Check if it's this player's turn
        if (game.current_turn !== playerNumber) {
            return res.status(400).json({ error: 'Det er ikke din tur!' });
        }

        // Parse board
        const board = JSON.parse(game.board_state);

        // Check if position is empty
        if (board[position] !== '') {
            return res.status(400).json({ error: 'Denne ruten er allerede okkupert!' });
        }

        // Make the move
        const symbol = playerNumber === 1 ? 'X' : 'O';
        board[position] = symbol;

        // Check for winner
        const winner = checkWinner(board);
        const isDraw = !winner && board.every(cell => cell !== '');

        let newStatus = 'in_progress';
        let winnerCode = null;
        let winnerName = null;
        let result = null;

        if (winner) {
            newStatus = 'completed';
            winnerCode = participant_code;
            winnerName = playerNumber === 1 ? game.player1_name : game.player2_name;
            result = 'win';
        } else if (isDraw) {
            newStatus = 'completed';
            result = 'draw';
        }

        // Update game
        const nextTurn = game.current_turn === 1 ? 2 : 1;
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE tic_tac_toe_games
                 SET board_state = ?,
                     current_turn = ?,
                     status = ?,
                     winner_code = ?,
                     winner_name = ?,
                     result = ?,
                     completed_at = ${newStatus === 'completed' ? "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')" : 'NULL'}
                 WHERE id = ?`,
                [
                    JSON.stringify(board),
                    nextTurn,
                    newStatus,
                    winnerCode,
                    winnerName,
                    result,
                    game_id
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // Get updated game
        const updatedGame = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM tic_tac_toe_games WHERE id = ?',
                [game_id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        res.json({
            game_id: updatedGame.id,
            status: updatedGame.status,
            board: JSON.parse(updatedGame.board_state),
            current_turn: updatedGame.current_turn,
            winner: winner ? {
                code: updatedGame.winner_code,
                name: updatedGame.winner_name,
                player_number: playerNumber
            } : null,
            result: updatedGame.result
        });

    } catch (err) {
        console.error('Error making move:', err);
        res.status(500).json({ error: 'Kunne ikke utføre trekk' });
    }
});

// GET /api/tic-tac-toe/game/:id - Get game state
router.get('/game/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        const game = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM tic_tac_toe_games WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!game) {
            return res.status(404).json({ error: 'Spill ikke funnet' });
        }

        res.json({
            game_id: game.id,
            status: game.status,
            player1: {
                code: game.player1_code,
                name: game.player1_name,
                team: game.player1_team,
                symbol: 'X'
            },
            player2: game.player2_code ? {
                code: game.player2_code,
                name: game.player2_name,
                team: game.player2_team,
                symbol: 'O'
            } : null,
            board: JSON.parse(game.board_state),
            current_turn: game.current_turn,
            starting_player: game.starting_player,
            winner: game.winner_code ? {
                code: game.winner_code,
                name: game.winner_name
            } : null,
            result: game.result,
            created_at: game.created_at,
            started_at: game.started_at,
            completed_at: game.completed_at
        });

    } catch (err) {
        console.error('Error fetching game:', err);
        res.status(500).json({ error: 'Kunne ikke hente spilldata' });
    }
});

// GET /api/tic-tac-toe/leaderboard - Get leaderboard
router.get('/leaderboard', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get win statistics for all participants
        const stats = await new Promise((resolve, reject) => {
            db.all(
                `SELECT
                    p.participant_code,
                    p.first_name,
                    p.last_name,
                    p.team,
                    p.profile_photo_path,
                    COUNT(CASE WHEN g.winner_code = p.participant_code THEN 1 END) as wins,
                    COUNT(CASE WHEN (g.player1_code = p.participant_code OR g.player2_code = p.participant_code)
                               AND g.status = 'completed' AND g.result = 'draw' THEN 1 END) as draws,
                    COUNT(CASE WHEN (g.player1_code = p.participant_code OR g.player2_code = p.participant_code)
                               AND g.status = 'completed' AND g.winner_code != p.participant_code AND g.winner_code IS NOT NULL THEN 1 END) as losses,
                    COUNT(CASE WHEN g.player1_code = p.participant_code OR g.player2_code = p.participant_code THEN 1 END) as total_games
                 FROM participants p
                 LEFT JOIN tic_tac_toe_games g ON
                    (g.player1_code = p.participant_code OR g.player2_code = p.participant_code)
                    AND g.status = 'completed'
                 WHERE p.active = 1
                 GROUP BY p.participant_code
                 HAVING total_games > 0
                 ORDER BY wins DESC, total_games DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        // Format leaderboard
        const leaderboard = stats.map((stat, index) => ({
            rank: index + 1,
            participant_code: stat.participant_code,
            name: `${stat.first_name} ${stat.last_name}`,
            team: stat.team,
            profile_photo_path: stat.profile_photo_path,
            wins: stat.wins,
            draws: stat.draws,
            losses: stat.losses,
            total_games: stat.total_games,
            win_rate: stat.total_games > 0 ? ((stat.wins / stat.total_games) * 100).toFixed(1) : '0.0'
        }));

        res.json({
            leaderboard: leaderboard,
            total_participants: leaderboard.length
        });

    } catch (err) {
        console.error('Error fetching leaderboard:', err);
        res.status(500).json({ error: 'Kunne ikke hente resultattavle' });
    }
});

// GET /api/tic-tac-toe/games - Get all games (admin)
router.get('/games', async (req, res) => {
    const db = req.app.locals.db;

    try {
        const games = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM tic_tac_toe_games
                 WHERE status = 'completed'
                 ORDER BY completed_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json({ games });
    } catch (err) {
        console.error('Error fetching games:', err);
        res.status(500).json({ error: 'Kunne ikke hente spill' });
    }
});

// DELETE /api/tic-tac-toe/game/:id - Delete a game (admin)
router.delete('/game/:id', async (req, res) => {
    const db = req.app.locals.db;
    const { id } = req.params;

    try {
        // Get game info before deleting
        const game = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM tic_tac_toe_games WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!game) {
            return res.status(404).json({ error: 'Spill ikke funnet' });
        }

        // Delete the game
        await new Promise((resolve, reject) => {
            db.run(
                'DELETE FROM tic_tac_toe_games WHERE id = ?',
                [id],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        res.json({
            success: true,
            message: 'Spill slettet',
            deleted_game: {
                player1: game.player1_name,
                player2: game.player2_name,
                winner: game.winner_name,
                result: game.result
            }
        });
    } catch (err) {
        console.error('Error deleting game:', err);
        res.status(500).json({ error: 'Kunne ikke slette spill' });
    }
});

// Helper function to check for winner
function checkWinner(board) {
    const winningCombinations = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal \
        [2, 4, 6]  // Diagonal /
    ];

    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Returns 'X' or 'O'
        }
    }

    return null; // No winner
}

module.exports = router;
