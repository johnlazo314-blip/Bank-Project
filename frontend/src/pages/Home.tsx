import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@asgardeo/auth-react';
import './Home.css';

const Home = () => {
  const { state, signIn } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  if (state.isLoading) {
    return <div className="home-loading">Loading...</div>;
  }

  return (
    <div className="home-container">
      <h1 className="home-logo">NorthBank</h1>
      <button className="home-signin-btn" onClick={() => signIn()}>
        Sign In / Create Account
      </button>
    </div>
  );
};

export default Home;
