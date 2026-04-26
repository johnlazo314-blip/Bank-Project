import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useUserContext } from '../context/UserContext';
import './Dashboard.css';

interface Account {
  AccountID: number;
  UserID: number;
  AccountType: 'checking' | 'savings';
  Balance: number;
}

const Dashboard = () => {
  const { dbUser, isAdmin } = useUserContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Account[]>('/api/accounts')
      .then((res) => setAccounts(res.data))
      .catch(() => setError('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, []);

  const formatBalance = (balance: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.Balance), 0);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome back, {dbUser?.FirstName}!</h1>
        {isAdmin && <span className="admin-badge">Admin</span>}
      </div>

      <div className="dashboard-summary">
        <div className="summary-card total">
          <p className="summary-label">{isAdmin ? 'Total Across All Accounts' : 'Total Balance'}</p>
          <p className="summary-amount">{formatBalance(totalBalance)}</p>
        </div>
        <div className="summary-card count">
          <p className="summary-label">{isAdmin ? 'Total Accounts' : 'Your Accounts'}</p>
          <p className="summary-amount">{accounts.length}</p>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Accounts</h2>
          <Link to="/accounts" className="view-all-link">Manage Accounts →</Link>
        </div>

        {loading && <p className="dashboard-loading">Loading accounts...</p>}
        {error && <p className="dashboard-error">{error}</p>}

        {!loading && !error && accounts.length === 0 && (
          <p className="dashboard-empty">No accounts yet. <Link to="/accounts">Create one →</Link></p>
        )}

        <div className="account-cards">
          {accounts.map((account) => (
            <div key={account.AccountID} className="account-card">
              <div className="account-card-top">
                <span className={`account-type-badge ${account.AccountType}`}>
                  {account.AccountType.charAt(0).toUpperCase() + account.AccountType.slice(1)}
                </span>
                {isAdmin && <span className="account-owner">User #{account.UserID}</span>}
              </div>
              <p className="account-card-balance">{formatBalance(account.Balance)}</p>
              <p className="account-card-number">Account #{account.AccountID}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Quick Links</h2>
        </div>
        <div className="quick-links">
          <Link to="/accounts" className="quick-link-card">
            <span className="quick-link-icon">🏦</span>
            <span>Accounts</span>
          </Link>
          <Link to="/transactions" className="quick-link-card">
            <span className="quick-link-icon">📋</span>
            <span>Transactions</span>
          </Link>
          <Link to="/profile" className="quick-link-card">
            <span className="quick-link-icon">👤</span>
            <span>Profile</span>
          </Link>
          {isAdmin && (
            <Link to="/users" className="quick-link-card">
              <span className="quick-link-icon">⚙️</span>
              <span>User Management</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
