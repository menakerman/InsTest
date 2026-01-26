import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Lessons to evaluate
const classLessonsToEvaluate = [
  'צלילת הכירות',
  'סיכונים בירידה',
  'סיכונים בשהיה',
  'סיכונים בעליה',
  'כללי התנהגות 1',
];

const waterLessonsToEvaluate = [
  'סקובה 1',
  'סקובה 2',
  'סקובה 3',
  'סקובה 4',
  'סקובה 5',
  'קמס 1',
];

// Score generation - biased towards passing
function getRandomScore() {
  const rand = Math.random();
  if (rand < 0.05) return 1;      // 5% fail
  if (rand < 0.15) return 4;      // 10% basic
  if (rand < 0.55) return 7;      // 40% good
  return 10;                       // 45% excellent
}

function calculateResults(scores, criteria, maxRawScore, passingRawScore) {
  const rawScore = scores.reduce((sum, s) => sum + s, 0);
  const percentageScore = (rawScore / maxRawScore) * 100;
  const hasCriticalFail = scores.some((score, idx) =>
    criteria[idx]?.is_critical && score === 1
  );
  const passingPercentage = (passingRawScore / maxRawScore) * 100;
  const isPassing = percentageScore >= passingPercentage && !hasCriticalFail;

  return {
    rawScore,
    percentageScore: Math.round(percentageScore * 100) / 100,
    isPassing,
    hasCriticalFail
  };
}

async function addEvaluations() {
  const client = await pool.connect();

  try {
    console.log('=== Adding Evaluations ===\n');

    // Get all students
    const studentsResult = await client.query(
      `SELECT id, first_name, last_name FROM students ORDER BY id`
    );
    const students = studentsResult.rows;
    console.log(`Found ${students.length} students\n`);

    // Get instructor
    const instructorResult = await client.query(
      `SELECT id FROM instructors LIMIT 1`
    );
    const instructorId = instructorResult.rows[0]?.id;

    // Get course
    const courseResult = await client.query(
      `SELECT id, name FROM courses LIMIT 1`
    );
    const course = courseResult.rows[0];

    // Get lecture_delivery subject and criteria
    const lectureSubjectResult = await client.query(
      `SELECT * FROM evaluation_subjects WHERE code = 'lecture_delivery'`
    );
    const lectureSubject = lectureSubjectResult.rows[0];

    const lectureCriteriaResult = await client.query(
      `SELECT * FROM evaluation_criteria WHERE subject_id = $1 ORDER BY display_order`,
      [lectureSubject.id]
    );
    const lectureCriteria = lectureCriteriaResult.rows;

    // Get water_lesson subject and criteria
    const waterSubjectResult = await client.query(
      `SELECT * FROM evaluation_subjects WHERE code = 'water_lesson'`
    );
    const waterSubject = waterSubjectResult.rows[0];

    const waterCriteriaResult = await client.query(
      `SELECT * FROM evaluation_criteria WHERE subject_id = $1 ORDER BY display_order`,
      [waterSubject.id]
    );
    const waterCriteria = waterCriteriaResult.rows;

    let evalCount = 0;

    // For each student
    for (const student of students) {
      console.log(`\n${student.first_name} ${student.last_name}:`);

      // Add 5 class lesson evaluations
      console.log('  Class lessons:');
      for (let i = 0; i < classLessonsToEvaluate.length; i++) {
        const lessonName = classLessonsToEvaluate[i];
        const scores = lectureCriteria.map(() => getRandomScore());
        const results = calculateResults(scores, lectureCriteria, lectureSubject.max_raw_score, lectureSubject.passing_raw_score);

        // Create evaluation date (spread over past weeks)
        const evalDate = new Date();
        evalDate.setDate(evalDate.getDate() - (classLessonsToEvaluate.length - i) * 3);

        const evalResult = await client.query(
          `INSERT INTO student_evaluations
           (student_id, subject_id, instructor_id, course_name, lesson_name, evaluation_date,
            raw_score, percentage_score, final_score, is_passing, has_critical_fail)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [
            student.id, lectureSubject.id, instructorId, course.name, lessonName, evalDate,
            results.rawScore, results.percentageScore, results.percentageScore,
            results.isPassing, results.hasCriticalFail
          ]
        );

        const evaluationId = evalResult.rows[0].id;

        // Insert item scores
        for (let j = 0; j < scores.length; j++) {
          await client.query(
            `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
             VALUES ($1, $2, $3)`,
            [evaluationId, lectureCriteria[j].id, scores[j]]
          );
        }

        const status = results.isPassing ? '✓' : '✗';
        console.log(`    ${status} ${lessonName}: ${results.percentageScore.toFixed(0)}%`);
        evalCount++;
      }

      // Add 6 water lesson evaluations
      console.log('  Water lessons:');
      for (let i = 0; i < waterLessonsToEvaluate.length; i++) {
        const lessonName = waterLessonsToEvaluate[i];
        const scores = waterCriteria.map(() => getRandomScore());
        const results = calculateResults(scores, waterCriteria, waterSubject.max_raw_score, waterSubject.passing_raw_score);

        // Create evaluation date
        const evalDate = new Date();
        evalDate.setDate(evalDate.getDate() - (waterLessonsToEvaluate.length - i) * 2);

        const evalResult = await client.query(
          `INSERT INTO student_evaluations
           (student_id, subject_id, instructor_id, course_name, lesson_name, evaluation_date,
            raw_score, percentage_score, final_score, is_passing, has_critical_fail)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [
            student.id, waterSubject.id, instructorId, course.name, lessonName, evalDate,
            results.rawScore, results.percentageScore, results.percentageScore,
            results.isPassing, results.hasCriticalFail
          ]
        );

        const evaluationId = evalResult.rows[0].id;

        // Insert item scores
        for (let j = 0; j < scores.length; j++) {
          await client.query(
            `INSERT INTO evaluation_item_scores (evaluation_id, criterion_id, score)
             VALUES ($1, $2, $3)`,
            [evaluationId, waterCriteria[j].id, scores[j]]
          );
        }

        const status = results.isPassing ? '✓' : '✗';
        console.log(`    ${status} ${lessonName}: ${results.percentageScore.toFixed(0)}%`);
        evalCount++;
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total evaluations created: ${evalCount}`);
    console.log(`  - ${students.length * classLessonsToEvaluate.length} class lesson evaluations`);
    console.log(`  - ${students.length * waterLessonsToEvaluate.length} water lesson evaluations`);
    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addEvaluations();
