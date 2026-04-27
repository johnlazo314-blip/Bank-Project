import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './Components/Header';
import Footer from './Components/Footer';
import ProtectedRoute from './Components/ProtectedRoute';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';
import Accounts from './pages/Accounts';
import Transaction from './pages/Transaction';
import Login from './pages/Login';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/users"
              element={(
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/accounts"
              element={(
                <ProtectedRoute>
                  <Accounts />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/transactions"
              element={(
                <ProtectedRoute>
                  <Transaction />
                </ProtectedRoute>
              )}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App
