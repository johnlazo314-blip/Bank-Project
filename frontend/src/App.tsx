import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import SecureRoute from './Components/SecureRoute';
import { UserProvider } from './context/UserContext';
import { useAuthInterceptor } from './hooks/useAuthInterceptor';
import './App.css';

function AppRoutes() {
  useAuthInterceptor();

  return (
    <Router>
      <div className="app-container">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<SecureRoute><Dashboard /></SecureRoute>} />
            <Route path="/accounts" element={<SecureRoute><Accounts /></SecureRoute>} />
            <Route path="/transactions" element={<SecureRoute><Transactions /></SecureRoute>} />
            <Route path="/profile" element={<SecureRoute><Profile /></SecureRoute>} />
            <Route path="/users" element={<SecureRoute adminOnly><UserManagement /></SecureRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  );
}

export default App;
