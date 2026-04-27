import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUserRole } from '../auth';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const role = getCurrentUserRole();
  const isAdmin = role === 'admin';

  const handleCardClick = (path: string) => {
    if (!loggedIn) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Your Bank</h1>
          <p>Simple, secure, and convenient banking at your fingertips.</p>
        </div>
      </section>

      <section className="features-section">
        <button
          type="button"
          className="feature-card feature-card-button"
          onClick={() => handleCardClick('/accounts')}
        >
          <h2>View Accounts</h2>
          <p>Check account balances and details in real-time.</p>
        </button>
        <button
          type="button"
          className="feature-card feature-card-button"
          onClick={() => handleCardClick('/transactions')}
        >
          <h2>Track Transactions</h2>
          <p>Keep an eye on all incoming and outgoing transactions.</p>
        </button>
        {isAdmin && (
          <button
            type="button"
            className="feature-card feature-card-button"
            onClick={() => handleCardClick('/users')}
          >
            <h2>Manage Users</h2>
            <p>Easily add, edit, and manage user accounts.</p>
          </button>
        )}
      </section>
    </div>
  );
};

export default Home;
