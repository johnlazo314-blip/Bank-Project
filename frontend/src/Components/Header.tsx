import { Link } from 'react-router-dom';
import { useAuthContext } from '@asgardeo/auth-react';
import { clearAuth, getCurrentUserRole, isAuthenticated } from '../auth';
import './Header.css';

export default function Header() {
  const { signOut } = useAuthContext();
  const loggedIn = isAuthenticated();
  const role = getCurrentUserRole();
  const isAdmin = role === 'admin';

  const handleLogout = async () => {
    clearAuth();
    await signOut();
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">
          <Link to="/">NorthBank</Link>
        </h1>
        <nav className="nav">
          <ul className="nav-list">
            <li><Link to="/">Home</Link></li>
            {loggedIn && <li><Link to="/accounts">Accounts</Link></li>}
            {loggedIn && isAdmin && <li><Link to="/users">User Management</Link></li>}
            {!loggedIn && <li><Link to="/login">Login</Link></li>}
            {loggedIn && (
              <li>
                <button type="button" onClick={handleLogout}>Logout</button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}
