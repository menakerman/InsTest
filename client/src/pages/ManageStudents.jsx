import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api';

function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    unit_id: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/students`);
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      unit_id: ''
    });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      unit_id: student.unit_id || ''
    });
    setShowModal(true);
  };

  const openDeleteModal = (student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingStudent
        ? `${API_URL}/students/${editingStudent.id}`
        : `${API_URL}/students`;

      const response = await fetch(url, {
        method: editingStudent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save student');
      }

      await fetchStudents();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/students/${deletingStudent.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete student');

      await fetchStudents();
      closeDeleteModal();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="students-page">
      <div className="students-header">
        <h2>Manage Students</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Add Student
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {students.length === 0 ? (
        <div className="empty-state">
          <p>No students yet. Click "Add Student" to create one.</p>
        </div>
      ) : (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Unit ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.email}</td>
                  <td>{student.phone || '-'}</td>
                  <td>{student.unit_id || '-'}</td>
                  <td className="actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditModal(student)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => openDeleteModal(student)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingStudent ? 'Edit Student' : 'Add Student'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="unit_id">Unit ID</label>
                <input
                  type="text"
                  id="unit_id"
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Save Changes' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm">
              <h3>Delete Student</h3>
              <p>
                Are you sure you want to delete{' '}
                <strong>{deletingStudent.first_name} {deletingStudent.last_name}</strong>?
                This action cannot be undone.
              </p>
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={closeDeleteModal}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageStudents;
