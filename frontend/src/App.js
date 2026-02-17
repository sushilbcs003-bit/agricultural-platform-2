import React, { useState, useEffect } from 'react';
import './App.css';
import HomePage from './pages/HomePage';
import FarmerRegistration from './pages/FarmerRegistration';
import BuyerRegistration from './pages/BuyerRegistration';
import SupplierRegistration from './pages/SupplierRegistration';
import LoginPage from './pages/LoginPage';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { checkApiHealth } from './utils/api';
import logger from './utils/logger';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [loginRole, setLoginRole] = useState('FARMER');
  const [pendingFarmerPhone, setPendingFarmerPhone] = useState('');
  const [farmerRegistrationFromLogin, setFarmerRegistrationFromLogin] = useState(false);
  const [adminPage, setAdminPage] = useState('dashboard');

  // Check API status on startup
  useEffect(() => {
    checkApiHealth()
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('disconnected'));
  }, []);

  // Check for existing user session
  useEffect(() => {
    const savedUser = localStorage.getItem('agricultural_user');
    const savedAdmin = localStorage.getItem('admin_user');
    const adminToken = localStorage.getItem('admin_token');
    
    if (savedAdmin && adminToken) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setAdminUser(adminData);
        setCurrentPage('admin');
      } catch (error) {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      }
    } else if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentPage('dashboard');
      } catch (error) {
        localStorage.removeItem('agricultural_user');
      }
    }
  }, []);

  // Session timeout: Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    if (!user && !adminUser) return;

    const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
    let inactivityTimer;
    let lastActivityTime = Date.now();

    // Update last activity time on user interactions
    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Check for inactivity periodically
    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        console.log('Session timeout: Auto-logging out due to inactivity');
        handleLogout();
        alert('Your session has expired due to inactivity. Please login again.');
      }
    };

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check inactivity every minute
    inactivityTimer = setInterval(checkInactivity, 60 * 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      if (inactivityTimer) {
        clearInterval(inactivityTimer);
      }
    };
    // eslint-disable-next-line
  }, [user, adminUser]); // handleLogout is stable, no need to include in deps

  const handleLogin = (userData) => {
    try {
      // Ensure we have a valid user object
      if (!userData) {
        console.error('handleLogin: No userData provided');
        return;
      }

      // Backend returns: { success: true, user: {...}, token: "...", message: "..." }
      // Normalize the user data structure to always have { user: {...} }
      let normalized;
      if (userData.user) {
        // Backend response structure: { success, user, token, message }
        normalized = { user: userData.user };
      } else if (userData.role) {
        // Direct user object
        normalized = { user: userData };
      } else {
        console.error('handleLogin: Invalid user data structure', userData);
        return;
      }
      
      // Validate that we have a user with a role
      const userObj = normalized.user;
      if (!userObj || !userObj.role) {
        console.error('handleLogin: Invalid user data structure - missing role', userData);
        return;
      }

      console.log('handleLogin: Setting user', normalized);
      setUser(normalized);
      localStorage.setItem('agricultural_user', JSON.stringify(normalized));
      setCurrentPage('dashboard');
    } catch (error) {
      console.error('handleLogin error:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAdminUser(null);
    localStorage.removeItem('agricultural_user');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    setCurrentPage('home');
  };

  // Session timeout: Auto-logout after 10 minutes of inactivity
  useEffect(() => {
    if (!user && !adminUser) return;

    const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
    let inactivityTimer;
    let lastActivityTime = Date.now();

    // Update last activity time on user interactions
    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Check for inactivity periodically
    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        console.log('Session timeout: Auto-logging out due to inactivity');
        handleLogout();
        alert('Your session has expired due to inactivity. Please login again.');
      }
    };

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check inactivity every minute
    inactivityTimer = setInterval(checkInactivity, 60 * 1000);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      if (inactivityTimer) {
        clearInterval(inactivityTimer);
      }
    };
  }, [user, adminUser, handleLogout]);

  const handleAdminLogin = (adminData) => {
    setAdminUser(adminData);
    setCurrentPage('admin');
    setAdminPage('dashboard');
  };

  const startFarmerRegistration = (phone, fromLogin = false) => {
    setPendingFarmerPhone(phone || '');
    setFarmerRegistrationFromLogin(fromLogin);
    setCurrentPage('farmer-register');
  };

  const renderPage = () => {
    // Admin portal
    if (adminUser) {
      return (
        <AdminLayout
          admin={adminUser}
          onLogout={handleLogout}
          currentPage={adminPage}
          onNavigate={setAdminPage}
        >
          {adminPage === 'dashboard' && <AdminDashboard />}
          {adminPage === 'users-buyers' && <div>Buyers Management (Coming Soon)</div>}
          {adminPage === 'users-farmers' && <div>Farmers Management (Coming Soon)</div>}
          {adminPage === 'users-suppliers' && <div>Suppliers Management (Coming Soon)</div>}
          {adminPage === 'products' && <div>Products Management (Coming Soon)</div>}
          {adminPage === 'offers' && <div>Offers Management (Coming Soon)</div>}
          {adminPage === 'orders' && <div>Orders Management (Coming Soon)</div>}
          {adminPage === 'machinery' && <div>Machinery Management (Coming Soon)</div>}
          {adminPage === 'transport' && <div>Transport Management (Coming Soon)</div>}
          {adminPage === 'quality' && <div>Quality Tests Management (Coming Soon)</div>}
          {adminPage === 'auth-logs' && <div>Auth & OTP Logs (Coming Soon)</div>}
          {adminPage === 'audit' && <div>Audit Logs (Coming Soon)</div>}
          {adminPage === 'admin-users' && <div>Admin Users Management (Coming Soon)</div>}
          {adminPage === 'admin-roles' && <div>Roles & Permissions (Coming Soon)</div>}
        </AdminLayout>
      );
    }

    // Regular user dashboards
    if (user) {
      try {
        console.log('Rendering page with user:', user);
        const role = user.user?.role || user.role;
        console.log('User role:', role);
        
        // Route to appropriate dashboard based on user role
        if (role === 'FARMER') {
          console.log('Rendering FarmerDashboard');
          return <FarmerDashboard user={user} onLogout={handleLogout} />;
        } else if (role === 'BUYER') {
          console.log('Rendering BuyerDashboard');
          return <BuyerDashboard user={user} onLogout={handleLogout} />;
        } else if (role === 'SUPPLIER') {
          console.log('Rendering SupplierDashboard');
          return <SupplierDashboard user={user} onLogout={handleLogout} />;
        } else {
          // Invalid role - clear user and show home
          console.error('Invalid user role:', role, 'User object:', user);
          handleLogout();
          return (
            <HomePage 
              onNavigate={setCurrentPage}
              apiStatus={apiStatus}
              onSelectLoginRole={(role) => {
                setLoginRole(role);
                setCurrentPage('login');
                setPendingFarmerPhone('');
              }}
              onAdminLogin={() => setCurrentPage('admin-login')}
            />
          );
        }
      } catch (error) {
        console.error('Error rendering dashboard:', error);
        console.error('Error stack:', error.stack);
        handleLogout();
        return (
          <HomePage 
            onNavigate={setCurrentPage}
            apiStatus={apiStatus}
            onSelectLoginRole={(role) => {
              setLoginRole(role);
              setCurrentPage('login');
              setPendingFarmerPhone('');
            }}
            onAdminLogin={() => setCurrentPage('admin-login')}
          />
        );
      }
    }

    switch (currentPage) {
      case 'admin-login':
        return (
          <AdminLogin
            onLogin={handleAdminLogin}
            onBack={() => setCurrentPage('home')}
          />
        );
      case 'farmer-register':
        return (
          <FarmerRegistration
            onLogin={handleLogin}
            onBack={() => {
              setCurrentPage('home');
              setPendingFarmerPhone('');
              setFarmerRegistrationFromLogin(false);
            }}
            initialPhone={pendingFarmerPhone}
            startAtDetails={Boolean(pendingFarmerPhone)}
            fromLogin={farmerRegistrationFromLogin}
          />
        );
      case 'buyer-register':
        return <BuyerRegistration onLogin={handleLogin} onBack={() => setCurrentPage('home')} />;
      case 'supplier-register':
        return <SupplierRegistration onBack={() => setCurrentPage('home')} onLogin={handleLogin} />;
      case 'login':
        return (
          <LoginPage
            role={loginRole}
            onLogin={handleLogin}
            onBack={() => setCurrentPage('home')}
            onStartFarmerRegistration={startFarmerRegistration}
          />
        );
      default:
        return (
          <HomePage 
            onNavigate={setCurrentPage}
            apiStatus={apiStatus}
            onSelectLoginRole={(role) => {
              setLoginRole(role);
              setCurrentPage('login');
              setPendingFarmerPhone('');
            }}
            onAdminLogin={() => setCurrentPage('admin-login')}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="App">
        {renderPage()}
      </div>
    </ErrorBoundary>
  );
}

export default App;
