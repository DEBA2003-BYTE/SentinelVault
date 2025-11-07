import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  isBlocked: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  fileCount: number;
  recentLogins: number;
  zkpVerified: boolean;
  deviceFingerprint?: string;
  registeredLocation?: any;
  lastKnownLocation?: any;
  rejectionReasons?: string[];
}

interface Feedback {
  _id: string;
  email: string;
  complaint: string;
  rating: number;
  createdAt: string;
  status?: string;
  priority?: string;
}

interface AccessLog {
  _id: string;
  userId: string;
  user?: string;
  action: string;
  timestamp: string;
  allowed: boolean;
  riskScore: number;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: {
    city?: string;
    country?: string;
  };
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'block' | 'unblock' | 'delete';
  user: User | null;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const Admin: React.FC = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: 'block',
    user: null,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  useEffect(() => {
    if (user?.isAdmin && token) {
      fetchUsers();
      fetchFeedback();
      fetchLogs();
    }
  }, [user, token]);

  const fetchUsers = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const showBlockConfirmation = (targetUser: User, block: boolean) => {
    if (targetUser.isAdmin) {
      alert('Cannot block admin users');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: block ? 'block' : 'unblock',
      user: targetUser,
      title: block ? 'Block User' : 'Unblock User',
      message: block 
        ? `Are you sure you want to block ${targetUser.email}? They will not be able to login until unblocked.`
        : `Are you sure you want to unblock ${targetUser.email}? They will be able to login again.`,
      confirmText: block ? 'Block User' : 'Unblock User',
      onConfirm: () => handleBlockUser(targetUser.id, block),
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showDeleteConfirmation = (targetUser: User) => {
    if (targetUser.isAdmin) {
      alert('Cannot delete admin users');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      type: 'delete',
      user: targetUser,
      title: 'Delete User',
      message: `Are you sure you want to permanently delete ${targetUser.email}? This action cannot be undone and will delete all their files and data.`,
      confirmText: 'Delete User',
      onConfirm: () => handleDeleteUser(targetUser.id, targetUser.email),
      onCancel: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      console.log('Block/unblock user:', { userId, block });
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ blocked: block })
      });

