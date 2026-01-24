import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getEvaluationSubjects,
  getEvaluationSubject,
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAbsences,
  getAbsence,
  createAbsence,
  updateAbsence,
  deleteAbsence,
  exportFinalReport
} from '../utils/api';

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.getItem.mockReturnValue(null);
  });

  describe('Auth Headers', () => {
    it('should not include auth header when no token', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getStudents();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      const callHeaders = global.fetch.mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });

    it('should include auth header when token exists', async () => {
      window.localStorage.getItem.mockReturnValue('my-token');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      });

      await getStudents();

      const callHeaders = global.fetch.mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBe('Bearer my-token');
    });
  });

  describe('401 Handling', () => {
    it('should clear token and redirect on 401', async () => {
      window.localStorage.getItem.mockReturnValue('expired-token');

      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(getStudents()).rejects.toThrow('Session expired');

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.location.href).toBe('/login');

      window.location = originalLocation;
    });
  });

  describe('Error Handling', () => {
    it('should throw error with message from API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Custom error message' })
      });

      await expect(getStudents()).rejects.toThrow('Custom error message');
    });

    it('should throw generic error when no message from API', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Parse error'))
      });

      await expect(getStudents()).rejects.toThrow('Request failed with status 500');
    });
  });

  describe('Student API', () => {
    it('should call correct endpoint for getStudents', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      const result = await getStudents();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students'),
        expect.any(Object)
      );
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should call correct endpoint for getStudent', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await getStudent(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students/1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for createStudent', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await createStudent({ first_name: 'Test', last_name: 'User', email: 'test@test.com' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test')
        })
      );
    });

    it('should call correct endpoint for updateStudent', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await updateStudent(1, { first_name: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students/1'),
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });

    it('should call correct endpoint for deleteStudent', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'deleted' })
      });

      await deleteStudent(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/students/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Instructor API', () => {
    it('should call correct endpoint for getInstructors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      await getInstructors();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/instructors'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getInstructor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await getInstructor(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/instructors/1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for createInstructor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await createInstructor({ first_name: 'Test' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/instructors'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call correct endpoint for updateInstructor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await updateInstructor(1, { first_name: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/instructors/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should call correct endpoint for deleteInstructor', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await deleteInstructor(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/instructors/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Evaluation Subjects API', () => {
    it('should call correct endpoint for getEvaluationSubjects', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ code: 'class_lecture' }])
      });

      await getEvaluationSubjects();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluation-subjects'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getEvaluationSubject', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ code: 'class_lecture' })
      });

      await getEvaluationSubject('class_lecture');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluation-subjects/class_lecture'),
        expect.any(Object)
      );
    });
  });

  describe('Evaluations API', () => {
    it('should call correct endpoint for getEvaluations without filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      await getEvaluations();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluations'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getEvaluations with filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      await getEvaluations({ student_id: 1, subject_id: 2 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('student_id=1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getEvaluation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await getEvaluation(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluations/1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for createEvaluation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await createEvaluation({ student_id: 1, subject_id: 1 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluations'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call correct endpoint for updateEvaluation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await updateEvaluation(1, { notes: 'updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluations/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should call correct endpoint for deleteEvaluation', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await deleteEvaluation(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/evaluations/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('User API', () => {
    it('should call correct endpoint for getUsers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      await getUsers();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getUser', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await getUser(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for createUser', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await createUser({
        email: 'new@test.com',
        password: 'pass123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should call correct endpoint for updateUser', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await updateUser(1, { first_name: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });

    it('should call correct endpoint for deleteUser', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'deleted' })
      });

      await deleteUser(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Absences API', () => {
    it('should call correct endpoint for getAbsences without filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      await getAbsences();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/absences'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getAbsences with filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1 }])
      });

      await getAbsences({ student_id: 1 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('student_id=1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for getAbsence', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await getAbsence(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/absences/1'),
        expect.any(Object)
      );
    });

    it('should call correct endpoint for createAbsence', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await createAbsence({ student_id: 1, absence_date: '2024-01-15' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/absences'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call correct endpoint for updateAbsence', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 })
      });

      await updateAbsence(1, { reason: 'updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/absences/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should call correct endpoint for deleteAbsence', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await deleteAbsence(1);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/absences/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Export API', () => {
    it('should call correct endpoint for exportFinalReport', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/octet-stream' });

      // Mock DOM methods
      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = vi.fn();
      window.URL.createObjectURL = mockCreateObjectURL;
      window.URL.revokeObjectURL = mockRevokeObjectURL;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: () => Promise.resolve(mockBlob),
        headers: {
          get: () => 'attachment; filename="report.xlsx"'
        }
      });

      await exportFinalReport();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/export/final-report'),
        expect.any(Object)
      );

      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    it('should handle 401 on export', async () => {
      window.localStorage.getItem.mockReturnValue('expired-token');

      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(exportFinalReport()).rejects.toThrow('Session expired');

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');

      window.location = originalLocation;
    });

    it('should handle export errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Export failed' })
      });

      await expect(exportFinalReport()).rejects.toThrow('Export failed');
    });
  });
});
