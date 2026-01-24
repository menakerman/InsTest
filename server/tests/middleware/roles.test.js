import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { requireRole, roleHierarchy, canManageRole } from '../../middleware/roles.js';

describe('Roles Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('requireRole', () => {
    it('should return 401 if no user is set', () => {
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('גישה נדחתה')
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not in allowed roles', () => {
      req.user = { id: 1, role: 'student' };
      const middleware = requireRole('admin', 'instructor');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('אין לך הרשאה')
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is admin and admin is allowed', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next if user role is in the allowed roles list', () => {
      req.user = { id: 1, role: 'instructor' };
      const middleware = requireRole('admin', 'instructor', 'tester');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next for tester when tester is allowed', () => {
      req.user = { id: 1, role: 'tester' };
      const middleware = requireRole('tester');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should reject student when only admin/instructor allowed', () => {
      req.user = { id: 1, role: 'student' };
      const middleware = requireRole('admin', 'instructor');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should work with single role', () => {
      req.user = { id: 1, role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should work with multiple roles', () => {
      req.user = { id: 1, role: 'tester' };
      const middleware = requireRole('admin', 'instructor', 'tester', 'student');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('roleHierarchy', () => {
    it('should define admin as having access to all roles', () => {
      expect(roleHierarchy.admin).toEqual(['admin', 'instructor', 'tester', 'student']);
    });

    it('should define instructor as having access to instructor, tester, student', () => {
      expect(roleHierarchy.instructor).toEqual(['instructor', 'tester', 'student']);
    });

    it('should define tester as having access to tester, student', () => {
      expect(roleHierarchy.tester).toEqual(['tester', 'student']);
    });

    it('should define student as having access only to student', () => {
      expect(roleHierarchy.student).toEqual(['student']);
    });
  });

  describe('canManageRole', () => {
    it('should return true if admin manages instructor', () => {
      expect(canManageRole('admin', 'instructor')).toBe(true);
    });

    it('should return true if admin manages tester', () => {
      expect(canManageRole('admin', 'tester')).toBe(true);
    });

    it('should return true if admin manages student', () => {
      expect(canManageRole('admin', 'student')).toBe(true);
    });

    it('should return false if admin tries to manage admin', () => {
      expect(canManageRole('admin', 'admin')).toBe(false);
    });

    it('should return true if instructor manages tester', () => {
      expect(canManageRole('instructor', 'tester')).toBe(true);
    });

    it('should return true if instructor manages student', () => {
      expect(canManageRole('instructor', 'student')).toBe(true);
    });

    it('should return false if instructor manages instructor', () => {
      expect(canManageRole('instructor', 'instructor')).toBe(false);
    });

    it('should return false if instructor manages admin', () => {
      expect(canManageRole('instructor', 'admin')).toBe(false);
    });

    it('should return false if student manages anyone', () => {
      expect(canManageRole('student', 'student')).toBe(false);
      expect(canManageRole('student', 'tester')).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(canManageRole('unknown', 'student')).toBe(false);
    });
  });
});
