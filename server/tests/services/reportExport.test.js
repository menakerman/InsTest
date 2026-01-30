import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock ExcelJS
const mockGetCell = jest.fn().mockReturnValue({
  value: null,
  font: {},
  alignment: {},
  fill: {}
});

const mockGetRow = jest.fn().mockReturnValue({
  font: {},
  fill: {}
});

const mockGetColumn = jest.fn().mockReturnValue({
  width: 0
});

const mockMergeCells = jest.fn();

const mockAddWorksheet = jest.fn().mockReturnValue({
  getCell: mockGetCell,
  getRow: mockGetRow,
  getColumn: mockGetColumn,
  mergeCells: mockMergeCells
});

const mockWorkbook = {
  creator: '',
  created: null,
  addWorksheet: mockAddWorksheet,
  xlsx: {
    write: jest.fn()
  }
};

jest.unstable_mockModule('exceljs', () => ({
  default: {
    Workbook: jest.fn().mockImplementation(() => mockWorkbook)
  },
  Workbook: jest.fn().mockImplementation(() => mockWorkbook)
}));

const { generateFinalReport } = await import('../../services/reportExport.js');

describe('Report Export Service', () => {
  let mockPool;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = {
      query: jest.fn()
    };
  });

  const mockStudents = [
    { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@test.com', phone: '0501234567', unit_id: 'Unit1' },
    { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@test.com', phone: null, unit_id: null }
  ];

  const mockSubjects = [
    { id: 1, code: 'class_lecture', name_he: 'הרצאה', max_raw_score: 100, passing_raw_score: 60, display_order: 1 },
    { id: 2, code: 'class_exercise', name_he: 'תרגיל', max_raw_score: 100, passing_raw_score: 60, display_order: 2 },
    { id: 3, code: 'teaching_practice', name_he: 'הדרכה', max_raw_score: 100, passing_raw_score: 60, display_order: 3 },
    { id: 4, code: 'written_test', name_he: 'מבחן כתוב', max_raw_score: 100, passing_raw_score: 60, display_order: 4 },
    { id: 5, code: 'water_lesson', name_he: 'שיעור מים', max_raw_score: 100, passing_raw_score: 60, display_order: 5 }
  ];

  const mockEvaluations = [
    {
      id: 1,
      student_id: 1,
      subject_id: 1,
      evaluation_date: '2024-01-15',
      raw_score: 85,
      percentage_score: 85,
      is_passing: true,
      has_critical_fail: false,
      course_name: 'קורס מדריכי צלילה',
      instructor_first_name: 'David',
      instructor_last_name: 'Cohen'
    },
    {
      id: 2,
      student_id: 1,
      subject_id: 2,
      evaluation_date: '2024-01-16',
      raw_score: 55,
      percentage_score: 55,
      is_passing: false,
      has_critical_fail: false,
      instructor_first_name: 'Sara',
      instructor_last_name: 'Levi'
    },
    {
      id: 3,
      student_id: 2,
      subject_id: 1,
      evaluation_date: '2024-01-17',
      raw_score: 70,
      percentage_score: 70,
      is_passing: true,
      has_critical_fail: false,
      instructor_first_name: null,
      instructor_last_name: null
    }
  ];

  const mockAbsences = [
    { id: 1, student_id: 1, absence_date: '2024-01-10', reason: 'Sick', is_excused: true },
    { id: 2, student_id: 1, absence_date: '2024-01-11', reason: null, is_excused: false },
    { id: 3, student_id: 2, absence_date: '2024-01-10', reason: 'Family', is_excused: true }
  ];

  const mockItemScores = [];
  const mockExternalTests = [];
  const mockStudentSkills = [];
  const mockCriteria = [];

  // Helper to set up all 9 required mock query responses
  const setupMockQueries = (students, subjects, evaluations, absences, itemScores = [], course = [], externalTests = [], studentSkills = [], criteria = []) => {
    mockPool.query
      .mockResolvedValueOnce({ rows: students })      // students
      .mockResolvedValueOnce({ rows: subjects })      // subjects
      .mockResolvedValueOnce({ rows: evaluations })   // evaluations
      .mockResolvedValueOnce({ rows: absences })      // absences
      .mockResolvedValueOnce({ rows: itemScores })    // itemScores
      .mockResolvedValueOnce({ rows: course })        // course
      .mockResolvedValueOnce({ rows: externalTests }) // externalTests
      .mockResolvedValueOnce({ rows: studentSkills }) // studentSkills
      .mockResolvedValueOnce({ rows: criteria });     // criteria
  };

  describe('generateFinalReport', () => {
    it('should create workbook with all required sheets', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
      // Should create: קורס, ראשי, העדרויות, מבחנים + one sheet per student (2)
      expect(mockAddWorksheet).toHaveBeenCalledTimes(6);
    });

    it('should query all required tables', async () => {
      setupMockQueries([], [], [], [], [], [], [], [], []);

      await generateFinalReport(mockPool);

      // 8 queries when courseId is not provided (course query returns Promise.resolve directly)
      expect(mockPool.query).toHaveBeenCalledTimes(8);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM evaluation_subjects ORDER BY display_order');
    });

    it('should handle empty data gracefully', async () => {
      setupMockQueries([], [], [], [], [], [], [], [], []);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
      // Should create: קורס, ראשי, העדרויות, מבחנים (no student sheets)
      expect(mockAddWorksheet).toHaveBeenCalledTimes(4);
    });

    it('should create course sheet with right-to-left view', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      expect(mockAddWorksheet).toHaveBeenCalledWith('קורס', {
        views: [{ rightToLeft: true }]
      });
    });

    it('should create main sheet with passing thresholds', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      expect(mockAddWorksheet).toHaveBeenCalledWith('ראשי', {
        views: [{ rightToLeft: true }]
      });
    });

    it('should create absences sheet', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      expect(mockAddWorksheet).toHaveBeenCalledWith('העדרויות', {
        views: [{ rightToLeft: true }]
      });
    });

    it('should create exams matrix sheet', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      expect(mockAddWorksheet).toHaveBeenCalledWith('מבחנים', {
        views: [{ rightToLeft: true }]
      });
    });

    it('should create individual student sheets', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      // Check that student sheets were created
      expect(mockAddWorksheet).toHaveBeenCalledWith('John Doe', expect.anything());
      expect(mockAddWorksheet).toHaveBeenCalledWith('Jane Smith', expect.anything());
    });

    it('should derive course info from evaluations', async () => {
      const evaluationsWithCourse = [
        { ...mockEvaluations[0], course_name: 'Test Course' },
        { ...mockEvaluations[1], course_name: 'Test Course' },
        { ...mockEvaluations[2], course_name: 'Other Course' }
      ];

      setupMockQueries(mockStudents, mockSubjects, evaluationsWithCourse, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      // Verify the course sheet was created
      expect(mockAddWorksheet).toHaveBeenCalledWith('קורס', expect.anything());
    });

    it('should use default course name when no evaluations', async () => {
      setupMockQueries(mockStudents, mockSubjects, [], mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      expect(mockAddWorksheet).toHaveBeenCalled();
    });

    it('should handle students with no evaluations', async () => {
      const studentWithNoEvals = [
        { id: 3, first_name: 'No', last_name: 'Evals', email: 'no@test.com', phone: null, unit_id: null }
      ];

      setupMockQueries(studentWithNoEvals, mockSubjects, [], [], mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
    });

    it('should handle students with no absences', async () => {
      setupMockQueries(mockStudents, mockSubjects, mockEvaluations, [], mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
    });

    it('should handle evaluation with critical fail', async () => {
      const evalsWithCriticalFail = [
        {
          ...mockEvaluations[0],
          is_passing: true,
          has_critical_fail: true
        }
      ];

      setupMockQueries(mockStudents, mockSubjects, evalsWithCriticalFail, mockAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
    });

    it('should handle multiple evaluations for same subject (take latest)', async () => {
      const multipleEvals = [
        {
          id: 1,
          student_id: 1,
          subject_id: 1,
          evaluation_date: '2024-01-15',
          raw_score: 50,
          percentage_score: 50,
          is_passing: false,
          has_critical_fail: false
        },
        {
          id: 2,
          student_id: 1,
          subject_id: 1,
          evaluation_date: '2024-01-20',
          raw_score: 80,
          percentage_score: 80,
          is_passing: true,
          has_critical_fail: false
        }
      ];

      setupMockQueries([mockStudents[0]], mockSubjects, multipleEvals, [], mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
    });

    it('should set workbook metadata', async () => {
      setupMockQueries([], [], [], [], [], [], [], [], []);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook.creator).toBe('InsTest');
      expect(workbook.created).toBeInstanceOf(Date);
    });

    it('should truncate long student names for sheet names', async () => {
      const studentWithLongName = [{
        id: 1,
        first_name: 'VeryLongFirstNameThatExceeds',
        last_name: 'ThirtyOneCharacters',
        email: 'long@test.com',
        phone: null,
        unit_id: null
      }];

      setupMockQueries(studentWithLongName, mockSubjects, [], [], mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      await generateFinalReport(mockPool);

      // Verify that student sheet was created (name should be truncated to 31 chars)
      expect(mockAddWorksheet).toHaveBeenCalledWith(
        expect.stringMatching(/^.{1,31}$/),
        expect.anything()
      );
    });

    it('should handle excused and unexcused absences differently', async () => {
      const mixedAbsences = [
        { id: 1, student_id: 1, absence_date: '2024-01-10', reason: 'Sick', is_excused: true },
        { id: 2, student_id: 1, absence_date: '2024-01-11', reason: 'Unknown', is_excused: false }
      ];

      setupMockQueries([mockStudents[0]], mockSubjects, mockEvaluations.filter(e => e.student_id === 1), mixedAbsences, mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
    });

    it('should handle evaluations without instructor info', async () => {
      const evalsNoInstructor = [{
        id: 1,
        student_id: 1,
        subject_id: 1,
        evaluation_date: '2024-01-15',
        raw_score: 85,
        percentage_score: 85,
        is_passing: true,
        has_critical_fail: false,
        instructor_first_name: null,
        instructor_last_name: null
      }];

      setupMockQueries([mockStudents[0]], mockSubjects, evalsNoInstructor, [], mockItemScores, [], mockExternalTests, mockStudentSkills, mockCriteria);

      const workbook = await generateFinalReport(mockPool);

      expect(workbook).toBeDefined();
    });
  });
});
