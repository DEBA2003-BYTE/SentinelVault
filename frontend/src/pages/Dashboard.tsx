import React, { useState, useEffect } from 'react';
import { FileText, Upload, Shield, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import { fileService, riskService } from '../services/api';
import type { FileItem, RiskAssessment } from '../types';
import RiskIndicator from '../components/common/RiskIndicator';
import ZKPStatusCard from '../components/zkproofs/ZKPStatusCard';
import QuickZKPVerify from '../components/zkproofs/QuickZKPVerify';
import RiskMeter from '../components/security/RiskMeter';

const Dashboard: React.FC = () => {
  const { user, token, deviceContext } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [riskData, setRiskData] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) return;

      try {
        const [filesResponse, riskResponse] = await Promise.all([
          fileService.getUserFiles(token),
          riskService.getRiskAssessment(token)
        ]);

        setFiles(filesResponse.files || []);
        setRiskData(riskResponse);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalStorage = files.reduce((sum, file) => sum + file.size, 0);
  const recentFiles = files.slice(0, 5);

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }} />
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('Dashboard user data:', user);
  console.log('Dashboard device context:', deviceContext);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1>Welcome back, {user?.email}</h1>
        <p style={{ color: 'var(--color-gray-600)', marginBottom: 0 }}>
          Here's an overview of your secure cloud storage
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              padding: 'var(--space-3)',
              backgroundColor: 'var(--color-brand-light)',
              borderRadius: '8px'
            }}>
              <FileText size={24} style={{ color: 'var(--color-brand)' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                {files.length}
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
              backgroundColor: '#dbeafe',
              borderRadius: '8px'
            }}>
              <Upload size={24} style={{ color: 'var(--color-info)' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                {formatFileSize(totalStorage)}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                Storage Used
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              padding: 'var(--space-3)',
              backgroundColor: riskData && riskData.riskScore <= 30 ? '#d1fae5' : '#fee2e2',
              borderRadius: '8px'
            }}>
              <Shield size={24} style={{ 
                color: riskData && riskData.riskScore <= 30 ? 'var(--color-success)' : 'var(--color-error)' 
              }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                {riskData?.riskScore || 0}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                Risk Score
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              padding: 'var(--space-3)',
              backgroundColor: user?.zkpVerified ? '#d1fae5' : '#fef3c7',
              borderRadius: '8px'
            }}>
              <Key size={24} style={{ 
                color: user?.zkpVerified ? 'var(--color-success)' : 'var(--color-warning)' 
              }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                {user?.zkpVerified ? 'Yes' : 'No'}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                ZKP Verified
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3" style={{ gap: 'var(--space-8)' }}>
        {/* Recent Files */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Files</h3>
          </div>
          {recentFiles.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: '6px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'var(--font-medium)' }}>{file.filename}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                    {file.accessCount} downloads
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-gray-500)' }}>
              No files uploaded yet
            </div>
          )}
        </div>

        {/* Security Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Security Status</h3>
          </div>
          {riskData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ textAlign: 'center' }}>
                <RiskMeter riskScore={riskData.riskScore} size="medium" />
              </div>
              
              <div>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                  Security Factors
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {/* Only show ZKP if verified */}
                  {user?.zkpVerified === true && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span>ZKP Verified:</span>
                      <span style={{ color: 'var(--color-success)' }}>
                        Yes
                      </span>
                    </div>
                  )}
                  
                  {/* Only show Device if registered */}
                  {(user?.deviceFingerprint && user.deviceFingerprint !== 'unknown' && user.deviceFingerprint.length > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span>Device Registered:</span>
                      <span style={{ color: 'var(--color-success)' }}>
                        Yes
                      </span>
                    </div>
                  )}
                  
                  {/* Always show location if available */}
                  {(user?.registeredLocation || deviceContext?.location) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span>Location:</span>
                      <span style={{ color: 'var(--color-gray-600)' }}>
                        {user?.registeredLocation || deviceContext?.location}
                      </span>
                    </div>
                  )}
                  
                  {/* Show message if no security factors are active */}
                  {!user?.zkpVerified && 
                   !(user?.deviceFingerprint && user.deviceFingerprint !== 'unknown' && user.deviceFingerprint.length > 0) && 
                   !(user?.registeredLocation || deviceContext?.location) && (
                    <div style={{ 
                      fontSize: 'var(--text-sm)', 
                      color: 'var(--color-gray-500)', 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: 'var(--space-2)'
                    }}>
                      Complete verification to enhance security
                    </div>
                  )}
                </div>
              </div>

              {riskData.recentActivity.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>
                    Recent Activity
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {riskData.recentActivity.slice(0, 3).map((activity, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        <span>{activity.action}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <RiskIndicator score={activity.riskScore} showLabel={false} size="sm" />
                          <span style={{ color: activity.allowed ? 'var(--color-success)' : 'var(--color-error)' }}>
                            {activity.allowed ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-gray-500)' }}>
              Loading security status...
            </div>
          )}
        </div>

        {/* ZKP Status */}
        <div>
          <ZKPStatusCard />
        </div>

        {/* Quick ZKP Verification */}
        <div>
          <QuickZKPVerify />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;