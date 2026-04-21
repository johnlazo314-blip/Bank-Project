import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import axios from 'axios';
import './UserList.css';

interface User {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'user' | 'admin';
}

interface UserFormData {
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'user' | 'admin';
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users`;

const initialFormData: UserFormData = {
  FirstName: '',
  LastName: '',
  Email: '',
  Role: 'user'
};

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get<User[]>(API_BASE_URL);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingUserId(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      if (editingUserId !== null) {
        await axios.put(`${API_BASE_URL}/${editingUserId}`, formData);
      } else {
        await axios.post(API_BASE_URL, formData);
      }

      await fetchUsers();
      resetForm();
    } catch (err) {
      setError(editingUserId !== null ? 'Failed to update user' : 'Failed to create user');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.UserID);
    setFormData({
      FirstName: user.FirstName,
      LastName: user.LastName,
      Email: user.Email,
      Role: user.Role
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      setError(null);
      await axios.delete(`${API_BASE_URL}/${id}`);
      await fetchUsers();
      if (editingUserId === id) {
        resetForm();
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  };

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="user-list-container">
      <h2>{editingUserId !== null ? 'Edit User' : 'Add New User'}</h2>

      <form className="user-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="FirstName"
          placeholder="First Name"
          value={formData.FirstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="LastName"
          placeholder="Last Name"
          value={formData.LastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="Email"
          placeholder="Email"
          value={formData.Email}
          onChange={handleChange}
          required
        />
        <select name="Role" value={formData.Role} onChange={handleChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingUserId !== null ? 'Update User' : 'Create User'}
          </button>
          {editingUserId !== null && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}

      <h2>Users</h2>
      <ul className="user-list">
        {users.map(user => (
          <li key={user.UserID} className="user-list-item">
            <div className="user-info">
              <strong>{user.FirstName} {user.LastName}</strong> ({user.Role})
              <br />
              <small>{user.Email}</small>
            </div>
            <div className="user-actions">
              <button onClick={() => handleEdit(user)}>Edit</button>
              <button onClick={() => handleDelete(user.UserID)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
