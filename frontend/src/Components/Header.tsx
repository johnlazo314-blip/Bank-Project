import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">
          <Link to="/">NorthBank</Link>
        </h1>
        <nav className="nav">
          <ul className="nav-list">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/accounts">Accounts</Link></li>
            <li><Link to="/users">User Management</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
