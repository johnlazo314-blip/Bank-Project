import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import axios, { type AxiosError } from 'axios';
import { getAuthToken, getCurrentUserRole } from '../auth';
import './Transaction.css';

interface Account {
  AccountID: number;
  UserID: number;
  AccountType: 'checking' | 'savings';
  Balance: number;
  owner?: {
    FirstName: string;
    LastName: string;
    Email: string;
  };
}

interface TargetAccountOption {
  AccountID: number;
  AccountType: 'checking' | 'savings';
}

interface UserOption {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
}

interface CurrentUser {
  UserID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: 'user' | 'admin';
}

interface TransactionRecord {
  TransactionID: number;
  AccountID: number;
  Amount: number;
  TransactionType: 'withdrawal' | 'deposit' | 'transfer';
  TransferID: number | null;
  Timestamp: string;
  account?: Account;
  transfer?: {
    TransferID: number;
    FromAccountID: number;
    ToAccountID: number;
    Amount: number;
    Timestamp: string;
  };
}

interface TransactionFormData {
  accountId: string;
  transactionType: 'withdraw' | 'deposit' | 'transfer';
  amount: string;
  targetUserId: string;
  targetAccountId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const ACCOUNTS_URL = `${API_BASE_URL}/api/accounts`;
const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;
const USERS_URL = `${API_BASE_URL}/api/users`;

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Transaction = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserOption | null>(null);
  const [selectedTargetAccounts, setSelectedTargetAccounts] = useState<TargetAccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>({
    accountId: '',
    transactionType: 'withdraw',
    amount: '',
    targetUserId: '',
    targetAccountId: '',
  });

  const currentRole = getCurrentUserRole();
  const isAdmin = currentRole === 'admin';

  const currentAccounts = useMemo(
    () => (isAdmin ? accounts : accounts.filter(account => account.UserID === currentUser?.UserID)),
    [accounts, currentUser?.UserID, isAdmin]
  );

  const availableTargetAccounts = useMemo(
    () =>
      selectedTargetAccounts.filter(
        account => account.AccountID !== Number(formData.accountId)
      ),
    [formData.accountId, selectedTargetAccounts]
  );

  const getDisplayBalance = (balance: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(balance);

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const loadUsers = async () => {
    const response = await axios.get<UserOption[]>(USERS_URL, { headers: getAuthHeaders() });
    setUsers(response.data);
  };

  const loadAccounts = async () => {
    const response = await axios.get<Account[]>(ACCOUNTS_URL, { headers: getAuthHeaders() });
    setAccounts(response.data);
  };

  const loadTransactions = async () => {
    const response = await axios.get<TransactionRecord[]>(TRANSACTIONS_URL, { headers: getAuthHeaders() });
    setTransactions(response.data);
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

    const fetchData = async () => {
      try {
        await Promise.all([loadAccounts(), loadUsers(), loadTransactions()]);
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        setError(axiosErr.response?.data?.message ?? 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!formData.targetUserId) {
      setSelectedTargetUser(null);
      setSelectedTargetAccounts([]);
      return;
    }

    const targetUser = users.find(user => user.UserID === Number(formData.targetUserId)) ?? null;
    setSelectedTargetUser(targetUser);

    const loadTargetAccounts = async () => {
      try {
        const response = await axios.get<TargetAccountOption[]>(`${ACCOUNTS_URL}/user/${formData.targetUserId}`, {
          headers: getAuthHeaders(),
        });

        setSelectedTargetAccounts(response.data);
      } catch {
        setSelectedTargetAccounts([]);
        setError('Failed to load target accounts for the selected user.');
      }
    };

    loadTargetAccounts();
  }, [formData.targetUserId, users]);

  useEffect(() => {
    if (!formData.targetAccountId) {
      return;
    }

    const isStillValid = availableTargetAccounts.some(
      account => account.AccountID === Number(formData.targetAccountId)
    );

    if (!isStillValid) {
      setFormData(previous => ({
        ...previous,
        targetAccountId: '',
      }));
    }
  }, [availableTargetAccounts, formData.targetAccountId]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setFormData(previous => ({
      ...previous,
      [name]: value,
      ...(name === 'transactionType' && value !== 'transfer'
        ? { targetUserId: '', targetAccountId: '' }
        : null),
      ...(name === 'targetUserId' ? { targetAccountId: '' } : null),
    }));
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      transactionType: 'withdraw',
      amount: '',
      targetUserId: '',
      targetAccountId: '',
    });
  };

  const getTransactionLabel = (transaction: TransactionRecord) => {
    if (transaction.TransactionType === 'transfer' && transaction.transfer) {
      if (transaction.AccountID === transaction.transfer.FromAccountID) {
        return 'Transfer withdrawal';
      }

      if (transaction.AccountID === transaction.transfer.ToAccountID) {
        return 'Transfer deposit';
      }

      return 'Transfer';
    }

    return transaction.TransactionType === 'withdrawal' ? 'Withdrawal' : 'Deposit';
  };

