import TransactionList from '../Components/TransactionList';
import './Transactions.css';

const Transactions = () => {
  return (
    <div className="transactions-page">
      <h1>Transactions</h1>
      <TransactionList />
    </div>
  );
};

export default Transactions;
