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
const usersRoutes = (await import('../../routes/users.js')).default;

describe('Users Routes', () => {
  let app;
  const mockQuery = pg.__mockQuery;
  let adminToken;
  let instructorToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/users', usersRoutes);

    adminToken = jwt.sign(
      { userId: 1, email: 'admin@test.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    instructorToken = jwt.sign(
      { userId: 2, email: 'instructor@test.com', role: 'instructor' },
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

  const mockInstructorUser = {
    id: 2,
    email: 'instructor@test.com',
    first_name: 'Instructor',
    last_name: 'User',
    role: 'instructor',
    is_active: true
  };

  describe('GET /api/users', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin users', async () => {
      mockQuery.mockResolvedValue({ rows: [mockInstructorUser] });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
    });

    it('should return users list for admin', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] }) // Auth middleware
        .mockResolvedValueOnce({
          rows: [
            { id: 1, email: 'user1@test.com', first_name: 'User', last_name: 'One', role: 'admin', is_active: true },
            { id: 2, email: 'user2@test.com', first_name: 'User', last_name: 'Two', role: 'instructor', is_active: true }
          ]
        });

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return 404 if user not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should return user by id', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({
          rows: [{ id: 5, email: 'user5@test.com', first_name: 'User', last_name: 'Five', role: 'tester', is_active: true }]
        });

      const res = await request(app)
        .get('/api/users/5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(5);
    });
  });

  describe('POST /api/users', () => {
    it('should return 400 if required fields are missing', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'new@test.com' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if password is too short', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new@test.com',
          password: '123',
          first_name: 'New',
          last_name: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 תווים');
    });

    it('should return 400 for invalid role', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new@test.com',
          password: 'password123',
          first_name: 'New',
          last_name: 'User',
          role: 'superadmin'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('תפקיד');
    });

    it('should create user successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({
          rows: [{
            id: 10,
            email: 'new@test.com',
            first_name: 'New',
            last_name: 'User',
            role: 'student',
            is_active: true
          }]
        });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'new@test.com',
          password: 'password123',
          first_name: 'New',
          last_name: 'User'
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('new@test.com');
    });

    it('should return 400 if email already exists', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockRejectedValueOnce({ code: '23505' });

      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'existing@test.com',
          password: 'password123',
          first_name: 'Existing',
          last_name: 'User'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('כבר קיים');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should return 400 if required fields are missing', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .put('/api/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'update@test.com' });

      expect(res.status).toBe(400);
    });

    it('should prevent admin from deactivating themselves', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@test.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          is_active: false
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('לבטל את החשבון שלך');
    });

    it('should prevent admin from changing their own role', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'admin@test.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'instructor',
          is_active: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('לשנות את התפקיד');
    });

    it('should update user without password change', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({
          rows: [{
            id: 5,
            email: 'updated@test.com',
            first_name: 'Updated',
            last_name: 'User',
            role: 'instructor',
            is_active: true
          }]
        });

      const res = await request(app)
        .put('/api/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@test.com',
          first_name: 'Updated',
          last_name: 'User',
          role: 'instructor',
          is_active: true
        });

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('updated@test.com');
    });

    it('should update user with password change', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({
          rows: [{
            id: 5,
            email: 'updated@test.com',
            first_name: 'Updated',
            last_name: 'User',
            role: 'instructor',
            is_active: true
          }]
        });

      const res = await request(app)
        .put('/api/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@test.com',
          password: 'newpassword123',
          first_name: 'Updated',
          last_name: 'User',
          role: 'instructor',
          is_active: true
        });

      expect(res.status).toBe(200);
    });

    it('should return 400 if new password is too short', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .put('/api/users/5')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@test.com',
          password: '123',
          first_name: 'Updated',
          last_name: 'User',
          role: 'instructor',
          is_active: true
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 תווים');
    });

    it('should return 404 if user not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updated@test.com',
          first_name: 'Updated',
          last_name: 'User',
          role: 'instructor',
          is_active: true
        });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should prevent admin from deleting themselves', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('למחוק את החשבון שלך');
    });

    it('should return 404 if user not found', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .delete('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should delete user successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockAdminUser] })
        .mockResolvedValueOnce({
          rows: [{ id: 5, email: 'deleted@test.com' }]
        });

      const res = await request(app)
        .delete('/api/users/5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('בהצלחה');
    });
  });
});
