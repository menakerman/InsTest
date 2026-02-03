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

// Get all lessons with evaluation subject info
router.get('/', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { subject_id, is_active } = req.query;

    let query = `
      SELECT
        l.*,
        es.name_he as subject_name,
        es.code as subject_code
      FROM lessons l
      LEFT JOIN evaluation_subjects es ON l.subject_id = es.id
    `;

    const params = [];
    const conditions = [];

    if (subject_id) {
      conditions.push(`l.subject_id = $${params.length + 1}`);
      params.push(subject_id);
    }

    if (is_active !== undefined) {
      conditions.push(`l.is_active = $${params.length + 1}`);
      params.push(is_active === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY es.display_order, l.display_order, l.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get single lesson
router.get('/:id', authenticateToken, requireRole('admin', 'madar', 'instructor', 'tester'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        l.*,
        es.name_he as subject_name,
        es.code as subject_code
       FROM lessons l
       LEFT JOIN evaluation_subjects es ON l.subject_id = es.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Create lesson (admin only)
router.post('/', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  try {
    const { name, subject_id, description, display_order } = req.body;

    if (!name || !subject_id) {
      return res.status(400).json({ error: 'Name and evaluation subject are required' });
    }

    const result = await pool.query(
      `INSERT INTO lessons (name, subject_id, description, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, subject_id, description || null, display_order || 0]
    );

    // Fetch with subject info
    const lessonResult = await pool.query(
      `SELECT
        l.*,
        es.name_he as subject_name,
        es.code as subject_code
       FROM lessons l
       LEFT JOIN evaluation_subjects es ON l.subject_id = es.id
       WHERE l.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(lessonResult.rows[0]);
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

// Update lesson (admin only)
router.put('/:id', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject_id, description, display_order, is_active } = req.body;

    if (!name || !subject_id) {
      return res.status(400).json({ error: 'Name and evaluation subject are required' });
    }

    const result = await pool.query(
      `UPDATE lessons
       SET name = $1, subject_id = $2, description = $3, display_order = $4, is_active = $5
       WHERE id = $6
       RETURNING *`,
      [name, subject_id, description || null, display_order || 0, is_active !== false, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Fetch with subject info
    const lessonResult = await pool.query(
      `SELECT
        l.*,
        es.name_he as subject_name,
        es.code as subject_code
       FROM lessons l
       LEFT JOIN evaluation_subjects es ON l.subject_id = es.id
       WHERE l.id = $1`,
      [id]
    );

    res.json(lessonResult.rows[0]);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete lesson (admin only)
router.delete('/:id', authenticateToken, requireRole('admin', 'madar'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM lessons WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

export default router;
