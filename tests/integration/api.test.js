/**
 * Integration tests for API endpoints
 */

const request = require('supertest');
const { app, db } = require('../../server');

describe('API Integration Tests', () => {
  // Close database connection after all tests
  afterAll((done) => {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      done();
    });
  });

  describe('GET /api/event', () => {
    test('should return event information', async () => {
      const response = await request(app).get('/api/event');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('event_name');
    });

    test('should return event with all expected fields', async () => {
      const response = await request(app).get('/api/event');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        event_name: expect.any(String),
        location: expect.anything(),
        start_date: expect.anything(),
        end_date: expect.anything()
      });
    });
  });

  describe('GET /api/participants', () => {
    test('should return list of participants', async () => {
      const response = await request(app).get('/api/participants');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('participants should have required fields', async () => {
      const response = await request(app).get('/api/participants');
      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        const participant = response.body[0];
        expect(participant).toHaveProperty('participant_code');
        expect(participant).toHaveProperty('first_name');
        expect(participant).toHaveProperty('last_name');
      }
    });
  });

  describe('GET /api/participants/:code', () => {
    test('should return 404 for non-existent participant', async () => {
      const response = await request(app).get('/api/participants/INVALID999');
      expect(response.status).toBe(404);
    });

    test('should return participant if exists', async () => {
      // First get list of participants to find a valid code
      const listResponse = await request(app).get('/api/participants');

      if (listResponse.body.length > 0) {
        const validCode = listResponse.body[0].participant_code;
        const response = await request(app).get(`/api/participants/${validCode}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('participant_code', validCode);
        expect(response.body).toHaveProperty('first_name');
        expect(response.body).toHaveProperty('last_name');
      }
    });
  });

  describe('GET /api/teams', () => {
    test('should return list of teams', async () => {
      const response = await request(app).get('/api/teams');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('teams should have expected structure', async () => {
      const response = await request(app).get('/api/teams');
      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        const team = response.body[0];
        expect(team).toHaveProperty('id');
        expect(team).toHaveProperty('name');
      }
    });
  });

  describe('GET /api/sleeping-rooms', () => {
    test('should return list of sleeping rooms', async () => {
      const response = await request(app).get('/api/sleeping-rooms');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('rooms should have capacity and name', async () => {
      const response = await request(app).get('/api/sleeping-rooms');
      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        const room = response.body[0];
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('name');
        expect(room).toHaveProperty('capacity');
      }
    });
  });

  describe('GET /api/sleeping-rooms/report/all', () => {
    test('should return rooms with occupancy data', async () => {
      const response = await request(app).get('/api/sleeping-rooms/report/all');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const room = response.body[0];
        expect(room).toHaveProperty('name');
        expect(room).toHaveProperty('capacity');
        expect(room).toHaveProperty('occupancy');
        expect(room).toHaveProperty('participants');
        expect(Array.isArray(room.participants)).toBe(true);
      }
    });
  });

  describe('PUT /api/participants/:code/sleeping-room', () => {
    test('should reject request without body', async () => {
      const response = await request(app)
        .put('/api/participants/TEST001/sleeping-room')
        .send({});

      // Should either be 400 (bad request) or 404 (participant not found)
      expect([400, 404]).toContain(response.status);
    });

    test('should reject invalid room ID', async () => {
      // Get a valid participant first
      const participantsResponse = await request(app).get('/api/participants');

      if (participantsResponse.body.length > 0) {
        const validCode = participantsResponse.body[0].participant_code;

        const response = await request(app)
          .put(`/api/participants/${validCode}/sleeping-room`)
          .send({ sleepingRoomId: 99999 });

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('not found');
      }
    });

    test('should assign room to participant if both exist', async () => {
      // Get valid participant and room
      const participantsResponse = await request(app).get('/api/participants');
      const roomsResponse = await request(app).get('/api/sleeping-rooms');

      if (participantsResponse.body.length > 0 && roomsResponse.body.length > 0) {
        const participant = participantsResponse.body[0];
        const room = roomsResponse.body[0];

        const response = await request(app)
          .put(`/api/participants/${participant.participant_code}/sleeping-room`)
          .send({ sleepingRoomId: room.id });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('roomName');
        expect(response.body.roomName).toBe(room.name);
      }
    });

    test('should remove room assignment when sleepingRoomId is null', async () => {
      const participantsResponse = await request(app).get('/api/participants');

      if (participantsResponse.body.length > 0) {
        const participant = participantsResponse.body[0];

        const response = await request(app)
          .put(`/api/participants/${participant.participant_code}/sleeping-room`)
          .send({ sleepingRoomId: null });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('POST /api/participants/:code/confirm', () => {
    test('should return 404 for non-existent participant', async () => {
      const response = await request(app)
        .post('/api/participants/INVALID999/confirm');

      expect(response.status).toBe(404);
    });

    test('should confirm a participant', async () => {
      // Get a valid unconfirmed participant
      const participantsResponse = await request(app).get('/api/participants');

      if (participantsResponse.body.length > 0) {
        const unconfirmedParticipant = participantsResponse.body.find(p => p.confirmed !== 1);

        if (unconfirmedParticipant) {
          const response = await request(app)
            .post(`/api/participants/${unconfirmedParticipant.participant_code}/confirm`);

          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('confirmed', 1);
          expect(response.body).toHaveProperty('confirmed_at');
        }
      }
    });
  });

  describe('GET /api/courses', () => {
    test('should return list of courses', async () => {
      const response = await request(app).get('/api/courses');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/quiz/questions', () => {
    test('should return list of quiz questions', async () => {
      const response = await request(app).get('/api/quiz/questions');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/scavenger/checkpoints', () => {
    test('should return list of checkpoints', async () => {
      const response = await request(app).get('/api/scavenger/checkpoints');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Error handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
    });

    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/participants/TEST/confirm')
        .send('invalid json');

      // Should handle error (either 400 or 404)
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
