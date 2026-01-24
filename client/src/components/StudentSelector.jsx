import { useState, useEffect, useRef } from 'react';
import { getStudents } from '../utils/api';

function StudentSelector({ value, onChange, required = false }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find(s => s.id === value);

  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const handleSelect = (studentId) => {
    onChange(studentId);
    setIsOpen(false);
    setSearchTerm('');
  };

  if (loading) {
    return <div className="selector-loading">טוען תלמידים...</div>;
  }

  return (
    <div className="selector-wrapper" ref={wrapperRef}>
      <div
        className={`selector-display ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedStudent
          ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
          : 'בחר תלמיד'
        }
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
            {filteredStudents.length === 0 ? (
              <div className="selector-empty">לא נמצאו תלמידים</div>
            ) : (
              filteredStudents.map(student => (
                <div
                  key={student.id}
                  className={`selector-option ${student.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(student.id)}
                >
                  {student.first_name} {student.last_name}
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

export default StudentSelector;