      if (response.ok) {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchUsers(); // Refresh the user list
      } else {
        const error = await response.json();
        console.error('Failed to update user:', error);
        alert(`Failed to ${block ? 'block' : 'unblock'} user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Error ${block ? 'blocking' : 'unblocking'} user`);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      console.log('Deleting user:', { userId, email });
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        fetchUsers(); // Refresh the user list
      } else {
        const error = await response.json();
        console.error('Failed to delete user:', error);
        alert(`Failed to delete user: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const fetchFeedback = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/feedback/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setFeedback(data.feedback || []);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    }
  };

  // Note: handleUpdateFeedback available for future feedback management features
  // const handleUpdateFeedback = async (feedbackId: string, updates: any) => {
  //   try {
  //     const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  //     const response = await fetch(`${apiUrl}/api/feedback/${feedbackId}`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify(updates)
  //     });

  //     if (response.ok) {
  //       fetchFeedback(); // Refresh feedback list
  //     } else {
  //       console.error('Failed to update feedback');
  //     }
  //   } catch (error) {
  //     console.error('Error updating feedback:', error);
  //   }
  // };

  const fetchLogs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/admin/audit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-content">
            <h2>Access Denied</h2>
            <p>You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-content">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Registered Users ({users.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          💬 User Feedback ({feedback.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Access Logs ({logs.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Management</h2>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Device Fingerprint</th>
                    <th>Location</th>
                    <th>Registration Date</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center">
                        <div className="empty-state">
                          <h3>No users found</h3>
                          <p>No registered users in the system.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>
                            <div className="font-medium">{user.email}</div>
                            {user.isBlocked && (
                              <div className="text-xs text-red-600 font-medium mt-1">
                                🚫 BLOCKED
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`role ${user.isAdmin ? 'admin' : 'user'}`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${user.isBlocked ? 'blocked' : 'active'}`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs font-mono">
                            {user.deviceFingerprint ? 
                              user.deviceFingerprint.substring(0, 12) + '...' : 
                              'Not set'
                            }
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {user.registeredLocation ? 
                              `${user.registeredLocation.city || 'Unknown'}, ${user.registeredLocation.country || 'Unknown'}` : 
                              'Not detected'
                            }
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {user.isAdmin ? (
                              <span className="text-xs text-gray-500">Protected</span>
                            ) : (
                              <>
                                <button
                                  className={`btn ${user.isBlocked ? 'btn-success' : 'btn-warning'}`}
                                  onClick={() => showBlockConfirmation(user, !user.isBlocked)}
                                >
                                  {user.isBlocked ? 'Unblock' : 'Block'}
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => showDeleteConfirmation(user)}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Feedback</h2>
          </div>
          <div className="card-content">
            <div className="feedback-list">
              {feedback.length === 0 ? (
                <div className="empty-state">
                  <h3>No feedback yet</h3>
                  <p>No user feedback has been submitted.</p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item._id} className="feedback-item">
                    <div className="feedback-header">
                      <span className="feedback-rating">
                        {'★'.repeat(item.rating || 5)}{'☆'.repeat(5 - (item.rating || 5))}
                      </span>
                      <span className="feedback-date">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="feedback-message">{item.complaint}</p>
                    <small className="feedback-user">From: {item.email}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Access Logs</h2>
          </div>
          <div className="card-content">
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User Email</th>
                    <th>IP Address</th>
                    <th>Device Fingerprint</th>
                    <th>Location</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center">
                        <div className="empty-state">
                          <h3>No access logs found</h3>
                          <p>No access logs available in the system.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id}>
                        <td>
                          <div className="text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm font-medium">
                            {log.action}
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {log.user || 'Unknown'}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {log.ipAddress || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs font-mono">
                            {log.deviceFingerprint ? 
                              log.deviceFingerprint.substring(0, 12) + '...' : 
                              '-'
                            }
                          </div>
                        </td>
                        <td>
                          <div className="text-xs">
                            {log.location ? 
                              `${log.location.city || 'Unknown'}, ${log.location.country || 'Unknown'}` : 
                              '-'
                            }
                          </div>
                        </td>
                        <td>
                          <span className={`risk-score ${log.riskScore > 70 ? 'high' : log.riskScore > 30 ? 'medium' : 'low'}`}>
                            {log.riskScore}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${log.allowed ? 'active' : 'blocked'}`}>
                            {log.allowed ? 'Allowed' : 'Blocked'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs">
                            {log.reason || '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="confirmation-dialog">
          <div className="confirmation-content">
            <div className="confirmation-header">
              <div className={`confirmation-icon ${confirmDialog.type === 'delete' ? 'danger' : 'warning'}`}>
                {confirmDialog.type === 'delete' ? '🗑️' : confirmDialog.type === 'block' ? '🚫' : '✅'}
              </div>
              <div>
                <h3 className="confirmation-title">{confirmDialog.title}</h3>
                <p className="confirmation-message">{confirmDialog.message}</p>
              </div>
            </div>
            
            {confirmDialog.user && (
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <div className="text-sm">
                  <div className="font-medium">User Details:</div>
                  <div className="mt-1 text-gray-600">
                    <div>Email: {confirmDialog.user.email}</div>
                    <div>Role: {confirmDialog.user.isAdmin ? 'Admin' : 'User'}</div>
                    <div>Files: {confirmDialog.user.fileCount}</div>
                    <div>Status: {confirmDialog.user.isBlocked ? 'Blocked' : 'Active'}</div>
                  </div>
                </div>
              </div>
            )}

            {confirmDialog.type === 'delete' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-sm text-red-800">
                  <div className="font-medium mb-1">⚠️ Warning: This action is irreversible!</div>
                  <div>This will permanently delete:</div>
                  <ul className="list-disc list-inside mt-1 text-xs">
                    <li>User account</li>
                    <li>All user's files</li>
                    <li>Device registration</li>
                    <li>ZKP proofs</li>
                  </ul>
                  <div className="mt-1 text-xs">Access logs will be kept for audit purposes.</div>
                </div>
              </div>
            )}

            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={confirmDialog.onCancel}
              >
                Cancel
              </button>
              <button
                className={`btn ${confirmDialog.type === 'delete' ? 'btn-danger' : confirmDialog.type === 'block' ? 'btn-warning' : 'btn-success'}`}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;