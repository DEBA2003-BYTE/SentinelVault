import React, { useState } from 'react';
import { Shield, Lock, Eye, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import ZKMFASetup from '../components/zkauth/ZKMFASetup';

const ZKAuth: React.FC = () => {
  const { user, token } = useAuth();
  const [activeDemo, setActiveDemo] = useState<'overview' | 'zk-mfa'>('overview');

  const features = [
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Multi-Factor ZK Authentication",
      description: "Secure your account with zero-knowledge multi-factor authentication. Prove knowledge of multiple secrets without revealing them.",
      benefits: ["Multiple security layers", "No secret transmission", "Biometric privacy", "Behavioral analysis"],
      color: "#10b981"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Privacy by Design",
      description: "Your sensitive data never leaves your device. Only cryptographic proofs are shared.",
      benefits: ["Local data processing", "Zero data leakage", "GDPR compliant", "User-controlled"],
      color: "#8b5cf6"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Verification",
      description: "Fast cryptographic verification without compromising security or privacy.",
      benefits: ["Sub-second proofs", "Scalable verification", "Offline capable", "Low bandwidth"],
      color: "#f59e0b"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enhanced Security",
      description: "Advanced cryptographic protection that goes beyond traditional authentication methods.",
      benefits: ["Quantum-resistant", "Non-repudiation", "Tamper-proof", "Mathematically secure"],
      color: "var(--color-brand)"
    }
  ];

  const comparisonData = [
    {
      aspect: "Data Exposure",
      traditional: "Full credentials transmitted",
      zkAuth: "Zero data exposure",
      advantage: "zk"
    },
    {
      aspect: "Password Storage",
      traditional: "Server-side password hashes",
      zkAuth: "No passwords needed",
      advantage: "zk"
    },
    {
      aspect: "Privacy",
      traditional: "Identity data collected",
      zkAuth: "Complete privacy preservation",
      advantage: "zk"
    },
    {
      aspect: "Biometric Security",
      traditional: "Biometric templates stored",
      zkAuth: "Local processing only",
      advantage: "zk"
    },
    {
      aspect: "Decentralization",
      traditional: "Central authority required",
      zkAuth: "Self-sovereign identity",
      advantage: "zk"
    }
  ];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 'var(--space-12)',
        background: 'linear-gradient(135deg, var(--color-brand-light) 0%, #f0f9ff 100%)',
        padding: 'var(--space-12) var(--space-8)',
        borderRadius: '20px',
        border: '1px solid var(--color-border)'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-6)',
          boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)'
        }}>
          <Shield size={50} style={{ color: 'white' }} />
        </div>
        <h1 style={{ 
          fontSize: '3.5rem', 
          fontWeight: 'var(--font-bold)', 
          marginBottom: 'var(--space-4)',
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Multi-Factor Authentication
        </h1>
        <p style={{ 
          fontSize: 'var(--text-xl)', 
          color: 'var(--color-gray-600)', 
          maxWidth: '700px', 
          margin: '0 auto var(--space-8)',
          lineHeight: '1.6'
        }}>
          Secure your account with zero-knowledge multi-factor authentication. 
          Prove knowledge of multiple secrets without revealing any sensitive data, 
          using advanced cryptographic proofs for maximum security and privacy.
        </p>

        {/* Demo Navigation */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveDemo('overview')}
            className={`btn ${activeDemo === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: 'var(--space-3) var(--space-6)' }}
          >
            <Shield size={18} style={{ marginRight: 'var(--space-2)' }} />
            Overview
          </button>
          {user && (
            <button
              onClick={() => setActiveDemo('zk-mfa')}
              className={`btn ${activeDemo === 'zk-mfa' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: 'var(--space-3) var(--space-6)' }}
            >
              <Lock size={18} style={{ marginRight: 'var(--space-2)' }} />
              Setup MFA
            </button>
          )}
        </div>
      </div>

      {/* Content based on active demo */}
      {activeDemo === 'overview' && (
        <>
          {/* Features Grid */}
          <div style={{ marginBottom: 'var(--space-12)' }}>
            <h2 style={{ 
              textAlign: 'center', 
              marginBottom: 'var(--space-8)',
              fontSize: '2.5rem',
              fontWeight: 'var(--font-bold)'
            }}>
              Multi-Factor Authentication Features
            </h2>
            <div className="grid grid-cols-2" style={{ gap: 'var(--space-6)' }}>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="card"
                  style={{
                    padding: 'var(--space-6)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    border: '1px solid var(--color-border)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    <div style={{ 
                      color: feature.color,
                      padding: 'var(--space-3)',
                      backgroundColor: feature.color + '20',
                      borderRadius: '12px'
                    }}>
                      {feature.icon}
                    </div>
                    <h3 style={{ 
                      fontSize: 'var(--text-xl)', 
                      fontWeight: 'var(--font-semibold)',
                      margin: 0
                    }}>
                      {feature.title}
                    </h3>
                  </div>
                  <p style={{ 
                    color: 'var(--color-gray-600)', 
                    lineHeight: '1.6',
                    marginBottom: 'var(--space-4)'
                  }}>
                    {feature.description}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {feature.benefits.map((benefit, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <CheckCircle size={16} style={{ color: feature.color }} />
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-700)' }}>
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ 
              textAlign: 'center', 
              marginBottom: 'var(--space-8)',
              fontSize: '2.5rem',
              fontWeight: 'var(--font-bold)'
            }}>
              Traditional vs Zero-Knowledge MFA
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-gray-50)' }}>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left', borderBottom: '2px solid var(--color-gray-200)' }}>
                      Aspect
                    </th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left', borderBottom: '2px solid var(--color-gray-200)' }}>
                      Traditional Auth
                    </th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'left', borderBottom: '2px solid var(--color-gray-200)' }}>
                      Zero-Knowledge Auth
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--color-gray-200)' }}>
                      <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-medium)' }}>
                        {row.aspect}
                      </td>
                      <td style={{ 
                        padding: 'var(--space-4)', 
                        color: row.advantage === 'zk' ? 'var(--color-gray-500)' : 'var(--color-gray-700)'
                      }}>
                        {row.traditional}
                      </td>
                      <td style={{ 
                        padding: 'var(--space-4)', 
                        color: row.advantage === 'zk' ? 'var(--color-success)' : 'var(--color-gray-700)',
                        fontWeight: row.advantage === 'zk' ? 'var(--font-medium)' : 'normal'
                      }}>
                        {row.advantage === 'zk' && <CheckCircle size={16} style={{ marginRight: 'var(--space-2)', display: 'inline' }} />}
                        {row.zkAuth}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}



      {activeDemo === 'zk-mfa' && user && token && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <ZKMFASetup token={token} />
        </div>
      )}

      {activeDemo === 'zk-mfa' && !user && (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <Lock size={64} style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-4)' }} />
          <h3 style={{ marginBottom: 'var(--space-2)' }}>Authentication Required</h3>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
            Please log in to access the ZK-MFA setup demo.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn btn-primary"
          >
            Login to Continue
          </button>
        </div>
      )}
    </div>
  );
};

export default ZKAuth;