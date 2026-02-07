import express from 'express';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

dotenv.config();

const router = express.Router();
const { Pool } = pg;

const isLocalhost = process.env.DATABASE_URL?.includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false
  }
});

// All routes require admin role
router.use(authenticateToken);
router.use(requireRole('admin', 'madar'));

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active, instructor_number, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'שגיאה בטעינת משתמשים' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_active, instructor_number, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'שגיאה בטעינת משתמש' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, is_active, instructor_number } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'נדרשים אימייל, סיסמה, שם פרטי ושם משפחה' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
    }

    const validRoles = ['admin', 'madar', 'instructor', 'tester', 'student'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'תפקיד לא תקין' });
    }

    // Validate instructor_number if provided
    if (instructor_number !== undefined && instructor_number !== null && instructor_number !== '') {
      const num = parseInt(instructor_number);
      if (isNaN(num) || num < 1 || num > 100000) {
        return res.status(400).json({ error: 'מספר מדריך חייב להיות בין 1 ל-100000' });
      }

      // Check if instructor_number already exists
      const existingUser = await pool.query(
        'SELECT first_name, last_name FROM users WHERE instructor_number = $1',
        [num]
      );
      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        return res.status(400).json({
          error: `מספר מדריך ${num} כבר קיים עבור ${user.first_name} ${user.last_name}`
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role || 'student';

    // Start transaction to create user and corresponding student/instructor
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, instructor_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, first_name, last_name, role, is_active, instructor_number, created_at, updated_at`,
        [email.toLowerCase(), passwordHash, first_name, last_name, userRole, is_active !== false, instructor_number || null]
      );

      // Also create entry in students table if role is student
      if (userRole === 'student') {
        await client.query(
          `INSERT INTO students (first_name, last_name, email)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO NOTHING`,
          [first_name, last_name, email.toLowerCase()]
        );
      }

      // Also create entry in instructors table if role is instructor/madar/tester/admin
      if (['admin', 'madar', 'instructor', 'tester'].includes(userRole)) {
        await client.query(
          `INSERT INTO instructors (first_name, last_name, email)
           VALUES ($1, $2, $3)
           ON CONFLICT (email) DO NOTHING`,
          [first_name, last_name, email.toLowerCase()]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      if (error.constraint?.includes('instructor_number')) {
        return res.status(400).json({ error: 'מספר מדריך זה כבר קיים' });
      }
      return res.status(400).json({ error: 'משתמש עם אימייל זה כבר קיים' });
    }
    res.status(500).json({ error: 'שגיאה ביצירת משתמש' });
  }
});

// Update user (also updates corresponding student/instructor entry)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { email, password, first_name, last_name, role, is_active, instructor_number } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({ error: 'נדרשים שם פרטי ושם משפחה' });
    }

    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id && is_active === false) {
      return res.status(400).json({ error: 'לא ניתן לבטל את החשבון שלך' });
    }

    // Prevent admin from changing their own role
    if (parseInt(id) === req.user.id && role && role !== req.user.role) {
      return res.status(400).json({ error: 'לא ניתן לשנות את התפקיד שלך' });
    }

    const validRoles = ['admin', 'madar', 'instructor', 'tester', 'student'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'תפקיד לא תקין' });
    }

    // Validate instructor_number if provided
    if (instructor_number !== undefined && instructor_number !== null && instructor_number !== '') {
      const num = parseInt(instructor_number);
      if (isNaN(num) || num < 1 || num > 100000) {
        return res.status(400).json({ error: 'מספר מדריך חייב להיות בין 1 ל-100000' });
      }

      // Check if instructor_number already exists for another user
      const existingUser = await client.query(
        'SELECT first_name, last_name FROM users WHERE instructor_number = $1 AND id != $2',
        [num, id]
      );
      if (existingUser.rows.length > 0) {
        const user = existingUser.rows[0];
        return res.status(400).json({
          error: `מספר מדריך ${num} כבר קיים עבור ${user.first_name} ${user.last_name}`
        });
      }
    }

    await client.query('BEGIN');

    // Get current user data to find old email and role
    const currentUser = await client.query(
      'SELECT email, role FROM users WHERE id = $1',
      [id]
    );

    if (currentUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    const oldEmail = currentUser.rows[0].email;
    const oldRole = currentUser.rows[0].role;

    let query;
    let params;

    if (password && password.length > 0) {
      if (password.length < 6) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      query = `UPDATE users
               SET email = $1, password_hash = $2, first_name = $3, last_name = $4, role = $5, is_active = $6, instructor_number = $7
               WHERE id = $8
               RETURNING id, email, first_name, last_name, role, is_active, instructor_number, created_at, updated_at`;
      params = [email.toLowerCase(), passwordHash, first_name, last_name, role, is_active, instructor_number || null, id];
    } else {
      query = `UPDATE users
               SET email = $1, first_name = $2, last_name = $3, role = $4, is_active = $5, instructor_number = $6
               WHERE id = $7
               RETURNING id, email, first_name, last_name, role, is_active, instructor_number, created_at, updated_at`;
      params = [email.toLowerCase(), first_name, last_name, role, is_active, instructor_number || null, id];
    }

    const result = await client.query(query, params);

    // Sync to students table if role is student
    if (role === 'student') {
      await client.query(
        `INSERT INTO students (first_name, last_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET first_name = $1, last_name = $2`,
        [first_name, last_name, email.toLowerCase()]
      );
      // If role changed from instructor type, remove from instructors
      if (['admin', 'madar', 'instructor', 'tester'].includes(oldRole)) {
        await client.query(
          `DELETE FROM instructors WHERE email = $1`,
          [oldEmail.toLowerCase()]
        );
      }
    }

    // Sync to instructors table if role is instructor/madar/tester/admin
    if (['admin', 'madar', 'instructor', 'tester'].includes(role)) {
      await client.query(
        `INSERT INTO instructors (first_name, last_name, email)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET first_name = $1, last_name = $2`,
        [first_name, last_name, email.toLowerCase()]
      );
      // If role changed from student, remove from students
      if (oldRole === 'student') {
        await client.query(
          `DELETE FROM students WHERE email = $1`,
          [oldEmail.toLowerCase()]
        );
      }
    }

    // Update email in students/instructors if email changed
    if (oldEmail.toLowerCase() !== email.toLowerCase()) {
      if (role === 'student') {
        await client.query(
          `UPDATE students SET email = $1 WHERE email = $2`,
          [email.toLowerCase(), oldEmail.toLowerCase()]
        );
      } else if (['admin', 'madar', 'instructor', 'tester'].includes(role)) {
        await client.query(
          `UPDATE instructors SET email = $1 WHERE email = $2`,
          [email.toLowerCase(), oldEmail.toLowerCase()]
        );
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      if (error.constraint?.includes('instructor_number')) {
        return res.status(400).json({ error: 'מספר מדריך זה כבר קיים' });
      }
      return res.status(400).json({ error: 'משתמש עם אימייל זה כבר קיים' });
    }
    res.status(500).json({ error: 'שגיאה בעדכון משתמש' });
  } finally {
    client.release();
  }
});

// Delete user (also deletes from students/instructors tables)
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'לא ניתן למחוק את החשבון שלך' });
    }

    // Get user data before deleting
    const userResult = await client.query(
      'SELECT email, role FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    const { email, role } = userResult.rows[0];

    await client.query('BEGIN');

    // Delete user
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    // Also delete from students/instructors tables
    if (role === 'student') {
      await client.query(
        'DELETE FROM students WHERE email = $1',
        [email.toLowerCase()]
      );
    } else if (['admin', 'madar', 'instructor', 'tester'].includes(role)) {
      await client.query(
        'DELETE FROM instructors WHERE email = $1',
        [email.toLowerCase()]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'המשתמש נמחק בהצלחה' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'שגיאה במחיקת משתמש' });
  } finally {
    client.release();
  }
});

export default router;
