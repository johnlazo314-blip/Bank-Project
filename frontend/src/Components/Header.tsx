import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">NorthBank</h1>
        <nav className="nav">
          <ul className="nav-list">
            <li><a href="#home">Home</a></li>
            <li><a href="#accounts">Accounts</a></li>
            <li><a href="#transfers">Transfers</a></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
