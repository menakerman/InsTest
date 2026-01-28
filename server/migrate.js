import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { evaluationSubjects, evaluationCriteria } from './data/evaluationSeeds.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTablesQuery = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'student'
      CHECK (role IN ('admin', 'instructor', 'tester', 'student')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Password reset tokens
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Students table (existing)
  CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    unit_id VARCHAR(100),
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Add photo_url column if it doesn't exist (for existing databases)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'students'
                   AND column_name = 'photo_url') THEN
      ALTER TABLE students ADD COLUMN photo_url VARCHAR(500);
    END IF;
  END $$;

  -- Instructors table
  CREATE TABLE IF NOT EXISTS instructors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Evaluation subjects table (5 evaluation types)
  CREATE TABLE IF NOT EXISTS evaluation_subjects (
    id SERIAL PRIMARY KEY,
    name_he VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    max_raw_score INTEGER NOT NULL,
    passing_raw_score INTEGER NOT NULL,
    description_he TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Evaluation criteria table (items within each subject)
  CREATE TABLE IF NOT EXISTS evaluation_criteria (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    name_he VARCHAR(500) NOT NULL,
    description_he TEXT,
    display_order INTEGER DEFAULT 0,
    is_critical BOOLEAN DEFAULT FALSE,
    score_descriptions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Add score_descriptions column if it doesn't exist (for existing databases)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'evaluation_criteria'
                   AND column_name = 'score_descriptions') THEN
      ALTER TABLE evaluation_criteria ADD COLUMN score_descriptions JSONB;
    END IF;
  END $$;

  -- Add max_score column if it doesn't exist (for quality scoring sections)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'evaluation_criteria'
                   AND column_name = 'max_score') THEN
      ALTER TABLE evaluation_criteria ADD COLUMN max_score INTEGER DEFAULT NULL;
    END IF;
  END $$;

  -- Student evaluations table (evaluation sessions)
  CREATE TABLE IF NOT EXISTS student_evaluations (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES evaluation_subjects(id) ON DELETE RESTRICT,
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
    course_name VARCHAR(200),
    lesson_name VARCHAR(300),
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_score INTEGER NOT NULL,
    percentage_score DECIMAL(5,2) NOT NULL,
    final_score DECIMAL(5,2) NOT NULL,
    is_passing BOOLEAN NOT NULL,
    has_critical_fail BOOLEAN DEFAULT FALSE,
    is_final_test BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Add is_final_test column if it doesn't exist (for existing databases)
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'student_evaluations'
                   AND column_name = 'is_final_test') THEN
      ALTER TABLE student_evaluations ADD COLUMN is_final_test BOOLEAN DEFAULT FALSE;
    END IF;
  END $$;

  -- Evaluation item scores table (individual criterion scores)
  CREATE TABLE IF NOT EXISTS evaluation_item_scores (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES student_evaluations(id) ON DELETE CASCADE,
    criterion_id INTEGER REFERENCES evaluation_criteria(id) ON DELETE RESTRICT,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Update constraint to allow all valid scores (0-10) for quality sections
  DO $$
  BEGIN
    ALTER TABLE evaluation_item_scores DROP CONSTRAINT IF EXISTS evaluation_item_scores_score_check;
    ALTER TABLE evaluation_item_scores ADD CONSTRAINT evaluation_item_scores_score_check CHECK (score >= 0 AND score <= 10);
  EXCEPTION
    WHEN others THEN NULL;
  END $$;

  -- Student absences table
  CREATE TABLE IF NOT EXISTS student_absences (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    absence_date DATE NOT NULL,
    reason VARCHAR(500),
    is_excused BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Course type enum
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_type') THEN
      CREATE TYPE course_type AS ENUM ('מדריך_עוזר', 'מדריך', 'מדריך_עוזר_משולב_עם_מדריך', 'קרוסאובר');
    END IF;
  END $$;

  -- Add קרוסאובר to existing enum if not present
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'קרוסאובר' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'course_type')) THEN
      ALTER TYPE course_type ADD VALUE 'קרוסאובר';
    END IF;
  EXCEPTION WHEN duplicate_object THEN
    -- Value already exists, ignore
  END $$;

  -- Courses table
  CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    course_type course_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT end_date_after_start CHECK (end_date >= start_date)
  );

  -- Course-students junction table (many-to-many)
  CREATE TABLE IF NOT EXISTS course_students (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
  );

  -- Lessons table (lesson names associated with evaluation subjects)
  CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    subject_id INTEGER REFERENCES evaluation_subjects(id) ON DELETE CASCADE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Create or replace update_updated_at_column function
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  -- Triggers for updated_at on all tables
  DROP TRIGGER IF EXISTS update_students_updated_at ON students;
  CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_instructors_updated_at ON instructors;
  CREATE TRIGGER update_instructors_updated_at
    BEFORE UPDATE ON instructors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_evaluation_subjects_updated_at ON evaluation_subjects;
  CREATE TRIGGER update_evaluation_subjects_updated_at
    BEFORE UPDATE ON evaluation_subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_evaluation_criteria_updated_at ON evaluation_criteria;
  CREATE TRIGGER update_evaluation_criteria_updated_at
    BEFORE UPDATE ON evaluation_criteria
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_student_evaluations_updated_at ON student_evaluations;
  CREATE TRIGGER update_student_evaluations_updated_at
    BEFORE UPDATE ON student_evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_evaluation_item_scores_updated_at ON evaluation_item_scores;
  CREATE TRIGGER update_evaluation_item_scores_updated_at
    BEFORE UPDATE ON evaluation_item_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_student_absences_updated_at ON student_absences;
  CREATE TRIGGER update_student_absences_updated_at
    BEFORE UPDATE ON student_absences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
  CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_course_students_updated_at ON course_students;
  CREATE TRIGGER update_course_students_updated_at
    BEFORE UPDATE ON course_students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
  CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function seedAdminUser() {
  console.log('Seeding admin user...');

  const existingAdmin = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    ['admin@instest.local']
  );

  if (existingAdmin.rows.length === 0) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin@instest.local', passwordHash, 'מנהל', 'מערכת', 'admin', true]
    );
    console.log('  - Admin user created: admin@instest.local');
  } else {
    console.log('  - Admin user already exists');
  }
}

