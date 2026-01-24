const API_URL = 'http://localhost:3001/api';

// Get auth token from localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Generic fetch wrapper
async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers
    },
    ...options
  });

  if (response.status === 401) {
    // Token expired or invalid - clear and redirect
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// Students
export const getStudents = () => fetchAPI('/students');
export const getStudent = (id) => fetchAPI(`/students/${id}`);
export const createStudent = (data) => fetchAPI('/students', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const updateStudent = (id, data) => fetchAPI(`/students/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteStudent = (id) => fetchAPI(`/students/${id}`, {
  method: 'DELETE'
});

// Instructors
export const getInstructors = () => fetchAPI('/instructors');
export const getInstructor = (id) => fetchAPI(`/instructors/${id}`);
export const createInstructor = (data) => fetchAPI('/instructors', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const updateInstructor = (id, data) => fetchAPI(`/instructors/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteInstructor = (id) => fetchAPI(`/instructors/${id}`, {
  method: 'DELETE'
});

// Evaluation Subjects
export const getEvaluationSubjects = () => fetchAPI('/evaluation-subjects');
export const getEvaluationSubject = (code) => fetchAPI(`/evaluation-subjects/${code}`);

// Evaluations
export const getEvaluations = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const queryString = params.toString();
  return fetchAPI(`/evaluations${queryString ? `?${queryString}` : ''}`);
};
export const getEvaluation = (id) => fetchAPI(`/evaluations/${id}`);
export const createEvaluation = (data) => fetchAPI('/evaluations', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const updateEvaluation = (id, data) => fetchAPI(`/evaluations/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteEvaluation = (id) => fetchAPI(`/evaluations/${id}`, {
  method: 'DELETE'
});

// Users (Admin only)
export const getUsers = () => fetchAPI('/users');
export const getUser = (id) => fetchAPI(`/users/${id}`);
export const createUser = (data) => fetchAPI('/users', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const updateUser = (id, data) => fetchAPI(`/users/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteUser = (id) => fetchAPI(`/users/${id}`, {
  method: 'DELETE'
});

// Absences
export const getAbsences = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const queryString = params.toString();
  return fetchAPI(`/absences${queryString ? `?${queryString}` : ''}`);
};
export const getAbsence = (id) => fetchAPI(`/absences/${id}`);
export const createAbsence = (data) => fetchAPI('/absences', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const updateAbsence = (id, data) => fetchAPI(`/absences/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteAbsence = (id) => fetchAPI(`/absences/${id}`, {
  method: 'DELETE'
});

// Courses
export const getCourses = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, value);
  });
  const queryString = params.toString();
  return fetchAPI(`/courses${queryString ? `?${queryString}` : ''}`);
};
export const getCourse = (id) => fetchAPI(`/courses/${id}`);
export const createCourse = (data) => fetchAPI('/courses', {
  method: 'POST',
  body: JSON.stringify(data)
});
export const updateCourse = (id, data) => fetchAPI(`/courses/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteCourse = (id) => fetchAPI(`/courses/${id}`, {
  method: 'DELETE'
});

// Student Skills
export const getStudentSkills = (studentId) => fetchAPI(`/student-skills/${studentId}`);
export const getAllStudentSkills = () => fetchAPI('/student-skills');
export const saveStudentSkills = (studentId, data) => fetchAPI(`/student-skills/${studentId}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

// External Tests
export const getExternalTests = (studentId) => fetchAPI(`/external-tests/${studentId}`);
export const getAllExternalTests = () => fetchAPI('/external-tests');
export const saveExternalTests = (studentId, data) => fetchAPI(`/external-tests/${studentId}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
export const deleteExternalTests = (studentId) => fetchAPI(`/external-tests/${studentId}`, {
  method: 'DELETE'
});

// Export
export const exportFinalReport = async (courseId = null) => {
  const token = localStorage.getItem('token');
  const url = courseId
    ? `${API_URL}/export/final-report?courseId=${courseId}`
    : `${API_URL}/export/final-report`;
  const response = await fetch(url, {
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to export report');
  }

  // Get the blob and create download
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;

  // Get filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `דוח_קורס_${new Date().toISOString().split('T')[0]}.xlsx`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/);
    if (match) {
      filename = decodeURIComponent(match[1].replace(/"/g, ''));
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(blobUrl);
  document.body.removeChild(a);
};

export default {
  // Students
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  // Instructors
  getInstructors,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
  // Evaluation Subjects
  getEvaluationSubjects,
  getEvaluationSubject,
  // Evaluations
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  // Users
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  // Absences
  getAbsences,
  getAbsence,
  createAbsence,
  updateAbsence,
  deleteAbsence,
  // Courses
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  // Student Skills
  getStudentSkills,
  getAllStudentSkills,
  saveStudentSkills,
  // External Tests
  getExternalTests,
  getAllExternalTests,
  saveExternalTests,
  deleteExternalTests,
  // Export
  exportFinalReport
};
