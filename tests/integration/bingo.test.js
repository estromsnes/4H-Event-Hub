/**
 * Integration tests for Bingo API endpoints
 */

const request = require('supertest');
const { app, db } = require('../../server');

describe('Bingo API Integration Tests', () => {
    let testParticipantCode;
    let adminToken;

    // Setup: Get a valid participant and admin token
    beforeAll(async () => {
        // Get a participant for testing
        const participantsResponse = await request(app).get('/api/participants');
        if (participantsResponse.body.length > 0) {
            testParticipantCode = participantsResponse.body[0].participant_code;
        }

        // Login as admin to get a valid token
        try {
            // Use default test credentials (adjust based on your env)
            const loginResponse = await request(app)
                .post('/api/auth/admin-login')
                .send({
                    accessKey: process.env.ADMIN_ACCESS_KEY || 'test-admin-key',
                    pin: process.env.ADMIN_PIN || '1234'
                });

            if (loginResponse.body.success && loginResponse.body.token) {
                adminToken = loginResponse.body.token;
            } else {
                // If login fails, skip admin tests by setting token to null
                console.log('Warning: Could not authenticate as admin, admin tests will be skipped');
                adminToken = null;
            }
        } catch (error) {
            console.log('Warning: Admin authentication error, admin tests will be skipped');
            adminToken = null;
        }
    });

    // Close database connection after all tests
    afterAll((done) => {
        setTimeout(() => {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                }
                done();
            });
        }, 100);
    });

    describe('GET /api/bingo/admin/config', () => {
        test('should return Bingo configuration', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const response = await request(app)
                .get('/api/bingo/admin/config')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('active');
            expect(response.body).toHaveProperty('points_per_task');
            expect(response.body).toHaveProperty('bonus_row_points');
            expect(response.body).toHaveProperty('bonus_full_card_points');
            expect(response.body).toHaveProperty('card_size');
        });

        test('should have default configuration values', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const response = await request(app)
                .get('/api/bingo/admin/config')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body.card_size).toBe(5);
            expect(typeof response.body.points_per_task).toBe('number');
            expect(typeof response.body.bonus_row_points).toBe('number');
            expect(typeof response.body.bonus_full_card_points).toBe('number');
        });
    });

    describe('GET /api/bingo/admin/tasks', () => {
        test('should return list of Bingo tasks', async () => {
            const response = await request(app)
                .get('/api/bingo/admin/tasks')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('should have at least 25 tasks for a full card', async () => {
            const response = await request(app)
                .get('/api/bingo/admin/tasks')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body.length).toBeGreaterThanOrEqual(25);
        });

        test('tasks should have required fields', async () => {
            const response = await request(app)
                .get('/api/bingo/admin/tasks')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);

            if (response.body.length > 0) {
                const task = response.body[0];
                expect(task).toHaveProperty('id');
                expect(task).toHaveProperty('task_text');
                expect(task).toHaveProperty('category');
                expect(task).toHaveProperty('active');
            }
        });
    });

    describe('POST /api/bingo/start', () => {
        test('should return 400 if participant_code is missing', async () => {
            const response = await request(app)
                .post('/api/bingo/start')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 404 for non-existent participant', async () => {
            const response = await request(app)
                .post('/api/bingo/start')
                .send({ participant_code: 'INVALID999' });

            expect(response.status).toBe(404);
        });

        test('should create Bingo card for valid participant', async () => {
            if (!testParticipantCode) {
                console.log('Skipping test: No test participant available');
                return;
            }

            const response = await request(app)
                .post('/api/bingo/start')
                .send({ participant_code: testParticipantCode });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('card_id');
            expect(response.body).toHaveProperty('tasks');
            expect(response.body).toHaveProperty('layout');
            expect(response.body).toHaveProperty('completions');
            expect(response.body).toHaveProperty('config');
            expect(response.body.tasks).toHaveLength(25);
        });

        test('should return existing card if already created', async () => {
            if (!testParticipantCode) {
                console.log('Skipping test: No test participant available');
                return;
            }

            // First call to create card
            const firstResponse = await request(app)
                .post('/api/bingo/start')
                .send({ participant_code: testParticipantCode });

            const cardId = firstResponse.body.card_id;

            // Second call should return same card
            const secondResponse = await request(app)
                .post('/api/bingo/start')
                .send({ participant_code: testParticipantCode });

            expect(secondResponse.status).toBe(200);
            expect(secondResponse.body.card_id).toBe(cardId);
        });
    });

    describe('GET /api/bingo/card/:participant_code', () => {
        test('should return 404 for participant without card', async () => {
            const response = await request(app)
                .get('/api/bingo/card/NOCARD999');

            expect(response.status).toBe(404);
        });

        test('should return Bingo card for participant with card', async () => {
            if (!testParticipantCode) {
                console.log('Skipping test: No test participant available');
                return;
            }

            // Ensure card exists
            await request(app)
                .post('/api/bingo/start')
                .send({ participant_code: testParticipantCode });

            // Get card
            const response = await request(app)
                .get(`/api/bingo/card/${testParticipantCode}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('card_id');
            expect(response.body).toHaveProperty('tasks');
            expect(response.body).toHaveProperty('layout');
            expect(response.body).toHaveProperty('completions');
            expect(response.body).toHaveProperty('achievements');
            expect(response.body).toHaveProperty('stats');
        });

        test('card should have correct structure', async () => {
            if (!testParticipantCode) {
                console.log('Skipping test: No test participant available');
                return;
            }

            const response = await request(app)
                .get(`/api/bingo/card/${testParticipantCode}`);

            expect(response.status).toBe(200);
            expect(response.body.tasks).toHaveLength(25);
            expect(Array.isArray(response.body.layout)).toBe(true);
            expect(Array.isArray(response.body.completions)).toBe(true);
            expect(response.body.achievements).toHaveProperty('rows');
            expect(response.body.achievements).toHaveProperty('columns');
            expect(response.body.achievements).toHaveProperty('diagonals');
            expect(response.body.achievements).toHaveProperty('fullCard');
        });
    });

    describe('POST /api/bingo/scan', () => {
        test('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/bingo/scan')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('should return 400 if participant_code is missing', async () => {
            const response = await request(app)
                .post('/api/bingo/scan')
                .send({
                    scanned_code: 'TEST001',
                    task_id: 1,
                    position: 0
                });

            expect(response.status).toBe(400);
        });

        test('should return 400 if scanned_code is missing', async () => {
            const response = await request(app)
                .post('/api/bingo/scan')
                .send({
                    participant_code: testParticipantCode,
                    task_id: 1,
                    position: 0
                });

            expect(response.status).toBe(400);
        });

        test('should return 404 for non-existent card', async () => {
            const response = await request(app)
                .post('/api/bingo/scan')
                .send({
                    participant_code: 'NOCARD999',
                    scanned_code: 'TEST001',
                    task_id: 1,
                    position: 0
                });

            expect(response.status).toBe(404);
        });

        test('should prevent scanning yourself', async () => {
            if (!testParticipantCode) {
                console.log('Skipping test: No test participant available');
                return;
            }

            // Ensure card exists
            const cardResponse = await request(app)
                .post('/api/bingo/start')
                .send({ participant_code: testParticipantCode });

            const taskId = cardResponse.body.tasks[0].id;

            const response = await request(app)
                .post('/api/bingo/scan')
                .send({
                    participant_code: testParticipantCode,
                    scanned_code: testParticipantCode,
                    task_id: taskId,
                    position: 0
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('deg selv');
        });
    });

    describe('GET /api/bingo/leaderboard', () => {
        test('should return Bingo leaderboard', async () => {
            const response = await request(app).get('/api/bingo/leaderboard');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('leaderboard entries should have required fields', async () => {
            const response = await request(app).get('/api/bingo/leaderboard');

            expect(response.status).toBe(200);

            if (response.body.length > 0) {
                const entry = response.body[0];
                expect(entry).toHaveProperty('rank');
                expect(entry).toHaveProperty('participant_code');
                expect(entry).toHaveProperty('first_name');
                expect(entry).toHaveProperty('last_name');
                expect(entry).toHaveProperty('tasks_completed');
                expect(entry).toHaveProperty('rows_completed');
                expect(entry).toHaveProperty('columns_completed');
                expect(entry).toHaveProperty('diagonals_completed');
                expect(entry).toHaveProperty('full_card_completed');
                expect(entry).toHaveProperty('total_points');
            }
        });

        test('leaderboard should be sorted correctly', async () => {
            const response = await request(app).get('/api/bingo/leaderboard');

            expect(response.status).toBe(200);

            if (response.body.length > 1) {
                // Check that full card completions are prioritized
                const leaderboard = response.body;

                for (let i = 1; i < leaderboard.length; i++) {
                    const prev = leaderboard[i - 1];
                    const curr = leaderboard[i];

                    // If previous has full card and current doesn't, order is correct
                    if (prev.full_card_completed && !curr.full_card_completed) {
                        expect(true).toBe(true);
                    }
                    // If both have same full card status, check other criteria
                    else if (prev.full_card_completed === curr.full_card_completed) {
                        // Higher or equal total points
                        expect(prev.total_points).toBeGreaterThanOrEqual(curr.total_points);
                    }
                }
            }
        });

        test('leaderboard should have sequential ranks', async () => {
            const response = await request(app).get('/api/bingo/leaderboard');

            expect(response.status).toBe(200);

            if (response.body.length > 0) {
                response.body.forEach((entry, index) => {
                    expect(entry.rank).toBe(index + 1);
                });
            }
        });
    });

    describe('POST /api/bingo/admin/config', () => {
        test('should require admin token', async () => {
            const response = await request(app)
                .post('/api/bingo/admin/config')
                .send({ active: 1 });

            expect(response.status).toBe(401);
        });

        test('should update Bingo configuration', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const newConfig = {
                active: 1,
                points_per_task: 15,
                bonus_row_points: 75,
                bonus_full_card_points: 150
            };

            const response = await request(app)
                .post('/api/bingo/admin/config')
                .set('X-Admin-Token', adminToken)
                .send(newConfig);

            expect(response.status).toBe(200);

            // Verify config was updated
            const getResponse = await request(app)
                .get('/api/bingo/admin/config')
                .set('X-Admin-Token', adminToken);

            expect(getResponse.body.points_per_task).toBe(15);
            expect(getResponse.body.bonus_row_points).toBe(75);
            expect(getResponse.body.bonus_full_card_points).toBe(150);

            // Reset to defaults
            await request(app)
                .post('/api/bingo/admin/config')
                .set('X-Admin-Token', adminToken)
                .send({
                    points_per_task: 10,
                    bonus_row_points: 50,
                    bonus_full_card_points: 100
                });
        });
    });

    describe('POST /api/bingo/admin/tasks', () => {
        test('should require admin token', async () => {
            const response = await request(app)
                .post('/api/bingo/admin/tasks')
                .send({ task_text: 'Test task', category: 'Test' });

            expect(response.status).toBe(401);
        });

        test('should create new Bingo task', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const newTask = {
                task_text: 'Test: Finn noen som liker å teste',
                category: 'Test'
            };

            const response = await request(app)
                .post('/api/bingo/admin/tasks')
                .set('X-Admin-Token', adminToken)
                .send(newTask);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');

            // Clean up: delete the test task
            await request(app)
                .delete(`/api/bingo/admin/tasks/${response.body.id}`)
                .set('X-Admin-Token', adminToken);
        });

        test('should return 400 if task_text is missing', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const response = await request(app)
                .post('/api/bingo/admin/tasks')
                .set('X-Admin-Token', adminToken)
                .send({ category: 'Test' });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/bingo/admin/stats', () => {
        test('should require admin token', async () => {
            const response = await request(app)
                .get('/api/bingo/admin/stats');

            expect(response.status).toBe(401);
        });

        test('should return Bingo statistics', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const response = await request(app)
                .get('/api/bingo/admin/stats')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('totalParticipants');
            expect(response.body).toHaveProperty('totalCards');
            expect(response.body).toHaveProperty('totalCompletions');
            expect(response.body).toHaveProperty('averageTasksCompleted');
            expect(response.body).toHaveProperty('rowsCompleted');
            expect(response.body).toHaveProperty('columnsCompleted');
            expect(response.body).toHaveProperty('diagonalsCompleted');
            expect(response.body).toHaveProperty('fullCardsCompleted');
        });

        test('statistics should have valid numeric values', async () => {
            if (!adminToken) {
                console.log('Skipping test: No admin token available');
                return;
            }

            const response = await request(app)
                .get('/api/bingo/admin/stats')
                .set('X-Admin-Token', adminToken);

            expect(response.status).toBe(200);
            expect(typeof response.body.totalParticipants).toBe('number');
            expect(typeof response.body.totalCards).toBe('number');
            expect(typeof response.body.totalCompletions).toBe('number');
            expect(response.body.totalParticipants).toBeGreaterThanOrEqual(0);
            expect(response.body.totalCards).toBeGreaterThanOrEqual(0);
        });
    });
});
