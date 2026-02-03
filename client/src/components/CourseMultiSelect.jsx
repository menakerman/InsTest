import { useState, useEffect, useRef } from 'react';

function CourseMultiSelect({ courses, selectedIds, onChange, loading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
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

  // Check if dropdown should open upward
  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300; // approximate height
      setOpenUpward(spaceBelow < dropdownHeight);
    }
  }, [isOpen]);

  const filteredCourses = courses.filter(course => {
    const name = (course.name || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term);
  });

  const handleToggleCourse = (courseId) => {
    const newIds = selectedIds.includes(courseId)
      ? selectedIds.filter(id => id !== courseId)
      : [...selectedIds, courseId];
    onChange(newIds);
  };

  const handleRemoveCourse = (courseId, e) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== courseId));
  };

  const selectedCourses = courses.filter(c => selectedIds.includes(c.id));

  return (
    <div className="student-multi-select" ref={wrapperRef}>
      <div
        className={`multi-select-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCourses.length === 0 ? (
          <span className="placeholder">בחר קורסים...</span>
        ) : (
          <div className="selected-chips">
            {selectedCourses.slice(0, 2).map(course => (
              <span key={course.id} className="student-chip">
                {course.name}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={(e) => handleRemoveCourse(course.id, e)}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedCourses.length > 2 && (
              <span className="more-chip">+{selectedCourses.length - 2} נוספים</span>
            )}
          </div>
        )}
        <span className="multi-select-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className={`multi-select-dropdown ${openUpward ? 'open-upward' : ''}`}>
          <input
            type="text"
            className="multi-select-search"
            placeholder="חיפוש קורס..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="multi-select-options">
            {loading ? (
              <div className="multi-select-loading">טוען קורסים...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="multi-select-empty">לא נמצאו קורסים</div>
            ) : (
              filteredCourses.map(course => (
                <label
                  key={course.id}
                  className={`multi-select-option ${selectedIds.includes(course.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(course.id)}
                    onChange={() => handleToggleCourse(course.id)}
                  />
                  <span className="option-name">
                    {course.name}
                  </span>
                  <span className="option-email">{course.course_type_label || course.course_type}</span>
                </label>
              ))
            )}
          </div>

          {selectedCourses.length > 0 && (
            <div className="multi-select-footer">
              {selectedCourses.length} קורסים נבחרו
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseMultiSelect;
