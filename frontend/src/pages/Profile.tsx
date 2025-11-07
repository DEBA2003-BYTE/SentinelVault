import React from 'react';
import { User, Shield, MapPin, Smartphone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useZKP } from '../contexts/ZKPContext';
import ZKPStatusCard from '../components/zkproofs/ZKPStatusCard';
import ContextMonitor from '../components/security/ContextMonitor';
import RiskMeter from '../components/security/RiskMeter';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { status } = useZKP();

  if (!user) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="card-content text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3>User Not Found</h3>
            <p>Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <User className="w-8 h-8 text-blue-600" />
          <div>
            <h1>User Profile</h1>
            <p>Manage your account and security settings</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3>Account Information</h3>
              </div>
              <div className="card-content">
                <div className="profile-info">
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{user.email}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">Account ID:</span>
                    <span className="value font-mono">{user.id}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">Account Type:</span>
                    <span className={`value ${user.isAdmin ? 'admin' : 'user'}`}>
                      {user.isAdmin ? 'Administrator' : 'Standard User'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">Account Status:</span>
                    <span className={`value ${user.isBlocked ? 'blocked' : 'active'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">Member Since:</span>
                    <span className="value">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="label">Last Login:</span>
                    <span className="value">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <div className="card-header">
                <h3>Security Information</h3>
              </div>
              <div className="card-content">
                <div className="security-grid">
                  <div className="security-item">
                    <div className="security-header">
                      <Shield className="w-5 h-5" />
                      <span>Identity Verification</span>
                    </div>
                    <div className="security-status">
                      {user.zkpVerified ? (
                        <div className="status verified">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="status unverified">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span>Not Verified</span>
                        </div>
                      )}
                    </div>
                    {status?.verifiedAt && (
                      <div className="security-details">
                        <Clock className="w-4 h-4" />
                        <span>Verified: {new Date(status.verifiedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="security-item">
                    <div className="security-header">
                      <Smartphone className="w-5 h-5" />
                      <span>Device Registration</span>
                    </div>
                    <div className="security-status">
                      {user.deviceFingerprint ? (
                        <div className="status registered">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Registered</span>
                        </div>
                      ) : (
                        <div className="status unregistered">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span>Not Registered</span>
                        </div>
                      )}
                    </div>
                    {user.deviceFingerprint && (
                      <div className="security-details">
                        <span className="fingerprint">
                          Device ID: {user.deviceFingerprint.slice(0, 8)}...
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="security-item">
                    <div className="security-header">
                      <MapPin className="w-5 h-5" />
                      <span>Location Registration</span>
                    </div>
                    <div className="security-status">
                      {user.registeredLocation ? (
                        <div className="status registered">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Registered</span>
                        </div>
                      ) : (
                        <div className="status unregistered">
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span>Not Registered</span>
                        </div>
                      )}
                    </div>
                    {user.registeredLocation && (
                      <div className="security-details">
                        <span>Location: {user.registeredLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Context Monitor */}
            <div className="mt-6">
              <ContextMonitor />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* ZKP Status */}
            <ZKPStatusCard />

            {/* Risk Assessment */}
            <div className="card mt-6">
              <div className="card-header">
                <h3>Current Risk Assessment</h3>
              </div>
              <div className="card-content">
                <div className="risk-assessment">
                  <RiskMeter riskScore={25} size="large" />
                  <div className="risk-factors">
                    <h4>Risk Factors:</h4>
                    <ul>
                      <li className={user.zkpVerified ? 'positive' : 'neutral'}>
                        Identity Verification: {user.zkpVerified ? 'Verified' : 'Pending'}
                      </li>
                      <li className={user.deviceFingerprint ? 'positive' : 'neutral'}>
                        Device Recognition: {user.deviceFingerprint ? 'Known' : 'Unknown'}
                      </li>
                      <li className={user.registeredLocation ? 'positive' : 'neutral'}>
                        Location Status: {user.registeredLocation ? 'Registered' : 'Unregistered'}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Recommendations */}
            <div className="card mt-6">
              <div className="card-header">
                <h3>Security Recommendations</h3>
              </div>
              <div className="card-content">
                <div className="recommendations">
                  {!user.zkpVerified && (
                    <div className="recommendation">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <div>
                        <h4>Complete Identity Verification</h4>
                        <p>Verify your identity using zero-knowledge proofs to reduce your risk score.</p>
                      </div>
                    </div>
                  )}
                  
                  {!user.deviceFingerprint && (
                    <div className="recommendation">
                      <Smartphone className="w-4 h-4 text-orange-500" />
                      <div>
                        <h4>Register Your Device</h4>
                        <p>Register this device to improve security and reduce login friction.</p>
                      </div>
                    </div>
                  )}
                  
                  {!user.registeredLocation && (
                    <div className="recommendation">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <div>
                        <h4>Set Primary Location</h4>
                        <p>Register your primary location for enhanced security monitoring.</p>
                      </div>
                    </div>
                  )}
                  
                  {user.zkpVerified && user.deviceFingerprint && user.registeredLocation && (
                    <div className="recommendation success">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <div>
                        <h4>Security Optimized</h4>
                        <p>Your account security is fully optimized. Great job!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;