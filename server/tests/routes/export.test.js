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

// Mock reportExport service
const mockWorkbook = {
  xlsx: {
    write: jest.fn().mockResolvedValue(undefined)
  }
};

jest.unstable_mockModule('../../services/reportExport.js', () => ({
  generateFinalReport: jest.fn().mockResolvedValue(mockWorkbook)
}));

const pg = await import('pg');
const { generateFinalReport } = await import('../../services/reportExport.js');
const exportRoutes = (await import('../../routes/export.js')).default;

describe('Export Routes', () => {
  let app;
  const mockQuery = pg.__mockQuery;
  let adminToken;
  let instructorToken;
  let studentToken;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/export', exportRoutes);

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

    studentToken = jwt.sign(
      { userId: 3, email: 'student@test.com', role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  beforeEach(() => {
    mockQuery.mockReset();
    generateFinalReport.mockClear();
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

  const mockStudentUser = {
    id: 3,
    email: 'student@test.com',
    first_name: 'Student',
    last_name: 'User',
    role: 'student',
    is_active: true
  };

  describe('GET /api/export/final-report', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/export/final-report');
      expect(res.status).toBe(401);
    });

    it('should return 403 for student role', async () => {
      mockQuery.mockResolvedValue({ rows: [mockStudentUser] });

      const res = await request(app)
        .get('/api/export/final-report')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('should generate report for admin', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .get('/api/export/final-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(generateFinalReport).toHaveBeenCalled();
      expect(res.headers['content-type']).toContain('spreadsheetml');
    });

    it('should generate report for instructor', async () => {
      mockQuery.mockResolvedValue({ rows: [mockInstructorUser] });

      const res = await request(app)
        .get('/api/export/final-report')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(generateFinalReport).toHaveBeenCalled();
    });

    it('should set correct content-disposition header', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });

      const res = await request(app)
        .get('/api/export/final-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.headers['content-disposition']).toContain('attachment');
      expect(res.headers['content-disposition']).toContain('.xlsx');
    });

    it('should handle errors from report generation', async () => {
      mockQuery.mockResolvedValue({ rows: [mockAdminUser] });
      generateFinalReport.mockRejectedValueOnce(new Error('Report error'));

      const res = await request(app)
        .get('/api/export/final-report')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('שגיאה');
    });
  });
});
