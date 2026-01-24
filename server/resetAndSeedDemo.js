import pg from 'pg';
import dotenv from 'dotenv';
import { evaluationSubjects, evaluationCriteria } from './data/evaluationSeeds.js';
import { classLessonNames, waterLessonNames } from './data/lessonNames.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Demo students
const demoStudents = [
  { first_name: 'יונתן', last_name: 'כהן', email: 'yonatan.cohen@example.com', phone: '050-1111111', unit_id: 'U001' },
  { first_name: 'מיכל', last_name: 'לוי', email: 'michal.levi@example.com', phone: '050-2222222', unit_id: 'U001' },
  { first_name: 'דוד', last_name: 'אברהם', email: 'david.avraham@example.com', phone: '050-3333333', unit_id: 'U002' },
  { first_name: 'שרה', last_name: 'יעקב', email: 'sara.yaakov@example.com', phone: '050-4444444', unit_id: 'U002' },
  { first_name: 'אלון', last_name: 'בן-דוד', email: 'alon.bendavid@example.com', phone: '050-5555555', unit_id: 'U001' },
  { first_name: 'נועה', last_name: 'שמעון', email: 'noa.shimon@example.com', phone: '050-6666666', unit_id: 'U003' },
];

// Demo instructors
const demoInstructors = [
  { first_name: 'משה', last_name: 'רבינוביץ', email: 'moshe.r@example.com', phone: '052-1111111' },
  { first_name: 'רחל', last_name: 'גולדברג', email: 'rachel.g@example.com', phone: '052-2222222' },
  { first_name: 'יוסי', last_name: 'כץ', email: 'yossi.k@example.com', phone: '052-3333333' },
];

// Score generation helper
function generateScores(criteriaCount, avgScore = 7, variance = 2) {
  const scores = [];
  for (let i = 0; i < criteriaCount; i++) {
    const possibleScores = [1, 4, 7, 10];
    // Bias towards avgScore
    let score;
    const rand = Math.random();
    if (rand < 0.1) score = 1;
    else if (rand < 0.25) score = 4;
    else if (rand < 0.7) score = 7;
    else score = 10;
    scores.push(score);
  }
  return scores;
}

// Calculate evaluation results
function calculateResults(scores, criteria, maxRawScore, passingRawScore) {
  const rawScore = scores.reduce((sum, s) => sum + s, 0);
  const percentageScore = (rawScore / maxRawScore) * 100;
  const hasCriticalFail = scores.some((score, idx) =>
    criteria[idx]?.is_critical && score === 1
  );
  const isPassing = percentageScore >= (passingRawScore / maxRawScore * 100) && !hasCriticalFail;

  return {
    rawScore,
    percentageScore: Math.round(percentageScore * 100) / 100,
    finalScore: Math.round(percentageScore * 100) / 100,
    isPassing,
    hasCriticalFail
  };
}

async function clearData() {
  console.log('Clearing existing data (except users)...');

  // Delete in order due to foreign keys
  await pool.query('DELETE FROM evaluation_item_scores');
  await pool.query('DELETE FROM student_evaluations');
  await pool.query('DELETE FROM student_absences');
  await pool.query('DELETE FROM evaluation_criteria');
  await pool.query('DELETE FROM evaluation_subjects');
  await pool.query('DELETE FROM students');
  await pool.query('DELETE FROM instructors');

  console.log('  - Data cleared');
}

async function seedSubjectsAndCriteria() {
  console.log('Seeding evaluation subjects and criteria...');

  const subjectIds = {};
  const criteriaBySubject = {};

  for (const subject of evaluationSubjects) {
    const result = await pool.query(
      `INSERT INTO evaluation_subjects (name_he, code, max_raw_score, passing_raw_score, description_he, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [subject.name_he, subject.code, subject.max_raw_score, subject.passing_raw_score, subject.description_he, subject.display_order]
    );

    const subjectId = result.rows[0].id;
    subjectIds[subject.code] = subjectId;
    criteriaBySubject[subject.code] = [];

    // Insert criteria for this subject
    const criteria = evaluationCriteria[subject.code];
    if (criteria) {
      for (const criterion of criteria) {
        const critResult = await pool.query(
          `INSERT INTO evaluation_criteria (subject_id, name_he, description_he, display_order, is_critical)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [subjectId, criterion.name_he, criterion.description_he, criterion.display_order, criterion.is_critical]
        );
        criteriaBySubject[subject.code].push({
          id: critResult.rows[0].id,
          ...criterion
        });
      }
    }

    console.log(`  - Added subject: ${subject.name_he} with ${criteria?.length || 0} criteria`);
  }

  return { subjectIds, criteriaBySubject };
}

