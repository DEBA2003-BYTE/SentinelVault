import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Clock, Unlock, Eye, CheckCircle } from 'lucide-react';

interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  userEmail?: string;
  metadata?: {
    failedAttempts?: number;
    ipAddress?: string;
    location?: string;
    riskScore?: number;
    blockReason?: string;
  };
  isRead: boolean;
  createdAt: string;
}

interface RateLimitStats {
  blockedAccountsCount: number;
  failedAttemptsLast24h: number;
  failedAttemptsLast7d: number;
  topFailingIPs: { _id: string; count: number }[];
  recentNotifications: AdminNotification[];
  rateLimitConfig: {
    maxAttempts: number;
    windowMinutes: number;
    lockoutHours: number;
  };
}

interface RateLimitManagementProps {
  token: string;
}

const RateLimitManagement: React.FC<RateLimitManagementProps> = ({ token }) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [unblockReason, setUnblockReason] = useState('');
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch notifications:', response.status);
        setNotifications([]);
        return;
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/rate-limit-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch rate limit stats:', response.status);
        setStats({
          blockedAccountsCount: 0,
          failedAttemptsLast24h: 0,
          failedAttemptsLast7d: 0,
          topFailingIPs: [],
          recentNotifications: [],
          rateLimitConfig: {
            maxAttempts: 5,
            windowMinutes: 15,
            lockoutHours: 1
          }
        });
        return;
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        blockedAccountsCount: 0,
        failedAttemptsLast24h: 0,
        failedAttemptsLast7d: 0,
        topFailingIPs: [],
        recentNotifications: [],
        rateLimitConfig: {
          maxAttempts: 5,
          windowMinutes: 15,
          lockoutHours: 1
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unblockUser = async (userId: string, userEmail: string) => {
    if (!unblockReason.trim()) {
      alert('Please provide a reason for unblocking');
      return;
    }

    setUnblockingUserId(userId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: unblockReason })
      });

      if (response.ok) {
        alert(`User ${userEmail} has been unblocked successfully`);
        setUnblockReason('');
        setSelectedNotification(null);
        fetchNotifications();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Failed to unblock user: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert('Failed to unblock user');
    } finally {
      setUnblockingUserId(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={20} />;
      case 'high': return <Shield size={20} />;
      case 'medium': return <Clock size={20} />;
      case 'low': return <CheckCircle size={20} />;
      default: return <AlertTriangle size={20} />;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner"></div>
        <p>Loading rate limit management...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={24} />
        Rate Limiting & Security Management
      </h2>

      {/* Statistics Overview */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div className="stat-card" style={{
            padding: '20px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #fecaca'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#dc2626' }}>Blocked Accounts</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
              {stats.blockedAccountsCount}
            </div>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#7f1d1d' }}>
              Accounts currently blocked
            </p>
          </div>

          <div className="stat-card" style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fde68a'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#d97706' }}>Failed Attempts (24h)</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
              {stats.failedAttemptsLast24h}
            </div>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
              Failed login attempts today
            </p>
          </div>

          <div className="stat-card" style={{
            padding: '20px',
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            border: '1px solid #bfdbfe'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2563eb' }}>Rate Limit Config</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb' }}>
              {stats.rateLimitConfig?.maxAttempts || 5} attempts / {stats.rateLimitConfig?.windowMinutes || 15}min
            </div>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#1e40af' }}>
              {stats.rateLimitConfig?.lockoutHours || 1}h lockout period
            </p>
          </div>
        </div>
      )}

      {/* Admin Notifications */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Security Notifications</h3>
        
        {notifications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '10px' }} />
            <p style={{ color: '#6b7280' }}>No security notifications</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                style={{
                  padding: '15px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: notification.isRead ? '#f9fafb' : '#ffffff',
                  borderLeft: `4px solid ${getSeverityColor(notification.severity)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ color: getSeverityColor(notification.severity) }}>
                        {getSeverityIcon(notification.severity)}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    
                    <p style={{ margin: '0 0 10px 0', color: '#6b7280', fontSize: '0.9rem' }}>
                      {notification.message}
                    </p>
                    
                    {notification.metadata && (
                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', color: '#6b7280' }}>
                        {notification.metadata.failedAttempts && (
                          <span>Failed Attempts: {notification.metadata.failedAttempts}</span>
                        )}
                        {notification.metadata.ipAddress && (
                          <span>IP: {notification.metadata.ipAddress}</span>
                        )}
                        {notification.metadata.location && (
                          <span>Location: {notification.metadata.location}</span>
                        )}
                        {notification.metadata.riskScore && (
                          <span>Risk Score: {notification.metadata.riskScore}</span>
                        )}
                      </div>
                    )}
                    
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '8px' }}>
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} style={{ marginRight: '4px' }} />
                        Mark Read
                      </button>
                    )}
                    
                    {notification.type === 'account_blocked' && notification.userId && (
                      <button
                        onClick={() => setSelectedNotification(notification)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Unlock size={14} style={{ marginRight: '4px' }} />
                        Unblock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unblock User Modal */}
      {selectedNotification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Unblock User Account</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <p><strong>User:</strong> {selectedNotification.userEmail}</p>
              <p><strong>Block Reason:</strong> {selectedNotification.metadata?.blockReason}</p>
              <p><strong>Failed Attempts:</strong> {selectedNotification.metadata?.failedAttempts}</p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Reason for Unblocking:
              </label>
              <textarea
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                placeholder="Enter reason for unblocking this account..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setSelectedNotification(null);
                  setUnblockReason('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={() => unblockUser(selectedNotification.userId!, selectedNotification.userEmail!)}
                disabled={!unblockReason.trim() || unblockingUserId === selectedNotification.userId}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: unblockReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: unblockReason.trim() ? 1 : 0.6
                }}
              >
                {unblockingUserId === selectedNotification.userId ? 'Unblocking...' : 'Unblock Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateLimitManagement;