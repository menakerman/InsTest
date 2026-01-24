import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ManageStudents from './pages/ManageStudents';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>Diving Instructor Course</h1>
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Manage Students
            </NavLink>
            <span className="nav-link disabled" title="Coming soon">
              Grade Students
            </span>
            <span className="nav-link disabled" title="Coming soon">
              Student Stats
            </span>
          </nav>
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<ManageStudents />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
