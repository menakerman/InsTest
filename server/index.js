import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import absencesRoutes from './routes/absences.js';
import exportRoutes from './routes/export.js';
import coursesRoutes from './routes/courses.js';
import lessonsRoutes from './routes/lessons.js';
import { authenticateToken } from './middleware/auth.js';
import { requireRole } from './middleware/roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for student photo uploads
const studentPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads/students');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const studentId = req.params.id;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `student_${studentId}${ext}`);
  }
});

const photoUpload = multer({
  storage: studentPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// User management routes (admin/madar only)
app.use('/api/users', usersRoutes);

// Absences routes (admin/madar/instructor only)
app.use('/api/absences', absencesRoutes);

// Export routes
app.use('/api/export', exportRoutes);

// Courses routes (admin/madar = CRUD, instructor = CRUD (own courses), tester = view only)
app.use('/api/courses', coursesRoutes);

// Lessons routes (admin/madar = CRUD, instructor/tester = view only)
app.use('/api/lessons', lessonsRoutes);

// ==================== STUDENTS ====================
// Roles: admin/madar = CRUD, instructor = CRUD (own courses), tester = view only, student = no access

// Get all students with their courses (filtered by instructor's courses if role is instructor)
app.get('/api/students', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const user = req.user;
    let query;
    let params = [];

    // If user is instructor, only show students from courses they're assigned to
    if (user.role === 'instructor') {
      // Find instructor_id by email
      const instructorResult = await pool.query(
        'SELECT id FROM instructors WHERE email = $1',
        [user.email]
      );

      if (instructorResult.rows.length === 0) {
        return res.json([]); // Instructor not found, return empty
      }

      const instructorId = instructorResult.rows[0].id;

      query = `
        SELECT DISTINCT ON (s.id) s.*,
          COALESCE(
            (SELECT json_agg(
              json_build_object('id', c2.id, 'name', c2.name, 'course_type', c2.course_type)
              ORDER BY c2.name
            )
            FROM course_students cs2
            JOIN courses c2 ON cs2.course_id = c2.id
            WHERE cs2.student_id = s.id),
            '[]'
          ) as courses
        FROM students s
        JOIN course_students cs ON s.id = cs.student_id
        JOIN course_instructors ci ON cs.course_id = ci.course_id
        WHERE ci.instructor_id = $1
        ORDER BY s.id, s.created_at DESC
      `;
      params = [instructorId];
    } else {
      // Admin/tester see all students
      query = `
        SELECT s.*,
          COALESCE(
            json_agg(
              json_build_object('id', c.id, 'name', c.name, 'course_type', c.course_type)
              ORDER BY c.name
            ) FILTER (WHERE c.id IS NOT NULL),
            '[]'
          ) as courses
        FROM students s
        LEFT JOIN course_students cs ON s.id = cs.student_id
        LEFT JOIN courses c ON cs.course_id = c.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student (with instructor access check)
app.get('/api/students/:id', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // If instructor, verify they have access to this student
    if (user.role === 'instructor') {
      const instructorResult = await pool.query(
        'SELECT id FROM instructors WHERE email = $1',
        [user.email]
      );

      if (instructorResult.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const instructorId = instructorResult.rows[0].id;
      const accessCheck = await pool.query(
        `SELECT 1 FROM students s
         JOIN course_students cs ON s.id = cs.student_id
         JOIN course_instructors ci ON cs.course_id = ci.course_id
         WHERE s.id = $1 AND ci.instructor_id = $2`,
        [id, instructorId]
      );

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied - student not in your courses' });
      }
    }

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Create student (admin only)
app.post('/api/students', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { first_name, last_name, email, phone, unit_id, id_number, course_ids } = req.body;

    if (!first_name || !last_name || !email || !id_number) {
      return res.status(400).json({ error: 'First name, last name, email, and ID number are required' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO students (first_name, last_name, email, phone, unit_id, id_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [first_name, last_name, email, phone || null, unit_id || null, id_number]
    );

    const studentId = result.rows[0].id;

    // Associate student with courses
    if (course_ids && course_ids.length > 0) {
      for (const courseId of course_ids) {
        await client.query(
          `INSERT INTO course_students (course_id, student_id) VALUES ($1, $2)`,
          [courseId, studentId]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch student with courses
    const studentResult = await pool.query(
      `SELECT s.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'course_type', c.course_type) ORDER BY c.name)
           FROM course_students cs
           JOIN courses c ON cs.course_id = c.id
           WHERE cs.student_id = s.id),
          '[]'
        ) as courses
       FROM students s WHERE s.id = $1`,
      [studentId]
    );

    res.status(201).json(studentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating student:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A student with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create student' });
  } finally {
    client.release();
  }
});

// Update student (admin only)
app.put('/api/students/:id', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, unit_id, id_number, course_ids } = req.body;

    if (!first_name || !last_name || !email || !id_number) {
      return res.status(400).json({ error: 'First name, last name, email, and ID number are required' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE students
       SET first_name = $1, last_name = $2, email = $3, phone = $4, unit_id = $5, id_number = $6
       WHERE id = $7
       RETURNING *`,
      [first_name, last_name, email, phone || null, unit_id || null, id_number, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update course associations - remove all and re-add
    if (course_ids !== undefined) {
      await client.query('DELETE FROM course_students WHERE student_id = $1', [id]);

      if (course_ids && course_ids.length > 0) {
        for (const courseId of course_ids) {
          await client.query(
            `INSERT INTO course_students (course_id, student_id) VALUES ($1, $2)`,
            [courseId, id]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Fetch updated student with courses
    const studentResult = await pool.query(
      `SELECT s.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'course_type', c.course_type) ORDER BY c.name)
           FROM course_students cs
           JOIN courses c ON cs.course_id = c.id
           WHERE cs.student_id = s.id),
          '[]'
        ) as courses
       FROM students s WHERE s.id = $1`,
      [id]
    );

    res.json(studentResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating student:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A student with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update student' });
  } finally {
    client.release();
  }
});

// Delete student (admin only)
app.delete('/api/students/:id', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get student photo_url to delete the file
    const studentResult = await pool.query('SELECT photo_url FROM students WHERE id = $1', [id]);
    if (studentResult.rows.length > 0 && studentResult.rows[0].photo_url) {
      const photoPath = path.join(__dirname, studentResult.rows[0].photo_url);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// Upload student photo (admin only)
app.post('/api/students/:id/photo', authenticateToken, requireRole('admin', 'madar'), photoUpload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No photo file provided' });
    }

    // Check if student exists
    const studentCheck = await pool.query('SELECT id, photo_url FROM students WHERE id = $1', [id]);
    if (studentCheck.rows.length === 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete old photo if exists
    const oldPhotoUrl = studentCheck.rows[0].photo_url;
    if (oldPhotoUrl) {
      const oldPhotoPath = path.join(__dirname, oldPhotoUrl);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update student with new photo URL
    const photoUrl = `/uploads/students/${req.file.filename}`;
    await pool.query('UPDATE students SET photo_url = $1 WHERE id = $2', [photoUrl, id]);

    res.json({ photo_url: photoUrl });
  } catch (error) {
    console.error('Error uploading student photo:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Delete student photo (admin only)
app.delete('/api/students/:id/photo', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  try {
    const { id } = req.params;

    const studentResult = await pool.query('SELECT photo_url FROM students WHERE id = $1', [id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const photoUrl = studentResult.rows[0].photo_url;
    if (photoUrl) {
      const photoPath = path.join(__dirname, photoUrl);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
      await pool.query('UPDATE students SET photo_url = NULL WHERE id = $1', [id]);
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting student photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// ==================== INSTRUCTORS ====================
// Roles: admin/madar = CRUD, instructor/tester = view only, student = no access

// Get all instructors with their courses (based on evaluations they performed)
app.get('/api/instructors', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*,
        COALESCE(
          (SELECT json_agg(DISTINCT jsonb_build_object('name', se.course_name))
           FROM student_evaluations se
           WHERE se.instructor_id = i.id AND se.course_name IS NOT NULL AND se.course_name != ''),
          '[]'
        ) as courses
       FROM instructors i
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
});

// Get single instructor
app.get('/api/instructors/:id', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM instructors WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching instructor:', error);
    res.status(500).json({ error: 'Failed to fetch instructor' });
  }
});

// Create instructor (also creates a user account for login)
app.post('/api/instructors', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { first_name, last_name, email, phone, id_number } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required for instructor login' });
    }

    if (!id_number) {
      return res.status(400).json({ error: 'ID number is required' });
    }

    await client.query('BEGIN');

    // Create instructor record
    const instructorResult = await client.query(
      `INSERT INTO instructors (first_name, last_name, email, phone, id_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [first_name, last_name, email, phone || null, id_number]
    );

    // Create user account with default password (instructor's email as initial password)
    const defaultPassword = email.split('@')[0] + '123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, 'instructor', true)`,
      [email.toLowerCase(), passwordHash, first_name, last_name]
    );

    await client.query('COMMIT');

    res.status(201).json({
      ...instructorResult.rows[0],
      user_created: true,
      default_password: defaultPassword,
      message: `User account created. Default password: ${defaultPassword}`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating instructor:', error);
    if (error.code === '23505') {
      if (error.constraint?.includes('users')) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }
      return res.status(400).json({ error: 'An instructor with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create instructor' });
  } finally {
    client.release();
  }
});

// Update instructor (also updates the associated user account)
app.put('/api/instructors/:id', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, id_number } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required for instructor login' });
    }

    if (!id_number) {
      return res.status(400).json({ error: 'ID number is required' });
    }

    await client.query('BEGIN');

    // Get current instructor email
    const currentInstructor = await client.query(
      'SELECT email FROM instructors WHERE id = $1',
      [id]
    );

    if (currentInstructor.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Instructor not found' });
    }

    const oldEmail = currentInstructor.rows[0].email;

    // Update instructor record
    const result = await client.query(
      `UPDATE instructors
       SET first_name = $1, last_name = $2, email = $3, phone = $4, id_number = $5
       WHERE id = $6
       RETURNING *`,
      [first_name, last_name, email, phone || null, id_number, id]
    );

    // Update associated user account
    if (oldEmail) {
      await client.query(
        `UPDATE users
         SET email = $1, first_name = $2, last_name = $3
         WHERE email = $4 AND role = 'instructor'`,
        [email.toLowerCase(), first_name, last_name, oldEmail.toLowerCase()]
      );
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating instructor:', error);
    if (error.code === '23505') {
      if (error.constraint?.includes('users')) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }
      return res.status(400).json({ error: 'An instructor with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to update instructor' });
  } finally {
    client.release();
  }
});

// Delete instructor (also deletes the associated user account)
app.delete('/api/instructors/:id', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get instructor email before deleting
    const instructorResult = await client.query(
      'DELETE FROM instructors WHERE id = $1 RETURNING *',
      [id]
    );

    if (instructorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Instructor not found' });
    }

    const deletedInstructor = instructorResult.rows[0];

    // Delete associated user account if email exists
    if (deletedInstructor.email) {
      await client.query(
        'DELETE FROM users WHERE email = $1 AND role = $2',
        [deletedInstructor.email.toLowerCase(), 'instructor']
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Instructor and user account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting instructor:', error);
    res.status(500).json({ error: 'Failed to delete instructor' });
  } finally {
    client.release();
  }
});

// ==================== EVALUATION SUBJECTS ====================
// Roles: admin/madar/instructor/tester = full access, student = no access

// Get all evaluation subjects with criteria
app.get('/api/evaluation-subjects', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const subjectsResult = await pool.query(
      'SELECT * FROM evaluation_subjects ORDER BY display_order'
    );

    const subjects = await Promise.all(
      subjectsResult.rows.map(async (subject) => {
        const criteriaResult = await pool.query(
          'SELECT * FROM evaluation_criteria WHERE subject_id = $1 ORDER BY display_order',
          [subject.id]
        );
        return { ...subject, criteria: criteriaResult.rows };
      })
    );

    res.json(subjects);
  } catch (error) {
    console.error('Error fetching evaluation subjects:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation subjects' });
  }
});

// Get single evaluation subject by code with criteria
app.get('/api/evaluation-subjects/:code', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { code } = req.params;
    const subjectResult = await pool.query(
      'SELECT * FROM evaluation_subjects WHERE code = $1',
      [code]
    );

    if (subjectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation subject not found' });
    }

    const subject = subjectResult.rows[0];
    const criteriaResult = await pool.query(
      'SELECT * FROM evaluation_criteria WHERE subject_id = $1 ORDER BY display_order',
      [subject.id]
    );

    res.json({ ...subject, criteria: criteriaResult.rows });
  } catch (error) {
    console.error('Error fetching evaluation subject:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation subject' });
  }
});

