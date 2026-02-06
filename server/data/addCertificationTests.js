import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isLocalhost = process.env.DATABASE_URL?.includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocalhost ? false : { rejectUnauthorized: false }
});

// Test categories and types for each certification track
const testStructure = {
  'מדריך_עוזר': [
    {
      code: 'assistant_entry_tests',
      name_he: 'תנאי קבלה',
      display_order: 1,
      tests: [
        { code: 'assistant_entry_swim_200', name_he: 'שחייה 200 מ\'', score_type: 'pass_fail', display_order: 1 },
        { code: 'assistant_entry_basis', name_he: 'ביסוס', score_type: 'pass_fail', display_order: 2 },
        { code: 'assistant_entry_dive_10', name_he: 'צלילת 10 מ\'', score_type: 'pass_fail', display_order: 3 },
        { code: 'assistant_entry_swim_800', name_he: 'שחייה 800 מ\'', score_type: 'pass_fail', display_order: 4 }
      ]
    },
    {
      code: 'assistant_theory_tests',
      name_he: 'מבחני תיאוריה',
      display_order: 2,
      tests: [
        { code: 'assistant_general_knowledge', name_he: 'ידע כללי', score_type: 'percentage', display_order: 1 },
        { code: 'assistant_general_knowledge_retake', name_he: 'ידע כללי (חוזר)', score_type: 'percentage', display_order: 2 },
        { code: 'assistant_diving_law', name_he: 'חוק הצלילה', score_type: 'percentage', display_order: 3 },
        { code: 'assistant_diving_law_retake', name_he: 'חוק הצלילה (חוזר)', score_type: 'percentage', display_order: 4 }
      ]
    },
    {
      code: 'assistant_lecture_tests',
      name_he: 'מבחני העברת הרצאה',
      display_order: 3,
      tests: [
        { code: 'assistant_equipment_lecture', name_he: 'ציוד צלילה', score_type: 'pass_fail', display_order: 1 },
        { code: 'assistant_pre_dive_briefing', name_he: 'תדריך לפני צלילה', score_type: 'pass_fail', display_order: 2 },
        { code: 'assistant_review_topic', name_he: 'חוזר בנושא', score_type: 'pass_fail', display_order: 3 }
      ]
    },
    {
      code: 'assistant_practical_tests',
      name_he: 'מבחנים מעשיים',
      display_order: 4,
      tests: [
        { code: 'assistant_cmas_lesson', name_he: 'שיעור קמ"ס', score_type: 'pass_fail', display_order: 1 },
        { code: 'assistant_dive_leading', name_he: 'הובלת צלילה', score_type: 'pass_fail', display_order: 2 },
        { code: 'assistant_first_dive_leading', name_he: 'הובלת צלילת בכורה', score_type: 'pass_fail', display_order: 3 },
        { code: 'assistant_rescue_procedure', name_he: 'נוהל הצלה', score_type: 'pass_fail', display_order: 4 },
        { code: 'assistant_practical_retake', name_he: 'מבחן חוזר', score_type: 'pass_fail', display_order: 5 }
      ]
    }
  ],
  'מדריך': [
    {
      code: 'instructor_entry_tests',
      name_he: 'תנאי קבלה',
      display_order: 1,
      tests: [
        { code: 'instructor_entry_swim_200', name_he: 'שחייה 200 מ\'', score_type: 'pass_fail', display_order: 1 },
        { code: 'instructor_entry_basis', name_he: 'ביסוס', score_type: 'pass_fail', display_order: 2 },
        { code: 'instructor_entry_tow', name_he: 'גרירת בן-זוג', score_type: 'pass_fail', display_order: 3 },
        { code: 'instructor_entry_swim_800', name_he: 'שחייה 800 מ\'', score_type: 'pass_fail', display_order: 4 },
        { code: 'instructor_entry_intro_dive', name_he: 'מבחן צלילת הכרות', score_type: 'pass_fail', display_order: 5 },
        { code: 'instructor_entry_briefing', name_he: 'העברת תדריך', score_type: 'pass_fail', display_order: 6 },
        { code: 'instructor_entry_equipment', name_he: 'העברת ש.ציוד', score_type: 'pass_fail', display_order: 7 }
      ]
    },
    {
      code: 'instructor_knowledge_tests',
      name_he: 'מבחני ידע',
      display_order: 2,
      tests: [
        { code: 'instructor_tables', name_he: 'טבלאות', score_type: 'percentage', display_order: 1 },
        { code: 'instructor_tables_retake', name_he: 'טבלאות (חוזר)', score_type: 'percentage', display_order: 2 },
        { code: 'instructor_physics', name_he: 'פיזיקה', score_type: 'percentage', display_order: 3 },
        { code: 'instructor_physics_retake', name_he: 'פיזיקה (חוזר)', score_type: 'percentage', display_order: 4 },
        { code: 'instructor_physiology', name_he: 'פיזיולוגיה', score_type: 'percentage', display_order: 5 },
        { code: 'instructor_physiology_retake', name_he: 'פיזיולוגיה (חוזר)', score_type: 'percentage', display_order: 6 },
        { code: 'instructor_eye_contact', name_he: 'קשר עין', score_type: 'percentage', display_order: 7 },
        { code: 'instructor_eye_contact_retake', name_he: 'קשר עין (חוזר)', score_type: 'percentage', display_order: 8 },
        { code: 'instructor_equipment_exam', name_he: 'ציוד צלילה', score_type: 'percentage', display_order: 9 },
        { code: 'instructor_equipment_retake', name_he: 'ציוד צלילה (חוזר)', score_type: 'percentage', display_order: 10 },
        { code: 'instructor_diving_law', name_he: 'חוק הצלילה', score_type: 'percentage', display_order: 11 },
        { code: 'instructor_diving_law_retake', name_he: 'חוק הצלילה (חוזר)', score_type: 'percentage', display_order: 12 }
      ]
    },
    {
      code: 'instructor_lecture_tests',
      name_he: 'מבחני העברת הרצאה',
      display_order: 3,
      tests: [
        { code: 'instructor_lecture_1', name_he: 'נושא הרצאה 1', score_type: 'pass_fail', display_order: 1 },
        { code: 'instructor_lecture_2', name_he: 'נושא הרצאה 2', score_type: 'pass_fail', display_order: 2 },
        { code: 'instructor_lecture_choice', name_he: 'הרצאת בחירה', score_type: 'pass_fail', display_order: 3 },
        { code: 'instructor_lecture_retake', name_he: 'חוזר בנושא', score_type: 'pass_fail', display_order: 4 }
      ]
    },
    {
      code: 'instructor_water_tests',
      name_he: 'מבחני העברת שיעור מים',
      display_order: 4,
      tests: [
        { code: 'instructor_water_cmas', name_he: 'מבחן קמ"ס', score_type: 'pass_fail', display_order: 1 },
        { code: 'instructor_water_protected_1', name_he: 'מבחן מים מוגנים 1', score_type: 'pass_fail', display_order: 2 },
        { code: 'instructor_water_protected_2', name_he: 'מבחן מים מוגנים 2', score_type: 'pass_fail', display_order: 3 },
        { code: 'instructor_water_open_sea', name_he: 'מבחן ים פתוח', score_type: 'pass_fail', display_order: 4 },
        { code: 'instructor_water_retake', name_he: 'מבחן חוזר', score_type: 'pass_fail', display_order: 5 }
      ]
    },
    {
      code: 'instructor_rescue_test',
      name_he: 'מבחן הצלה',
      display_order: 5,
      tests: [
        { code: 'instructor_rescue_surface', name_he: 'העלאה לפני המים', score_type: 'pass_fail', display_order: 1 },
        { code: 'instructor_rescue_tow_breath', name_he: 'גרירה והנשמה', score_type: 'pass_fail', display_order: 2 },
        { code: 'instructor_rescue_cpr', name_he: 'הוצאה והחייאה', score_type: 'pass_fail', display_order: 3 }
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
        location VARCHAR(50),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_score_type CHECK (score_type IN ('percentage', 'pass_fail', 'evaluation'))
      )
    `);
    console.log('  - Created test_types table');

    // Add location column if it doesn't exist (for existing tables)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'test_types' AND column_name = 'location'
        ) THEN
          ALTER TABLE test_types ADD COLUMN location VARCHAR(50);
        END IF;
      END $$;
    `);
    console.log('  - Ensured location column exists');

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
            `INSERT INTO test_types (code, category_id, name_he, score_type, location, display_order)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (code) DO UPDATE SET category_id = $2, name_he = $3, score_type = $4, location = $5, display_order = $6`,
            [test.code, categoryId, test.name_he, test.score_type, test.location || null, test.display_order]
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
