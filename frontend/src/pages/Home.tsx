import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Your Bank</h1>
          <p>Simple, secure, and convenient banking at your fingertips.</p>
        </div>
      </section>

      <section className="features-section">
        <div className="feature-card">
          <h2>Manage Users</h2>
          <p>Easily add, edit, and manage user accounts.</p>
        </div>
        <div className="feature-card">
          <h2>View Accounts</h2>
          <p>Check account balances and details in real-time.</p>
        </div>
        <div className="feature-card">
          <h2>Track Transactions</h2>
          <p>Keep an eye on all incoming and outgoing transactions.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
