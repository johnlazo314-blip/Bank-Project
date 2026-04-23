import AccountList from '../Components/AccountList';
import './Accounts.css';

const Accounts = () => {
  return (
    <div className="accounts-page">
      <h1>Account Management</h1>
      <AccountList />
    </div>
  );
};

export default Accounts;