// ==================== EVALUATIONS ====================
// Roles: admin/madar/instructor/tester = full access, student = no access

// Get all evaluations with filters (filtered by instructor's courses if role is instructor)
app.get('/api/evaluations', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { student_id, subject_id, instructor_id, from_date, to_date } = req.query;
    const user = req.user;

    let query = `
      SELECT
        se.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        i.first_name as instructor_first_name,
        i.last_name as instructor_last_name,
        es.name_he as subject_name,
        es.code as subject_code
      FROM student_evaluations se
      LEFT JOIN students s ON se.student_id = s.id
      LEFT JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN evaluation_subjects es ON se.subject_id = es.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // If instructor, only show evaluations for students in their courses
    if (user.role === 'instructor') {
      const instructorResult = await pool.query(
        'SELECT id FROM instructors WHERE email = $1',
        [user.email]
      );

      if (instructorResult.rows.length === 0) {
        return res.json([]); // Instructor not found, return empty
      }

      const loggedInInstructorId = instructorResult.rows[0].id;
      query += ` AND se.student_id IN (
        SELECT DISTINCT cs.student_id
        FROM course_students cs
        JOIN course_instructors ci ON cs.course_id = ci.course_id
        WHERE ci.instructor_id = $${paramIndex++}
      )`;
      params.push(loggedInInstructorId);
    }

    if (student_id) {
      query += ` AND se.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (subject_id) {
      query += ` AND se.subject_id = $${paramIndex++}`;
      params.push(subject_id);
    }
    if (instructor_id) {
      query += ` AND se.instructor_id = $${paramIndex++}`;
      params.push(instructor_id);
    }
    if (from_date) {
      query += ` AND se.evaluation_date >= $${paramIndex++}`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND se.evaluation_date <= $${paramIndex++}`;
      params.push(to_date);
    }

    query += ' ORDER BY se.evaluation_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// Get single evaluation with all item scores
app.get('/api/evaluations/:id', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { id } = req.params;

    const evalResult = await pool.query(
      `SELECT
        se.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        i.first_name as instructor_first_name,
        i.last_name as instructor_last_name,
        es.name_he as subject_name,
        es.code as subject_code,
        es.max_raw_score,
        es.passing_raw_score
      FROM student_evaluations se
      LEFT JOIN students s ON se.student_id = s.id
      LEFT JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN evaluation_subjects es ON se.subject_id = es.id
      WHERE se.id = $1`,
      [id]
    );

    if (evalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    const evaluation = evalResult.rows[0];

    const scoresResult = await pool.query(
      `SELECT
        eis.*,
        ec.name_he as criterion_name,
        ec.is_critical
      FROM evaluation_item_scores eis
      LEFT JOIN evaluation_criteria ec ON eis.criterion_id = ec.id
      WHERE eis.evaluation_id = $1
      ORDER BY ec.display_order`,
      [id]
    );

    res.json({ ...evaluation, item_scores: scoresResult.rows });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    res.status(500).json({ error: 'Failed to fetch evaluation' });
  }
});

// Mapping from lesson names to test type codes
const lessonToTestTypeMapping = {
  'קמס': 'water_cmas',
  'קמס 1': 'water_cmas',
  'סקובה 1': 'water_scuba_1',
  'סקובה 3': 'water_scuba_3',
  'סקובה 5': 'water_scuba_5',
  // מבחני כיתה
  'כללי התנהגות': 'classroom_behavior',
  'סיכוני צלילה': 'classroom_risks',
  'הרצאה חופשית': 'classroom_free_lecture',
};

// Helper function to link evaluation to test score
async function linkEvaluationToTestScore(client, studentId, lessonName, evaluationId, percentageScore, isPassing) {
  if (!lessonName) return;

  const testTypeCode = lessonToTestTypeMapping[lessonName];
  if (!testTypeCode) return;

  // Find the test type
  const testTypeResult = await client.query(
    'SELECT id FROM test_types WHERE code = $1',
    [testTypeCode]
  );

  if (testTypeResult.rows.length === 0) return;

  const testTypeId = testTypeResult.rows[0].id;

  // Insert or update the test score with evaluation link
  await client.query(`
    INSERT INTO student_test_scores (student_id, test_type_id, score, passed, evaluation_id, test_date)
    VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
    ON CONFLICT (student_id, test_type_id)
    DO UPDATE SET
      score = EXCLUDED.score,
      passed = EXCLUDED.passed,
      evaluation_id = EXCLUDED.evaluation_id,
      test_date = EXCLUDED.test_date,
      updated_at = CURRENT_TIMESTAMP
  `, [studentId, testTypeId, Math.round(percentageScore), isPassing, evaluationId]);
}

// Create evaluation with item scores
app.post('/api/evaluations', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      student_id,
      subject_id,
      instructor_id,
      course_name,
      lesson_name,
      evaluation_date,
      raw_score,
      percentage_score,
      final_score,
      is_passing,
      has_critical_fail,
      is_final_test,
      notes,
      item_scores
    } = req.body;

    if (!student_id || !subject_id || !item_scores || item_scores.length === 0) {
      return res.status(400).json({ error: 'Student, subject, and item scores are required' });
    }

    // Insert evaluation
    const evalResult = await client.query(
      `INSERT INTO student_evaluations
        (student_id, subject_id, instructor_id, course_name, lesson_name, evaluation_date,
         raw_score, percentage_score, final_score, is_passing, has_critical_fail, is_final_test, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        student_id,
        subject_id,
        instructor_id || null,
        course_name || null,
        lesson_name || null,
        evaluation_date || new Date(),
        raw_score,
        percentage_score,
        final_score,
        is_passing,
        has_critical_fail || false,
        is_final_test || false,
        notes || null
      ]
    );

    const evaluationId = evalResult.rows[0].id;

    // Insert item scores
    for (const item of item_scores) {
      await client.query(
        `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
         VALUES ($1, $2, $3)`,
        [evaluationId, item.criterion_id, item.score]
      );
    }

    // If this is a final test, link to student_test_scores
    if (is_final_test && lesson_name) {
      await linkEvaluationToTestScore(client, student_id, lesson_name, evaluationId, percentage_score, is_passing);
    }

    await client.query('COMMIT');

    // Fetch complete evaluation with scores
    const completeResult = await pool.query(
      `SELECT
        se.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        es.name_he as subject_name
      FROM student_evaluations se
      LEFT JOIN students s ON se.student_id = s.id
      LEFT JOIN evaluation_subjects es ON se.subject_id = es.id
      WHERE se.id = $1`,
      [evaluationId]
    );

    res.status(201).json(completeResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Failed to create evaluation' });
  } finally {
    client.release();
  }
});

