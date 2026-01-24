import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock pg before importing the module
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
const { authenticateToken } = await import('../../middleware/auth.js');

describe('Auth Middleware', () => {
  let req, res, next;
  const mockQuery = pg.__mockQuery;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    mockQuery.mockReset();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('גישה נדחתה')
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header has no token', async () => {
      req.headers['authorization'] = 'Bearer ';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', async () => {
      req.headers['authorization'] = 'Bearer invalid-token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('טוקן לא תקין')
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@test.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      req.headers['authorization'] = `Bearer ${expiredToken}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('פג תוקף')
      });
    });

    it('should return 401 if user not found in database', async () => {
      const validToken = jwt.sign(
        { userId: 999, email: 'notfound@test.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers['authorization'] = `Bearer ${validToken}`;
      mockQuery.mockResolvedValue({ rows: [] });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('משתמש לא נמצא')
      });
    });

    it('should return 401 if user is not active', async () => {
      const validToken = jwt.sign(
        { userId: 1, email: 'inactive@test.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers['authorization'] = `Bearer ${validToken}`;
      mockQuery.mockResolvedValue({
        rows: [{
          id: 1,
          email: 'inactive@test.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'admin',
          is_active: false
        }]
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('אינו פעיל')
      });
    });

    it('should call next and set req.user for valid token and active user', async () => {
      const validToken = jwt.sign(
        { userId: 1, email: 'test@test.com', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers['authorization'] = `Bearer ${validToken}`;

      const mockUser = {
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        is_active: true
      };
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      await authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should query database with correct user id from token', async () => {
      const validToken = jwt.sign(
        { userId: 42, email: 'test@test.com', role: 'instructor' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers['authorization'] = `Bearer ${validToken}`;
      mockQuery.mockResolvedValue({
        rows: [{
          id: 42,
          email: 'test@test.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'instructor',
          is_active: true
        }]
      });

      await authenticateToken(req, res, next);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [42]
      );
    });
  });
});
