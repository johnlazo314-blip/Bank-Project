import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';
import Accounts from './pages/Accounts';
import SecureRoute from './Components/SecureRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<SecureRoute><UserManagement /></SecureRoute>} />
            <Route path="/accounts" element={<SecureRoute><Accounts /></SecureRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App
