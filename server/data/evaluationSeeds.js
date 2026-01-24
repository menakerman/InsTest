// Evaluation subjects and criteria seed data based on Hebrew PDF forms
// Score values: 1=לא עבר (Fail), 4=בסיסי (Basic), 7=טוב (Good), 10=מצוין (Excellent)
// Items marked with is_critical=true: if scored 1, entire test fails

export const evaluationSubjects = [
  {
    code: 'intro_dive',
    name_he: 'צלילת הכרות',
    max_raw_score: 70,
    passing_raw_score: 40,
    description_he: 'הערכת צלילת הכרות - 7 קריטריונים',
    display_order: 1
  },
  {
    code: 'equipment_lesson',
    name_he: 'שיעור ציוד',
    max_raw_score: 110,
    passing_raw_score: 61, // 55% of 110
    description_he: 'הערכת שיעור ציוד - 4 חלקים',
    display_order: 2
  },
  {
    code: 'pre_dive_briefing',
    name_he: 'העברת תדריך לפני צלילה',
    max_raw_score: 70,
    passing_raw_score: 40,
    description_he: 'הערכת תדריך לפני צלילה - 7 קריטריונים',
    display_order: 3
  },
  {
    code: 'lecture_delivery',
    name_he: 'העברת הרצאה',
    max_raw_score: 110,
    passing_raw_score: 72, // 65% of 110
    description_he: 'הערכת העברת הרצאה - 4 חלקים',
    display_order: 4
  },
  {
    code: 'water_lesson',
    name_he: 'העברת שיעור מים',
    max_raw_score: 130,
    passing_raw_score: 78, // 60% of 130
    description_he: 'הערכת שיעור מים - 5 חלקים',
    display_order: 5
  }
];

