import ExcelJS from 'exceljs';
import {
  classLessonNames,
  waterLessonNames,
  classLessonCriteria,
  waterLessonCriteria
} from '../data/lessonNames.js';

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
function createExamsSheet(workbook, students, evaluations, subjects, externalTests) {
  const sheet = workbook.addWorksheet('מבחנים', {
    views: [{ rightToLeft: true }]
  });

  // External test definitions
  const externalTestDefs = [
    { key: 'physics_score', label: 'פיזיקה' },
    { key: 'physiology_score', label: 'פיזיולוגיה' },
    { key: 'eye_contact_score', label: 'קשר עין' },
    { key: 'equipment_score', label: 'ציוד' },
    { key: 'decompression_score', label: 'דקומפרסיה' }
  ];

  // Header
  sheet.getCell('A1').value = 'ריכוז מבחנים';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  // Headers row - student name + external tests + average
  sheet.getCell('A3').value = 'שם התלמיד';

  // External test headers
  externalTestDefs.forEach((test, index) => {
    const col = String.fromCharCode(66 + index); // B, C, D, E, F
    sheet.getCell(`${col}3`).value = test.label;
    sheet.getColumn(col).width = 12;
  });

  // Average column
  const avgCol = String.fromCharCode(66 + externalTestDefs.length); // G
  sheet.getCell(`${avgCol}3`).value = 'ממוצע';
  sheet.getColumn(avgCol).width = 10;

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

    // Find external tests for this student
    const studentTests = externalTests.find(et => et.student_id === student.id);

    // Fill in external test scores
    externalTestDefs.forEach((test, testIndex) => {
      const col = String.fromCharCode(66 + testIndex);
      const score = studentTests?.[test.key];
      const cell = sheet.getCell(`${col}${row}`);

      if (score !== null && score !== undefined) {
        cell.value = `${parseFloat(score).toFixed(0)}%`;
        cell.alignment = { horizontal: 'center' };

        // Color coding based on passing (60%)
        if (score >= 60) {
          cell.font = { color: { argb: 'FF008000' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        } else {
          cell.font = { color: { argb: 'FFFF0000' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
        }
      } else {
        cell.value = '-';
        cell.alignment = { horizontal: 'center' };
      }
    });

    // Average column
    const avgCell = sheet.getCell(`${avgCol}${row}`);
    const avgScore = studentTests?.average_score;
    if (avgScore !== null && avgScore !== undefined) {
      avgCell.value = `${parseFloat(avgScore).toFixed(1)}%`;
      avgCell.alignment = { horizontal: 'center' };
      avgCell.font = { bold: true };

      if (avgScore >= 60) {
        avgCell.font = { bold: true, color: { argb: 'FF008000' } };
        avgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      } else {
        avgCell.font = { bold: true, color: { argb: 'FFFF0000' } };
        avgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      }
    } else {
      avgCell.value = '-';
      avgCell.alignment = { horizontal: 'center' };
    }
  });

  // Column widths
  sheet.getColumn('A').width = 20;

  // Add summary row
  const summaryRow = students.length + 5;
  sheet.getCell(`A${summaryRow}`).value = 'סה"כ עברו:';
  sheet.getCell(`A${summaryRow}`).font = { bold: true };

  // Count students who passed each external test (score >= 60)
  externalTestDefs.forEach((test, testIndex) => {
    const col = String.fromCharCode(66 + testIndex);
    const passedCount = students.filter(student => {
      const studentTests = externalTests.find(et => et.student_id === student.id);
      const score = studentTests?.[test.key];
      return score !== null && score !== undefined && score >= 60;
    }).length;

    const testedCount = students.filter(student => {
      const studentTests = externalTests.find(et => et.student_id === student.id);
      const score = studentTests?.[test.key];
      return score !== null && score !== undefined;
    }).length;

    sheet.getCell(`${col}${summaryRow}`).value = testedCount > 0 ? `${passedCount}/${testedCount}` : '-';
    sheet.getCell(`${col}${summaryRow}`).font = { bold: true };
    sheet.getCell(`${col}${summaryRow}`).alignment = { horizontal: 'center' };
  });

  // Average summary
  const avgPassedCount = students.filter(student => {
    const studentTests = externalTests.find(et => et.student_id === student.id);
    const avgScore = studentTests?.average_score;
    return avgScore !== null && avgScore !== undefined && avgScore >= 60;
  }).length;

  const avgTestedCount = students.filter(student => {
    const studentTests = externalTests.find(et => et.student_id === student.id);
    return studentTests?.average_score !== null && studentTests?.average_score !== undefined;
  }).length;

  sheet.getCell(`${avgCol}${summaryRow}`).value = avgTestedCount > 0 ? `${avgPassedCount}/${avgTestedCount}` : '-';
  sheet.getCell(`${avgCol}${summaryRow}`).font = { bold: true };
  sheet.getCell(`${avgCol}${summaryRow}`).alignment = { horizontal: 'center' };

  return sheet;
}

/**
 * Convert column number to Excel column letter (1=A, 2=B, ..., 27=AA, etc.)
 */
function getColumnLetter(colNum) {
  let letter = '';
  while (colNum > 0) {
    const mod = (colNum - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colNum = Math.floor((colNum - 1) / 26);
  }
  return letter;
}

/**
 * Create a lesson scores table (class or water) on a sheet
 * Returns the row number after the table
 */
function createLessonTable(sheet, startRow, lessonNames, criteriaItems, evaluations, itemScores, subjectCode, tableTitle) {
  // Filter evaluations for this subject type
  const subjectEvals = evaluations.filter(e => e.subject_code === subjectCode);

  // Group evaluations by lesson_name
  const evalsByLesson = {};
  subjectEvals.forEach(evaluation => {
    const lessonName = evaluation.lesson_name;
    if (lessonName) {
      if (!evalsByLesson[lessonName]) {
        evalsByLesson[lessonName] = [];
      }
      evalsByLesson[lessonName].push(evaluation);
    }
  });

  // Get unique lesson names that have evaluations (preserving order from predefined list)
  const usedLessonNames = lessonNames.filter(name => evalsByLesson[name]);

  if (usedLessonNames.length === 0) {
    sheet.getCell(`A${startRow}`).value = tableTitle;
    sheet.getCell(`A${startRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${startRow + 1}`).value = 'אין נתונים';
    return startRow + 3;
  }

  // Table header
  sheet.getCell(`A${startRow}`).value = tableTitle;
  sheet.getCell(`A${startRow}`).font = { bold: true, size: 12 };
  sheet.mergeCells(`A${startRow}:${getColumnLetter(usedLessonNames.length + 3)}${startRow}`);

  const headerRow = startRow + 1;

  // Column headers: Criterion | Lesson1 | Lesson2 | ... | Average | Trend
  sheet.getCell(`A${headerRow}`).value = 'קריטריון';

  usedLessonNames.forEach((lessonName, index) => {
    const col = getColumnLetter(index + 2); // B, C, D...
    sheet.getCell(`${col}${headerRow}`).value = lessonName;
    sheet.getColumn(col).width = 10;
  });

  const avgCol = getColumnLetter(usedLessonNames.length + 2);
  const trendCol = getColumnLetter(usedLessonNames.length + 3);

  sheet.getCell(`${avgCol}${headerRow}`).value = 'ממוצע';
  sheet.getCell(`${trendCol}${headerRow}`).value = 'מגמה';

  // Style header row
  const headerRowObj = sheet.getRow(headerRow);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Data rows - one per criterion
  let currentRow = headerRow + 1;

  criteriaItems.forEach((criterion, criterionIndex) => {
    sheet.getCell(`A${currentRow}`).value = criterion.name;

    const scoreCells = [];

    usedLessonNames.forEach((lessonName, lessonIndex) => {
      const col = getColumnLetter(lessonIndex + 2);
      const cellRef = `${col}${currentRow}`;

      // Find the evaluation for this lesson
      const evals = evalsByLesson[lessonName] || [];
      // Take the most recent evaluation if multiple exist
      const latestEval = evals.sort((a, b) =>
        new Date(b.evaluation_date) - new Date(a.evaluation_date)
      )[0];

      if (latestEval) {
        // Find the item score for this criterion
        const evalItemScores = itemScores.filter(is => is.evaluation_id === latestEval.id);
        // Match by criterion display_order (since criteria IDs may differ)
        const criterionItemScore = evalItemScores.find(is =>
          is.criterion_display_order === criterionIndex + 1
        );

        if (criterionItemScore) {
          sheet.getCell(cellRef).value = criterionItemScore.score;
          scoreCells.push(cellRef);
        } else {
          sheet.getCell(cellRef).value = '-';
        }
      } else {
        sheet.getCell(cellRef).value = '-';
      }
    });

    // Average formula
    if (scoreCells.length > 0) {
      const startCol = getColumnLetter(2);
      const endCol = getColumnLetter(usedLessonNames.length + 1);
      sheet.getCell(`${avgCol}${currentRow}`).value = {
        formula: `IFERROR(AVERAGE(${startCol}${currentRow}:${endCol}${currentRow}),"-")`
      };
      sheet.getCell(`${avgCol}${currentRow}`).numFmt = '0.0';
    } else {
      sheet.getCell(`${avgCol}${currentRow}`).value = '-';
    }

    // SLOPE formula for trend
    if (usedLessonNames.length >= 2 && scoreCells.length >= 2) {
      const startCol = getColumnLetter(2);
      const endCol = getColumnLetter(usedLessonNames.length + 1);
      // SLOPE(y_values, x_values) - x_values are column numbers (1,2,3...)
      sheet.getCell(`${trendCol}${currentRow}`).value = {
        formula: `IFERROR(SLOPE(${startCol}${currentRow}:${endCol}${currentRow},COLUMN(${startCol}1:${endCol}1)),"-")`
      };
      sheet.getCell(`${trendCol}${currentRow}`).numFmt = '0.00';
    } else {
      sheet.getCell(`${trendCol}${currentRow}`).value = '-';
    }

    currentRow++;
  });

  // Total row
  const totalRow = currentRow;
  sheet.getCell(`A${totalRow}`).value = 'סה"כ';
  sheet.getCell(`A${totalRow}`).font = { bold: true };

  usedLessonNames.forEach((lessonName, lessonIndex) => {
    const col = getColumnLetter(lessonIndex + 2);
    const startDataRow = headerRow + 1;
    const endDataRow = totalRow - 1;
    sheet.getCell(`${col}${totalRow}`).value = {
      formula: `IFERROR(SUM(${col}${startDataRow}:${col}${endDataRow}),"-")`
    };
    sheet.getCell(`${col}${totalRow}`).font = { bold: true };
  });

  // Total average
  const startCol = getColumnLetter(2);
  const endCol = getColumnLetter(usedLessonNames.length + 1);
  sheet.getCell(`${avgCol}${totalRow}`).value = {
    formula: `IFERROR(AVERAGE(${startCol}${totalRow}:${endCol}${totalRow}),"-")`
  };
  sheet.getCell(`${avgCol}${totalRow}`).numFmt = '0.0';
  sheet.getCell(`${avgCol}${totalRow}`).font = { bold: true };

  // Total trend
  if (usedLessonNames.length >= 2) {
    sheet.getCell(`${trendCol}${totalRow}`).value = {
      formula: `IFERROR(SLOPE(${startCol}${totalRow}:${endCol}${totalRow},COLUMN(${startCol}1:${endCol}1)),"-")`
    };
    sheet.getCell(`${trendCol}${totalRow}`).numFmt = '0.00';
    sheet.getCell(`${trendCol}${totalRow}`).font = { bold: true };
  } else {
    sheet.getCell(`${trendCol}${totalRow}`).value = '-';
    sheet.getCell(`${trendCol}${totalRow}`).font = { bold: true };
  }

  // Style total row
  const totalRowObj = sheet.getRow(totalRow);
  totalRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9EAD3' }
  };

  return totalRow + 2;
}

/**
 * Create individual student sheet with progress data and chart
 */
function createStudentSheet(workbook, student, evaluations, subjects, absences, itemScores, externalTests, studentSkills) {
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

  // Add lesson tables section
  let lessonTablesRow = chartDataRow + 6;

  // Class lessons table (העברת הרצאה - lecture_delivery)
  lessonTablesRow = createLessonTable(
    sheet,
    lessonTablesRow,
    classLessonNames,
    classLessonCriteria,
    studentEvals,
    itemScores.filter(is => studentEvals.some(e => e.id === is.evaluation_id)),
    'lecture_delivery',
    'טבלת שיעורי כיתה (הרצאה)'
  );

  // Water lessons table (העברת שיעור מים - water_lesson)
  lessonTablesRow = createLessonTable(
    sheet,
    lessonTablesRow,
    waterLessonNames,
    waterLessonCriteria,
    studentEvals,
    itemScores.filter(is => studentEvals.some(e => e.id === is.evaluation_id)),
    'water_lesson',
    'טבלת שיעורי מים'
  );

  // External Tests Section
  let externalTestsRow = lessonTablesRow + 2;
  sheet.getCell(`A${externalTestsRow}`).value = 'מבחנים חיצוניים';
  sheet.getCell(`A${externalTestsRow}`).font = { bold: true, size: 12 };

  // Headers for external tests
  const testHeaders = ['מבחן', 'ציון'];
  testHeaders.forEach((header, index) => {
    const col = String.fromCharCode(65 + index);
    sheet.getCell(`${col}${externalTestsRow + 2}`).value = header;
    sheet.getCell(`${col}${externalTestsRow + 2}`).font = { bold: true };
  });

  const headerRow = sheet.getRow(externalTestsRow + 2);
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // External test data
  const testNames = [
    { key: 'physics_score', label: 'פיזיקה' },
    { key: 'physiology_score', label: 'פיזיולוגיה' },
    { key: 'eye_contact_score', label: 'קשר עין' },
    { key: 'equipment_score', label: 'ציוד' },
    { key: 'decompression_score', label: 'דקומפרסיה' }
  ];

  testNames.forEach((test, index) => {
    const row = externalTestsRow + 3 + index;
    sheet.getCell(`A${row}`).value = test.label;
    const score = externalTests?.[test.key];
    sheet.getCell(`B${row}`).value = score !== null && score !== undefined ? `${score}%` : '-';

    // Color coding for scores
    if (score !== null && score !== undefined) {
      const cell = sheet.getCell(`B${row}`);
      if (score >= 60) {
        cell.font = { color: { argb: 'FF008000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      } else {
        cell.font = { color: { argb: 'FFFF0000' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      }
    }
  });

  // Average row
  const avgRow = externalTestsRow + 3 + testNames.length;
  sheet.getCell(`A${avgRow}`).value = 'ממוצע';
  sheet.getCell(`A${avgRow}`).font = { bold: true };

  const avgScore = externalTests?.average_score;
  sheet.getCell(`B${avgRow}`).value = avgScore !== null && avgScore !== undefined ? `${parseFloat(avgScore).toFixed(1)}%` : '-';
  sheet.getCell(`B${avgRow}`).font = { bold: true };

  if (avgScore !== null && avgScore !== undefined) {
    const avgCell = sheet.getCell(`B${avgRow}`);
    if (avgScore >= 60) {
      avgCell.font = { bold: true, color: { argb: 'FF008000' } };
      avgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
    } else {
      avgCell.font = { bold: true, color: { argb: 'FFFF0000' } };
      avgCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
    }
  }

  // Skills Section (מיומנויות)
  let skillsRow = avgRow + 3;
  sheet.getCell(`A${skillsRow}`).value = 'מיומנויות';
  sheet.getCell(`A${skillsRow}`).font = { bold: true, size: 12 };

  // Headers for skills
  sheet.getCell(`A${skillsRow + 2}`).value = 'מיומנות';
  sheet.getCell(`B${skillsRow + 2}`).value = 'בוצע';
  const skillsHeaderRow = sheet.getRow(skillsRow + 2);
  skillsHeaderRow.font = { bold: true };
  skillsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Skills data
  const skills = [
    { key: 'meters_30', label: '30 מטר' },
    { key: 'meters_40', label: '40 מטר' },
    { key: 'guidance', label: 'הובלה' }
  ];

  skills.forEach((skill, index) => {
    const row = skillsRow + 3 + index;
    sheet.getCell(`A${row}`).value = skill.label;
    const performed = studentSkills?.[skill.key] || false;
    const cell = sheet.getCell(`B${row}`);
    cell.value = performed ? '✓' : '-';
    if (performed) {
      cell.font = { bold: true, color: { argb: 'FF008000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
    }
  });

  return sheet;
}

/**
 * Main function to generate the final report
 * @param {Pool} pool - Database connection pool
 * @param {number|null} courseId - Optional course ID to filter by
 */
export async function generateFinalReport(pool, courseId = null) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InsTest';
  workbook.created = new Date();

  // Build student query based on courseId
  let studentsQuery;
  let studentsParams = [];

  if (courseId) {
    // Get only students enrolled in this course
    studentsQuery = `
      SELECT s.* FROM students s
      JOIN course_students cs ON s.id = cs.student_id
      WHERE cs.course_id = $1
      ORDER BY s.last_name, s.first_name
    `;
    studentsParams = [courseId];
  } else {
    studentsQuery = 'SELECT * FROM students ORDER BY last_name, first_name';
  }

  // Fetch all required data
  const [
    studentsResult,
    subjectsResult,
    evaluationsResult,
    absencesResult,
    itemScoresResult,
    courseResult,
    externalTestsResult,
    studentSkillsResult
  ] = await Promise.all([
    pool.query(studentsQuery, studentsParams),
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
    pool.query('SELECT * FROM student_absences ORDER BY absence_date DESC'),
    pool.query(`
      SELECT
        eis.*,
        ec.display_order as criterion_display_order,
        ec.name_he as criterion_name
      FROM evaluation_item_scores eis
      LEFT JOIN evaluation_criteria ec ON eis.criterion_id = ec.id
      ORDER BY eis.evaluation_id, ec.display_order
    `),
    courseId ? pool.query('SELECT * FROM courses WHERE id = $1', [courseId]) : Promise.resolve({ rows: [] }),
    pool.query('SELECT * FROM external_tests'),
    pool.query('SELECT * FROM student_skills')
  ]);

  const students = studentsResult.rows;
  const subjects = subjectsResult.rows;
  const studentIds = students.map(s => s.id);

  // Filter evaluations and absences to only include students in the course
  const evaluations = evaluationsResult.rows.filter(e => studentIds.includes(e.student_id));
  const absences = absencesResult.rows.filter(a => studentIds.includes(a.student_id));

  // Filter item scores to only include evaluations for these students
  const evaluationIds = evaluations.map(e => e.id);
  const itemScores = itemScoresResult.rows.filter(is => evaluationIds.includes(is.evaluation_id));

  // Filter external tests to only include students in the course
  const externalTests = externalTestsResult.rows.filter(et => studentIds.includes(et.student_id));

  // Filter student skills to only include students in the course
  const studentSkills = studentSkillsResult.rows.filter(ss => studentIds.includes(ss.student_id));

  // Derive course info - use actual course data if courseId provided
  let courseInfo;
  if (courseId && courseResult.rows.length > 0) {
    const course = courseResult.rows[0];
    courseInfo = {
      name: course.name,
      date: formatDateHebrew(course.start_date)
    };
  } else {
    courseInfo = deriveCourseInfo(evaluations);
  }

  // Create all sheets
  createCourseSheet(workbook, courseInfo);
  createMainSheet(workbook, subjects);
  createAbsencesSheet(workbook, students, absences);
  createExamsSheet(workbook, students, evaluations, subjects, externalTests);

  // Create individual student sheets
  for (const student of students) {
    const studentExternalTests = externalTests.find(et => et.student_id === student.id);
    const studentSkillsData = studentSkills.find(ss => ss.student_id === student.id);
    createStudentSheet(workbook, student, evaluations, subjects, absences, itemScores, studentExternalTests, studentSkillsData);
  }

  return workbook;
}

export default { generateFinalReport };
