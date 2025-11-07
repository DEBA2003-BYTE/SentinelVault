import React from 'react';
import { Shield, Key, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import ZKPStatusCard from '../components/zkproofs/ZKPStatusCard';
import ZKPVerifier from '../components/zkproofs/ZKPVerifier';
import { useZKP } from '../contexts/ZKPContext';
import { useAuth } from '../contexts/AuthContext';

const Proofs: React.FC = () => {
  const { status, loading } = useZKP();
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1>Zero-Knowledge Proofs</h1>
            <p>Manage your cryptographic identity verification</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Overview */}
          <div className="lg:col-span-1">
            <ZKPStatusCard />
            
            <div className="card mt-6">
              <div className="card-header">
                <h3>Account Security</h3>
              </div>
              <div className="card-content">
                <div className="security-items">
                  <div className="security-item">
                    <div className="security-icon">
                      <CheckCircle className={`w-5 h-5 ${user?.zkpVerified ? 'text-green-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="security-info">
                      <span>Identity Verification</span>
                      <small>{user?.zkpVerified ? 'Verified' : 'Pending'}</small>
                    </div>
                  </div>
                  
                  <div className="security-item">
                    <div className="security-icon">
                      <Key className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="security-info">
                      <span>Cryptographic Proofs</span>
                      <small>{status?.hasProof ? 'Available' : 'None'}</small>
                    </div>
                  </div>
                  
                  <div className="security-item">
                    <div className="security-icon">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="security-info">
                      <span>Last Verification</span>
                      <small>
                        {status?.verifiedAt 
                          ? new Date(status.verifiedAt).toLocaleDateString()
                          : 'Never'
                        }
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-6">
              <div className="card-header">
                <h3>Benefits of Verification</h3>
              </div>
              <div className="card-content">
                <ul className="benefits-list">
                  <li>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Reduced risk score</span>
                  </li>
                  <li>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Enhanced security features</span>
                  </li>
                  <li>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Priority support access</span>
                  </li>
                  <li>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Privacy-preserving authentication</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Verification Interface */}
          <div className="lg:col-span-2">
            <ZKPVerifier />
            
            <div className="card mt-6">
              <div className="card-header">
                <h3>Understanding Zero-Knowledge Proofs</h3>
              </div>
              <div className="card-content">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="info-content">
                      <h4>Privacy First</h4>
                      <p>Prove your identity without revealing sensitive information. Your secrets stay secret.</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <Key className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="info-content">
                      <h4>Cryptographically Secure</h4>
                      <p>Uses advanced cryptography to ensure proofs cannot be forged or replicated.</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <CheckCircle className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="info-content">
                      <h4>Instant Verification</h4>
                      <p>Proofs can be verified quickly without compromising security or privacy.</p>
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <div className="info-icon">
                      <AlertCircle className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="info-content">
                      <h4>Risk Reduction</h4>
                      <p>Verified users receive lower risk scores and enhanced access privileges.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Proofs;