// Update evaluation
app.put('/api/evaluations/:id', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      student_id,
      subject_id,
      instructor_id,
      course_name,
      lesson_name,
      evaluation_date,
      raw_score,
      percentage_score,
      final_score,
      is_passing,
      has_critical_fail,
      is_final_test,
      notes,
      item_scores
    } = req.body;

    // Update evaluation
    const evalResult = await client.query(
      `UPDATE student_evaluations
       SET student_id = $1, subject_id = $2, instructor_id = $3, course_name = $4,
           lesson_name = $5, evaluation_date = $6, raw_score = $7, percentage_score = $8,
           final_score = $9, is_passing = $10, has_critical_fail = $11, is_final_test = $12, notes = $13
       WHERE id = $14
       RETURNING *`,
      [
        student_id,
        subject_id,
        instructor_id || null,
        course_name || null,
        lesson_name || null,
        evaluation_date,
        raw_score,
        percentage_score,
        final_score,
        is_passing,
        has_critical_fail || false,
        is_final_test || false,
        notes || null,
        id
      ]
    );

    if (evalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evaluation not found' });
    }

    // Delete existing item scores and insert new ones
    await client.query('DELETE FROM evaluation_item_scores WHERE evaluation_id = $1', [id]);

    if (item_scores && item_scores.length > 0) {
      for (const item of item_scores) {
        await client.query(
          `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
           VALUES ($1, $2, $3)`,
          [id, item.criterion_id, item.score]
        );
      }
    }

    // If this is a final test, link to student_test_scores
    if (is_final_test && lesson_name) {
      await linkEvaluationToTestScore(client, student_id, lesson_name, parseInt(id), percentage_score, is_passing);
    }

    await client.query('COMMIT');

    res.json(evalResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating evaluation:', error);
    res.status(500).json({ error: 'Failed to update evaluation' });
  } finally {
    client.release();
  }
});

