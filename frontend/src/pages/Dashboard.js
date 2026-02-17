import React, { useState, useEffect } from 'react';
import { getUsers, getProducts, getApiInfo } from '../utils/api';

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, productsData, apiData] = await Promise.all([
          getUsers(),
          getProducts(),
          getApiInfo()
        ]);
        
        setUsers(usersData.users || []);
        setProducts(productsData.products || []);
        setStats(apiData.stats || {});
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUserInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '2rem' }}>🌱</div>
            <div>Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <div className="user-info">
            <div className="user-avatar">
              {getUserInitial(user.user?.name)}
            </div>
            <div className="user-details">
              <h3>Welcome, {user.user?.name}!</h3>
              <p>{user.user?.role} • ID: {user.user?.id}</p>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.registeredUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.farmers || 0}</div>
            <div className="stat-label">Farmers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.buyers || 0}</div>
            <div className="stat-label">Buyers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Products</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Recent Users</h3>
            {users.slice(0, 5).map(user => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.role}</div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {user.profile?.district}, {user.profile?.state}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>Sample Products</h3>
            {products.slice(0, 5).map(product => (
              <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <strong>{product.name}</strong>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{product.farmer} • {product.location}</div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 'bold' }}>
                  ₹{product.price}/{product.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