async function seedStudents() {
  console.log('Seeding demo students...');
  const studentIds = [];

  for (const student of demoStudents) {
    const result = await pool.query(
      `INSERT INTO students (first_name, last_name, email, phone, unit_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [student.first_name, student.last_name, student.email, student.phone, student.unit_id]
    );
    studentIds.push(result.rows[0].id);
    console.log(`  - Added student: ${student.first_name} ${student.last_name}`);
  }

  return studentIds;
}

async function seedInstructors() {
  console.log('Seeding demo instructors...');
  const instructorIds = [];

  for (const instructor of demoInstructors) {
    const result = await pool.query(
      `INSERT INTO instructors (first_name, last_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [instructor.first_name, instructor.last_name, instructor.email, instructor.phone]
    );
    instructorIds.push(result.rows[0].id);
    console.log(`  - Added instructor: ${instructor.first_name} ${instructor.last_name}`);
  }

  return instructorIds;
}

async function seedEvaluations(studentIds, instructorIds, subjectIds, criteriaBySubject) {
  console.log('Seeding demo evaluations...');

  const subjects = evaluationSubjects;
  let evalCount = 0;

  // For each student, create multiple evaluations
  for (let studentIdx = 0; studentIdx < studentIds.length; studentIdx++) {
    const studentId = studentIds[studentIdx];
    const studentName = demoStudents[studentIdx].first_name;

    // Create evaluations for different subjects and lessons
    for (const subject of subjects) {
      const subjectId = subjectIds[subject.code];
      const criteria = criteriaBySubject[subject.code];

      // Determine how many evaluations to create for this student/subject
      let numEvals = 1;
      let lessonNames = [null]; // Default: no lesson name

      if (subject.code === 'lecture_delivery') {
        // Create 2-4 class lesson evaluations with different lesson names
        numEvals = 2 + Math.floor(Math.random() * 3);
        lessonNames = classLessonNames.slice(0, numEvals);
      } else if (subject.code === 'water_lesson') {
        // Create 2-4 water lesson evaluations with different lesson names
        numEvals = 2 + Math.floor(Math.random() * 3);
        lessonNames = waterLessonNames.slice(0, numEvals);
      }

      for (let evalIdx = 0; evalIdx < numEvals; evalIdx++) {
        const instructorId = instructorIds[Math.floor(Math.random() * instructorIds.length)];
        const lessonName = lessonNames[evalIdx];

        // Generate scores
        const scores = generateScores(criteria.length);
        const results = calculateResults(scores, criteria, subject.max_raw_score, subject.passing_raw_score);

        // Create evaluation date (spread over past 2 months)
        const daysAgo = Math.floor(Math.random() * 60);
        const evalDate = new Date();
        evalDate.setDate(evalDate.getDate() - daysAgo);

        // Insert evaluation
        const evalResult = await pool.query(
          `INSERT INTO student_evaluations
           (student_id, subject_id, instructor_id, lesson_name, evaluation_date,
            raw_score, percentage_score, final_score, is_passing, has_critical_fail)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            studentId, subjectId, instructorId, lessonName, evalDate,
            results.rawScore, results.percentageScore, results.finalScore,
            results.isPassing, results.hasCriticalFail
          ]
        );

        const evaluationId = evalResult.rows[0].id;

        // Insert item scores
        for (let i = 0; i < scores.length; i++) {
          await pool.query(
            `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
             VALUES ($1, $2, $3)`,
            [evaluationId, criteria[i].id, scores[i]]
          );
        }

        evalCount++;

        if (lessonName) {
          console.log(`  - ${studentName}: ${subject.name_he} - ${lessonName} (${results.percentageScore}%)`);
        }
      }
    }
  }

  console.log(`  - Created ${evalCount} evaluations total`);
}

async function seedAbsences(studentIds) {
  console.log('Seeding demo absences...');

  // Create a few absences for some students
  const absenceCount = 8;

  for (let i = 0; i < absenceCount; i++) {
    const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
    const daysAgo = Math.floor(Math.random() * 45);
    const absenceDate = new Date();
    absenceDate.setDate(absenceDate.getDate() - daysAgo);

    const isExcused = Math.random() > 0.5;
    const reasons = ['מחלה', 'אילוץ משפחתי', 'תורנות', 'בעיה אישית'];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];

    await pool.query(
      `INSERT INTO student_absences (student_id, absence_date, reason, is_excused)
       VALUES ($1, $2, $3, $4)`,
      [studentId, absenceDate.toISOString().split('T')[0], reason, isExcused]
    );
  }

  console.log(`  - Created ${absenceCount} absence records`);
}

async function main() {
  try {
    console.log('=== Reset and Seed Demo Data ===\n');

    await clearData();

    const { subjectIds, criteriaBySubject } = await seedSubjectsAndCriteria();
    const studentIds = await seedStudents();
    const instructorIds = await seedInstructors();

    await seedEvaluations(studentIds, instructorIds, subjectIds, criteriaBySubject);
    await seedAbsences(studentIds);

    console.log('\n=== Demo data seeded successfully! ===');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