// Delete evaluation
app.delete('/api/evaluations/:id', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM student_evaluations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluation not found' });
    }
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ error: 'Failed to delete evaluation' });
  }
});

// ==================== EXTERNAL TESTS ====================
// Roles: admin/madar/instructor = CRUD, tester = view only

// Get external tests for a student
app.get('/api/external-tests/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(
      'SELECT * FROM external_tests WHERE student_id = $1',
      [studentId]
    );

    if (result.rows.length === 0) {
      // Return empty object if no tests exist yet
      return res.json({
        student_id: parseInt(studentId),
        physics_score: null,
        physiology_score: null,
        eye_contact_score: null,
        equipment_score: null,
        decompression_score: null,
        average_score: null
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching external tests:', error);
    res.status(500).json({ error: 'Failed to fetch external tests' });
  }
});

// Get all external tests (for reporting)
app.get('/api/external-tests', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT et.*, s.first_name, s.last_name
      FROM external_tests et
      JOIN students s ON et.student_id = s.id
      ORDER BY s.last_name, s.first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all external tests:', error);
    res.status(500).json({ error: 'Failed to fetch external tests' });
  }
});

// Create or update external tests for a student
app.put('/api/external-tests/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      physics_score,
      physiology_score,
      eye_contact_score,
      equipment_score,
      decompression_score
    } = req.body;

    // Validate scores are between 0-100 or null
    const scores = { physics_score, physiology_score, eye_contact_score, equipment_score, decompression_score };
    for (const [key, value] of Object.entries(scores)) {
      if (value !== null && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) {
          return res.status(400).json({ error: `${key} must be between 0 and 100` });
        }
      }
    }

    // Upsert - insert or update
    const result = await pool.query(`
      INSERT INTO external_tests (student_id, physics_score, physiology_score, eye_contact_score, equipment_score, decompression_score)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (student_id) DO UPDATE SET
        physics_score = EXCLUDED.physics_score,
        physiology_score = EXCLUDED.physiology_score,
        eye_contact_score = EXCLUDED.eye_contact_score,
        equipment_score = EXCLUDED.equipment_score,
        decompression_score = EXCLUDED.decompression_score
      RETURNING *
    `, [
      studentId,
      physics_score || null,
      physiology_score || null,
      eye_contact_score || null,
      equipment_score || null,
      decompression_score || null
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving external tests:', error);
    if (error.code === '23503') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Failed to save external tests' });
  }
});

