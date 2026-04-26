import { useAuthContext } from '@asgardeo/auth-react';
import { Link } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import './Header.css';

export default function Header() {
  const { state, signOut } = useAuthContext();
  const { isAdmin, dbUser } = useUserContext();

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">
          <Link to={state.isAuthenticated ? '/dashboard' : '/'}>NorthBank</Link>
        </h1>

        {state.isAuthenticated && (
          <nav className="nav">
            <ul className="nav-list">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/accounts">Accounts</Link></li>
              <li><Link to="/transactions">Transactions</Link></li>
              {isAdmin && <li><Link to="/users">User Management</Link></li>}
            </ul>
          </nav>
        )}

        <div className="auth-controls">
          {state.isAuthenticated ? (
            <>
              <Link to="/profile" className="profile-link">
                <span className="profile-initials">
                  {dbUser ? `${dbUser.FirstName.charAt(0)}${dbUser.LastName.charAt(0)}` : '?'}
                </span>
              </Link>
              <button onClick={() => signOut()}>Logout</button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
