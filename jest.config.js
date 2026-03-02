module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'routes/**/*.js',
    'database/**/*.js',
    '!database/migrations/**',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
