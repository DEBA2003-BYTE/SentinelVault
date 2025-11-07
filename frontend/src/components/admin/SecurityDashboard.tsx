import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Eye, Clock, MapPin, Smartphone, Ban } from 'lucide-react';

interface FlaggedAttempt {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  allowed: boolean;
  reason: string;
  ipAddress: string;
  location?: string;
  deviceFingerprint?: string;
  timestamp: string;
  policyViolations: string[];
}

const SecurityDashboard: React.FC = () => {
  const [flaggedAttempts, setFlaggedAttempts] = useState<FlaggedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'blocked' | 'high_risk'>('all');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchFlaggedAttempts();
  }, [filter, timeRange]);

  const fetchFlaggedAttempts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/flagged-attempts?filter=${filter}&timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFlaggedAttempts(data.attempts || []);
      } else {
        console.error('Failed to fetch flagged attempts');
      }
    } catch (error) {
      console.error('Error fetching flagged attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#7c2d12';
      default: return '#6b7280';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return <Ban size={16} />;
      case 'high': return <AlertTriangle size={16} />;
      case 'medium': return <Shield size={16} />;
      default: return <Eye size={16} />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1h': return 'Last Hour';
      case '24h': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      default: return 'Last 24 Hours';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="loading-spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
        <p>Loading security dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Security Dashboard
        </h1>
        <p style={{ color: 'var(--color-gray-600)' }}>
          Monitor flagged authentication attempts and security events
        </p>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginRight: '0.5rem' }}>
            Filter:
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--color-gray-300)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="all">All Attempts</option>
            <option value="blocked">Blocked Only</option>
            <option value="high_risk">High Risk Only</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginRight: '0.5rem' }}>
            Time Range:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--color-gray-300)',
              borderRadius: '6px',
              fontSize: '0.875rem'
            }}
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <button
          onClick={fetchFlaggedAttempts}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-brand)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Total Flagged</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {flaggedAttempts.length}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Ban size={20} style={{ color: '#dc2626' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Blocked</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {flaggedAttempts.filter(a => !a.allowed).length}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>High Risk</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700' }}>
            {flaggedAttempts.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length}
          </div>
        </div>
      </div>

      {/* Flagged Attempts Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Flagged Authentication Attempts - {getTimeRangeLabel(timeRange)}
          </h3>
        </div>

        {flaggedAttempts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-gray-600)' }}>
            No flagged attempts found for the selected criteria
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-gray-50)', borderBottom: '2px solid var(--color-gray-200)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    User
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Risk
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Location
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Device
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Time
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600' }}>
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {flaggedAttempts.map((attempt) => (
                  <tr key={attempt.id} style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                          {attempt.userEmail}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                          {attempt.action}
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ color: getRiskColor(attempt.riskLevel) }}>
                          {getRiskIcon(attempt.riskLevel)}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {attempt.riskScore}
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: getRiskColor(attempt.riskLevel),
                            textTransform: 'capitalize'
                          }}>
                            {attempt.riskLevel}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: attempt.allowed ? '#d1fae5' : '#fee2e2',
                        color: attempt.allowed ? '#065f46' : '#991b1b'
                      }}>
                        {attempt.allowed ? 'Allowed' : 'Blocked'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={14} style={{ color: 'var(--color-gray-400)' }} />
                        <div>
                          <div style={{ fontSize: '0.875rem' }}>
                            {attempt.location || 'Unknown'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
                            {attempt.ipAddress}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Smartphone size={14} style={{ color: 'var(--color-gray-400)' }} />
                        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-gray-600)' }}>
                          {attempt.deviceFingerprint ? 
                            attempt.deviceFingerprint.slice(0, 12) + '...' : 
                            'Unknown'
                          }
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} style={{ color: 'var(--color-gray-400)' }} />
                        <div style={{ fontSize: '0.875rem' }}>
                          {formatTimestamp(attempt.timestamp)}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', maxWidth: '200px' }}>
                        {attempt.reason}
                      </div>
                      {attempt.policyViolations.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginTop: '0.25rem' }}>
                          Policies: {attempt.policyViolations.join(', ')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;