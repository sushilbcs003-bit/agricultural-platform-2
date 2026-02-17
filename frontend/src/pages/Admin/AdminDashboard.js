import React, { useState, useEffect } from 'react';
import { getAdminDashboard } from '../../utils/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await getAdminDashboard();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-primary" onClick={fetchDashboard}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Platform Overview</h2>
        <button className="btn btn-primary" onClick={fetchDashboard}>
          Refresh
        </button>
      </div>

      <div className="dashboard-widgets">
        {/* Users Widget */}
        <div className="widget widget-large">
          <h3>👥 Users</h3>
          <div className="widget-content">
            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-value">{data.users?.total?.buyers || data.users?.buyers || 0}</div>
                <div className="stat-label">Buyers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{data.users?.total?.farmers || data.users?.farmers || 0}</div>
                <div className="stat-label">Farmers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{data.users?.total?.suppliers || data.users?.suppliers || 0}</div>
                <div className="stat-label">Suppliers</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{data.users?.total?.total || data.users?.total || 0}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            <div className="widget-footer">
              <span>New today: {data.users?.newRegistrations?.today || 0}</span>
              <span>New this week: {data.users?.newRegistrations?.week || 0}</span>
            </div>
          </div>
        </div>

        {/* Active Users Widget */}
        <div className="widget">
          <h3>📈 Active Users</h3>
          <div className="widget-content">
            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-value">{data.users?.active?.dau || 0}</div>
                <div className="stat-label">DAU</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{data.users?.active?.mau || 0}</div>
                <div className="stat-label">MAU</div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Widget */}
        <div className="widget">
          <h3>📦 Orders</h3>
          <div className="widget-content">
            <div className="stat-value-large">{data.orders?.createdToday || data.orders?.total || 0}</div>
            <div className="stat-label">Created Today</div>
          </div>
        </div>

        {/* Offers Widget */}
        <div className="widget">
          <h3>💰 Offers</h3>
          <div className="widget-content">
            <div className="stat-value-large">{data.offers?.createdToday || data.offers?.total || 0}</div>
            <div className="stat-label">Created Today</div>
          </div>
        </div>

        {/* OTP Widget */}
        <div className="widget">
          <h3>🔐 OTP Success Rate</h3>
          <div className="widget-content">
            <div className="stat-value-large">{data.otp?.successRate || 0}%</div>
            <div className="stat-label">
              {data.otp?.successful || 0} / {data.otp?.total || 0} successful
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${data.otp?.successRate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className="widget">
          <h3>⏳ Pending Approvals</h3>
          <div className="widget-content">
            <div className="stat-item">
              <div className="stat-value">{data.pendingApprovals?.products || 0}</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{data.pendingApprovals?.machinery || 0}</div>
              <div className="stat-label">Machinery</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{data.pendingApprovals?.transport || 0}</div>
              <div className="stat-label">Transport</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;





