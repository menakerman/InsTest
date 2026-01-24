import ExcelJS from 'exceljs';

// Hebrew month names for formatting
const hebrewMonths = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

/**
 * Format date to Hebrew month-year format
 */
function formatDateHebrew(date) {
  const d = new Date(date);
  return `${hebrewMonths[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Get course info from evaluations data
 */
function deriveCourseInfo(evaluations) {
  if (!evaluations || evaluations.length === 0) {
    return { name: 'קורס מדריכי צלילה', date: formatDateHebrew(new Date()) };
  }

  // Most common course name
  const courseNames = evaluations.map(e => e.course_name).filter(Boolean);
  const nameCount = {};
  courseNames.forEach(name => {
    nameCount[name] = (nameCount[name] || 0) + 1;
  });
  const mostCommonName = Object.keys(nameCount).sort((a, b) => nameCount[b] - nameCount[a])[0];

  // Earliest evaluation date
  const dates = evaluations.map(e => new Date(e.evaluation_date)).filter(d => !isNaN(d));
  const earliestDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();

  return {
    name: mostCommonName || 'קורס מדריכי צלילה',
    date: formatDateHebrew(earliestDate)
  };
}

/**
 * Create Sheet 1: Course metadata
 */
function createCourseSheet(workbook, courseInfo) {
  const sheet = workbook.addWorksheet('קורס', {
    views: [{ rightToLeft: true }]
  });

  // Header
  sheet.getCell('A1').value = 'פרטי הקורס';
  sheet.getCell('A1').font = { bold: true, size: 16 };

  // Course name
  sheet.getCell('A3').value = 'שם הקורס:';
  sheet.getCell('A3').font = { bold: true };
  sheet.getCell('B3').value = courseInfo.name;

  // Course date
  sheet.getCell('A4').value = 'תאריך:';
  sheet.getCell('A4').font = { bold: true };
  sheet.getCell('B4').value = courseInfo.date;

  // Column widths
  sheet.getColumn('A').width = 15;
  sheet.getColumn('B').width = 30;

  return sheet;
}

/**
 * Create Sheet 2: Main settings with passing thresholds
 */
function createMainSheet(workbook, subjects) {
  const sheet = workbook.addWorksheet('ראשי', {
    views: [{ rightToLeft: true }]
  });

  // Header
  sheet.getCell('A1').value = 'הגדרות ציון מעבר';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  // Headers row
  sheet.getCell('A3').value = 'נושא הערכה';
  sheet.getCell('B3').value = 'ציון מקסימלי';
  sheet.getCell('C3').value = 'ציון מעבר';
  sheet.getCell('D3').value = 'אחוז מעבר';

  const headerRow = sheet.getRow(3);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Subject rows
  subjects.forEach((subject, index) => {
    const row = index + 4;
    sheet.getCell(`A${row}`).value = subject.name_he;
    sheet.getCell(`B${row}`).value = subject.max_raw_score;
    sheet.getCell(`C${row}`).value = subject.passing_raw_score;
    sheet.getCell(`D${row}`).value = Math.round((subject.passing_raw_score / subject.max_raw_score) * 100) + '%';
  });

  // Column widths
  sheet.getColumn('A').width = 25;
  sheet.getColumn('B').width = 15;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 12;

  return sheet;
}

/**
 * Create Sheet 3: Absences tracking
 */
function createAbsencesSheet(workbook, students, absences) {
  const sheet = workbook.addWorksheet('העדרויות', {
    views: [{ rightToLeft: true }]
  });

  // Header
  sheet.getCell('A1').value = 'ריכוז העדרויות';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  if (!absences || absences.length === 0) {
    sheet.getCell('A3').value = 'אין רשומות העדרות';
    return sheet;
  }

  // Get unique dates sorted
  const uniqueDates = [...new Set(absences.map(a => a.absence_date))].sort();

  // Headers row
  sheet.getCell('A3').value = 'שם התלמיד';
  uniqueDates.forEach((date, index) => {
    const col = String.fromCharCode(66 + index); // B, C, D...
    const formattedDate = new Date(date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    sheet.getCell(`${col}3`).value = formattedDate;
    sheet.getColumn(col).width = 10;
  });

  const headerRow = sheet.getRow(3);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Student rows
  students.forEach((student, studentIndex) => {
    const row = studentIndex + 4;
    sheet.getCell(`A${row}`).value = `${student.first_name} ${student.last_name}`;

    uniqueDates.forEach((date, dateIndex) => {
      const col = String.fromCharCode(66 + dateIndex);
      const absence = absences.find(a =>
        a.student_id === student.id && a.absence_date === date
      );

      if (absence) {
        sheet.getCell(`${col}${row}`).value = absence.is_excused ? 'מ' : 'ח';
        sheet.getCell(`${col}${row}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: absence.is_excused ? 'FFFFEB9C' : 'FFFFC7CE' }
        };
      }
    });
  });

  // Column widths
  sheet.getColumn('A').width = 20;

  // Add legend
  const legendRow = students.length + 6;
  sheet.getCell(`A${legendRow}`).value = 'מקרא:';
  sheet.getCell(`A${legendRow}`).font = { bold: true };
  sheet.getCell(`A${legendRow + 1}`).value = 'ח = חיסור';
  sheet.getCell(`A${legendRow + 2}`).value = 'מ = חיסור מאושר';

  return sheet;
}

