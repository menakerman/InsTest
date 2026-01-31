import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Demo data
const demoStudents = [
  { first_name: 'אבי', last_name: 'כהן', email: 'avi.cohen@example.com', phone: '050-1234567', unit_id: 'U001' },
  { first_name: 'בני', last_name: 'לוי', email: 'beni.levi@example.com', phone: '052-2345678', unit_id: 'U001' },
  { first_name: 'גילי', last_name: 'מזרחי', email: 'gili.mizrachi@example.com', phone: '054-3456789', unit_id: 'U002' },
  { first_name: 'דני', last_name: 'אברהם', email: 'dani.avraham@example.com', phone: '053-4567890', unit_id: 'U002' },
  { first_name: 'הדר', last_name: 'פרץ', email: 'hadar.peretz@example.com', phone: '050-5678901', unit_id: 'U001' },
  { first_name: 'ורד', last_name: 'שמעון', email: 'vered.shimon@example.com', phone: '052-6789012', unit_id: 'U003' },
];

const demoInstructors = [
  { first_name: 'משה', last_name: 'רבינוביץ', email: 'moshe@diving.com', phone: '050-1111111' },
  { first_name: 'שרה', last_name: 'גולדברג', email: 'sarah@diving.com', phone: '052-2222222' },
  { first_name: 'יעקב', last_name: 'אלון', email: 'yaakov@diving.com', phone: '054-3333333' },
];

const demoCourses = [
  { name: 'קורס מדריכים ינואר 2026', course_type: 'מדריך', start_date: '2026-01-15', end_date: '2026-02-15', is_active: true },
  { name: 'קורס עוזר מדריך פברואר 2026', course_type: 'מדריך_עוזר', start_date: '2026-02-01', end_date: '2026-02-28', is_active: true },
];

const lessonNames = [
  'שיעור 1 - מבוא', 'שיעור 2 - בסיסי', 'שיעור 3 - מתקדם',
  'שיעור 4 - תרגול', 'שיעור 5 - סיכום'
];

const SCORES = [1, 4, 7, 10];

function getRandomScore(passingBias = 0.7) {
  const rand = Math.random();
  if (rand < passingBias) {
    return Math.random() < 0.5 ? 7 : 10;
  } else if (rand < 0.9) {
    return 4;
  } else {
    return 1;
  }
}

function generateItemScores(criteria, shouldPass = true) {
  const scores = [];
  let hasCriticalFail = false;

  for (const criterion of criteria) {
    let score;
    if (criterion.is_critical && !shouldPass && Math.random() < 0.3) {
      score = 1;
      hasCriticalFail = true;
    } else if (criterion.is_critical) {
      score = getRandomScore(0.9);
      if (score === 1) hasCriticalFail = true;
    } else {
      score = getRandomScore(shouldPass ? 0.75 : 0.4);
    }
    scores.push({ criterion_id: criterion.id, score });
  }

  return { scores, hasCriticalFail };
}