  const getDisplayedTransactionAmount = (transaction: TransactionRecord) => {
    const amount = Number(transaction.Amount);
    const isWithdrawal =
      transaction.TransactionType === 'withdrawal' ||
      (transaction.TransactionType === 'transfer' &&
        transaction.transfer &&
        transaction.AccountID === transaction.transfer.FromAccountID);

    return isWithdrawal ? -Math.abs(amount) : Math.abs(amount);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const accountId = Number(formData.accountId);
    const amount = Number(formData.amount);

    if (!accountId || !amount || amount <= 0) {
      setError('Please choose an account and enter a valid amount.');
      return;
    }

    if (formData.transactionType === 'transfer' && !formData.targetAccountId) {
      setError('Please choose a target account for the transfer.');
      return;
    }

    if (formData.transactionType === 'transfer' && formData.accountId === formData.targetAccountId) {
      setError('You cannot transfer money into the same account.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, unknown> = {
        AccountID: accountId,
        Amount: amount,
        Type: formData.transactionType,
      };

      if (formData.transactionType === 'transfer') {
        payload.ToAccountID = Number(formData.targetAccountId);
      }

      const response = await axios.post<TransactionRecord | TransactionRecord[]>(
        TRANSACTIONS_URL,
        payload,
        { headers: getAuthHeaders() }
      );

      const returnedTransactions = Array.isArray(response.data) ? response.data : [response.data];
      setTransactions(previous => [...returnedTransactions, ...previous]);
      setSuccessMessage('Transaction completed successfully.');

      await Promise.all([loadAccounts(), loadTransactions()]);
      resetForm();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? 'Failed to process transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="loading">Loading transaction page...</p>;
  }

  return (
    <div className="transaction-page">
      <h1>Transactions</h1>

      <div className="transaction-container">
        <section className="transaction-form-section">
          <h2>New Transaction</h2>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="accountId">From Account</label>
              <select id="accountId" name="accountId" value={formData.accountId} onChange={handleChange} required>
                <option value="">Select an account</option>
                {currentAccounts.map(account => (
                  <option key={account.AccountID} value={account.AccountID}>
                    #{account.AccountID} - {account.AccountType} - {getDisplayBalance(account.Balance)}
                    {isAdmin && account.owner ? ` - ${account.owner.FirstName} ${account.owner.LastName}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="transactionType">Transaction Type</label>
              <select id="transactionType" name="transactionType" value={formData.transactionType} onChange={handleChange}>
                <option value="withdraw">Withdraw</option>
                <option value="deposit">Deposit</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            {formData.transactionType === 'transfer' && (
              <>
                <div className="form-group">
                  <label htmlFor="targetUserId">Transfer To User</label>
                  <select id="targetUserId" name="targetUserId" value={formData.targetUserId} onChange={handleChange} required>
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user.UserID} value={user.UserID}>
                        {user.FirstName} {user.LastName}
                        {currentUser?.UserID === user.UserID ? ' (You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="targetAccountId">To Account</label>
                  <select
                    id="targetAccountId"
                    name="targetAccountId"
                    value={formData.targetAccountId}
                    onChange={handleChange}
                    required
                    disabled={!selectedTargetUser}
                  >
                    <option value="">Select target account</option>
                    {availableTargetAccounts.length > 0 ? (
                      availableTargetAccounts.map(account => (
                        <option key={account.AccountID} value={account.AccountID}>
                          #{account.AccountID} - {account.AccountType}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No eligible accounts available
                      </option>
                    )}
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? 'Processing...' : 'Process Transaction'}
            </button>
          </form>
        </section>

        <section className="transaction-history-section">
          <h2>Transaction History</h2>

          {transactions.length === 0 ? (
            <p className="no-transactions">No transactions yet.</p>
          ) : (
            <div className="transaction-list">
              {transactions.map(transaction => (
                <article
                  key={transaction.TransactionID}
                  className={`transaction-item ${getDisplayedTransactionAmount(transaction) < 0 ? 'transaction-item--negative' : 'transaction-item--positive'}`}
                >
                  <div className="transaction-header">
                    <span className="transaction-type">{getTransactionLabel(transaction)}</span>
                    <span className="transaction-date">{formatTimestamp(transaction.Timestamp)}</span>
                  </div>
                  <div className="transaction-body">
                    <span
                      className={`transaction-amount ${getDisplayedTransactionAmount(transaction) < 0 ? 'transaction-amount--negative' : 'transaction-amount--positive'}`}
                    >
                      {getDisplayBalance(getDisplayedTransactionAmount(transaction))}
                    </span>
                    <span className="transaction-meta">
                      Account #{transaction.AccountID}
                      {transaction.account?.owner
                        ? ` - ${transaction.account.owner.FirstName} ${transaction.account.owner.LastName}`
                        : ''}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Transaction;
