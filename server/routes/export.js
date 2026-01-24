import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { generateFinalReport } from '../services/reportExport.js';

dotenv.config();

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// All routes require authentication and admin/instructor role
router.use(authenticateToken);
router.use(requireRole('admin', 'instructor'));

/**
 * GET /api/export/final-report
 * Generate and download the final report Excel file
 */
router.get('/final-report', async (req, res) => {
  try {
    // Generate the workbook
    const workbook = await generateFinalReport(pool);

    // Set response headers for Excel file download
    const fileName = `דוח_קורס_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error generating final report:', error);
    res.status(500).json({ error: 'שגיאה ביצירת הדוח' });
  }
});

export default router;
