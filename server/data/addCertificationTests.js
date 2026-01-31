import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test categories and types for each certification track
const testStructure = {
  'מדריך_עוזר': [
    {
      code: 'assistant_external_tests',
      name_he: 'מבחנים עיוניים',
      display_order: 1,
      tests: [
        { code: 'assistant_instructor_exam', name_he: 'ציון מבחן מדריך עוזר', score_type: 'percentage', display_order: 1 },
        { code: 'diving_authority_exam', name_he: 'ציון מבחן רשות הצלילה', score_type: 'percentage', display_order: 2 },
        { code: 'three_stars_exam', name_he: 'ציון מבחן שלושה כוכבים', score_type: 'percentage', display_order: 3 }
      ]
    },
    {
      code: 'assistant_skills',
      name_he: 'מיומנויות',
      display_order: 2,
      tests: [
        { code: 'skill_30m', name_he: '30 מטר', score_type: 'pass_fail', display_order: 1 },
        { code: 'skill_40m', name_he: '40 מטר', score_type: 'pass_fail', display_order: 2 },
        { code: 'skill_rescue', name_he: 'הצלה', score_type: 'pass_fail', display_order: 3 }
      ]
    },
    {
      code: 'assistant_instructor_tests',
      name_he: 'מבחני מדריך עוזר',
      display_order: 3,
      tests: [
        { code: 'assistant_intro', name_he: 'היכרות', score_type: 'pass_fail', display_order: 1 },
        { code: 'assistant_briefing', name_he: 'תדריך', score_type: 'percentage', display_order: 2 },
        { code: 'assistant_equipment', name_he: 'ציוד', score_type: 'percentage', display_order: 3 },
        { code: 'assistant_rescue', name_he: 'הצלה', score_type: 'pass_fail', display_order: 4 },
        { code: 'assistant_extra_1', name_he: 'נוסף 1', score_type: 'pass_fail', display_order: 5 },
        { code: 'assistant_extra_2', name_he: 'נוסף 2', score_type: 'pass_fail', display_order: 6 }
      ]
    }
  ],
  'מדריך': [
    {
      code: 'instructor_water_tests',
      name_he: 'מבחני מים',
      display_order: 1,
      tests: [
        { code: 'water_cmas', name_he: 'קמס', score_type: 'percentage', display_order: 1 },
        { code: 'water_scuba_1', name_he: 'סקובה 1', score_type: 'percentage', display_order: 2 },
        { code: 'water_scuba_3', name_he: 'סקובה 3', score_type: 'percentage', display_order: 3 },
        { code: 'water_scuba_5', name_he: 'סקובה 5', score_type: 'percentage', display_order: 4 },
        { code: 'water_extra', name_he: 'נוסף', score_type: 'percentage', display_order: 5 }
      ]
    },
    {
      code: 'instructor_classroom_tests',
      name_he: 'מבחני כיתה',
      display_order: 2,
      tests: [
        { code: 'classroom_behavior', name_he: 'כללי התנהגות', score_type: 'percentage', display_order: 1 },
        { code: 'classroom_risks', name_he: 'סיכוני צלילה', score_type: 'percentage', display_order: 2 },
        { code: 'classroom_free_lecture', name_he: 'הרצאה חופשית', score_type: 'percentage', display_order: 3 },
        { code: 'classroom_extra', name_he: 'נוסף', score_type: 'percentage', display_order: 4 }
      ]
    },
    {
      code: 'instructor_external_tests',
      name_he: 'מבחנים עיוניים',
      display_order: 3,
      tests: [
        { code: 'ext_physics', name_he: 'פיזיקה', score_type: 'percentage', display_order: 1 },
        { code: 'ext_physiology', name_he: 'פיזיולוגיה', score_type: 'percentage', display_order: 2 },
        { code: 'ext_eye_contact', name_he: 'קשר עין', score_type: 'percentage', display_order: 3 },
        { code: 'ext_equipment', name_he: 'ציוד', score_type: 'percentage', display_order: 4 },
        { code: 'ext_decompression', name_he: 'דקומפרסיה', score_type: 'percentage', display_order: 5 }
      ]
    }
  ],
  'מדריך_עוזר_משולב_עם_מדריך': [], // Will combine both tracks
  'קרוסאובר': [] // Empty for now
};

async function addCertificationTestsTables() {
  const client = await pool.connect();

  try {
    console.log('Creating certification tests tables...\n');

    await client.query('BEGIN');

    // Create test_categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_categories (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        name_he VARCHAR(200) NOT NULL,
        course_type VARCHAR(50) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  - Created test_categories table');

    // Create test_types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_types (
        id SERIAL PRIMARY KEY,
        code VARCHAR(100) UNIQUE NOT NULL,
        category_id INTEGER REFERENCES test_categories(id) ON DELETE CASCADE,
        name_he VARCHAR(200) NOT NULL,
        score_type VARCHAR(50) NOT NULL DEFAULT 'percentage',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_score_type CHECK (score_type IN ('percentage', 'pass_fail', 'evaluation'))
      )
    `);
    console.log('  - Created test_types table');

    // Create student_test_scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_test_scores (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        test_type_id INTEGER NOT NULL REFERENCES test_types(id) ON DELETE CASCADE,
        score DECIMAL(5,2),
        passed BOOLEAN,
        evaluation_id INTEGER REFERENCES student_evaluations(id) ON DELETE SET NULL,
        test_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, test_type_id)
      )
    `);
    console.log('  - Created student_test_scores table');

    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_student_test_scores_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_student_test_scores_updated_at ON student_test_scores;
      CREATE TRIGGER trigger_update_student_test_scores_updated_at
        BEFORE UPDATE ON student_test_scores
        FOR EACH ROW
        EXECUTE FUNCTION update_student_test_scores_updated_at();
    `);
    console.log('  - Created trigger for updated_at');

    // Seed the test structure
    console.log('\nSeeding test categories and types...');

    for (const [courseType, categories] of Object.entries(testStructure)) {
      if (categories.length === 0) continue;

      for (const category of categories) {
        // Insert category
        const catResult = await client.query(
          `INSERT INTO test_categories (code, name_he, course_type, display_order)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (code) DO UPDATE SET name_he = $2, course_type = $3, display_order = $4
           RETURNING id`,
          [category.code, category.name_he, courseType, category.display_order]
        );
        const categoryId = catResult.rows[0].id;

        console.log(`  - Added category: ${category.name_he} (${courseType})`);

        // Insert test types
        for (const test of category.tests) {
          await client.query(
            `INSERT INTO test_types (code, category_id, name_he, score_type, display_order)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (code) DO UPDATE SET category_id = $2, name_he = $3, score_type = $4, display_order = $5`,
            [test.code, categoryId, test.name_he, test.score_type, test.display_order]
          );
        }
        console.log(`    Added ${category.tests.length} test types`);
      }
    }

    await client.query('COMMIT');

    console.log('\n=== Certification tests tables created successfully! ===');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating certification tests tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCertificationTestsTables();