// Delete external tests for a student
app.delete('/api/external-tests/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(
      'DELETE FROM external_tests WHERE student_id = $1 RETURNING *',
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'External tests not found for this student' });
    }
    res.json({ message: 'External tests deleted successfully' });
  } catch (error) {
    console.error('Error deleting external tests:', error);
    res.status(500).json({ error: 'Failed to delete external tests' });
  }
});

// ==================== CERTIFICATION TESTS ====================
// Roles: admin/madar/instructor = CRUD, tester = view only

// Get test structure for a course type
app.get('/api/test-structure/:courseType', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { courseType } = req.params;

    const result = await pool.query(`
      SELECT
        tc.id as category_id,
        tc.code as category_code,
        tc.name_he as category_name,
        tc.display_order as category_order,
        json_agg(
          json_build_object(
            'id', tt.id,
            'code', tt.code,
            'name_he', tt.name_he,
            'score_type', tt.score_type,
            'display_order', tt.display_order
          ) ORDER BY tt.display_order
        ) as tests
      FROM test_categories tc
      LEFT JOIN test_types tt ON tc.id = tt.category_id
      WHERE tc.course_type = $1
      GROUP BY tc.id, tc.code, tc.name_he, tc.display_order
      ORDER BY tc.display_order
    `, [courseType]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching test structure:', error);
    res.status(500).json({ error: 'Failed to fetch test structure' });
  }
});