async function seedEvaluationData() {
  console.log('Seeding evaluation subjects and criteria...');

  // Insert or update evaluation subjects
  for (const subject of evaluationSubjects) {
    const existingSubject = await pool.query(
      'SELECT id FROM evaluation_subjects WHERE code = $1',
      [subject.code]
    );

    let subjectId;
    const criteria = evaluationCriteria[subject.code];

    if (existingSubject.rows.length === 0) {
      // Insert new subject
      const result = await pool.query(
        `INSERT INTO evaluation_subjects (name_he, code, max_raw_score, passing_raw_score, description_he, display_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [subject.name_he, subject.code, subject.max_raw_score, subject.passing_raw_score, subject.description_he, subject.display_order]
      );
      subjectId = result.rows[0].id;

      // Insert criteria for this subject
      if (criteria) {
        for (const criterion of criteria) {
          await pool.query(
            `INSERT INTO evaluation_criteria (subject_id, name_he, description_he, display_order, is_critical, score_descriptions, max_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [subjectId, criterion.name_he, criterion.description_he, criterion.display_order, criterion.is_critical, JSON.stringify(criterion.score_descriptions || null), criterion.max_score || null]
          );
        }
      }

      console.log(`  - Added subject: ${subject.name_he} with ${criteria?.length || 0} criteria`);
    } else {
      // Update existing subject
      subjectId = existingSubject.rows[0].id;
      await pool.query(
        `UPDATE evaluation_subjects SET max_raw_score = $1, passing_raw_score = $2, description_he = $3 WHERE id = $4`,
        [subject.max_raw_score, subject.passing_raw_score, subject.description_he, subjectId]
      );

      // Check if criteria count matches - if not, recreate criteria
      const existingCriteria = await pool.query(
        'SELECT COUNT(*) FROM evaluation_criteria WHERE subject_id = $1',
        [subjectId]
      );
      const existingCount = parseInt(existingCriteria.rows[0].count);
      const expectedCount = criteria?.length || 0;

      if (existingCount !== expectedCount) {
        // Delete old criteria and insert new ones
        await pool.query('DELETE FROM evaluation_criteria WHERE subject_id = $1', [subjectId]);

        if (criteria) {
          for (const criterion of criteria) {
            await pool.query(
              `INSERT INTO evaluation_criteria (subject_id, name_he, description_he, display_order, is_critical, score_descriptions, max_score)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [subjectId, criterion.name_he, criterion.description_he, criterion.display_order, criterion.is_critical, JSON.stringify(criterion.score_descriptions || null), criterion.max_score || null]
            );
          }
        }
        console.log(`  - Updated subject: ${subject.name_he} - recreated ${expectedCount} criteria (was ${existingCount})`);
      } else {
        console.log(`  - Subject already exists: ${subject.name_he}`);
      }
    }
  }
}

async function migrate() {
  try {
    console.log('Running migrations...');
    await pool.query(createTablesQuery);
    console.log('Tables created successfully!');

    await seedAdminUser();
    await seedEvaluationData();
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
