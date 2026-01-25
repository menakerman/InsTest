import { useState, useEffect, useRef } from 'react';

function InstructorMultiSelect({ instructors, selectedIds, onChange, loading }) {
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

  const filteredInstructors = instructors.filter(instructor => {
    const fullName = `${instructor.first_name} ${instructor.last_name}`.toLowerCase();
    const email = (instructor.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  const handleToggleInstructor = (instructorId) => {
    const newIds = selectedIds.includes(instructorId)
      ? selectedIds.filter(id => id !== instructorId)
      : [...selectedIds, instructorId];
    onChange(newIds);
  };

  const handleRemoveInstructor = (instructorId, e) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== instructorId));
  };

  const selectedInstructors = instructors.filter(i => selectedIds.includes(i.id));

  return (
    <div className="student-multi-select" ref={wrapperRef}>
      <div
        className={`multi-select-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedInstructors.length === 0 ? (
          <span className="placeholder">בחר מדריכים...</span>
        ) : (
          <div className="selected-chips">
            {selectedInstructors.slice(0, 3).map(instructor => (
              <span key={instructor.id} className="student-chip">
                {instructor.first_name} {instructor.last_name}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={(e) => handleRemoveInstructor(instructor.id, e)}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedInstructors.length > 3 && (
              <span className="more-chip">+{selectedInstructors.length - 3} נוספים</span>
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
            placeholder="חיפוש מדריך..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="multi-select-options">
            {loading ? (
              <div className="multi-select-loading">טוען מדריכים...</div>
            ) : filteredInstructors.length === 0 ? (
              <div className="multi-select-empty">לא נמצאו מדריכים</div>
            ) : (
              filteredInstructors.map(instructor => (
                <label
                  key={instructor.id}
                  className={`multi-select-option ${selectedIds.includes(instructor.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(instructor.id)}
                    onChange={() => handleToggleInstructor(instructor.id)}
                  />
                  <span className="option-name">
                    {instructor.first_name} {instructor.last_name}
                  </span>
                  <span className="option-email">{instructor.email}</span>
                </label>
              ))
            )}
          </div>

          {selectedInstructors.length > 0 && (
            <div className="multi-select-footer">
              {selectedInstructors.length} מדריכים נבחרו
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InstructorMultiSelect;
