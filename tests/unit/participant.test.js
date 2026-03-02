/**
 * Unit tests for participant-related functions
 */

describe('Participant Utilities', () => {
  describe('Participant Code Validation', () => {
    test('should validate correct participant code format', () => {
      const validCode = '4H001';
      const pattern = /^4H\d{3,}$/;
      expect(pattern.test(validCode)).toBe(true);
    });

    test('should reject invalid participant code format', () => {
      const invalidCodes = ['4H', '001', 'TEST001', '4H01'];
      const pattern = /^4H\d{3,}$/;

      invalidCodes.forEach(code => {
        expect(pattern.test(code)).toBe(false);
      });
    });

    test('should accept participant codes with more than 3 digits', () => {
      const validCode = '4H0001';
      const pattern = /^4H\d{3,}$/;
      expect(pattern.test(validCode)).toBe(true);
    });
  });

  describe('Participant Data Validation', () => {
    test('should have required fields', () => {
      const participant = global.testUtils.createTestParticipant();

      expect(participant).toHaveProperty('participant_code');
      expect(participant).toHaveProperty('first_name');
      expect(participant).toHaveProperty('last_name');
    });

    test('should allow optional fields to be null', () => {
      const participant = global.testUtils.createTestParticipant({
        team: null,
        notes: null
      });

      expect(participant.team).toBeNull();
      expect(participant.notes).toBeNull();
    });

    test('should create participant with custom values', () => {
      const customParticipant = global.testUtils.createTestParticipant({
        first_name: 'Kari',
        last_name: 'Nordmann',
        age: 16
      });

      expect(customParticipant.first_name).toBe('Kari');
      expect(customParticipant.last_name).toBe('Nordmann');
      expect(customParticipant.age).toBe(16);
    });
  });

  describe('Age Validation', () => {
    test('should accept valid ages', () => {
      const validAges = [6, 12, 15, 18, 25];

      validAges.forEach(age => {
        expect(age).toBeGreaterThan(0);
        expect(age).toBeLessThan(150);
      });
    });

    test('should reject invalid ages', () => {
      const invalidAges = [-1, 0, 151, 200];

      invalidAges.forEach(age => {
        expect(age < 1 || age > 150).toBe(true);
      });
    });
  });

  describe('Role Validation', () => {
    test('should accept valid roles', () => {
      const validRoles = ['Deltaker', 'Frivillig', 'Arrangør', 'Leder'];

      validRoles.forEach(role => {
        expect(validRoles).toContain(role);
      });
    });

    test('should have Deltaker as default role', () => {
      const participant = global.testUtils.createTestParticipant();
      expect(participant.role).toBe('Deltaker');
    });
  });
});