// Get all test scores for a student
app.get('/api/student-tests/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(`
      SELECT
        sts.id,
        sts.test_type_id,
        sts.score,
        sts.passed,
        sts.evaluation_id,
        sts.test_date,
        sts.notes,
        tt.code as test_code,
        tt.name_he as test_name,
        tt.score_type,
        tc.code as category_code,
        tc.name_he as category_name,
        tc.course_type
      FROM student_test_scores sts
      JOIN test_types tt ON sts.test_type_id = tt.id
      JOIN test_categories tc ON tt.category_id = tc.id
      WHERE sts.student_id = $1
      ORDER BY tc.display_order, tt.display_order
    `, [studentId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student tests:', error);
    res.status(500).json({ error: 'Failed to fetch student tests' });
  }
});

// Update test scores for a student
app.put('/api/student-tests/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor'), async (req, res) => {
  const client = await pool.connect();

  try {
    const { studentId } = req.params;
    const { scores } = req.body;

    // scores should be an array of { test_type_id, score, passed, test_date, notes }

    if (!scores || !Array.isArray(scores)) {
      return res.status(400).json({ error: 'Scores array is required' });
    }

    await client.query('BEGIN');

    for (const scoreData of scores) {
      const { test_type_id, score, passed, test_date, notes, evaluation_id } = scoreData;

      await client.query(`
        INSERT INTO student_test_scores (student_id, test_type_id, score, passed, evaluation_id, test_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (student_id, test_type_id)
        DO UPDATE SET
          score = EXCLUDED.score,
          passed = EXCLUDED.passed,
          evaluation_id = EXCLUDED.evaluation_id,
          test_date = EXCLUDED.test_date,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [studentId, test_type_id, score, passed, evaluation_id || null, test_date || null, notes || null]);
    }

    await client.query('COMMIT');

    // Fetch updated scores
    const result = await pool.query(`
      SELECT
        sts.id,
        sts.test_type_id,
        sts.score,
        sts.passed,
        sts.evaluation_id,
        sts.test_date,
        sts.notes,
        tt.code as test_code,
        tt.name_he as test_name,
        tt.score_type,
        tc.code as category_code,
        tc.name_he as category_name,
        tc.course_type
      FROM student_test_scores sts
      JOIN test_types tt ON sts.test_type_id = tt.id
      JOIN test_categories tc ON tt.category_id = tc.id
      WHERE sts.student_id = $1
      ORDER BY tc.display_order, tt.display_order
    `, [studentId]);

    res.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving student tests:', error);
    res.status(500).json({ error: 'Failed to save student tests' });
  } finally {
    client.release();
  }
});

