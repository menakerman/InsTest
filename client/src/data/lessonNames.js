// Lesson names extracted from the course summary Excel file
// Row 3 = class lessons (כיתה), Row 4 = water lessons (מים)

export const classLessonNames = [
  'סביבה',
  'כללים',
  'סיכונים',
  'תכנון',
  'כללים 2',
  'סיכונים 2',
  'סיכונים 3',
  'כללים 3',
  'כ9',
  'כ10',
  'כ11',
  'כ12',
  'כ13'
];

export const waterLessonNames = [
  'קמ"ס',
  'סק\'-1',
  'סק\'-2',
  'סק\'-3',
  'סק\'-5',
  'קמ"ס 2',
  'סק\'-1 (2)',
  'סק\'-2 (2)',
  'סק\'-3 (2)',
  'סק\'-5 (2)',
  'מ11',
  'מ12',
  'מ13'
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

// Check if a subject has predefined lesson names
export function subjectHasLessonNames(subjectCode) {
  return subjectCode in subjectLessonType;
}

export default {
  classLessonNames,
  waterLessonNames,
  subjectLessonType,
  getLessonNamesForSubject,
  subjectHasLessonNames
};
