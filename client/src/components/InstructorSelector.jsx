import { useState, useEffect, useRef } from 'react';
import { getInstructors } from '../utils/api';

function InstructorSelector({ value, onChange, required = false }) {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInstructors = async () => {
    try {
      const data = await getInstructors();
      setInstructors(data);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedInstructor = instructors.find(i => i.id === value);

  const filteredInstructors = instructors.filter(instructor => {
    const fullName = `${instructor.first_name} ${instructor.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleSelect = (instructorId) => {
    onChange(instructorId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  if (loading) {
    return <div className="selector-loading">טוען מדריכים...</div>;
  }

  return (
    <div className="selector-wrapper" ref={wrapperRef}>
      <div
        className={`selector-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedInstructor
          ? `${selectedInstructor.first_name} ${selectedInstructor.last_name}`
          : 'בחר מדריך (אופציונלי)'
        }
        {selectedInstructor && (
          <span className="selector-clear" onClick={handleClear}>&#10005;</span>
        )}
        <span className="selector-arrow">&#9662;</span>
      </div>

      {isOpen && (
        <div className="selector-dropdown">
          <input
            type="text"
            className="selector-search"
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          <div className="selector-options">
            {filteredInstructors.length === 0 ? (
              <div className="selector-empty">לא נמצאו מדריכים</div>
            ) : (
              filteredInstructors.map(instructor => (
                <div
                  key={instructor.id}
                  className={`selector-option ${instructor.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(instructor.id)}
                >
                  {instructor.first_name} {instructor.last_name}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {required && (
        <input
          type="hidden"
          value={value || ''}
          required
        />
      )}
    </div>
  );
}

export default InstructorSelector;
