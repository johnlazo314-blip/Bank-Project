import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { useAuthContext } from '@asgardeo/auth-react';
import { isAuthenticated } from '../auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const navigate = useNavigate();
  const { state, signIn, getAccessToken, getBasicUserInfo, getIDToken } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/accounts');
    }
  }, [navigate]);

  useEffect(() => {
    const syncSession = async () => {
      if (!state.isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);

        const [accessToken, idToken] = await Promise.all([
          getAccessToken(),
          getIDToken(),
        ]);

        const tokenCandidates = Array.from(
          new Set([accessToken, idToken].filter((token): token is string => Boolean(token)))
        );

        let authenticated = false;
        let lastError: unknown = null;

        for (const token of tokenCandidates) {
          try {
            const meResponse = await axios.get(`${API_BASE_URL}/api/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            localStorage.setItem('access_token', token);
            localStorage.setItem('current_user', JSON.stringify(meResponse.data));
            authenticated = true;
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!authenticated) {
          throw lastError ?? new Error('Unable to authenticate with Asgardeo tokens');
        }

        navigate('/accounts');
      } catch (err) {
        const axiosErr = err as AxiosError<{ message: string }>;
        setError(axiosErr.response?.data?.message ?? 'Failed to complete sign-in');
      } finally {
        setLoading(false);
      }
    };

    syncSession();
  }, [API_BASE_URL, getAccessToken, getBasicUserInfo, navigate, state.isAuthenticated]);

  const handleLogin = async () => {

    try {
      setLoading(true);
      setError(null);
      await signIn();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="accounts-page">
      <h1>Login</h1>
      <p>Sign in with Asgardeo to access your accounts.</p>
      <div className="account-form" style={{ maxWidth: 520 }}>
        <button type="button" onClick={handleLogin} disabled={loading}>
          {loading ? 'Redirecting...' : 'Login with Asgardeo'}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Login;
