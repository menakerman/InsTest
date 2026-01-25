import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addCourseInstructorsTable() {
  const client = await pool.connect();

  try {
    console.log('Creating course_instructors table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS course_instructors (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        instructor_id INTEGER NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(course_id, instructor_id)
      )
    `);

    console.log('course_instructors table created successfully!');

    // Create index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_course_instructors_instructor_id
      ON course_instructors(instructor_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_course_instructors_course_id
      ON course_instructors(course_id)
    `);

    console.log('Indexes created successfully!');

  } catch (error) {
    console.error('Error creating course_instructors table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCourseInstructorsTable()
  .then(() => {
    console.log('Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
