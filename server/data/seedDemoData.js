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

// Demo students data (Hebrew names)
const demoStudents = [
  { first_name: 'אבי', last_name: 'כהן', email: 'avi.cohen@example.com', phone: '050-1234567', unit_id: 'U001' },
  { first_name: 'בני', last_name: 'לוי', email: 'beni.levi@example.com', phone: '052-2345678', unit_id: 'U001' },
  { first_name: 'גילי', last_name: 'מזרחי', email: 'gili.mizrachi@example.com', phone: '054-3456789', unit_id: 'U002' },
  { first_name: 'דני', last_name: 'אברהם', email: 'dani.avraham@example.com', phone: '053-4567890', unit_id: 'U002' },
  { first_name: 'הדר', last_name: 'פרץ', email: 'hadar.peretz@example.com', phone: '050-5678901', unit_id: 'U001' },
  { first_name: 'ורד', last_name: 'שמעון', email: 'vered.shimon@example.com', phone: '052-6789012', unit_id: 'U003' },
  { first_name: 'זיו', last_name: 'דוד', email: 'ziv.david@example.com', phone: '054-7890123', unit_id: 'U003' },
  { first_name: 'חן', last_name: 'יוסף', email: 'chen.yosef@example.com', phone: '053-8901234', unit_id: 'U001' },
];

// Demo instructors data
const demoInstructors = [
  { first_name: 'משה', last_name: 'רבינוביץ', email: 'moshe.r@diving.com', phone: '050-1111111' },
  { first_name: 'שרה', last_name: 'גולדברג', email: 'sarah.g@diving.com', phone: '052-2222222' },
  { first_name: 'יעקב', last_name: 'אלון', email: 'yaakov.a@diving.com', phone: '054-3333333' },
];

// Score options (matching the evaluation system)
const SCORES = [1, 4, 7, 10];

function getRandomScore(passingBias = 0.7) {
  // Biased towards passing scores
  const rand = Math.random();
  if (rand < passingBias) {
    // 70% chance of good scores (7 or 10)
    return Math.random() < 0.5 ? 7 : 10;
  } else if (rand < 0.9) {
    // 20% chance of basic score (4)
    return 4;
  } else {
    // 10% chance of fail (1)
    return 1;
  }
}

function generateItemScores(criteria, shouldPass = true) {
  const scores = [];
  let hasCriticalFail = false;

  for (const criterion of criteria) {
    let score;
    if (criterion.is_critical && !shouldPass && Math.random() < 0.3) {
      // Sometimes fail on critical items when student shouldn't pass
      score = 1;
      hasCriticalFail = true;
    } else if (criterion.is_critical) {
      // Critical items usually pass
      score = getRandomScore(0.9);
      if (score === 1) hasCriticalFail = true;
    } else {
      score = getRandomScore(shouldPass ? 0.75 : 0.4);
    }
    scores.push({ criterion_id: criterion.id, score });
  }

  return { scores, hasCriticalFail };
}

