const express = require('express');
const router = express.Router();

// GET /api/statistics - Get comprehensive statistics
router.get('/', async (req, res) => {
    const db = req.app.locals.db;

    try {
        // 1. KPI - Main numbers
        const kpis = await getKPIs(db);

        // 2. Activity distribution
        const activityDistribution = await getActivityDistribution(db);

        // 4. Quiz insights
        const quizInsights = await getQuizInsights(db);

        // 5. Team challenge records
        const teamChallengeRecords = await getTeamChallengeRecords(db);

        // 6. Photo challenges statistics
        const photoChallenges = await getPhotoChallengeStats(db);

        // 7. Scavenger hunt statistics
        const scavengerHunt = await getScavengerHuntStats(db);

        // 8. Tic-tac-toe statistics
        const ticTacToe = await getTicTacToeStats(db);

        // 9. Activity over time
        const activityOverTime = await getActivityOverTime(db);

        // 11. Awards and badges
        const awards = await getAwards(db);

        // 12. Live feed
        const liveFeed = await getLiveFeed(db);

        // 13. Engagement score
        const engagement = await getEngagementScore(db);

        // 14. Team comparison
        const teamComparison = await getTeamComparison(db);

        res.json({
            kpis,
            activityDistribution,
            quizInsights,
            teamChallengeRecords,
            photoChallenges,
            scavengerHunt,
            ticTacToe,
            activityOverTime,
            awards,
            liveFeed,
            engagement,
            teamComparison
        });

    } catch (err) {
        console.error('Error fetching statistics:', err);
        res.status(500).json({ error: 'Kunne ikke hente statistikk' });
    }
});

// Helper functions

async function getKPIs(db) {
    // Total participants
    const totalParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM participants WHERE active = 1', [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    // Confirmed participants
    const confirmedParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM participants WHERE active = 1 AND confirmed = 1', [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    // No-show participants
    const noShowParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM participants WHERE active = 1 AND no_show = 1', [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    // Participants with teams
    const participantsWithTeams = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM participants WHERE active = 1 AND team IS NOT NULL AND team != ""', [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    // Total teams
    const totalTeams = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(DISTINCT team) as count FROM participants WHERE active = 1 AND team IS NOT NULL AND team != ""', [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    // Total QR scans
    const totalScans = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM scan_log', [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    // Total completed activities
    const quizCompleted = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM quiz_sessions WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const teamChallengeCompleted = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM team_challenge_sessions WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const scavengerCompleted = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM scavenger_sessions WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const ticTacToeCompleted = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM tic_tac_toe_games WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const totalCompletedActivities = quizCompleted + teamChallengeCompleted + scavengerCompleted + ticTacToeCompleted;

    // Total photos uploaded
    const totalPhotos = await new Promise((resolve, reject) => {
        db.get(`SELECT
            (SELECT COUNT(*) FROM participants WHERE profile_photo_path IS NOT NULL AND active = 1) +
            (SELECT COUNT(*) FROM photo_submissions) +
            (SELECT COUNT(*) FROM team_challenge_sessions WHERE team_photo_path IS NOT NULL) as count`,
            [], (err, row) => {
            if (err) reject(err);
            else resolve(row.count);
        });
    });

    return {
        totalParticipants,
        confirmedParticipants,
        noShowParticipants,
        participantsWithTeams,
        totalTeams,
        totalScans,
        totalCompletedActivities,
        totalPhotos
    };
}

async function getActivityDistribution(db) {
    // Count teams/participants who tried each activity
    const quizParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(DISTINCT team_name) as count FROM quiz_sessions', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const teamChallengeParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(DISTINCT team_name) as count FROM team_challenge_sessions', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const scavengerParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(DISTINCT team_name) as count FROM scavenger_sessions', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const ticTacToeParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT (SELECT COUNT(DISTINCT player1_code) FROM tic_tac_toe_games) + (SELECT COUNT(DISTINCT player2_code) FROM tic_tac_toe_games) as count', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const photoParticipants = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(DISTINCT team_name) as count FROM photo_submissions', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    return {
        quiz: quizParticipants,
        teamChallenge: teamChallengeParticipants,
        scavenger: scavengerParticipants,
        ticTacToe: ticTacToeParticipants,
        photoChallenges: photoParticipants
    };
}

