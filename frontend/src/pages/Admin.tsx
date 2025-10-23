import React, { useState, useEffect } from 'react';
import { Users, Shield, FileText, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import type { AdminUser, SystemStats } from '../types';

const Admin: React.FC = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const loadAdminData = async () => {
    if (!token) return;

    try {
      const [usersResponse, statsResponse] = await Promise.all([
        adminService.getAllUsers(token),
        adminService.getSystemStats(token)
      ]);

      setUsers(usersResponse.users || []);
      setStats(statsResponse);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (userId: string, blocked: boolean) => {
    if (!token) return;

    try {
      await adminService.toggleUserBlock(userId, blocked, token);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isBlocked: blocked } : user
      ));
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
          System overview and user management
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-brand-light)',
                borderRadius: '8px'
              }}>
                <Users size={24} style={{ color: 'var(--color-brand)' }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                  {stats.users.total}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                  Total Users
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                padding: 'var(--space-3)',
                backgroundColor: '#dbeafe',
                borderRadius: '8px'
              }}>
                <FileText size={24} style={{ color: 'var(--color-info)' }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                  {stats.files.total}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                  Total Files
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                padding: 'var(--space-3)',
                backgroundColor: '#fee2e2',
                borderRadius: '8px'
              }}>
                <Shield size={24} style={{ color: 'var(--color-error)' }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                  {stats.users.blocked}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                  Blocked Users
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                padding: 'var(--space-3)',
                backgroundColor: '#fef3c7',
                borderRadius: '8px'
              }}>
                <Activity size={24} style={{ color: 'var(--color-warning)' }} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                  {stats.activity.highRiskAttempts}
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                  High Risk Attempts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">User Management</h3>
        </div>
        {users.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    User
                  </th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Files
                  </th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Recent Logins
                  </th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Status
                  </th>
                  <th style={{ padding: 'var(--space-3)', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <div>
                        <div style={{ fontWeight: 'var(--font-medium)' }}>{user.email}</div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                          {user.isAdmin && <span style={{ color: 'var(--color-brand)' }}>Admin • </span>}
                          Joined {new Date(user.createdAt || '').toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                      {user.fileCount}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                      {user.recentLogins}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className={`risk-indicator ${user.isBlocked ? 'risk-high' : 'risk-low'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleToggleBlock(user.id, !user.isBlocked)}
                          className={`btn btn-sm ${user.isBlocked ? 'btn-primary' : 'btn-danger'}`}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-gray-500)' }}>
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;