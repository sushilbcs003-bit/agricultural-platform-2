import React, { useState } from 'react';
import './AdminLogin.css';

const AdminLogin = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Trim and normalize form data
    const trimmedData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim()
    };

    console.log('🔐 Admin login attempt:', { email: trimmedData.email, passwordLength: trimmedData.password.length });

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(trimmedData)
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok && data.success) {
        // Store admin token and info
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.admin));
        console.log('✅ Login successful');
        onLogin(data);
      } else {
        // Handle error response
        const errorMessage = data.error?.message || data.message || 'Invalid email or password';
        console.error('❌ Login failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>🔐 Admin Portal</h1>
          <p>Agricultural Platform Administration</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="admin@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {onBack && (
          <button
            type="button"
            className="btn btn-link"
            onClick={onBack}
            style={{ marginTop: '1rem' }}
          >
            ← Back to Home
          </button>
        )}

        <div className="admin-login-footer">
          <p className="text-muted">
            <small>Authorized personnel only</small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;





