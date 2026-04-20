import React from 'react';
import UserList from '../Components/UserList';
import './UserManagement.css';

const UserManagement = () => {
  return (
    <div className="user-management-container">
      <h1>User Management</h1>
      <UserList />
    </div>
  );
};

export default UserManagement;