export const evaluationCriteria = {
  // Evaluation 1: צלילת הכרות (Intro Dive) - 7 items
  intro_dive: [
    { name_he: 'הכנה והצגת הציוד', description_he: 'הכנת הציוד והצגתו לתלמיד', display_order: 1, is_critical: false },
    { name_he: 'הסברים ברורים', description_he: 'הסבר ברור ומובן של השלבים', display_order: 2, is_critical: false },
    { name_he: 'בדיקת ציוד עם התלמיד', description_he: 'ביצוע בדיקת ציוד יחד עם התלמיד', display_order: 3, is_critical: true },
    { name_he: 'כניסה למים ושליטה', description_he: 'כניסה בטוחה למים ושמירה על שליטה', display_order: 4, is_critical: true },
    { name_he: 'תקשורת מתחת למים', description_he: 'שימוש נכון בסימני יד ותקשורת', display_order: 5, is_critical: false },
    { name_he: 'שמירה על קשר עין', description_he: 'שמירה רציפה על קשר עין עם התלמיד', display_order: 6, is_critical: true },
    { name_he: 'יציאה בטוחה', description_he: 'יציאה מסודרת ובטוחה מהמים', display_order: 7, is_critical: false }
  ],

  // Evaluation 2: שיעור ציוד (Equipment Lesson) - 11 items in 4 sections
  equipment_lesson: [
    // Section 1: פתיחה (Opening)
    { name_he: 'פתיחה - הצגה עצמית', description_he: 'הצגה עצמית מקצועית', display_order: 1, is_critical: false },
    { name_he: 'פתיחה - הצגת מטרות השיעור', description_he: 'הצגה ברורה של מטרות השיעור', display_order: 2, is_critical: false },
    { name_he: 'פתיחה - יצירת עניין', description_he: 'יצירת מוטיבציה ועניין בנושא', display_order: 3, is_critical: false },

    // Section 2: גוף השיעור (Lesson Body)
    { name_he: 'גוף - ארגון והצגת הציוד', description_he: 'ארגון מסודר והצגה נכונה של הציוד', display_order: 4, is_critical: false },
    { name_he: 'גוף - הסברים מקצועיים', description_he: 'מתן הסברים מקצועיים ומדויקים', display_order: 5, is_critical: true },
    { name_he: 'גוף - הדגמה מעשית', description_he: 'הדגמה מעשית של השימוש בציוד', display_order: 6, is_critical: false },
    { name_he: 'גוף - מעורבות התלמידים', description_he: 'שיתוף והפעלת התלמידים', display_order: 7, is_critical: false },

    // Section 3: בטיחות (Safety)
    { name_he: 'בטיחות - הדגשת נקודות בטיחות', description_he: 'הדגשת נקודות בטיחות חיוניות', display_order: 8, is_critical: true },
    { name_he: 'בטיחות - תחזוקת ציוד', description_he: 'הסבר על תחזוקה נכונה של הציוד', display_order: 9, is_critical: false },

    // Section 4: סיכום (Summary)
    { name_he: 'סיכום - חזרה על נקודות מפתח', description_he: 'סיכום וחזרה על הנקודות העיקריות', display_order: 10, is_critical: false },
    { name_he: 'סיכום - מענה לשאלות', description_he: 'מענה לשאלות התלמידים', display_order: 11, is_critical: false }
  ],

  // Evaluation 3: תדריך לפני צלילה (Pre-Dive Briefing) - 7 items
  pre_dive_briefing: [
    { name_he: 'הצגת אתר הצלילה', description_he: 'תיאור ברור של אתר הצלילה ומאפייניו', display_order: 1, is_critical: false },
    { name_he: 'תנאי הצלילה', description_he: 'סקירת תנאי מזג האוויר והים', display_order: 2, is_critical: false },
    { name_he: 'תוכנית הצלילה', description_he: 'הצגת תוכנית הצלילה: עומק, זמן, מסלול', display_order: 3, is_critical: true },
    { name_he: 'נהלי חירום', description_he: 'סקירת נהלי חירום ונקודות יציאה', display_order: 4, is_critical: true },
    { name_he: 'חלוקת תפקידים', description_he: 'חלוקת תפקידים ברורה בין חברי הקבוצה', display_order: 5, is_critical: false },
    { name_he: 'בדיקת ציוד', description_he: 'הנחיות לבדיקת ציוד לפני הצלילה', display_order: 6, is_critical: true },
    { name_he: 'סימנים ותקשורת', description_he: 'סקירת סימני יד ואמצעי תקשורת', display_order: 7, is_critical: false }
  ],

  // Evaluation 4: העברת הרצאה (Lecture Delivery) - 11 items in 4 sections
  lecture_delivery: [
    // Section 1: פתיחה (Opening)
    { name_he: 'פתיחה - משיכת תשומת לב', description_he: 'פתיחה חזקה שמושכת תשומת לב', display_order: 1, is_critical: false },
    { name_he: 'פתיחה - הצגת הנושא', description_he: 'הצגה ברורה של נושא ההרצאה', display_order: 2, is_critical: false },
    { name_he: 'פתיחה - מטרות למידה', description_he: 'הגדרת מטרות הלמידה', display_order: 3, is_critical: false },

    // Section 2: תוכן (Content)
    { name_he: 'תוכן - ארגון לוגי', description_he: 'ארגון לוגי ורציף של החומר', display_order: 4, is_critical: false },
    { name_he: 'תוכן - דיוק מקצועי', description_he: 'דיוק מקצועי בתוכן המועבר', display_order: 5, is_critical: true },
    { name_he: 'תוכן - שימוש בדוגמאות', description_he: 'שימוש בדוגמאות והמחשות', display_order: 6, is_critical: false },
    { name_he: 'תוכן - עזרי הוראה', description_he: 'שימוש יעיל בעזרי הוראה', display_order: 7, is_critical: false },

    // Section 3: העברה (Delivery)
    { name_he: 'העברה - שפת גוף', description_he: 'שפת גוף פתוחה ומזמינה', display_order: 8, is_critical: false },
    { name_he: 'העברה - קשר עין', description_he: 'שמירה על קשר עין עם הקהל', display_order: 9, is_critical: false },
    { name_he: 'העברה - קול ודיקציה', description_he: 'קול ברור ודיקציה טובה', display_order: 10, is_critical: false },

    // Section 4: סיכום (Summary)
    { name_he: 'סיכום - חזרה על נקודות מפתח', description_he: 'סיכום הנקודות העיקריות', display_order: 11, is_critical: false }
  ],

  // Evaluation 5: שיעור מים (Water Lesson) - 13 items in 5 sections
  water_lesson: [
    // Section 1: הכנה (Preparation)
    { name_he: 'הכנה - בדיקת אתר', description_he: 'בדיקת האתר לפני השיעור', display_order: 1, is_critical: false },
    { name_he: 'הכנה - סידור ציוד', description_he: 'סידור הציוד באופן מאורגן', display_order: 2, is_critical: false },
    { name_he: 'הכנה - תדריך יבשה', description_he: 'תדריך מקדים ביבשה', display_order: 3, is_critical: false },

    // Section 2: הדגמה (Demonstration)
    { name_he: 'הדגמה - ביצוע נכון', description_he: 'הדגמה נכונה של המיומנות', display_order: 4, is_critical: true },
    { name_he: 'הדגמה - מיקום נכון', description_he: 'מיקום נכון ביחס לתלמידים', display_order: 5, is_critical: false },
    { name_he: 'הדגמה - קצב מתאים', description_he: 'קצב הדגמה מתאים להבנה', display_order: 6, is_critical: false },

    // Section 3: תרגול (Practice)
    { name_he: 'תרגול - הנחיות ברורות', description_he: 'מתן הנחיות ברורות לתרגול', display_order: 7, is_critical: false },
    { name_he: 'תרגול - מעקב אחר התלמידים', description_he: 'מעקב רציף אחר ביצוע התלמידים', display_order: 8, is_critical: true },
    { name_he: 'תרגול - משוב מיידי', description_he: 'מתן משוב מיידי ובונה', display_order: 9, is_critical: false },

    // Section 4: בטיחות (Safety)
    { name_he: 'בטיחות - מודעות מתמדת', description_he: 'מודעות מתמדת לסביבה ולתלמידים', display_order: 10, is_critical: true },
    { name_he: 'בטיחות - שליטה בקבוצה', description_he: 'שליטה ובקרה על הקבוצה', display_order: 11, is_critical: true },

    // Section 5: סיום (Closing)
    { name_he: 'סיום - סיכום במים', description_he: 'סיכום קצר במים', display_order: 12, is_critical: false },
    { name_he: 'סיום - תחקיר ביבשה', description_he: 'תחקיר מסכם ביבשה', display_order: 13, is_critical: false }
  ]
};

export default { evaluationSubjects, evaluationCriteria };
