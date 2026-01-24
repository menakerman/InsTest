import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addExternalTestsTable() {
  const client = await pool.connect();

  try {
    console.log('Creating external_tests table...\n');

    // Create external_tests table with 5 tests:
    // פיזיקה, פיזיולוגיה, קשר עין, ציוד, דקומפרסיה
    await client.query(`
      CREATE TABLE IF NOT EXISTS external_tests (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        physics_score DECIMAL(5,2) CHECK (physics_score >= 0 AND physics_score <= 100),
        physiology_score DECIMAL(5,2) CHECK (physiology_score >= 0 AND physiology_score <= 100),
        eye_contact_score DECIMAL(5,2) CHECK (eye_contact_score >= 0 AND eye_contact_score <= 100),
        equipment_score DECIMAL(5,2) CHECK (equipment_score >= 0 AND equipment_score <= 100),
        decompression_score DECIMAL(5,2) CHECK (decompression_score >= 0 AND decompression_score <= 100),
        average_score DECIMAL(5,2) GENERATED ALWAYS AS (
          (COALESCE(physics_score, 0) + COALESCE(physiology_score, 0) + COALESCE(eye_contact_score, 0) +
           COALESCE(equipment_score, 0) + COALESCE(decompression_score, 0)) /
          NULLIF(
            (CASE WHEN physics_score IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN physiology_score IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN eye_contact_score IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN equipment_score IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN decompression_score IS NOT NULL THEN 1 ELSE 0 END), 0)
        ) STORED,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id)
      )
    `);

    console.log('external_tests table created successfully!\n');

    // Create trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_external_tests_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_external_tests_updated_at ON external_tests;
      CREATE TRIGGER trigger_update_external_tests_updated_at
        BEFORE UPDATE ON external_tests
        FOR EACH ROW
        EXECUTE FUNCTION update_external_tests_updated_at();
    `);

    console.log('Trigger created for updated_at column.\n');

    console.log('=== Migration completed successfully! ===');
    console.log('Tests: פיזיקה, פיזיולוגיה, קשר עין, ציוד, דקומפרסיה');

  } catch (error) {
    console.error('Error creating external_tests table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addExternalTestsTable();
