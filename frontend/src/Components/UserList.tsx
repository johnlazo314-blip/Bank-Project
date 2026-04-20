import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserList.css';

interface User {
  userID: number;
  FirstName: string;
  LastName: string;
  email: string;
  role: 'user' | 'admin';
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/users');
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-list-container">
      <h2>Users</h2>
      <ul className="user-list">
        {users.map(user => (
          <li key={user.userID} className="user-list-item">
            <div className="user-info">
              <strong>{user.FirstName} {user.LastName}</strong> ({user.role})
              <br />
              <small>{user.email}</small>
            </div>
            <div className="user-actions">
              <button>Edit</button>
              <button>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