async function getQuizInsights(db) {
    // Average score per team
    const teamScores = await new Promise((resolve, reject) => {
        db.all(`SELECT
            team_name as team,
            AVG(score) as avg_score,
            COUNT(*) as quiz_count
            FROM quiz_sessions
            WHERE status = 'completed' AND team_name IS NOT NULL AND team_name != ''
            GROUP BY team_name
            ORDER BY avg_score DESC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    // Perfect scores count
    const perfectScores = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM quiz_sessions WHERE status = "completed" AND score = 100', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    // Average time per question (if we track this)
    const avgTime = await new Promise((resolve, reject) => {
        db.get(`SELECT AVG(
            (julianday(end_time) - julianday(start_time)) * 24 * 60 /
            NULLIF((SELECT COUNT(*) FROM quiz_questions WHERE active = 1), 0)
        ) as avg_minutes FROM quiz_sessions WHERE status = 'completed' AND end_time IS NOT NULL`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row && row.avg_minutes ? row.avg_minutes : 0);
        });
    });

    // Question difficulty - hardest and easiest
    const questionStats = await new Promise((resolve, reject) => {
        db.all(`SELECT
            q.question_text,
            COUNT(*) as times_asked,
            SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
            CAST(SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as correct_percentage
            FROM quiz_answers a
            JOIN quiz_questions q ON a.question_id = q.id
            GROUP BY a.question_id
            HAVING times_asked > 0
            ORDER BY correct_percentage ASC`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    const hardestQuestion = questionStats.length > 0 ? questionStats[0] : null;
    const easiestQuestion = questionStats.length > 0 ? questionStats[questionStats.length - 1] : null;

    // Music usage
    const withMusic = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM quiz_sessions q
            JOIN event_info e ON e.active = 1
            WHERE e.enable_quiz_music = 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const withoutMusic = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM quiz_sessions q
            JOIN event_info e ON e.active = 1
            WHERE e.enable_quiz_music = 0`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    return {
        teamScores,
        perfectScores,
        avgTimePerQuestion: avgTime,
        hardestQuestion,
        easiestQuestion,
        musicStats: {
            withMusic,
            withoutMusic
        }
    };
}

async function getTeamChallengeRecords(db) {
    // Fastest team
    const fastest = await new Promise((resolve, reject) => {
        db.get(`SELECT team_name, elapsed_time_seconds
            FROM team_challenge_sessions
            WHERE status = 'completed'
            ORDER BY elapsed_time_seconds ASC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Slowest team
    const slowest = await new Promise((resolve, reject) => {
        db.get(`SELECT team_name, elapsed_time_seconds
            FROM team_challenge_sessions
            WHERE status = 'completed'
            ORDER BY elapsed_time_seconds DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Average time
    const avgTime = await new Promise((resolve, reject) => {
        db.get('SELECT AVG(elapsed_time_seconds) as avg FROM team_challenge_sessions WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.avg : 0);
        });
    });

    // Failed attempts
    const failed = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM team_challenge_sessions WHERE status = "failed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    return {
        fastest,
        slowest,
        avgTime,
        failed
    };
}

async function getPhotoChallengeStats(db) {
    // Total submissions
    const totalSubmissions = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM photo_submissions', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    // Team with most points
    const topTeam = await new Promise((resolve, reject) => {
        db.get(`SELECT team_name, SUM(points_awarded) as total_points
            FROM photo_submissions
            WHERE points_awarded IS NOT NULL
            GROUP BY team_name
            ORDER BY total_points DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Average points per challenge
    const avgPoints = await new Promise((resolve, reject) => {
        db.get('SELECT AVG(points_awarded) as avg FROM photo_submissions WHERE points_awarded IS NOT NULL', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.avg : 0);
        });
    });

    // Most popular challenge
    const mostPopular = await new Promise((resolve, reject) => {
        db.get(`SELECT c.title, COUNT(s.id) as submission_count
            FROM photo_challenges c
            LEFT JOIN photo_submissions s ON c.id = s.challenge_id
            WHERE c.active = 1
            GROUP BY c.id
            ORDER BY submission_count DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    return {
        totalSubmissions,
        topTeam,
        avgPoints,
        mostPopular
    };
}

async function getScavengerHuntStats(db) {
    // Average checkpoints found
    const avgCheckpoints = await new Promise((resolve, reject) => {
        db.get(`SELECT AVG(checkpoint_count) as avg FROM (
            SELECT COUNT(*) as checkpoint_count
            FROM scavenger_scans
            GROUP BY session_id
        )`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.avg : 0);
        });
    });

    // Teams that completed all checkpoints
    const totalCheckpoints = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM scavenger_checkpoints WHERE active = 1', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    const completedAll = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM scavenger_sessions WHERE status = 'completed'`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    // Most popular checkpoint
    const mostPopular = await new Promise((resolve, reject) => {
        db.get(`SELECT c.name, COUNT(s.id) as scan_count
            FROM scavenger_checkpoints c
            LEFT JOIN scavenger_scans s ON c.id = s.checkpoint_id
            WHERE c.active = 1
            GROUP BY c.id
            ORDER BY scan_count DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Average time
    const avgTime = await new Promise((resolve, reject) => {
        db.get('SELECT AVG(elapsed_seconds) as avg FROM scavenger_sessions WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.avg : 0);
        });
    });

    return {
        avgCheckpoints,
        totalCheckpoints,
        completedAll,
        mostPopular,
        avgTime
    };
}

async function getTicTacToeStats(db) {
    // Player with most wins
    const topPlayer = await new Promise((resolve, reject) => {
        db.get(`SELECT
            p.first_name || ' ' || p.last_name as name,
            COUNT(CASE WHEN g.winner_code = p.participant_code THEN 1 END) as wins
            FROM participants p
            LEFT JOIN tic_tac_toe_games g ON (g.player1_code = p.participant_code OR g.player2_code = p.participant_code)
            WHERE g.status = 'completed'
            GROUP BY p.participant_code
            ORDER BY wins DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Total draws
    const totalDraws = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM tic_tac_toe_games WHERE result = "draw"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    // Total games
    const totalGames = await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM tic_tac_toe_games WHERE status = "completed"', [], (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.count : 0);
        });
    });

    return {
        topPlayer,
        totalDraws,
        totalGames
    };
}

async function getActivityOverTime(db) {
    // Get scans per hour for the last 24 hours
    const scansPerHour = await new Promise((resolve, reject) => {
        db.all(`SELECT
            strftime('%H', scan_timestamp) as hour,
            COUNT(*) as count
            FROM scan_log
            WHERE scan_timestamp >= datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    return {
        scansPerHour
    };
}

async function getAwards(db) {
    // Speedster - fastest quiz
    const speedster = await new Promise((resolve, reject) => {
        db.get(`SELECT
            team_name as name,
            team_name as team,
            (julianday(end_time) - julianday(start_time)) * 24 * 60 as minutes
            FROM quiz_sessions
            WHERE status = 'completed' AND end_time IS NOT NULL
            ORDER BY minutes ASC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Perfectionist - most 100% scores
    const perfectionist = await new Promise((resolve, reject) => {
        db.get(`SELECT
            team_name as name,
            team_name as team,
            COUNT(*) as perfect_count
            FROM quiz_sessions
            WHERE status = 'completed' AND score = 100
            GROUP BY team_name
            ORDER BY perfect_count DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Shutterbug - most photos
    const shutterbug = await new Promise((resolve, reject) => {
        db.get(`SELECT team_name, COUNT(*) as photo_count
            FROM photo_submissions
            GROUP BY team_name
            ORDER BY photo_count DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Early bird - first to complete each activity
    const earlyBirdQuiz = await new Promise((resolve, reject) => {
        db.get(`SELECT team_name as team, end_time as completion_time
            FROM quiz_sessions
            WHERE status = 'completed' AND team_name IS NOT NULL AND end_time IS NOT NULL
            ORDER BY end_time ASC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    const earlyBirdTeamChallenge = await new Promise((resolve, reject) => {
        db.get(`SELECT team_name, completion_time
            FROM team_challenge_sessions
            WHERE status = 'completed'
            ORDER BY completion_time ASC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    // Allrounder - team that participated in all activities
    const allrounders = await new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT p.team
            FROM participants p
            WHERE p.team IS NOT NULL AND p.team != ''
            AND EXISTS (SELECT 1 FROM quiz_sessions q WHERE q.team_name = p.team)
            AND EXISTS (SELECT 1 FROM team_challenge_sessions tc WHERE tc.team_name = p.team)
            AND EXISTS (SELECT 1 FROM scavenger_sessions s WHERE s.team_name = p.team)
            AND EXISTS (SELECT 1 FROM photo_submissions ps WHERE ps.team_name = p.team)`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    // Marathon team - most scans
    const marathon = await new Promise((resolve, reject) => {
        db.get(`SELECT p.team, COUNT(*) as scan_count
            FROM scan_log s
            JOIN participants p ON s.participant_code = p.participant_code
            WHERE p.team IS NOT NULL AND p.team != ''
            GROUP BY p.team
            ORDER BY scan_count DESC
            LIMIT 1`, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    return {
        speedster,
        perfectionist,
        shutterbug,
        earlyBird: {
            quiz: earlyBirdQuiz,
            teamChallenge: earlyBirdTeamChallenge
        },
        allrounders,
        marathon
    };
}

async function getLiveFeed(db) {
    // Get last 10 activities across all tables
    const activities = [];

    // Quiz completions
    const quizActivities = await new Promise((resolve, reject) => {
        db.all(`SELECT
            team_name as name,
            team_name as team,
            score,
            end_time as timestamp,
            'quiz' as activity_type
            FROM quiz_sessions
            WHERE status = 'completed' AND end_time IS NOT NULL
            ORDER BY end_time DESC
            LIMIT 5`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    // Team challenge completions
    const teamActivities = await new Promise((resolve, reject) => {
        db.all(`SELECT
            team_name,
            elapsed_time_seconds,
            completion_time as timestamp,
            'team_challenge' as activity_type
            FROM team_challenge_sessions
            WHERE status = 'completed'
            ORDER BY completion_time DESC
            LIMIT 5`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    // Tic-tac-toe games
    const ticTacToeActivities = await new Promise((resolve, reject) => {
        db.all(`SELECT
            p1.first_name || ' ' || p1.last_name as player1,
            p2.first_name || ' ' || p2.last_name as player2,
            pw.first_name || ' ' || pw.last_name as winner,
            g.result,
            g.completed_at as timestamp,
            'tic_tac_toe' as activity_type
            FROM tic_tac_toe_games g
            JOIN participants p1 ON g.player1_code = p1.participant_code
            JOIN participants p2 ON g.player2_code = p2.participant_code
            LEFT JOIN participants pw ON g.winner_code = pw.participant_code
            WHERE g.status = 'completed'
            ORDER BY g.completed_at DESC
            LIMIT 5`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });

    // Combine and sort all activities
    const allActivities = [
        ...quizActivities.map(a => ({ ...a, message: `${a.name} (${a.team}) fullførte quiz med ${a.score} poeng!` })),
        ...teamActivities.map(a => ({ ...a, message: `${a.team_name} fullførte "Samle laget" på ${Math.floor(a.elapsed_time_seconds / 60)}:${(a.elapsed_time_seconds % 60).toString().padStart(2, '0')}!` })),
        ...ticTacToeActivities.map(a => ({
            ...a,
            message: a.result === 'draw'
                ? `${a.player1} spilte uavgjort mot ${a.player2} i Tripp-Trapp-Tresko`
                : `${a.winner} vant mot ${a.result === 'player1_win' ? a.player2 : a.player1} i Tripp-Trapp-Tresko!`
        }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    return allActivities;
}

async function getEngagementScore(db) {
    // Calculate engagement for each team
    const teamEngagement = await new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT team FROM participants WHERE team IS NOT NULL AND team != '' AND active = 1`, [], async (err, teams) => {
            if (err) {
                reject(err);
                return;
            }

            const scores = [];
            for (const { team } of teams) {
                // Count activities participated in
                const quizCount = await new Promise((res, rej) => {
                    db.get(`SELECT COUNT(*) as count
                        FROM quiz_sessions
                        WHERE team_name = ?`, [team], (e, r) => e ? rej(e) : res(r && r.count ? r.count : 0));
                });

                const teamChallengeCount = await new Promise((res, rej) => {
                    db.get(`SELECT COUNT(*) as count FROM team_challenge_sessions WHERE team_name = ? AND status = 'completed'`, [team], (e, r) => e ? rej(e) : res(r && r.count ? r.count : 0));
                });

                const scavengerCount = await new Promise((res, rej) => {
                    db.get(`SELECT COUNT(*) as count
                        FROM scavenger_sessions
                        WHERE team_name = ?`, [team], (e, r) => e ? rej(e) : res(r && r.count ? r.count : 0));
                });

                const photoCount = await new Promise((res, rej) => {
                    db.get(`SELECT COUNT(*) as count FROM photo_submissions WHERE team_name = ?`, [team], (e, r) => e ? rej(e) : res(r.count));
                });

                // Calculate score (max 100)
                const activitiesScore = (quizCount > 0 ? 20 : 0) + (teamChallengeCount > 0 ? 20 : 0) + (scavengerCount > 0 ? 20 : 0) + (photoCount > 0 ? 20 : 0);
                const completionScore = Math.min(20, (quizCount + teamChallengeCount + scavengerCount + photoCount) * 2);
                const totalScore = activitiesScore + completionScore;

                scores.push({
                    team,
                    score: totalScore,
                    activities: {
                        quiz: quizCount,
                        teamChallenge: teamChallengeCount,
                        scavenger: scavengerCount,
                        photo: photoCount
                    }
                });
            }

            resolve(scores.sort((a, b) => b.score - a.score));
        });
    });

    return teamEngagement;
}

async function getTeamComparison(db) {
    // Get all teams and their performance across activities
    const teams = await new Promise((resolve, reject) => {
        db.all(`SELECT DISTINCT team FROM participants WHERE team IS NOT NULL AND team != '' AND active = 1`, [], async (err, teamRows) => {
            if (err) {
                reject(err);
                return;
            }

            const comparison = [];
            for (const { team } of teamRows) {
                // Quiz average score
                const quizScore = await new Promise((res, rej) => {
                    db.get(`SELECT AVG(score) as avg
                        FROM quiz_sessions
                        WHERE team_name = ? AND status = 'completed'`, [team], (e, r) => e ? rej(e) : res(r && r.avg ? r.avg : 0));
                });

                // Photo challenge points
                const photoPoints = await new Promise((res, rej) => {
                    db.get(`SELECT SUM(points_awarded) as total FROM photo_submissions WHERE team_name = ? AND points_awarded IS NOT NULL`, [team], (e, r) => e ? rej(e) : res(r && r.total ? r.total : 0));
                });

                // Team challenge time (inverted for radar - lower is better, so we use 120 - time)
                const teamChallengeTime = await new Promise((res, rej) => {
                    db.get(`SELECT elapsed_time_seconds FROM team_challenge_sessions WHERE team_name = ? AND status = 'completed' ORDER BY elapsed_time_seconds ASC LIMIT 1`, [team], (e, r) => e ? rej(e) : res(r && r.elapsed_time_seconds ? Math.max(0, 120 - r.elapsed_time_seconds) : 0));
                });

                // Scavenger hunt checkpoints - count unique checkpoints from sessions
                const scavengerCheckpoints = await new Promise((res, rej) => {
                    db.get(`SELECT COUNT(DISTINCT sc.checkpoint_id) as count
                        FROM scavenger_scans sc
                        JOIN scavenger_sessions ss ON sc.session_id = ss.id
                        WHERE ss.team_name = ?`, [team], (e, r) => e ? rej(e) : res(r && r.count ? r.count : 0));
                });

                // Tic-tac-toe win rate
                const ticTacToeWinRate = await new Promise((res, rej) => {
                    db.get(`SELECT
                        COUNT(CASE WHEN g.winner_code = p.participant_code THEN 1 END) as wins,
                        COUNT(*) as total
                        FROM tic_tac_toe_games g
                        JOIN participants p ON (g.player1_code = p.participant_code OR g.player2_code = p.participant_code)
                        WHERE p.team = ? AND g.status = 'completed'
                        GROUP BY p.team`, [team], (e, r) => e ? rej(e) : res(r && r.total > 0 ? (r.wins / r.total) * 100 : 0));
                });

                comparison.push({
                    team,
                    quizScore,
                    photoPoints,
                    teamChallengeTime,
                    scavengerCheckpoints,
                    ticTacToeWinRate
                });
            }

            resolve(comparison);
        });
    });

    return teams;
}

module.exports = router;