/**
 * Create Sheet 4: Exams matrix (Students × 5 Subjects)
 */
function createExamsSheet(workbook, students, evaluations, subjects) {
  const sheet = workbook.addWorksheet('מבחנים', {
    views: [{ rightToLeft: true }]
  });

  // Header
  sheet.getCell('A1').value = 'ריכוז מבחנים';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  // Headers row - student name + 5 subjects
  sheet.getCell('A3').value = 'שם התלמיד';
  subjects.forEach((subject, index) => {
    const col = String.fromCharCode(66 + index); // B, C, D, E, F
    sheet.getCell(`${col}3`).value = subject.name_he;
    sheet.getColumn(col).width = 18;
  });

  const headerRow = sheet.getRow(3);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Student rows
  students.forEach((student, studentIndex) => {
    const row = studentIndex + 4;
    sheet.getCell(`A${row}`).value = `${student.first_name} ${student.last_name}`;

    subjects.forEach((subject, subjectIndex) => {
      const col = String.fromCharCode(66 + subjectIndex);

      // Find the most recent evaluation for this student/subject
      const studentEvals = evaluations.filter(e =>
        e.student_id === student.id && e.subject_id === subject.id
      );

      if (studentEvals.length > 0) {
        // Sort by date desc and take most recent
        const latestEval = studentEvals.sort((a, b) =>
          new Date(b.evaluation_date) - new Date(a.evaluation_date)
        )[0];

        const passed = latestEval.is_passing && !latestEval.has_critical_fail;
        const cell = sheet.getCell(`${col}${row}`);
        cell.value = passed ? 'V' : 'X';
        cell.alignment = { horizontal: 'center' };
        cell.font = {
          bold: true,
          color: { argb: passed ? 'FF008000' : 'FFFF0000' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: passed ? 'FFC6EFCE' : 'FFFFC7CE' }
        };
      } else {
        sheet.getCell(`${col}${row}`).value = '-';
        sheet.getCell(`${col}${row}`).alignment = { horizontal: 'center' };
      }
    });
  });

  // Column widths
  sheet.getColumn('A').width = 20;

  // Add summary row
  const summaryRow = students.length + 5;
  sheet.getCell(`A${summaryRow}`).value = 'סה"כ עברו:';
  sheet.getCell(`A${summaryRow}`).font = { bold: true };

  subjects.forEach((subject, subjectIndex) => {
    const col = String.fromCharCode(66 + subjectIndex);
    const passedCount = students.filter(student => {
      const studentEvals = evaluations.filter(e =>
        e.student_id === student.id && e.subject_id === subject.id
      );
      if (studentEvals.length === 0) return false;
      const latestEval = studentEvals.sort((a, b) =>
        new Date(b.evaluation_date) - new Date(a.evaluation_date)
      )[0];
      return latestEval.is_passing && !latestEval.has_critical_fail;
    }).length;

    sheet.getCell(`${col}${summaryRow}`).value = `${passedCount}/${students.length}`;
    sheet.getCell(`${col}${summaryRow}`).font = { bold: true };
    sheet.getCell(`${col}${summaryRow}`).alignment = { horizontal: 'center' };
  });

  return sheet;
}

/**
 * Create individual student sheet with progress data and chart
 */
