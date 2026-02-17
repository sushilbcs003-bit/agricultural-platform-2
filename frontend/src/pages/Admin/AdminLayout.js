import React, { useState, useEffect } from 'react';
import './AdminLayout.css';

const AdminLayout = ({ children, admin, onLogout, currentPage, onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    // Get permissions from stored admin data
    const adminData = JSON.parse(localStorage.getItem('admin_user') || '{}');
    setPermissions(adminData.permissions || []);
  }, []);

  const hasPermission = (perm) => {
    return permissions.includes(perm) || permissions.includes('*');
  };

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      permission: 'audit.read'
    },
    {
      key: 'users',
      label: 'Users',
      icon: '👥',
      permission: 'users.read',
      children: [
        { key: 'users-buyers', label: 'Buyers', permission: 'users.read' },
        { key: 'users-farmers', label: 'Farmers', permission: 'users.read' },
        { key: 'users-suppliers', label: 'Suppliers', permission: 'users.read' }
      ]
    },
    {
      key: 'products',
      label: 'Products',
      icon: '🌾',
      permission: 'products.read'
    },
    {
      key: 'offers',
      label: 'Offers',
      icon: '💰',
      permission: 'offers.read'
    },
    {
      key: 'orders',
      label: 'Orders',
      icon: '📦',
      permission: 'orders.read'
    },
    {
      key: 'machinery',
      label: 'Machinery',
      icon: '🚜',
      permission: 'machinery.read'
    },
    {
      key: 'transport',
      label: 'Transport',
      icon: '🚚',
      permission: 'transport.read'
    },
    {
      key: 'quality',
      label: 'Quality Tests',
      icon: '🔬',
      permission: 'quality.read'
    },
    {
      key: 'auth-logs',
      label: 'Auth & OTP Logs',
      icon: '🔐',
      permission: 'otp.read'
    },
    {
      key: 'audit',
      label: 'Audit Logs',
      icon: '📋',
      permission: 'audit.read'
    },
    {
      key: 'admin-management',
      label: 'Admin Management',
      icon: '⚙️',
      permission: 'admin.manage_admins',
      children: [
        { key: 'admin-users', label: 'Admin Users', permission: 'admin.manage_admins' },
        { key: 'admin-roles', label: 'Roles & Permissions', permission: 'admin.manage_roles' }
      ]
    }
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.permission && !hasPermission(item.permission)) return false;
    if (item.children) {
      item.children = item.children.filter(child => 
        !child.permission || hasPermission(child.permission)
      );
      return item.children.length > 0;
    }
    return true;
  });

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🌱 Admin Portal</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleMenuItems.map(item => (
            <div key={item.key} className="nav-item">
              <button
                className={`nav-link ${currentPage === item.key ? 'active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
              {item.children && sidebarOpen && (
                <div className="nav-children">
                  {item.children.map(child => (
                    <button
                      key={child.key}
                      className={`nav-link child ${currentPage === child.key ? 'active' : ''}`}
                      onClick={() => onNavigate(child.key)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="admin-info">
              <span className="admin-name">{admin?.name || 'Admin'}</span>
              <span className="admin-roles">
                {admin?.roles?.join(', ') || 'Admin'}
              </span>
            </div>
            <button className="btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;





