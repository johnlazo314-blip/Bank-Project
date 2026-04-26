import { useEffect, useState } from 'react';
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

const TransactionList = () => {
  const { isAdmin } = useUserContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    apiClient.get<Transaction[]>('/api/transactions')
      .then((res) => setTransactions(res.data))
      .catch(() => setError('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const filtered = filterType === 'all'
    ? transactions
    : transactions.filter((t) => t.TransactionType === filterType);

  if (loading) return <p className="tx-loading">Loading transactions...</p>;
  if (error) return <p className="tx-error">{error}</p>;

  return (
    <div className="tx-container">
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

      {filtered.length === 0 ? (
        <p className="tx-empty">No transactions found.</p>
      ) : (
        <div className="tx-list">
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
