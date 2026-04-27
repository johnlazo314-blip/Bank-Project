import { useEffect, useState, type ChangeEvent } from 'react';
import { type AxiosError } from 'axios';
import apiClient from '../api/apiClient';
import { useUserContext } from '../context/UserContext';
import './TransactionList.css';

interface Transaction {
  TransactionID: number;
  AccountID: number;
  Amount: number;
  TransactionType: 'withdrawal' | 'deposit' | 'transfer';
  TransferID: number | null;
  Timestamp: string;
}

interface Account {
  AccountID: number;
  AccountType: 'checking' | 'savings';
  Balance: number;
}

type TxType = 'deposit' | 'withdraw' | 'transfer';

const TransactionList = () => {
  const { isAdmin } = useUserContext();

  // Transaction list state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Account list for form dropdowns
  const [accounts, setAccounts] = useState<Account[]>([]);

  // New transaction form state
  const [showForm, setShowForm] = useState(false);
  const [txType, setTxType] = useState<TxType>('deposit');
  const [formValues, setFormValues] = useState({ AccountID: '', ToAccountID: '', Amount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTransactions = () => {
    setLoading(true);
    apiClient.get<Transaction[]>('/api/transactions')
      .then((res) => setTransactions(res.data))
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
    apiClient.get<Account[]>('/api/accounts')
      .then((res) => setAccounts(res.data))
      .catch(() => {});
  }, []);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (txType === 'deposit') {
        await apiClient.post('/api/transactions/deposit', {
          AccountID: parseInt(formValues.AccountID, 10),
          Amount: parseFloat(formValues.Amount),
        });
      } else if (txType === 'withdraw') {
        await apiClient.post('/api/transactions/withdraw', {
          AccountID: parseInt(formValues.AccountID, 10),
          Amount: parseFloat(formValues.Amount),
        });
      } else {
        await apiClient.post('/api/transactions/transfer', {
          FromAccountID: parseInt(formValues.AccountID, 10),
          ToAccountID: parseInt(formValues.ToAccountID, 10),
          Amount: parseFloat(formValues.Amount),
        });
      }
      setFormValues({ AccountID: '', ToAccountID: '', Amount: '' });
      setShowForm(false);
      fetchTransactions();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setFormError(axiosErr.response?.data?.message ?? 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatAccountLabel = (a: Account) =>
    `#${a.AccountID} — ${a.AccountType.charAt(0).toUpperCase() + a.AccountType.slice(1)} (${formatAmount(a.Balance)})`;

  const filtered = filterType === 'all'
    ? transactions
    : transactions.filter((t) => t.TransactionType === filterType);

  return (
    <div className="tx-container">

      {/* New transaction form */}
      <div className="tx-new-section">
        {!showForm ? (
          <button className="tx-new-btn" onClick={() => setShowForm(true)}>
            + New Transaction
          </button>
        ) : (
          <form className="tx-form" onSubmit={handleSubmit}>
            <h3 className="tx-form-title">New Transaction</h3>

            <div className="tx-form-row">
              <label>Type</label>
              <div className="tx-type-tabs">
                {(['deposit', 'withdraw', 'transfer'] as TxType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`tx-type-tab ${txType === t ? 'active' : ''}`}
                    onClick={() => setTxType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="tx-form-row">
              <label>{txType === 'transfer' ? 'From Account' : 'Account'}</label>
              <select name="AccountID" value={formValues.AccountID} onChange={handleFormChange} required>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.AccountID} value={a.AccountID}>
                    {formatAccountLabel(a)}
                  </option>
                ))}
              </select>
            </div>

            {txType === 'transfer' && (
              <div className="tx-form-row">
                <label>To Account</label>
                <select name="ToAccountID" value={formValues.ToAccountID} onChange={handleFormChange} required>
                  <option value="">Select account</option>
                  {accounts
                    .filter((a) => String(a.AccountID) !== formValues.AccountID)
                    .map((a) => (
                      <option key={a.AccountID} value={a.AccountID}>
                        {formatAccountLabel(a)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="tx-form-row">
              <label>Amount</label>
              <input
                type="number"
                name="Amount"
                value={formValues.Amount}
                onChange={handleFormChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            {formError && <p className="tx-form-error">{formError}</p>}

            <div className="tx-form-actions">
              <button type="submit" className="tx-submit-btn" disabled={submitting}>
                {submitting ? 'Processing...' : `Confirm ${txType.charAt(0).toUpperCase() + txType.slice(1)}`}
              </button>
              <button type="button" className="tx-cancel-btn" onClick={() => {
                setShowForm(false);
                setFormError(null);
                setFormValues({ AccountID: '', ToAccountID: '', Amount: '' });
              }}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filters and list */}
      <div className="tx-toolbar">
        <span className="tx-count">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
        <div className="tx-filters">
          {['all', 'deposit', 'withdrawal', 'transfer'].map((type) => (
            <button
              key={type}
              className={`tx-filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="tx-loading">Loading transactions...</p>}
      {error && <p className="tx-error">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="tx-empty">No transactions yet. Use the form above to get started.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className={`tx-list ${isAdmin ? 'tx-list-admin' : ''}`}>
          <div className="tx-list-header">
            <span>Date</span>
            <span>Type</span>
            <span>Account #</span>
            {isAdmin && <span>Transfer ID</span>}
            <span className="tx-amount-col">Amount</span>
          </div>
          {filtered.map((tx) => (
            <div key={tx.TransactionID} className="tx-row">
              <span className="tx-date">{formatDate(tx.Timestamp)}</span>
              <span className={`tx-type-badge ${tx.TransactionType}`}>
                {tx.TransactionType.charAt(0).toUpperCase() + tx.TransactionType.slice(1)}
              </span>
              <span className="tx-account">#{tx.AccountID}</span>
              {isAdmin && <span className="tx-transfer">{tx.TransferID ?? '—'}</span>}
              <span className={`tx-amount ${tx.TransactionType === 'withdrawal' ? 'negative' : 'positive'}`}>
                {tx.TransactionType === 'withdrawal' ? '-' : '+'}{formatAmount(tx.Amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;