function createStudentSheet(workbook, student, evaluations, subjects, absences) {
  const sheetName = `${student.first_name} ${student.last_name}`.substring(0, 31);
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ rightToLeft: true }]
  });

  // Student header
  sheet.getCell('A1').value = `כרטיס תלמיד: ${student.first_name} ${student.last_name}`;
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.mergeCells('A1:F1');

  // Student info
  sheet.getCell('A2').value = 'אימייל:';
  sheet.getCell('B2').value = student.email;
  sheet.getCell('A3').value = 'טלפון:';
  sheet.getCell('B3').value = student.phone || '-';
  sheet.getCell('A4').value = 'יחידה:';
  sheet.getCell('B4').value = student.unit_id || '-';

  // Row 6: Passing threshold line (for chart reference)
  sheet.getCell('A6').value = 'ציון מעבר:';
  sheet.getCell('A6').font = { bold: true };

  // Fill passing threshold (60%) across columns for chart
  for (let i = 0; i < 10; i++) {
    const col = String.fromCharCode(66 + i); // B through K
    sheet.getCell(`${col}6`).value = 60;
  }

  // Row 8: Section header for evaluations
  sheet.getCell('A8').value = 'הערכות לפי נושא';
  sheet.getCell('A8').font = { bold: true, size: 12 };

  // Get student evaluations
  const studentEvals = evaluations.filter(e => e.student_id === student.id);

  // Headers for evaluations table
  sheet.getCell('A10').value = 'נושא';
  sheet.getCell('B10').value = 'תאריך';
  sheet.getCell('C10').value = 'ציון גולמי';
  sheet.getCell('D10').value = 'אחוז';
  sheet.getCell('E10').value = 'סטטוס';
  sheet.getCell('F10').value = 'מדריך';

  const evalHeaderRow = sheet.getRow(10);
  evalHeaderRow.font = { bold: true };
  evalHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Evaluation rows grouped by subject
  let currentRow = 11;
  subjects.forEach(subject => {
    const subjectEvals = studentEvals
      .filter(e => e.subject_id === subject.id)
      .sort((a, b) => new Date(a.evaluation_date) - new Date(b.evaluation_date));

    subjectEvals.forEach(evalItem => {
      sheet.getCell(`A${currentRow}`).value = subject.name_he;
      sheet.getCell(`B${currentRow}`).value = new Date(evalItem.evaluation_date)
        .toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      sheet.getCell(`C${currentRow}`).value = evalItem.raw_score;
      sheet.getCell(`D${currentRow}`).value = Math.round(evalItem.percentage_score) + '%';

      const passed = evalItem.is_passing && !evalItem.has_critical_fail;
      const statusCell = sheet.getCell(`E${currentRow}`);
      statusCell.value = passed ? 'עבר' : 'נכשל';
      statusCell.font = { color: { argb: passed ? 'FF008000' : 'FFFF0000' } };
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: passed ? 'FFC6EFCE' : 'FFFFC7CE' }
      };

      sheet.getCell(`F${currentRow}`).value = evalItem.instructor_first_name
        ? `${evalItem.instructor_first_name} ${evalItem.instructor_last_name || ''}`
        : '-';

      currentRow++;
    });
  });

  // Add absences section
  const absenceStartRow = currentRow + 2;
  sheet.getCell(`A${absenceStartRow}`).value = 'העדרויות';
  sheet.getCell(`A${absenceStartRow}`).font = { bold: true, size: 12 };

  const studentAbsences = absences.filter(a => a.student_id === student.id);
  if (studentAbsences.length === 0) {
    sheet.getCell(`A${absenceStartRow + 1}`).value = 'אין העדרויות רשומות';
  } else {
    sheet.getCell(`A${absenceStartRow + 2}`).value = 'תאריך';
    sheet.getCell(`B${absenceStartRow + 2}`).value = 'סיבה';
    sheet.getCell(`C${absenceStartRow + 2}`).value = 'סטטוס';
    const absHeaderRow = sheet.getRow(absenceStartRow + 2);
    absHeaderRow.font = { bold: true };

    studentAbsences.forEach((absence, index) => {
      const row = absenceStartRow + 3 + index;
      sheet.getCell(`A${row}`).value = new Date(absence.absence_date)
        .toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
      sheet.getCell(`B${row}`).value = absence.reason || '-';
      sheet.getCell(`C${row}`).value = absence.is_excused ? 'מאושר' : 'לא מאושר';
    });
  }

  // Summary section
  const summaryRow = absenceStartRow + Math.max(4, studentAbsences.length + 4);
  sheet.getCell(`A${summaryRow}`).value = 'סיכום';
  sheet.getCell(`A${summaryRow}`).font = { bold: true, size: 12 };

  const passedSubjects = subjects.filter(subject => {
    const subjectEvals = studentEvals.filter(e => e.subject_id === subject.id);
    if (subjectEvals.length === 0) return false;
    const latestEval = subjectEvals.sort((a, b) =>
      new Date(b.evaluation_date) - new Date(a.evaluation_date)
    )[0];
    return latestEval.is_passing && !latestEval.has_critical_fail;
  });

  sheet.getCell(`A${summaryRow + 1}`).value = 'נושאים שעברו:';
  sheet.getCell(`B${summaryRow + 1}`).value = `${passedSubjects.length} / ${subjects.length}`;
  sheet.getCell(`A${summaryRow + 2}`).value = 'סה"כ העדרויות:';
  sheet.getCell(`B${summaryRow + 2}`).value = studentAbsences.length;
  sheet.getCell(`A${summaryRow + 3}`).value = 'סטטוס כללי:';

  const overallPassed = passedSubjects.length === subjects.length;
  const statusCell = sheet.getCell(`B${summaryRow + 3}`);
  statusCell.value = overallPassed ? 'עבר את הקורס' : 'בתהליך';
  statusCell.font = {
    bold: true,
    color: { argb: overallPassed ? 'FF008000' : 'FFFF6600' }
  };

  // Column widths
  sheet.getColumn('A').width = 20;
  sheet.getColumn('B').width = 15;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 10;
  sheet.getColumn('E').width = 10;
  sheet.getColumn('F').width = 20;

  // Add progress chart data for evaluation scores
  // Prepare data for chart - scores over time per subject type
  const chartDataRow = summaryRow + 6;
  sheet.getCell(`A${chartDataRow}`).value = 'נתוני גרף התקדמות';
  sheet.getCell(`A${chartDataRow}`).font = { bold: true };

  // Class-based lessons (subjects 1-4)
  const classSubjects = subjects.slice(0, 4);
  const waterSubject = subjects[4]; // water_lesson

  sheet.getCell(`A${chartDataRow + 1}`).value = 'ציוני כיתה';
  sheet.getCell(`A${chartDataRow + 2}`).value = 'ציוני מים';
  sheet.getCell(`A${chartDataRow + 3}`).value = 'ציון מעבר';

  // Get class-based evaluation scores chronologically
  const classEvals = studentEvals
    .filter(e => classSubjects.some(s => s.id === e.subject_id))
    .sort((a, b) => new Date(a.evaluation_date) - new Date(b.evaluation_date));

  const waterEvals = studentEvals
    .filter(e => waterSubject && e.subject_id === waterSubject.id)
    .sort((a, b) => new Date(a.evaluation_date) - new Date(b.evaluation_date));

  // Fill in score data
  classEvals.forEach((evalItem, index) => {
    const col = String.fromCharCode(66 + index); // B, C, D...
    sheet.getCell(`${col}${chartDataRow + 1}`).value = Math.round(evalItem.percentage_score);
  });

  waterEvals.forEach((evalItem, index) => {
    const col = String.fromCharCode(66 + index);
    sheet.getCell(`${col}${chartDataRow + 2}`).value = Math.round(evalItem.percentage_score);
  });

  // Fill passing threshold line
  const maxEvals = Math.max(classEvals.length, waterEvals.length, 5);
  for (let i = 0; i < maxEvals; i++) {
    const col = String.fromCharCode(66 + i);
    sheet.getCell(`${col}${chartDataRow + 3}`).value = 60;
  }

  return sheet;
}

