import { jest, describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

// Mock email service
jest.unstable_mockModule('../../services/email.js', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true, simulated: true })
}));

const pg = await import('pg');
const { sendPasswordResetEmail } = await import('../../services/email.js');
const authRoutes = (await import('../../routes/auth.js')).default;

describe('Auth Routes', () => {
  let app;
  const mockQuery = pg.__mockQuery;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  beforeEach(() => {
    mockQuery.mockReset();
    sendPasswordResetEmail.mockClear();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('נדרשים');
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });

    it('should return 401 if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('שגויים');
    });

    it('should return 401 if user is not active', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          email: 'inactive@test.com',
          password_hash: passwordHash,
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          is_active: false
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inactive@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('אינו פעיל');
    });

    it('should return 401 if password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          email: 'test@test.com',
          password_hash: passwordHash,
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          is_active: true
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('שגויים');
    });

    it('should return token and user on successful login', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          email: 'test@test.com',
          password_hash: passwordHash,
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          is_active: true
        }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      });
    });

    it('should lowercase email when querying', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await request(app)
        .post('/api/auth/login')
        .send({ email: 'TEST@TEST.COM', password: 'password123' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['test@test.com']
      );
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should return user info with valid token', async () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@test.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          is_active: true
        }]
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin'
      });
    });
  });

  describe('POST /api/auth/change-password', () => {
    let validToken;

    beforeEach(() => {
      validToken = jwt.sign(
        { userId: 1, email: 'test@test.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .send({ currentPassword: 'old', newPassword: 'new123' });

      expect(res.status).toBe(401);
    });

    it('should return 400 if currentPassword is missing', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', is_active: true }]
      });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ newPassword: 'newpass123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if newPassword is too short', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', is_active: true }]
      });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'oldpass', newPassword: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 תווים');
    });

    it('should return 401 if current password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 10);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', is_active: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ password_hash: passwordHash }]
        });

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpass123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('שגויה');
    });

    it('should successfully change password', async () => {
      const passwordHash = await bcrypt.hash('oldpassword', 10);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User', role: 'admin', is_active: true }]
        })
        .mockResolvedValueOnce({
          rows: [{ password_hash: passwordHash }]
        })
        .mockResolvedValueOnce({ rows: [] }); // UPDATE query

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ currentPassword: 'oldpassword', newPassword: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('בהצלחה');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return success message even if user not found (prevent enumeration)', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'notfound@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });

    it('should create reset token and send email for valid user', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, first_name: 'Test', email: 'test@test.com' }]
        })
        .mockResolvedValueOnce({ rows: [] }) // Invalidate existing tokens
        .mockResolvedValueOnce({ rows: [] }); // Insert new token

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(200);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@test.com',
        expect.any(String),
        'Test'
      );
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 if token is missing', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ newPassword: 'newpass123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 if newPassword is too short', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', newPassword: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('6 תווים');
    });

    it('should return 400 if token is invalid or expired', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'newpass123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('אינו תקין');
    });

    it('should successfully reset password with valid token', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            user_id: 1,
            token: 'valid-token',
            email: 'test@test.com'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // UPDATE users
        .mockResolvedValueOnce({ rows: [] }); // UPDATE tokens

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('בהצלחה');
    });
  });
});
