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

  const resetForm = () => {
    setEditingUserId(null);
    setFormData(initialFormData);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: FormEvent) => {
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

  const handleCancel = () => {
    setEditingUserId(null);
    setFormData(initialFormData);
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.UserID);
    setFormData({ FirstName: user.FirstName, LastName: user.LastName, Email: user.Email, Role: user.Role });
  };

  const handleDelete = async (userId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?');
    if (!confirmed) return;

    try {
      setError(null);
      await axios.delete(`${API_BASE_URL}/${userId}`);
      await fetchUsers();
      if (editingUserId === userId) {
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
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleFormSubmit} className="user-form">
        <input
          type="text"
          name="FirstName"
          placeholder="First Name"
          value={formData.FirstName}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="LastName"
          placeholder="Last Name"
          value={formData.LastName}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="Email"
          placeholder="Email"
          value={formData.Email}
          onChange={handleInputChange}
          required
        />
        <select name="Role" value={formData.Role} onChange={handleInputChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingUserId ? 'Update User' : 'Add User'}
          </button>
          {editingUserId && (
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="user-list">
        <div className="user-list-header">
          <div>First Name</div>
          <div>Last Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Actions</div>
        </div>
        {users.map((user) => (
          <div key={user.UserID} className="user-list-item">
            <div>{user.FirstName}</div>
            <div>{user.LastName}</div>
            <div>{user.Email}</div>
            <div>{user.Role}</div>
            <div className="user-actions">
              <button className="edit-btn" onClick={() => handleEdit(user)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => handleDelete(user.UserID)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