async function resetAndSeed() {
  const client = await pool.connect();

  try {
    console.log('=== Resetting Database ===\n');

    // Clear all data (order matters due to foreign keys)
    console.log('Clearing existing data...');

    // Helper to delete from table if it exists
    const deleteIfExists = async (tableName) => {
      try {
        await client.query(`DELETE FROM ${tableName}`);
        console.log(`  - Cleared ${tableName}`);
      } catch (e) {
        if (e.code === '42P01') { // Table does not exist
          console.log(`  - Skipped ${tableName} (does not exist)`);
        } else {
          throw e;
        }
      }
    };

    await deleteIfExists('evaluation_item_scores');
    await deleteIfExists('student_evaluations');
    await deleteIfExists('external_tests');
    await deleteIfExists('student_skills');
    await deleteIfExists('course_instructors');
    await deleteIfExists('course_students');
    await deleteIfExists('student_absences');
    await deleteIfExists('courses');
    await deleteIfExists('students');
    await deleteIfExists('instructors');
    await deleteIfExists('password_reset_tokens');
    await deleteIfExists('users');
    console.log('Data cleared.\n');

    // Ensure required tables exist
    console.log('Ensuring tables exist...');

    // Create course_instructors table if not exists
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

    // Create external_tests table if not exists
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

    // Create student_skills table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS student_skills (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        meters_30 BOOLEAN DEFAULT FALSE,
        meters_40 BOOLEAN DEFAULT FALSE,
        guidance BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id)
      )
    `);

    console.log('Tables verified.\n');

    // Create admin user
    console.log('Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin@diving.com', adminPassword, 'מנהל', 'מערכת', 'admin', true]
    );
    console.log('  - Admin: admin@diving.com / admin123');

    // Insert instructors and create user accounts for them
    console.log('\nCreating instructors...');
    const instructorIds = [];
    const instructorPassword = await bcrypt.hash('instructor123', 10);

    for (const instructor of demoInstructors) {
      // Create instructor record
      const result = await client.query(
        `INSERT INTO instructors (first_name, last_name, email, phone)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [instructor.first_name, instructor.last_name, instructor.email, instructor.phone]
      );
      instructorIds.push(result.rows[0].id);

      // Create user account for instructor
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [instructor.email, instructorPassword, instructor.first_name, instructor.last_name, 'instructor', true]
      );
      console.log(`  - ${instructor.first_name} ${instructor.last_name}: ${instructor.email} / instructor123`);
    }

    // Insert students
    console.log('\nCreating students...');
    const studentIds = [];
    for (const student of demoStudents) {
      const result = await client.query(
        `INSERT INTO students (first_name, last_name, email, phone, unit_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [student.first_name, student.last_name, student.email, student.phone, student.unit_id]
      );
      studentIds.push(result.rows[0].id);
      console.log(`  - ${student.first_name} ${student.last_name}`);
    }

    // Insert courses
    console.log('\nCreating courses...');
    const courseIds = [];
    for (const course of demoCourses) {
      const result = await client.query(
        `INSERT INTO courses (name, course_type, start_date, end_date, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [course.name, course.course_type, course.start_date, course.end_date, course.is_active]
      );
      courseIds.push(result.rows[0].id);
      console.log(`  - ${course.name}`);
    }

    // Assign students to courses
    console.log('\nAssigning students to courses...');
    // Course 1: first 4 students
    for (let i = 0; i < 4; i++) {
      await client.query(
        `INSERT INTO course_students (course_id, student_id) VALUES ($1, $2)`,
        [courseIds[0], studentIds[i]]
      );
    }
    console.log(`  - קורס מדריכים: ${demoStudents.slice(0, 4).map(s => s.first_name).join(', ')}`);

    // Course 2: last 3 students
    for (let i = 3; i < 6; i++) {
      await client.query(
        `INSERT INTO course_students (course_id, student_id) VALUES ($1, $2)`,
        [courseIds[1], studentIds[i]]
      );
    }
    console.log(`  - קורס עוזר מדריך: ${demoStudents.slice(3, 6).map(s => s.first_name).join(', ')}`);

    // Assign instructors to courses
    console.log('\nAssigning instructors to courses...');
    // Course 1: משה and שרה
    await client.query(`INSERT INTO course_instructors (course_id, instructor_id) VALUES ($1, $2)`, [courseIds[0], instructorIds[0]]);
    await client.query(`INSERT INTO course_instructors (course_id, instructor_id) VALUES ($1, $2)`, [courseIds[0], instructorIds[1]]);
    console.log(`  - קורס מדריכים: משה, שרה`);

    // Course 2: שרה and יעקב
    await client.query(`INSERT INTO course_instructors (course_id, instructor_id) VALUES ($1, $2)`, [courseIds[1], instructorIds[1]]);
    await client.query(`INSERT INTO course_instructors (course_id, instructor_id) VALUES ($1, $2)`, [courseIds[1], instructorIds[2]]);
    console.log(`  - קורס עוזר מדריך: שרה, יעקב`);

    // Get evaluation subjects
    const subjectsResult = await client.query('SELECT * FROM evaluation_subjects ORDER BY display_order');
    const subjects = subjectsResult.rows;

    if (subjects.length === 0) {
      console.log('\nNo evaluation subjects found. Please run migrations first.');
      return;
    }

    // Create evaluations
    console.log('\nCreating evaluations...');
    let evaluationCount = 0;

    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const student = demoStudents[i];
      const numEvaluations = Math.floor(Math.random() * 3) + 2;

      const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
      const selectedSubjects = shuffledSubjects.slice(0, numEvaluations);

      for (const subject of selectedSubjects) {
        const criteriaResult = await client.query(
          'SELECT * FROM evaluation_criteria WHERE subject_id = $1 ORDER BY display_order',
          [subject.id]
        );
        const criteria = criteriaResult.rows;
        const shouldPass = Math.random() < 0.75;
        const { scores: itemScores, hasCriticalFail } = generateItemScores(criteria, shouldPass);

        const rawScore = itemScores.reduce((sum, item) => sum + item.score, 0);
        const percentageScore = (rawScore / subject.max_raw_score) * 100;
        const passingPercentage = (subject.passing_raw_score / subject.max_raw_score) * 100;
        const isPassing = !hasCriticalFail && percentageScore >= passingPercentage;

        const instructorId = instructorIds[Math.floor(Math.random() * instructorIds.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const evalDate = new Date();
        evalDate.setDate(evalDate.getDate() - daysAgo);
        const lessonName = lessonNames[Math.floor(Math.random() * lessonNames.length)];

        await client.query('BEGIN');

        const evalResult = await client.query(
          `INSERT INTO student_evaluations
            (student_id, subject_id, instructor_id, course_name, lesson_name, evaluation_date,
             raw_score, percentage_score, final_score, is_passing, has_critical_fail, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            studentId, subject.id, instructorId,
            i < 4 ? demoCourses[0].name : demoCourses[1].name,
            lessonName, evalDate, rawScore,
            Math.round(percentageScore * 100) / 100,
            Math.round(percentageScore * 100) / 100,
            isPassing, hasCriticalFail,
            isPassing ? null : 'נדרש תרגול נוסף'
          ]
        );

        const evaluationId = evalResult.rows[0].id;

        for (const itemScore of itemScores) {
          await client.query(
            `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
             VALUES ($1, $2, $3)`,
            [evaluationId, itemScore.criterion_id, itemScore.score]
          );
        }

        await client.query('COMMIT');
        evaluationCount++;
      }
      console.log(`  - ${student.first_name} ${student.last_name}: ${selectedSubjects.length} evaluations`);
    }

    // Add external tests for some students
    console.log('\nCreating external tests...');
    for (let i = 0; i < 4; i++) {
      const studentId = studentIds[i];
      const student = demoStudents[i];
      await client.query(
        `INSERT INTO external_tests (student_id, physics_score, physiology_score, eye_contact_score, equipment_score, decompression_score)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          studentId,
          Math.round(60 + Math.random() * 40),
          Math.round(60 + Math.random() * 40),
          Math.round(60 + Math.random() * 40),
          Math.round(60 + Math.random() * 40),
          Math.round(60 + Math.random() * 40)
        ]
      );
      console.log(`  - ${student.first_name} ${student.last_name}: external tests added`);
    }

    // Add skills for some students
    console.log('\nCreating student skills...');
    for (let i = 0; i < 3; i++) {
      const studentId = studentIds[i];
      const student = demoStudents[i];
      await client.query(
        `INSERT INTO student_skills (student_id, meters_30, meters_40, guidance)
         VALUES ($1, $2, $3, $4)`,
        [studentId, true, Math.random() > 0.5, Math.random() > 0.5]
      );
      console.log(`  - ${student.first_name} ${student.last_name}: skills added`);
    }

    console.log('\n=== Summary ===');
    console.log(`Users: 1 admin + ${instructorIds.length} instructors`);
    console.log(`Instructors: ${instructorIds.length}`);
    console.log(`Students: ${studentIds.length}`);
    console.log(`Courses: ${courseIds.length}`);
    console.log(`Evaluations: ${evaluationCount}`);
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@diving.com / admin123');
    console.log('Instructors: [email] / instructor123');
    console.log('\nDone!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetAndSeed();
