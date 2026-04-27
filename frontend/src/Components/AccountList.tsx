import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import axios, { type AxiosError } from 'axios';
import { getAuthToken, getCurrentUserRole } from '../auth';
import './AccountList.css';

interface Account {
  AccountID: number;
  UserID: number;
  AccountType: 'checking' | 'savings';
  Balance: number;
}

interface AccountFormData {
  UserID: string;
  AccountType: 'checking' | 'savings';
  Balance: string;
}

interface UserOption {
  UserID: number;
  FirstName: string;
  LastName: string;
}

interface CurrentUser {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'user' | 'admin';
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/accounts`;
const USERS_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/users`;

const getAuthHeaders = () => {
  const token = getAuthToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const initialFormData: AccountFormData = {
  UserID: '',
  AccountType: 'checking',
  Balance: '0.00',
};

const AccountList = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AccountFormData>(initialFormData);
  const currentRole = getCurrentUserRole();
  const isAdmin = currentRole === 'admin';

  const fetchAccounts = async () => {
    try {
      setLoading(true);
        const response = await axios.get<Account[]>(API_BASE_URL, { headers: getAuthHeaders() });
      setAccounts(response.data);
      setError(null);
    } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        setError(axiosErr.response?.data?.message ?? 'Failed to fetch accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
        const response = await axios.get<UserOption[]>(USERS_API_BASE_URL, { headers: getAuthHeaders() });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser) as CurrentUser);
      } catch {
        setCurrentUser(null);
      }
    }

    fetchAccounts();
    fetchUsers();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingAccountId(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const payload = {
        ...formData,
        UserID: parseInt(formData.UserID, 10),
        Balance: parseFloat(formData.Balance),
      };

      if (isAdmin) {
        if (!users.some(user => user.UserID === payload.UserID)) {
          setError('Select a valid user before creating an account.');
          return;
        }
      } else if (!currentUser) {
        setError('Unable to determine the logged in user. Please sign in again.');
        return;
      }

      if (editingAccountId !== null) {
          await axios.put(`${API_BASE_URL}/${editingAccountId}`, payload, { headers: getAuthHeaders() });
      } else {
          await axios.post(
            API_BASE_URL,
            isAdmin ? payload : { AccountType: payload.AccountType, Balance: payload.Balance },
            { headers: getAuthHeaders() }
          );
      }
      await fetchAccounts();
      resetForm();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const serverMsg = axiosErr.response?.data?.message;
      setError(serverMsg ?? (editingAccountId !== null ? 'Failed to update account' : 'Failed to create account'));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccountId(account.AccountID);
    setFormData({
      UserID: String(account.UserID),
      AccountType: account.AccountType,
      Balance: String(account.Balance),
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      setError(null);
      await axios.delete(`${API_BASE_URL}/${id}`, { headers: getAuthHeaders() });
      await fetchAccounts();
      if (editingAccountId === id) resetForm();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      const serverMsg = axiosErr.response?.data?.message;
      setError(serverMsg ?? 'Failed to delete account');
      console.error(err);
    }
  };

  const formatBalance = (balance: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance);

  if (loading) return <p>Loading accounts...</p>;

  return (
    <div className="account-list-container">
      <h2>{editingAccountId !== null ? 'Edit Account' : 'Add New Account'}</h2>

      <form className="account-form" onSubmit={handleSubmit}>
        {isAdmin ? (
          <select name="UserID" value={formData.UserID} onChange={handleChange} required>
            <option value="" disabled>
              Select User
            </option>
            {users.map(user => (
              <option key={user.UserID} value={user.UserID}>
                #{user.UserID} - {user.FirstName} {user.LastName}
              </option>
            ))}
          </select>
        ) : (
          <div className="account-form-readonly">
            <label>Account owner</label>
            <div>
              {currentUser
                ? `#${currentUser.UserID} - ${currentUser.FirstName} ${currentUser.LastName}`
                : 'Current logged in user'}
            </div>
          </div>
        )}
        <select name="AccountType" value={formData.AccountType} onChange={handleChange}>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </select>
        <input
          type="number"
          name="Balance"
          placeholder="Opening Balance"
          value={formData.Balance}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
        />

        <div className="form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : editingAccountId !== null ? 'Update Account' : 'Create Account'}
          </button>
          {editingAccountId !== null && (
            <button type="button" className="cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}

      <h2>Accounts</h2>
      <ul className="account-list">
        {accounts.map(account => (
          <li key={account.AccountID} className="account-list-item">
            <div className="account-info">
              <strong className={`account-type ${account.AccountType}`}>
                {account.AccountType.charAt(0).toUpperCase() + account.AccountType.slice(1)}
              </strong>
              <span className="account-balance">{formatBalance(account.Balance)}</span>
              <small>User ID: {account.UserID} &nbsp;·&nbsp; Account #{account.AccountID}</small>
            </div>
            <div className="account-actions">
              <button onClick={() => handleEdit(account)}>Edit</button>
              <button onClick={() => handleDelete(account.AccountID)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {accounts.length === 0 && <p className="no-accounts">No accounts found.</p>}
    </div>
  );
};

export default AccountList;
