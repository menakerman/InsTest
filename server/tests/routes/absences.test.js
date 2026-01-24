import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock pg before importing
jest.unstable_mockModule('pg', () => {
  const mockQuery = jest.fn();
  return {
    default: {
      Pool: jest.fn(() => ({
        query: mockQuery
      }))
    },
    Pool: jest.fn(() => ({
      query: mockQuery
    })),
    __mockQuery: mockQuery
  };
});

const pg = await import('pg');
const absencesRoutes = (await import('../../routes/absences.js')).default;

describe('Absences Routes', () => {
  let app;
  const mockQuery = pg.__mockQuery;
  let adminToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/absences', absencesRoutes);

    adminToken = jwt.sign(
      { userId: 1, email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  const mockAdminUser = {
    id: 1,
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true
  };

  const mockAbsence = {
    id: 1,
    student_id: 1,
    absence_date: '2024-01-15',
    reason: 'Sick',
    is_excused: true,
    notes: 'Doctor note provided',
    student_first_name: 'John',
    student_last_name: 'Doe'
  };

  describe('GET /api/absences', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/absences');
      expect(res.status).toBe(401);
    });

    it('should return all absences for authenticated admin', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [mockAbsence] });

      const res = await request(app)
        .get('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].student_first_name).toBe('John');
    });

    it('should filter absences by student_id', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [mockAbsence] });

      const res = await request(app)
        .get('/api/absences?student_id=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockQuery.mock.calls[1][1]).toContain('1');
    });

    it('should filter absences by date range', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/absences?from_date=2024-01-01&to_date=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(mockQuery.mock.calls[1][1]).toContain('2024-01-01');
      expect(mockQuery.mock.calls[1][1]).toContain('2024-01-31');
    });

    it('should handle database errors', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('שגיאה');
    });
  });

  describe('GET /api/absences/:id', () => {
    it('should return absence by id', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [mockAbsence] });

      const res = await request(app)
        .get('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('should return 404 if absence not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/absences/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('לא נמצאה');
    });

    it('should handle database errors', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .get('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/absences', () => {
    it('should return 400 if student_id is missing', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ absence_date: '2024-01-15' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('נדרשים');
    });

    it('should return 400 if absence_date is missing', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ student_id: 1 });

      expect(res.status).toBe(400);
    });

    it('should create absence successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [mockAbsence] });

      const res = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 1,
          absence_date: '2024-01-15',
          reason: 'Sick',
          is_excused: true,
          notes: 'Doctor note'
        });

      expect(res.status).toBe(201);
      expect(res.body.student_first_name).toBe('John');
    });

    it('should return 400 if student does not exist', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce({ code: '23503' });

      const res = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 999,
          absence_date: '2024-01-15'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('תלמיד לא קיים');
    });

    it('should handle database errors', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .post('/api/absences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 1,
          absence_date: '2024-01-15'
        });

      expect(res.status).toBe(500);
    });
  });

  describe('PUT /api/absences/:id', () => {
    it('should return 400 if required fields are missing', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .put('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Updated' });

      expect(res.status).toBe(400);
    });

    it('should update absence successfully', async () => {
      const updatedAbsence = { ...mockAbsence, reason: 'Updated reason' };
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [updatedAbsence] });

      const res = await request(app)
        .put('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 1,
          absence_date: '2024-01-15',
          reason: 'Updated reason',
          is_excused: true
        });

      expect(res.status).toBe(200);
    });

    it('should return 404 if absence not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/absences/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 1,
          absence_date: '2024-01-15'
        });

      expect(res.status).toBe(404);
    });

    it('should return 400 if student does not exist', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce({ code: '23503' });

      const res = await request(app)
        .put('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 999,
          absence_date: '2024-01-15'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('תלמיד לא קיים');
    });

    it('should handle database errors', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .put('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 1,
          absence_date: '2024-01-15'
        });

      expect(res.status).toBe(500);
    });
  });

  describe('DELETE /api/absences/:id', () => {
    it('should delete absence successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [mockAbsence] });

      const res = await request(app)
        .delete('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('בהצלחה');
    });

    it('should return 404 if absence not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/absences/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should handle database errors', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .delete('/api/absences/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
    });
  });
});
