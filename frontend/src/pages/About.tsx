import React from 'react';
import { Shield, Lock, Eye, Zap, Users, FileText, BarChart3, Settings } from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Zero-Knowledge Proofs",
      description: "Advanced cryptographic verification that proves identity without revealing sensitive information.",
      color: "var(--color-brand)"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Device Authentication",
      description: "Unique device fingerprinting ensures only registered devices can access your account.",
      color: "#10b981"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Risk Assessment",
      description: "Real-time risk scoring based on behavior, location, and device characteristics.",
      color: "#f59e0b"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "OPA Policy Engine",
      description: "Open Policy Agent integration for flexible, rule-based access control.",
      color: "#8b5cf6"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Admin Management",
      description: "Comprehensive admin dashboard for user management, audit logs, and system monitoring.",
      color: "#ef4444"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Secure File Storage",
      description: "Encrypted file storage with access logging and policy-based permissions.",
      color: "#06b6d4"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Audit & Analytics",
      description: "Complete audit trail with detailed analytics and security monitoring.",
      color: "#84cc16"
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Policy Configuration",
      description: "Flexible policy configuration with real-time updates and testing capabilities.",
      color: "#f97316"
    }
  ];

  const securityLayers = [
    {
      layer: "Layer 1",
      name: "Authentication",
      description: "Email/password + device fingerprinting",
      color: "#fee2e2"
    },
    {
      layer: "Layer 2", 
      name: "Risk Assessment",
      description: "Behavioral analysis and anomaly detection",
      color: "#fef3c7"
    },
    {
      layer: "Layer 3",
      name: "Policy Engine",
      description: "OPA-based access control decisions",
      color: "#dbeafe"
    },
    {
      layer: "Layer 4",
      name: "Zero-Knowledge Proofs",
      description: "Cryptographic identity verification",
      color: "#d1fae5"
    }
  ];

  return (
    <div className="page-container">
      {/* Hero Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 'var(--space-12)',
        background: 'linear-gradient(135deg, var(--color-brand-light) 0%, var(--color-bg-secondary) 100%)',
        padding: 'var(--space-12) var(--space-8)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)'
      }}>
        <Shield size={64} style={{ color: 'var(--color-brand)', marginBottom: 'var(--space-4)' }} />
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'var(--font-bold)', 
          marginBottom: 'var(--space-4)',
          background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          SentinelVault
        </h1>
        <p style={{ 
          fontSize: 'var(--text-xl)', 
          color: 'var(--color-gray-600)', 
          maxWidth: '600px', 
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Next-generation secure cloud storage with zero-knowledge proofs, 
          advanced risk assessment, and policy-based access control.
        </p>
      </div>

      {/* Features Grid */}
      <div style={{ marginBottom: 'var(--space-12)' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--space-8)',
          fontSize: '2.5rem',
          fontWeight: 'var(--font-bold)'
        }}>
          Powerful Features
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
                margin: 0
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Architecture */}
      <div style={{ marginBottom: 'var(--space-12)' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--space-8)',
          fontSize: '2.5rem',
          fontWeight: 'var(--font-bold)'
        }}>
          Multi-Layer Security Architecture
        </h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--space-4)',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {securityLayers.map((layer, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--space-6)',
                backgroundColor: layer.color,
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                minWidth: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-bold)',
                fontSize: 'var(--text-sm)',
                marginRight: 'var(--space-6)',
                boxShadow: 'var(--shadow-md)'
              }}>
                {layer.layer}
              </div>
              <div>
                <h3 style={{ 
                  fontSize: 'var(--text-xl)', 
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {layer.name}
                </h3>
                <p style={{ 
                  color: 'var(--color-gray-700)', 
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {layer.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="card" style={{ padding: 'var(--space-8)' }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: 'var(--space-8)',
          fontSize: '2.5rem',
          fontWeight: 'var(--font-bold)'
        }}>
          Technical Specifications
        </h2>
        <div className="grid grid-cols-2" style={{ gap: 'var(--space-8)' }}>
          <div>
            <h3 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-brand)'
            }}>
              Frontend Technologies
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <li>• React 18 with TypeScript</li>
              <li>• Modern CSS with CSS Variables</li>
              <li>• Responsive Grid System</li>
              <li>• Real-time Device Fingerprinting</li>
              <li>• Context-based State Management</li>
            </ul>
          </div>
          <div>
            <h3 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'var(--font-semibold)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-brand)'
            }}>
              Backend Technologies
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)'
            }}>
              <li>• Node.js with Express & TypeScript</li>
              <li>• MongoDB with Mongoose ODM</li>
              <li>• Open Policy Agent (OPA) Integration</li>
              <li>• JWT Authentication</li>
              <li>• Advanced Risk Assessment Engine</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;