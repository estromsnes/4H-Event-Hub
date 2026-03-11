const express = require('express');
const router = express.Router();

/**
 * GET /api/activities/status
 * Returns the active status of all activities
 */
router.get('/status', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // Get config for all activities
        const [
            bingoConfig,
            selfieChainConfig,
            quizConfig,
            scavengerHuntConfig,
            ticTacToeConfig,
            teamChallengeConfig,
            photoChallengesConfig
        ] = await Promise.all([
            getConfig(db, 'bingo_config'),
            getConfig(db, 'selfie_chain_config'),
            getConfig(db, 'quiz_config'),
            getConfig(db, 'scavenger_hunt_config'),
            getConfig(db, 'tic_tac_toe_config'),
            getConfig(db, 'team_challenge_config'),
            getConfig(db, 'photo_challenges_config')
        ]);

        // Return activity status with metadata
        const activities = {
            team_challenge: {
                active: teamChallengeConfig?.active ?? 1,
                name: 'Samle laget',
                icon: '📸'
            },
            photo_challenges: {
                active: photoChallengesConfig?.active ?? 1,
                name: 'Bildeoppgaver',
                icon: '🎭'
            },
            selfie_chain: {
                active: selfieChainConfig?.active ?? 1,
                name: 'Selfie-kjedet',
                icon: '🤳'
            },
            bingo: {
                active: bingoConfig?.active ?? 1,
                name: 'Sosial Bingo',
                icon: '🎲'
            },
            quiz: {
                active: quizConfig?.active ?? 1,
                name: 'Quiz',
                icon: '🧠'
            },
            scavenger_hunt: {
                active: scavengerHuntConfig?.active ?? 1,
                name: 'QR Skattejakt',
                icon: '🎯'
            },
            tic_tac_toe: {
                active: ticTacToeConfig?.active ?? 1,
                name: 'Tripp-Trapp-Tresko',
                icon: '⭕'
            }
        };

        res.json(activities);
    } catch (err) {
        console.error('Error getting activity status:', err);
        res.status(500).json({ error: 'Feil ved henting av aktivitetsstatus' });
    }
});

/**
 * Helper function to get config from a table
 */
function getConfig(db, tableName) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 1`,
            (err, row) => {
                if (err) reject(err);
                else resolve(row);
            }
        );
    });
}

module.exports = router;
