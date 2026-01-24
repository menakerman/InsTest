import { useState, useEffect, useRef } from 'react';

function StudentMultiSelect({ students, selectedIds, onChange, loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const email = (student.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  const handleToggleStudent = (studentId) => {
    const newIds = selectedIds.includes(studentId)
      ? selectedIds.filter(id => id !== studentId)
      : [...selectedIds, studentId];
    onChange(newIds);
  };

  const handleRemoveStudent = (studentId, e) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== studentId));
  };

  const selectedStudents = students.filter(s => selectedIds.includes(s.id));

  return (
    <div className="student-multi-select" ref={wrapperRef}>
      <div
        className={`multi-select-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedStudents.length === 0 ? (
          <span className="placeholder">בחר תלמידים...</span>
        ) : (
          <div className="selected-chips">
            {selectedStudents.slice(0, 3).map(student => (
              <span key={student.id} className="student-chip">
                {student.first_name} {student.last_name}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={(e) => handleRemoveStudent(student.id, e)}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedStudents.length > 3 && (
              <span className="more-chip">+{selectedStudents.length - 3} נוספים</span>
            )}
          </div>
        )}
        <span className="multi-select-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="multi-select-dropdown">
          <input
            type="text"
            className="multi-select-search"
            placeholder="חיפוש תלמיד..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="multi-select-options">
            {loading ? (
              <div className="multi-select-loading">טוען תלמידים...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="multi-select-empty">לא נמצאו תלמידים</div>
            ) : (
              filteredStudents.map(student => (
                <label
                  key={student.id}
                  className={`multi-select-option ${selectedIds.includes(student.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.id)}
                    onChange={() => handleToggleStudent(student.id)}
                  />
                  <span className="option-name">
                    {student.first_name} {student.last_name}
                  </span>
                  <span className="option-email">{student.email}</span>
                </label>
              ))
            )}
          </div>

          {selectedStudents.length > 0 && (
            <div className="multi-select-footer">
              {selectedStudents.length} תלמידים נבחרו
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentMultiSelect;
