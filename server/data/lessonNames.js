// Lesson names extracted from the course summary Excel file
// Row 3 = class lessons (כיתה), Row 4 = water lessons (מים)

export const classLessonNames = [
  'סביבה',
  'כללי התנהגות',
  'סיכונים',
  'תכנון',
  'כללי התנהגות 2',
  'סיכונים 2',
  'סיכונים 3',
  'כללי התנהגות 3',
  'כ9',
  'כ10',
  'כ11',
  'כ12',
  'כ13'
];

export const waterLessonNames = [
  'קמ"ס',
  'סקובה-1',
  'סקובה-2',
  'סקובה-3',
  'סקובה-5',
  'קמ"ס 2',
  'סקובה-1 (2)',
  'סקובה-2 (2)',
  'סקובה-3 (2)',
  'סקובה-5 (2)',
  'מ11',
  'מ12',
  'מ13'
];

// Criteria items for class lessons (from PDF page 4 - העברת הרצאה)
export const classLessonCriteria = [
  { id: 1, name: 'מוכנות לשיעור', section: 'מוכנות' },
  { id: 2, name: 'קשר - מבוא', section: 'מבוא' },
  { id: 3, name: 'נושאי הלימוד ומטרות', section: 'מבוא' },
  { id: 4, name: 'דגשים ומסרים הכרחיים להעברה', section: 'גוף ההרצאה' },
  { id: 5, name: 'סדר והגיון בהעברת המידע', section: 'גוף ההרצאה' },
  { id: 6, name: 'הקנית מיומנויות, ועזרי לימוד', section: 'גוף ההרצאה' },
  { id: 7, name: 'הערכה ו"תיקון או חיזוק"', section: 'גוף ההרצאה' },
  { id: 8, name: 'סיכום', section: 'סיכום' }
];

// Criteria items for water lessons (from PDF page 5 - העברת שיעור מים)
export const waterLessonCriteria = [
  { id: 1, name: 'תדריך', section: 'תדריך' },
  { id: 2, name: 'הדגמה', section: 'הדגמה' },
  { id: 3, name: 'פתרון בעיות - תרגול', section: 'תרגול' },
  { id: 4, name: 'הערכה ו"תיקון או חיזוק"', section: 'תרגול' },
  { id: 5, name: 'סיכום', section: 'סיכום' },
  { id: 6, name: 'שליטה והובלה', section: 'שליטה' }
];

// Map subject codes to their lesson type
export const subjectLessonType = {
  'lecture_delivery': 'class',    // העברת הרצאה - page 4
  'water_lesson': 'water'         // העברת שיעור מים - page 5
};

// Get lesson names for a given subject code
export function getLessonNamesForSubject(subjectCode) {
  const lessonType = subjectLessonType[subjectCode];
  if (lessonType === 'class') {
    return classLessonNames;
  } else if (lessonType === 'water') {
    return waterLessonNames;
  }
  return null;
}

// Get criteria items for a lesson type
export function getCriteriaForLessonType(lessonType) {
  if (lessonType === 'class') {
    return classLessonCriteria;
  } else if (lessonType === 'water') {
    return waterLessonCriteria;
  }
  return [];
}

export default {
  classLessonNames,
  waterLessonNames,
  classLessonCriteria,
  waterLessonCriteria,
  subjectLessonType,
  getLessonNamesForSubject,
  getCriteriaForLessonType
};
