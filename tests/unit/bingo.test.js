/**
 * Unit tests for Bingo helper functions
 */

// Mock the helper functions from bingo.js
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

describe('Bingo Helper Functions', () => {
    describe('checkAchievements', () => {
        test('should return empty achievements for no completions', () => {
            const completions = [];
            const result = checkAchievements(completions);

            expect(result.rows).toEqual([]);
            expect(result.columns).toEqual([]);
            expect(result.diagonals).toEqual([]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect completed row (first row)', () => {
            // Complete first row: positions 0, 1, 2, 3, 4
            const completions = [
                { position_on_card: 0 },
                { position_on_card: 1 },
                { position_on_card: 2 },
                { position_on_card: 3 },
                { position_on_card: 4 }
            ];
            const result = checkAchievements(completions);

            expect(result.rows).toEqual([0]);
            expect(result.columns).toEqual([]);
            expect(result.diagonals).toEqual([]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect completed row (middle row with free space)', () => {
            // Complete middle row: positions 10, 11, (12 is free), 13, 14
            const completions = [
                { position_on_card: 10 },
                { position_on_card: 11 },
                { position_on_card: 13 },
                { position_on_card: 14 }
            ];
            const result = checkAchievements(completions);

            expect(result.rows).toEqual([2]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect completed column (first column)', () => {
            // Complete first column: positions 0, 5, 10, 15, 20
            const completions = [
                { position_on_card: 0 },
                { position_on_card: 5 },
                { position_on_card: 10 },
                { position_on_card: 15 },
                { position_on_card: 20 }
            ];
            const result = checkAchievements(completions);

            expect(result.rows).toEqual([]);
            expect(result.columns).toEqual([0]);
            expect(result.diagonals).toEqual([]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect completed column (middle column with free space)', () => {
            // Complete middle column: positions 2, 7, (12 is free), 17, 22
            const completions = [
                { position_on_card: 2 },
                { position_on_card: 7 },
                { position_on_card: 17 },
                { position_on_card: 22 }
            ];
            const result = checkAchievements(completions);

            expect(result.columns).toEqual([2]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect completed diagonal (top-left to bottom-right)', () => {
            // Diagonal: positions 0, 6, (12 is free), 18, 24
            const completions = [
                { position_on_card: 0 },
                { position_on_card: 6 },
                { position_on_card: 18 },
                { position_on_card: 24 }
            ];
            const result = checkAchievements(completions);

            expect(result.rows).toEqual([]);
            expect(result.columns).toEqual([]);
            expect(result.diagonals).toEqual([0]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect completed diagonal (top-right to bottom-left)', () => {
            // Diagonal: positions 4, 8, (12 is free), 16, 20
            const completions = [
                { position_on_card: 4 },
                { position_on_card: 8 },
                { position_on_card: 16 },
                { position_on_card: 20 }
            ];
            const result = checkAchievements(completions);

            expect(result.diagonals).toEqual([1]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect both diagonals', () => {
            // Complete both diagonals (position 12 is shared and free)
            const completions = [
                // First diagonal: 0, 6, 18, 24
                { position_on_card: 0 },
                { position_on_card: 6 },
                { position_on_card: 18 },
                { position_on_card: 24 },
                // Second diagonal: 4, 8, 16, 20
                { position_on_card: 4 },
                { position_on_card: 8 },
                { position_on_card: 16 },
                { position_on_card: 20 }
            ];
            const result = checkAchievements(completions);

            expect(result.diagonals).toEqual([0, 1]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect multiple rows and columns', () => {
            // Complete first row (0-4) and first column (0, 5, 10, 15, 20)
            const completions = [
                { position_on_card: 0 },
                { position_on_card: 1 },
                { position_on_card: 2 },
                { position_on_card: 3 },
                { position_on_card: 4 },
                { position_on_card: 5 },
                { position_on_card: 10 },
                { position_on_card: 15 },
                { position_on_card: 20 }
            ];
            const result = checkAchievements(completions);

            expect(result.rows).toEqual([0]);
            expect(result.columns).toEqual([0]);
            expect(result.fullCard).toBe(false);
        });

        test('should detect full card (all 24 positions + free space)', () => {
            // All positions except 12 (which is free)
            const completions = Array.from({ length: 25 }, (_, i) => i)
                .filter(i => i !== 12)
                .map(i => ({ position_on_card: i }));

            const result = checkAchievements(completions);

            expect(result.rows).toEqual([0, 1, 2, 3, 4]);
            expect(result.columns).toEqual([0, 1, 2, 3, 4]);
            expect(result.diagonals).toEqual([0, 1]);
            expect(result.fullCard).toBe(true);
        });

        test('should work with 3x3 card size', () => {
            // Complete first row of 3x3: positions 0, 1, 2
            const completions = [
                { position_on_card: 0 },
                { position_on_card: 1 },
                { position_on_card: 2 }
            ];
            const result = checkAchievements(completions, 3);

            expect(result.rows).toEqual([0]);
            expect(result.fullCard).toBe(false);
        });

        test('should handle free space correctly for 3x3 grid', () => {
            // Middle position (4) is free in 3x3, complete middle row
            const completions = [
                { position_on_card: 3 },
                { position_on_card: 5 }
            ];
            const result = checkAchievements(completions, 3);

            expect(result.rows).toEqual([1]);
        });
    });

    describe('calculatePoints', () => {
        const defaultConfig = {
            points_per_task: 10,
            bonus_row_points: 50,
            bonus_full_card_points: 100
        };

        test('should calculate points for no completions', () => {
            const completions = [];
            const achievements = {
                rows: [],
                columns: [],
                diagonals: [],
                fullCard: false
            };

            const points = calculatePoints(completions, achievements, defaultConfig);
            expect(points).toBe(0);
        });

        test('should calculate points for tasks only (no achievements)', () => {
            const completions = new Array(5).fill({});
            const achievements = {
                rows: [],
                columns: [],
                diagonals: [],
                fullCard: false
            };

            const points = calculatePoints(completions, achievements, defaultConfig);
            expect(points).toBe(50); // 5 tasks * 10 points
        });

        test('should calculate points for one row achievement', () => {
            const completions = new Array(5).fill({});
            const achievements = {
                rows: [0],
                columns: [],
                diagonals: [],
                fullCard: false
            };

            const points = calculatePoints(completions, achievements, defaultConfig);
            expect(points).toBe(100); // (5 * 10) + (1 * 50)
        });

        test('should calculate points for multiple achievements', () => {
            const completions = new Array(9).fill({});
            const achievements = {
                rows: [0],
                columns: [0],
                diagonals: [0],
                fullCard: false
            };

            const points = calculatePoints(completions, achievements, defaultConfig);
            expect(points).toBe(240); // (9 * 10) + (3 * 50)
        });

        test('should calculate points for full card', () => {
            const completions = new Array(24).fill({}); // 24 + 1 free = 25
            const achievements = {
                rows: [0, 1, 2, 3, 4],
                columns: [0, 1, 2, 3, 4],
                diagonals: [0, 1],
                fullCard: true
            };

            const points = calculatePoints(completions, achievements, defaultConfig);
            expect(points).toBe(940); // (24 * 10) + (12 * 50) + 100
        });

        test('should use custom config values', () => {
            const customConfig = {
                points_per_task: 5,
                bonus_row_points: 25,
                bonus_full_card_points: 50
            };

            const completions = new Array(10).fill({});
            const achievements = {
                rows: [0],
                columns: [0],
                diagonals: [],
                fullCard: false
            };

            const points = calculatePoints(completions, achievements, customConfig);
            expect(points).toBe(100); // (10 * 5) + (2 * 25)
        });

        test('should calculate points with only full card bonus', () => {
            const completions = new Array(24).fill({});
            const achievements = {
                rows: [0, 1, 2, 3, 4],
                columns: [0, 1, 2, 3, 4],
                diagonals: [0, 1],
                fullCard: true
            };

            const points = calculatePoints(completions, achievements, defaultConfig);

            // Verify the calculation:
            // Tasks: 24 * 10 = 240
            // Achievements: (5 rows + 5 cols + 2 diagonals) * 50 = 600
            // Full card: 100
            // Total: 940
            expect(points).toBe(940);
        });

        test('should handle zero bonus values', () => {
            const zeroConfig = {
                points_per_task: 10,
                bonus_row_points: 0,
                bonus_full_card_points: 0
            };

            const completions = new Array(24).fill({});
            const achievements = {
                rows: [0, 1, 2, 3, 4],
                columns: [0, 1, 2, 3, 4],
                diagonals: [0, 1],
                fullCard: true
            };

            const points = calculatePoints(completions, achievements, zeroConfig);
            expect(points).toBe(240); // Only task points, no bonuses
        });
    });
});
