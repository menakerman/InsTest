import express from 'express';
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

dotenv.config();

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
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
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
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
      `SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
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
    const { email, password, first_name, last_name, role, is_active } = req.body;

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

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
      [email.toLowerCase(), passwordHash, first_name, last_name, role || 'student', is_active !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'משתמש עם אימייל זה כבר קיים' });
    }
    res.status(500).json({ error: 'שגיאה ביצירת משתמש' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, first_name, last_name, role, is_active } = req.body;

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

    let query;
    let params;

    if (password && password.length > 0) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      query = `UPDATE users
               SET email = $1, password_hash = $2, first_name = $3, last_name = $4, role = $5, is_active = $6
               WHERE id = $7
               RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`;
      params = [email.toLowerCase(), passwordHash, first_name, last_name, role, is_active, id];
    } else {
      query = `UPDATE users
               SET email = $1, first_name = $2, last_name = $3, role = $4, is_active = $5
               WHERE id = $6
               RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`;
      params = [email.toLowerCase(), first_name, last_name, role, is_active, id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'משתמש עם אימייל זה כבר קיים' });
    }
    res.status(500).json({ error: 'שגיאה בעדכון משתמש' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'לא ניתן למחוק את החשבון שלך' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    res.json({ message: 'המשתמש נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'שגיאה במחיקת משתמש' });
  }
});

export default router;
