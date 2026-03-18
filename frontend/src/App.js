import React, { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import AdminDashboard from './components/AdminDashboard';
import ResponderDashboard from './components/ResponderDashboard';
import CitizenDashboard from './components/CitizenDashboard';

function App() {
  const [user, setUser] = useState(null);

  // Check localStorage on app load to persist user session
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const getDashboardComponent = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      case 'RESPONDER':
        return <ResponderDashboard user={user} onLogout={handleLogout} />;
      case 'CITIZEN':
        return <CitizenDashboard user={user} onLogout={handleLogout} />;
      default:
        return <CitizenDashboard user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="App">
      {!user ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        getDashboardComponent()
      )}
    </div>
  );
}

export default App;