async function seedDemoData() {
  const client = await pool.connect();

  try {
    console.log('Seeding demo data...\n');

    // Insert students
    console.log('Adding students...');
    const studentIds = [];
    for (const student of demoStudents) {
      const existing = await client.query('SELECT id FROM students WHERE email = $1', [student.email]);
      if (existing.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO students (first_name, last_name, email, phone, unit_id)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [student.first_name, student.last_name, student.email, student.phone, student.unit_id]
        );
        studentIds.push(result.rows[0].id);
        console.log(`  - Added: ${student.first_name} ${student.last_name}`);
      } else {
        studentIds.push(existing.rows[0].id);
        console.log(`  - Exists: ${student.first_name} ${student.last_name}`);
      }
    }

    // Insert instructors
    console.log('\nAdding instructors...');
    const instructorIds = [];
    for (const instructor of demoInstructors) {
      const existing = await client.query('SELECT id FROM instructors WHERE email = $1', [instructor.email]);
      if (existing.rows.length === 0) {
        const result = await client.query(
          `INSERT INTO instructors (first_name, last_name, email, phone)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [instructor.first_name, instructor.last_name, instructor.email, instructor.phone]
        );
        instructorIds.push(result.rows[0].id);
        console.log(`  - Added: ${instructor.first_name} ${instructor.last_name}`);
      } else {
        instructorIds.push(existing.rows[0].id);
        console.log(`  - Exists: ${instructor.first_name} ${instructor.last_name}`);
      }
    }

    // Get evaluation subjects and criteria
    const subjectsResult = await client.query('SELECT * FROM evaluation_subjects ORDER BY display_order');
    const subjects = subjectsResult.rows;

    if (subjects.length === 0) {
      console.log('\nNo evaluation subjects found. Please run migrations first.');
      return;
    }

    // Create evaluations for students
    console.log('\nAdding evaluations...');
    let evaluationCount = 0;

    // Each student gets 2-4 random evaluations
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i];
      const student = demoStudents[i];
      const numEvaluations = Math.floor(Math.random() * 3) + 2; // 2-4 evaluations

      // Shuffle subjects and take random ones
      const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
      const selectedSubjects = shuffledSubjects.slice(0, numEvaluations);

      for (const subject of selectedSubjects) {
        // Get criteria for this subject
        const criteriaResult = await client.query(
          'SELECT * FROM evaluation_criteria WHERE subject_id = $1 ORDER BY display_order',
          [subject.id]
        );
        const criteria = criteriaResult.rows;

        // Decide if this evaluation should pass (80% pass rate)
        const shouldPass = Math.random() < 0.8;

        // Generate scores
        const { scores: itemScores, hasCriticalFail } = generateItemScores(criteria, shouldPass);

        // Calculate totals
        const rawScore = itemScores.reduce((sum, item) => sum + item.score, 0);
        const percentageScore = (rawScore / subject.max_raw_score) * 100;
        const passingPercentage = (subject.passing_raw_score / subject.max_raw_score) * 100;
        const isPassing = !hasCriticalFail && percentageScore >= passingPercentage;

        // Random instructor
        const instructorId = instructorIds[Math.floor(Math.random() * instructorIds.length)];

        // Random date in the last 3 months
        const daysAgo = Math.floor(Math.random() * 90);
        const evalDate = new Date();
        evalDate.setDate(evalDate.getDate() - daysAgo);

        // Course names
        const courseNames = ['קורס מדריכים 2024', 'קורס חורף', 'קורס קיץ', 'קורס מתקדם'];
        const courseName = courseNames[Math.floor(Math.random() * courseNames.length)];

        // Insert evaluation
        await client.query('BEGIN');

        const evalResult = await client.query(
          `INSERT INTO student_evaluations
            (student_id, subject_id, instructor_id, course_name, lesson_name, evaluation_date,
             raw_score, percentage_score, final_score, is_passing, has_critical_fail, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            studentId,
            subject.id,
            instructorId,
            courseName,
            subject.name_he,
            evalDate,
            rawScore,
            Math.round(percentageScore * 100) / 100,
            Math.round(percentageScore * 100) / 100,
            isPassing,
            hasCriticalFail,
            isPassing ? null : 'נדרש תרגול נוסף'
          ]
        );

        const evaluationId = evalResult.rows[0].id;

        // Insert item scores
        for (const itemScore of itemScores) {
          await client.query(
            `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
             VALUES ($1, $2, $3)`,
            [evaluationId, itemScore.criterion_id, itemScore.score]
          );
        }

        await client.query('COMMIT');

        evaluationCount++;
        const status = isPassing ? 'עבר' : 'נכשל';
        console.log(`  - ${student.first_name} ${student.last_name}: ${subject.name_he} (${Math.round(percentageScore)}%, ${status})`);
      }
    }

    console.log(`\n=== Demo Data Summary ===`);
    console.log(`Students: ${studentIds.length}`);
    console.log(`Instructors: ${instructorIds.length}`);
    console.log(`Evaluations: ${evaluationCount}`);
    console.log(`\nDemo data seeded successfully!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding demo data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoData();