/**
 * Main function to generate the final report
 */
export async function generateFinalReport(pool) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InsTest';
  workbook.created = new Date();

  // Fetch all required data
  const [
    studentsResult,
    subjectsResult,
    evaluationsResult,
    absencesResult
  ] = await Promise.all([
    pool.query('SELECT * FROM students ORDER BY last_name, first_name'),
    pool.query('SELECT * FROM evaluation_subjects ORDER BY display_order'),
    pool.query(`
      SELECT
        se.*,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        i.first_name as instructor_first_name,
        i.last_name as instructor_last_name,
        es.name_he as subject_name,
        es.code as subject_code
      FROM student_evaluations se
      LEFT JOIN students s ON se.student_id = s.id
      LEFT JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN evaluation_subjects es ON se.subject_id = es.id
      ORDER BY se.evaluation_date DESC
    `),
    pool.query('SELECT * FROM student_absences ORDER BY absence_date DESC')
  ]);

  const students = studentsResult.rows;
  const subjects = subjectsResult.rows;
  const evaluations = evaluationsResult.rows;
  const absences = absencesResult.rows;

  // Derive course info
  const courseInfo = deriveCourseInfo(evaluations);

  // Create all sheets
  createCourseSheet(workbook, courseInfo);
  createMainSheet(workbook, subjects);
  createAbsencesSheet(workbook, students, absences);
  createExamsSheet(workbook, students, evaluations, subjects);

  // Create individual student sheets
  for (const student of students) {
    createStudentSheet(workbook, student, evaluations, subjects, absences);
  }

  return workbook;
}

export default { generateFinalReport };
