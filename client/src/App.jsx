import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts';
import ProtectedRoute from './components/ProtectedRoute';
import UserMenu from './components/UserMenu';
import ManageStudents from './pages/ManageStudents';
import ManageInstructors from './pages/ManageInstructors';
import ManageCourses from './pages/ManageCourses';
import ManageAbsences from './pages/ManageAbsences';
import GradeStudents from './pages/GradeStudents';
import EvaluationForm from './pages/EvaluationForm';
import EvaluationHistory from './pages/EvaluationHistory';
import StudentStats from './pages/StudentStats';
import ManageUsers from './pages/ManageUsers';
import ManageLessons from './pages/ManageLessons';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NoAccess from './pages/NoAccess';
import './App.css';

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading">טוען...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {isAuthenticated && user?.role !== 'student' && (
        <header className="header">
          <div className="header-content">
            <div className="header-brand">
              <img src="/tidf-logo.png" alt="TIDF Logo" className="header-logo" />
              <h1>קורס מדריכי צלילה</h1>
            </div>
            <nav className="nav">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                ניהול חניכים
              </NavLink>
              <NavLink to="/instructors" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                ניהול מדריכים
              </NavLink>
              <NavLink to="/courses" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                ניהול קורסים
              </NavLink>
              <NavLink to="/grade" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                הערכות
              </NavLink>
              <NavLink to="/absences" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                העדרויות
              </NavLink>
              <NavLink to="/student-stats" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                סטטיסטיקות
              </NavLink>
              {(user?.role === 'admin' || user?.role === 'madar') && (
                <>
                  <NavLink to="/lessons" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    ניהול שיעורים
                  </NavLink>
                  <NavLink to="/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                    ניהול משתמשים
                  </NavLink>
                </>
              )}
            </nav>
          </div>
          <UserMenu />
        </header>
      )}

      {isAuthenticated && user?.role === 'student' && (
        <header className="header header-minimal">
          <div className="header-content">
            <div className="header-brand">
              <img src="/tidf-logo.png" alt="TIDF Logo" className="header-logo" />
              <h1>קורס מדריכי צלילה</h1>
            </div>
          </div>
          <UserMenu />
        </header>
      )}

      <main className={isAuthenticated ? 'main' : 'main-full'}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="/forgot-password" element={
            isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
          } />
          <Route path="/reset-password/:token" element={
            isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />
          } />

          {/* Student no-access page */}
          <Route path="/no-access" element={
            <ProtectedRoute>
              <NoAccess />
            </ProtectedRoute>
          } />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <ManageStudents />
            </ProtectedRoute>
          } />
          <Route path="/instructors" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <ManageInstructors />
            </ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <ManageCourses />
            </ProtectedRoute>
          } />
          <Route path="/grade" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <GradeStudents />
            </ProtectedRoute>
          } />
          <Route path="/evaluations/new/:subjectCode" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <EvaluationForm />
            </ProtectedRoute>
          } />
          <Route path="/evaluations/edit/:evaluationId" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <EvaluationForm />
            </ProtectedRoute>
          } />
          <Route path="/evaluations/history" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <EvaluationHistory />
            </ProtectedRoute>
          } />
          <Route path="/student-stats" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor', 'tester']}>
              <StudentStats />
            </ProtectedRoute>
          } />
          <Route path="/absences" element={
            <ProtectedRoute allowedRoles={['admin', 'madar', 'instructor']}>
              <ManageAbsences />
            </ProtectedRoute>
          } />

          {/* Admin only routes */}
          <Route path="/lessons" element={
            <ProtectedRoute allowedRoles={['admin', 'madar']}>
              <ManageLessons />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin', 'madar']}>
              <ManageUsers />
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to home or login */}
          <Route path="*" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
