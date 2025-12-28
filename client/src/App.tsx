import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { authService } from './services/authService';
import './App.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());

  useEffect(() => {
    // Simple routing - listen for path changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setIsAuthenticated(authService.isAuthenticated());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Redirect to login if not authenticated
  if (!isAuthenticated && currentPath !== '/register') {
    if (currentPath !== '/') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
    return currentPath === '/register' ? <Register /> : <Login />;
  }

  // Redirect to dashboard if authenticated and on login page
  if (isAuthenticated && (currentPath === '/' || currentPath === '/register')) {
    window.history.pushState({}, '', '/dashboard');
    setCurrentPath('/dashboard');
  }

  // Route rendering
  if (currentPath === '/register') {
    return <Register />;
  }

  if (currentPath === '/dashboard') {
    return <Dashboard />;
  }

  if (currentPath === '/') {
    return <Login />;
  }

  // Default fallback
  return <Dashboard />;
}

export default App;