// Delete a specific test score for a student
app.delete('/api/student-tests/:studentId/:testTypeId', authenticateToken, requireRole('admin', 'madar', 'instructor'), async (req, res) => {
  try {
    const { studentId, testTypeId } = req.params;

    const result = await pool.query(
      'DELETE FROM student_test_scores WHERE student_id = $1 AND test_type_id = $2 RETURNING *',
      [studentId, testTypeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test score not found' });
    }

    res.json({ message: 'Test score deleted successfully' });
  } catch (error) {
    console.error('Error deleting test score:', error);
    res.status(500).json({ error: 'Failed to delete test score' });
  }
});

// ==================== STUDENT SKILLS ====================
// Roles: admin/madar/instructor = CRUD, tester = view only

// Get skills for a student
app.get('/api/student-skills/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(
      'SELECT * FROM student_skills WHERE student_id = $1',
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.json({
        student_id: parseInt(studentId),
        meters_30: false,
        meters_40: false,
        guidance: false
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching student skills:', error);
    res.status(500).json({ error: 'Failed to fetch student skills' });
  }
});

// Get all student skills (for reporting)
app.get('/api/student-skills', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ss.*, s.first_name, s.last_name
      FROM student_skills ss
      JOIN students s ON ss.student_id = s.id
      ORDER BY s.last_name, s.first_name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all student skills:', error);
    res.status(500).json({ error: 'Failed to fetch student skills' });
  }
});

// Create or update skills for a student
app.put('/api/student-skills/:studentId', authenticateToken, requireRole('admin', 'madar', 'instructor'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { meters_30, meters_40, guidance } = req.body;

    const result = await pool.query(`
      INSERT INTO student_skills (student_id, meters_30, meters_40, guidance)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (student_id) DO UPDATE SET
        meters_30 = EXCLUDED.meters_30,
        meters_40 = EXCLUDED.meters_40,
        guidance = EXCLUDED.guidance
      RETURNING *
    `, [
      studentId,
      meters_30 || false,
      meters_40 || false,
      guidance || false
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving student skills:', error);
    if (error.code === '23503') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Failed to save student skills' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
