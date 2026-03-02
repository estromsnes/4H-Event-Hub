// Test setup file
// This runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port for tests
process.env.DB_PATH = ':memory:'; // Use in-memory database for tests

// Increase timeout for slower systems
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create a test participant
  createTestParticipant: (overrides = {}) => ({
    participant_code: 'TEST001',
    first_name: 'Test',
    last_name: 'Participant',
    age: 15,
    home_location: 'Oslo',
    club: 'Test Klubb',
    role: 'Deltaker',
    team: null,
    notes: '',
    ...overrides
  }),

  // Helper to create a test event
  createTestEvent: (overrides = {}) => ({
    event_name: 'Test Event',
    event_description: 'Test Description',
    location: 'Test Location',
    start_date: '2025-06-01',
    end_date: '2025-06-03',
    ...overrides
  })
};
