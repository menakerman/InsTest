// External Tests Calculations Utility Functions

export const EXTERNAL_TESTS_PASSING_THRESHOLD = 80;

export const INSTRUCTOR_COURSE_TYPES = ['מדריך', 'מדריך_עוזר_משולב_עם_מדריך'];

// Test name mappings for display
const TEST_NAMES = {
  physics_score: 'פיזיקה',
  physiology_score: 'פיזיולוגיה',
  eye_contact_score: 'קשר עין',
  equipment_score: 'ציוד',
  decompression_score: 'דקומפרסיה'
};

/**
 * Check if student is in an instructor course
 * @param {Array} courses - Array of course objects with course_type property
 * @returns {boolean} - true if student is in instructor course
 */
export function isInInstructorCourse(courses) {
  if (!courses || !Array.isArray(courses)) return false;
  return courses.some(course =>
    course.course_type && INSTRUCTOR_COURSE_TYPES.includes(course.course_type)
  );
}

/**
 * Get status color based on average score
 * @param {number|null} average - The average score
 * @returns {string} - CSS color class ('green' or 'red')
 */
export function getExternalTestsStatusColor(average) {
  if (average === null || average === undefined) return '';
  return average >= EXTERNAL_TESTS_PASSING_THRESHOLD ? 'green' : 'red';
}

/**
 * Get status text based on average score
 * @param {number|null} average - The average score
 * @returns {string} - Status text in Hebrew ('עבר' or 'נכשל')
 */
export function getExternalTestsStatusText(average) {
  if (average === null || average === undefined) return '';
  return average >= EXTERNAL_TESTS_PASSING_THRESHOLD ? 'עבר' : 'נכשל';
}

/**
 * Calculate retake recommendations to improve average to pass threshold
 * @param {Object} tests - Object with test scores { physics_score, physiology_score, etc. }
 * @returns {Array} - Array of recommendation objects or empty array if no recommendations needed
 */
export function calculateRetakeRecommendations(tests) {
  // Get all entered scores
  const enteredTests = [];
  Object.entries(tests).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      enteredTests.push({
        testKey: key,
        testName: TEST_NAMES[key] || key,
        currentScore: parseFloat(value)
      });
    }
  });

  // If no tests entered, return empty
  if (enteredTests.length === 0) return [];

  // Calculate current average
  const currentSum = enteredTests.reduce((sum, test) => sum + test.currentScore, 0);
  const currentAverage = currentSum / enteredTests.length;

  // If already passing, no recommendations needed
  if (currentAverage >= EXTERNAL_TESTS_PASSING_THRESHOLD) return [];

  // Calculate points needed to reach threshold
  const targetSum = EXTERNAL_TESTS_PASSING_THRESHOLD * enteredTests.length;
  let pointsNeeded = targetSum - currentSum;

  // Sort by lowest score (most room for improvement)
  const sortedTests = [...enteredTests].sort((a, b) => a.currentScore - b.currentScore);

  const recommendations = [];

  for (const test of sortedTests) {
    if (pointsNeeded <= 0) break;

    // Maximum possible improvement (can't go above 100)
    const maxPossibleScore = 100;
    const maxImprovement = maxPossibleScore - test.currentScore;

    // Skip if already at 100
    if (maxImprovement <= 0) continue;

    // Calculate needed improvement for this test
    const neededImprovement = Math.min(maxImprovement, pointsNeeded);
    const targetScore = Math.ceil(test.currentScore + neededImprovement);

    recommendations.push({
      testName: test.testName,
      currentScore: test.currentScore,
      targetScore: Math.min(targetScore, 100),
      improvement: Math.ceil(neededImprovement)
    });

    pointsNeeded -= neededImprovement;
  }

  return recommendations;
}
