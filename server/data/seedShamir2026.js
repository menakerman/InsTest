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

// Course data
const courseData = {
  name: 'שמיר 2026',
  course_type: 'מדריך',
  start_date: '2026-01-01',
  end_date: '2026-03-31',
  is_active: true
};

// 5 Students
const students = [
  { first_name: 'יוסי', last_name: 'כהן', email: 'yossi.cohen@example.com', phone: '050-1111111', unit_id: 'U001' },
  { first_name: 'דנה', last_name: 'לוי', email: 'dana.levi@example.com', phone: '050-2222222', unit_id: 'U001' },
  { first_name: 'אורי', last_name: 'אברהם', email: 'ori.avraham@example.com', phone: '050-3333333', unit_id: 'U001' },
  { first_name: 'מיכל', last_name: 'דוד', email: 'michal.david@example.com', phone: '050-4444444', unit_id: 'U001' },
  { first_name: 'רון', last_name: 'שמעון', email: 'ron.shimon@example.com', phone: '050-5555555', unit_id: 'U001' },
];

// Class lessons (for lecture_delivery subject)
const classLessons = [
  'צלילת הכירות',
  'סיכונים בירידה',
  'סיכונים בשהיה',
  'סיכונים בעליה',
  'כללי התנהגות 1',
  'כללי התנהגות 2',
  'כללי התנהגות 3',
  'כללי התנהגות 4',
  'כללי התנהגות 5',
  'הסביבה החדשה 1',
  'הסביבה החדשה 2',
];

// Water lessons (for water_lesson subject)
const waterLessons = [
  'סקובה 1',
  'סקובה 2',
  'סקובה 3',
  'סקובה 4',
  'סקובה 5',
  'קמס 1',
];

// Instructor
const instructor = {
  first_name: 'משה',
  last_name: 'רבינוביץ',
  email: 'moshe@diving.com',
  phone: '052-1111111'
};

async function clearAllData(client) {
  console.log('Clearing all data...');

  const tables = [
    'evaluation_item_scores',
    'student_evaluations',
    'external_tests',
    'student_skills',
    'course_instructors',
    'course_students',
    'student_absences',
    'lessons',
    'courses',
    'students',
    'instructors',
    'password_reset_tokens',
    'users',
  ];

  for (const table of tables) {
    try {
      await client.query(`DELETE FROM ${table}`);
      console.log(`  - Cleared ${table}`);
    } catch (e) {
      if (e.code !== '42P01') throw e;
    }
  }
}

async function seedData() {
  const client = await pool.connect();

  try {
    console.log('=== Seeding שמיר 2026 Course ===\n');

    await clearAllData(client);

    // Create admin user
    console.log('\nCreating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin@diving.com', adminPassword, 'מנהל', 'מערכת', 'admin', true]
    );
    console.log('  - Admin: admin@diving.com / admin123');

    // Create instructor
    console.log('\nCreating instructor...');
    const instructorPassword = await bcrypt.hash('instructor123', 10);
    const instructorResult = await client.query(
      `INSERT INTO instructors (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [instructor.first_name, instructor.last_name, instructor.email, instructor.phone]
    );
    const instructorId = instructorResult.rows[0].id;

    await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [instructor.email, instructorPassword, instructor.first_name, instructor.last_name, 'instructor', true]
    );
    console.log(`  - ${instructor.first_name} ${instructor.last_name}: ${instructor.email} / instructor123`);

    // Create course
    console.log('\nCreating course...');
    const courseResult = await client.query(
      `INSERT INTO courses (name, course_type, start_date, end_date, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [courseData.name, courseData.course_type, courseData.start_date, courseData.end_date, courseData.is_active]
    );
    const courseId = courseResult.rows[0].id;
    console.log(`  - ${courseData.name}`);

    // Assign instructor to course
    await client.query(
      `INSERT INTO course_instructors (course_id, instructor_id) VALUES ($1, $2)`,
      [courseId, instructorId]
    );

    // Create students and assign to course
    console.log('\nCreating students...');
    const studentIds = [];
    for (const student of students) {
      const result = await client.query(
        `INSERT INTO students (first_name, last_name, email, phone, unit_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [student.first_name, student.last_name, student.email, student.phone, student.unit_id]
      );
      const studentId = result.rows[0].id;
      studentIds.push(studentId);

      // Assign to course
      await client.query(
        `INSERT INTO course_students (course_id, student_id) VALUES ($1, $2)`,
        [courseId, studentId]
      );

      console.log(`  - ${student.first_name} ${student.last_name}`);
    }

    // Get subject IDs
    const lectureSubject = await client.query(
      `SELECT id FROM evaluation_subjects WHERE code = 'lecture_delivery'`
    );
    const waterSubject = await client.query(
      `SELECT id FROM evaluation_subjects WHERE code = 'water_lesson'`
    );

    const lectureSubjectId = lectureSubject.rows[0]?.id;
    const waterSubjectId = waterSubject.rows[0]?.id;

    // Create class lessons
    console.log('\nCreating class lessons (הרצאות)...');
    for (let i = 0; i < classLessons.length; i++) {
      await client.query(
        `INSERT INTO lessons (name, subject_id, display_order) VALUES ($1, $2, $3)`,
        [classLessons[i], lectureSubjectId, i + 1]
      );
      console.log(`  - ${classLessons[i]}`);
    }

    // Create water lessons
    console.log('\nCreating water lessons (שיעורי מים)...');
    for (let i = 0; i < waterLessons.length; i++) {
      await client.query(
        `INSERT INTO lessons (name, subject_id, display_order) VALUES ($1, $2, $3)`,
        [waterLessons[i], waterSubjectId, i + 1]
      );
      console.log(`  - ${waterLessons[i]}`);
    }

    console.log('\n=== Summary ===');
    console.log(`Course: ${courseData.name}`);
    console.log(`Students: ${students.length}`);
    console.log(`Class lessons: ${classLessons.length}`);
    console.log(`Water lessons: ${waterLessons.length}`);
    console.log(`Instructor: ${instructor.first_name} ${instructor.last_name}`);

    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@diving.com / admin123');
    console.log(`Instructor: ${instructor.email} / instructor123`);

    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
