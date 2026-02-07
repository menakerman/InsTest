import express from 'express';
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

// All routes require authentication and admin/madar role
router.use(authenticateToken);
router.use(requireRole('admin', 'madar'));

// Get all absences with optional filters
router.get('/', async (req, res) => {
  try {
    const { student_id, from_date, to_date } = req.query;

    let query = `
      SELECT
        sa.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name
      FROM student_absences sa
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (student_id) {
      query += ` AND sa.student_id = $${paramIndex++}`;
      params.push(student_id);
    }
    if (from_date) {
      query += ` AND sa.absence_date >= $${paramIndex++}`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND sa.absence_date <= $${paramIndex++}`;
      params.push(to_date);
    }

    query += ' ORDER BY sa.absence_date DESC, s.last_name, s.first_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching absences:', error);
    res.status(500).json({ error: 'שגיאה בטעינת העדרויות' });
  }
});

// Get single absence
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        sa.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name
      FROM student_absences sa
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE sa.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'העדרות לא נמצאה' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching absence:', error);
    res.status(500).json({ error: 'שגיאה בטעינת העדרות' });
  }
});

// Create absence
router.post('/', async (req, res) => {
  try {
    const { student_id, absence_date, reason, is_excused, notes } = req.body;

    if (!student_id || !absence_date) {
      return res.status(400).json({ error: 'נדרשים מזהה תלמיד ותאריך העדרות' });
    }

    const result = await pool.query(
      `INSERT INTO student_absences (student_id, absence_date, reason, is_excused, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [student_id, absence_date, reason || null, is_excused || false, notes || null]
    );

    // Fetch with student info
    const fullResult = await pool.query(
      `SELECT
        sa.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name
      FROM student_absences sa
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE sa.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(fullResult.rows[0]);
  } catch (error) {
    console.error('Error creating absence:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'תלמיד לא קיים' });
    }
    res.status(500).json({ error: 'שגיאה ביצירת העדרות' });
  }
});

// Update absence
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, absence_date, reason, is_excused, notes } = req.body;

    if (!student_id || !absence_date) {
      return res.status(400).json({ error: 'נדרשים מזהה תלמיד ותאריך העדרות' });
    }

    const result = await pool.query(
      `UPDATE student_absences
       SET student_id = $1, absence_date = $2, reason = $3, is_excused = $4, notes = $5
       WHERE id = $6
       RETURNING *`,
      [student_id, absence_date, reason || null, is_excused || false, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'העדרות לא נמצאה' });
    }

    // Fetch with student info
    const fullResult = await pool.query(
      `SELECT
        sa.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name
      FROM student_absences sa
      LEFT JOIN students s ON sa.student_id = s.id
      WHERE sa.id = $1`,
      [id]
    );

    res.json(fullResult.rows[0]);
  } catch (error) {
    console.error('Error updating absence:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'תלמיד לא קיים' });
    }
    res.status(500).json({ error: 'שגיאה בעדכון העדרות' });
  }
});

// Delete absence
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM student_absences WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'העדרות לא נמצאה' });
    }

    res.json({ message: 'ההעדרות נמחקה בהצלחה' });
  } catch (error) {
    console.error('Error deleting absence:', error);
    res.status(500).json({ error: 'שגיאה במחיקת העדרות' });
  }
});

export default router;
