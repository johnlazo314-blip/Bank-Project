import { useState, type FormEvent } from 'react';
import { useUserContext } from '../context/UserContext';
import apiClient from '../api/apiClient';
import './Profile.css';

const Profile = () => {
  const { dbUser, isAdmin } = useUserContext();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    FirstName: dbUser?.FirstName ?? '',
    LastName: dbUser?.LastName ?? '',
  });

  if (!dbUser) return <p className="profile-loading">Loading profile...</p>;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await apiClient.put(`/api/users/${dbUser.UserID}`, formData);
      setSuccess(true);
      setEditing(false);
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <h1>My Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar">
          {dbUser.FirstName.charAt(0)}{dbUser.LastName.charAt(0)}
        </div>

        <div className="profile-info">
          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className={`role-badge ${dbUser.Role}`}>
              {isAdmin ? 'Administrator' : 'User'}
            </span>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="profile-field">
                <label>First Name</label>
                <input
                  type="text"
                  value={formData.FirstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, FirstName: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label>Last Name</label>
                <input
                  type="text"
                  value={formData.LastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, LastName: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label>Email</label>
                <input type="email" value={dbUser.Email} disabled className="disabled-input" />
                <small>Email is managed by your identity provider</small>
              </div>
              {error && <p className="profile-error">{error}</p>}
              <div className="profile-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="cancel-btn" onClick={() => {
                  setEditing(false);
                  setFormData({ FirstName: dbUser.FirstName, LastName: dbUser.LastName });
                }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="profile-row">
                <span className="profile-label">First Name</span>
                <span className="profile-value">{dbUser.FirstName}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Last Name</span>
                <span className="profile-value">{dbUser.LastName}</span>
              </div>
              <div className="profile-row">
                <span className="profile-label">Email</span>
                <span className="profile-value">{dbUser.Email}</span>
              </div>
              {success && <p className="profile-success">Profile updated successfully.</p>}
              <button className="edit-btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
