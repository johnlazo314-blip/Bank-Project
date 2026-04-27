import { useEffect, useState, type ChangeEvent } from 'react';
import { type AxiosError } from 'axios';
import apiClient from '../api/apiClient';
import { useUserContext } from '../context/UserContext';
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

const initialFormData: AccountFormData = {
  UserID: '',
  AccountType: 'checking',
  Balance: '0.00',
};

const AccountList = () => {
  const { isAdmin, dbUser } = useUserContext();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AccountFormData>(initialFormData);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Account[]>('/api/accounts');
      setAccounts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingAccountId(null);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const userID = isAdmin ? parseInt(formData.UserID, 10) : dbUser!.UserID;
      const payload = {
        UserID: userID,
        AccountType: formData.AccountType,
        Balance: parseFloat(formData.Balance),
      };
      if (editingAccountId !== null) {
        await apiClient.put(`/api/accounts/${editingAccountId}`, payload);
      } else {
        await apiClient.post('/api/accounts', payload);
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
      await apiClient.delete(`/api/accounts/${id}`);
      await fetchAccounts();
      if (editingAccountId === id) resetForm();
    } catch (err) {
      setError('Failed to delete account');
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
        {isAdmin && (
          <input
            type="number"
            name="UserID"
            placeholder="User ID"
            value={formData.UserID}
            onChange={handleChange}
            required
            min="1"
          />
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
              <small>
                {isAdmin && <>User ID: {account.UserID} &nbsp;·&nbsp; </>}
                Account #{account.AccountID}
              </small>
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
