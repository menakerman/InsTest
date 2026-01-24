import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

dotenv.config();

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Course type labels for display
const courseTypeLabels = {
  'מדריך_עוזר': 'מדריך עוזר',
  'מדריך': 'מדריך',
  'מדריך_עוזר_משולב_עם_מדריך': 'מדריך עוזר משולב עם מדריך'
};

// Get all courses with student count
router.get('/', authenticateToken, requireRole('admin', 'instructor', 'tester'), async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = `
      SELECT
        c.*,
        COUNT(cs.student_id) as student_count
      FROM courses c
      LEFT JOIN course_students cs ON c.id = cs.course_id
    `;

    const params = [];
    if (is_active !== undefined) {
      query += ' WHERE c.is_active = $1';
      params.push(is_active === 'true');
    }

    query += ' GROUP BY c.id ORDER BY c.start_date DESC';

    const result = await pool.query(query, params);

    // Add display label for course type
    const courses = result.rows.map(course => ({
      ...course,
      course_type_label: courseTypeLabels[course.course_type] || course.course_type
    }));

    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course with enrolled students
router.get('/:id', authenticateToken, requireRole('admin', 'instructor', 'tester'), async (req, res) => {
  try {
    const { id } = req.params;

    const courseResult = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Get enrolled students
    const studentsResult = await pool.query(
      `SELECT s.*, cs.enrolled_at
       FROM students s
       JOIN course_students cs ON s.id = cs.student_id
       WHERE cs.course_id = $1
       ORDER BY s.last_name, s.first_name`,
      [id]
    );

    res.json({
      ...course,
      course_type_label: courseTypeLabels[course.course_type] || course.course_type,
      students: studentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course with students
router.post('/', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, course_type, start_date, end_date, description, student_ids } = req.body;

    if (!name || !course_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, course type, start date, and end date are required' });
    }

    // Validate course type
    const validTypes = ['מדריך_עוזר', 'מדריך', 'מדריך_עוזר_משולב_עם_מדריך'];
    if (!validTypes.includes(course_type)) {
      return res.status(400).json({ error: 'Invalid course type' });
    }

    await client.query('BEGIN');

    // Create course
    const courseResult = await client.query(
      `INSERT INTO courses (name, course_type, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, course_type, start_date, end_date, description || null]
    );

    const courseId = courseResult.rows[0].id;

    // Add students to course
    if (student_ids && student_ids.length > 0) {
      for (const studentId of student_ids) {
        await client.query(
          `INSERT INTO course_students (course_id, student_id)
           VALUES ($1, $2)`,
          [courseId, studentId]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch complete course with students
    const completeResult = await pool.query(
      `SELECT c.*, COUNT(cs.student_id) as student_count
       FROM courses c
       LEFT JOIN course_students cs ON c.id = cs.course_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [courseId]
    );

    res.status(201).json({
      ...completeResult.rows[0],
      course_type_label: courseTypeLabels[completeResult.rows[0].course_type]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  } finally {
    client.release();
  }
});

// Update course and students
router.put('/:id', authenticateToken, requireRole('admin', 'instructor'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { name, course_type, start_date, end_date, description, is_active, student_ids } = req.body;

    if (!name || !course_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, course type, start date, and end date are required' });
    }

    // Validate course type
    const validTypes = ['מדריך_עוזר', 'מדריך', 'מדריך_עוזר_משולב_עם_מדריך'];
    if (!validTypes.includes(course_type)) {
      return res.status(400).json({ error: 'Invalid course type' });
    }

    await client.query('BEGIN');

    // Update course
    const courseResult = await client.query(
      `UPDATE courses
       SET name = $1, course_type = $2, start_date = $3, end_date = $4,
           description = $5, is_active = $6
       WHERE id = $7
       RETURNING *`,
      [name, course_type, start_date, end_date, description || null, is_active !== false, id]
    );

    if (courseResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Course not found' });
    }

    // Update students - remove all and re-add
    await client.query('DELETE FROM course_students WHERE course_id = $1', [id]);

    if (student_ids && student_ids.length > 0) {
      for (const studentId of student_ids) {
        await client.query(
          `INSERT INTO course_students (course_id, student_id)
           VALUES ($1, $2)`,
          [id, studentId]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch updated course with student count
    const completeResult = await pool.query(
      `SELECT c.*, COUNT(cs.student_id) as student_count
       FROM courses c
       LEFT JOIN course_students cs ON c.id = cs.course_id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    res.json({
      ...completeResult.rows[0],
      course_type_label: courseTypeLabels[completeResult.rows[0].course_type]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  } finally {
    client.release();
  }
});

// Delete course (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
