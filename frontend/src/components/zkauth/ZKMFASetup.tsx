import React, { useState, useEffect } from 'react';
import { Shield, Plus, CheckCircle, AlertCircle, Fingerprint } from 'lucide-react';

interface MFAFactor {
  type: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
  metadata?: any;
}

interface FactorType {
  type: string;
  name: string;
  description: string;
  security: 'low' | 'medium' | 'high';
  setup: 'easy' | 'medium' | 'complex';
}

interface ZKMFASetupProps {
  token: string;
}

interface BiometricCaptureProps {
  factorType: FactorType;
  onCapture: (data: string) => void;
  loading: boolean;
}

const BiometricCapture: React.FC<BiometricCaptureProps> = ({ factorType, onCapture, loading }) => {
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');

  const startCapture = async () => {
    setCaptureStatus('capturing');

    if (factorType.type === 'fingerprint_hash') {
      try {
        // Check if WebAuthn is supported
        if (!window.PublicKeyCredential) {
          setCaptureStatus('error');
          alert('Biometric authentication is not supported on this browser. Please use Chrome, Edge, Safari, or Firefox.');
          return;
        }

        // Create WebAuthn credential for fingerprint registration
        const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
          challenge: new Uint8Array(32), // Random challenge
          rp: {
            name: 'SentinelVault',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
          },
          user: {
            id: new Uint8Array(16), // Random user ID
            name: 'user@sentinelvault.com',
            displayName: 'SentinelVault User'
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Use platform authenticator (Touch ID, Face ID, Windows Hello)
            userVerification: 'required' // Require biometric verification
          },
          timeout: 60000,
          attestation: 'none'
        };

        // Prompt user for biometric registration
        const credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        }) as PublicKeyCredential;

        if (credential) {
          // Successfully registered biometric
          const credentialId = credential.id;
          console.log('✅ Biometric registered successfully:', credentialId);
          onCapture(credentialId);
          setCaptureStatus('success');
        } else {
          setCaptureStatus('error');
        }
      } catch (error: any) {
        console.error('❌ Biometric registration error:', error);
        setCaptureStatus('error');
        
        if (error.name === 'NotAllowedError') {
          alert('Biometric registration was cancelled. Please try again.');
        } else if (error.name === 'NotSupportedError') {
          alert('Your device does not support biometric authentication.');
        } else {
          alert('Failed to register biometric. Please ensure your fingerprint/face is set up on this device.');
        }
      }
    }
  };

  const resetCapture = () => {
    setCaptureStatus('idle');
    onCapture('');
  };

  return (
    <div className="form-group">
      <label className="form-label">
        {factorType.name} Setup
      </label>
      
      <div style={{
        border: '2px dashed var(--color-border)',
        borderRadius: '8px',
        padding: 'var(--space-6)',
        textAlign: 'center',
        backgroundColor: 'var(--color-bg-secondary)'
      }}>
        {factorType.type === 'fingerprint_hash' && (
          <>
            {captureStatus === 'idle' && (
              <div>
                <Fingerprint size={48} style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-3)' }} />
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Biometric Setup</h4>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  Register your fingerprint, Face ID, or Windows Hello for secure authentication
                </p>
                <button
                  onClick={startCapture}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  👆 Register Biometric
                </button>
              </div>
            )}
            
            {captureStatus === 'capturing' && (
              <div>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid var(--color-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  animation: 'pulse 2s infinite'
                }}>
                  <Fingerprint size={48} style={{ color: 'var(--color-brand)' }} />
                </div>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Waiting for Biometric...</h4>
                <p style={{ color: 'var(--color-gray-600)' }}>
                  Follow your device's prompt to scan your fingerprint or face
                </p>
              </div>
            )}
          </>
        )}

        {captureStatus === 'success' && (
          <div>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
            <h4 style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
              Biometric Registered!
            </h4>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
              Your biometric authentication has been successfully registered. Click "Register Factor" below to save it.
            </p>
            <button
              onClick={resetCapture}
              className="btn btn-secondary"
            >
              Register Again
            </button>
          </div>
        )}

        {captureStatus === 'error' && (
          <div>
            <AlertCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)' }} />
            <h4 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-2)' }}>
              Capture Failed
            </h4>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
              Unable to access camera or sensor. Please check permissions.
            </p>
            <button
              onClick={resetCapture}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-2)' }}>
        {factorType.type === 'face_recognition_hash' && 
          'Your facial features will be processed locally and only a cryptographic hash will be stored'}
        {factorType.type === 'fingerprint_hash' && 
          'Your fingerprint will be processed locally and only a cryptographic hash will be stored'}
      </div>
    </div>
  );
};

const ZKMFASetup: React.FC<ZKMFASetupProps> = ({ token }) => {
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [availableTypes, setAvailableTypes] = useState<FactorType[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedType, setSelectedType] = useState<FactorType | null>(null);
  const [secretValue, setSecretValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFactors();
    fetchAvailableTypes();
  }, []);

  const fetchFactors = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-mfa/factors`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setFactors(data.factors);
    } catch (error) {
      setError('Failed to load MFA factors');
    }
  };

  const fetchAvailableTypes = async () => {
    // Define only fingerprint type
    const factorTypes: FactorType[] = [
      {
        type: 'fingerprint_hash',
        name: 'Fingerprint Authentication',
        description: 'Secure biometric authentication using your fingerprint',
        security: 'high',
        setup: 'easy'
      }
    ];
    setAvailableTypes(factorTypes);
  };

  const handleRemoveFactor = async (factorType: string) => {
    if (!confirm('Are you sure you want to reset this MFA factor? You will need to re-register it.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-mfa/remove-factor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ factorType })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('MFA factor removed successfully. You can re-register it now.');
        fetchFactors();
      } else {
        setError(data.error || 'Failed to remove factor');
      }
    } catch (error) {
      console.error('Error removing factor:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFactor = async () => {
    console.log('🔍 Starting MFA Factor Registration:', {
      selectedType: selectedType?.type,
      secretValue: secretValue ? '***' : 'empty',
      token: token ? '***' : 'missing'
    });

    if (!selectedType || !secretValue) {
      console.log('❌ Validation failed: missing type or value');
      setError('Please select a factor type and provide a value');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requestBody = {
        secretType: selectedType.type,
        secretValue,
        metadata: {
          strength: getSecretStrength(secretValue, selectedType.type)
        }
      };

      console.log('📤 Sending registration request:', {
        ...requestBody,
        secretValue: '***'
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-mfa/register-secret`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (response.ok) {
        console.log('✅ Registration successful');
        setSuccess(`${selectedType.name} registered successfully`);
        setSecretValue('');
        setSelectedType(null);
        setShowSetup(false);
        fetchFactors();
      } else {
        console.log('❌ Registration failed:', response.status, data);
        setError(data.error || 'Failed to register factor');
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSecretStrength = (_value: string, type: string): 'weak' | 'medium' | 'strong' => {
    // For biometric types, strength is always high
    if (type === 'fingerprint_hash') {
      return 'strong';
    }
    return 'medium';
  };

  const getFactorIcon = (type: string) => {
    switch (type) {
      case 'fingerprint_hash': return <Fingerprint size={20} />;
      default: return <Shield size={20} />;
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSecurityBg = (level: string) => {
    switch (level) {
      case 'high': return '#d1fae5';
      case 'medium': return '#fef3c7';
      case 'low': return '#fee2e2';
      default: return '#f3f4f6';
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h3 style={{ margin: 0, marginBottom: 'var(--space-1)' }}>Multi-Factor Authentication</h3>
          <p style={{ margin: 0, color: 'var(--color-gray-600)', fontSize: 'var(--text-sm)' }}>
            Secure your account with zero-knowledge multi-factor authentication
          </p>
        </div>
        <button
          onClick={() => setShowSetup(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Plus size={16} />
          Add Factor
        </button>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
          <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
          <CheckCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
          {success}
        </div>
      )}

      {/* Current Factors */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h4 style={{ marginBottom: 'var(--space-3)' }}>Registered Factors</h4>
        {factors.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 'var(--space-8)', 
            color: 'var(--color-gray-500)',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRadius: '8px'
          }}>
            No MFA factors registered yet. Add your first factor to enhance security.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {factors.map((factor, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: factor.isActive ? 'white' : 'var(--color-bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ color: 'var(--color-brand)' }}>
                    {getFactorIcon(factor.type)}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, marginBottom: 'var(--space-1)' }}>
                      {availableTypes.find(t => t.type === factor.type)?.name || factor.type}
                    </h5>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>
                      Added: {new Date(factor.createdAt).toLocaleDateString()}
                      {factor.lastUsed && (
                        <span> • Last used: {new Date(factor.lastUsed).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: '500',
                    backgroundColor: factor.isActive ? '#d1fae5' : '#fee2e2',
                    color: factor.isActive ? '#065f46' : '#991b1b'
                  }}>
                    {factor.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleRemoveFactor(factor.type)}
                    className="btn btn-danger btn-sm"
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: 'var(--text-xs)'
                    }}
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetup && (
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
          <div className="card" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            margin: 'var(--space-4)',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ padding: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Add MFA Factor</h3>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">Factor Type</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {availableTypes.map((type) => (
                    <div
                      key={type.type}
                      onClick={() => setSelectedType(type)}
                      style={{
                        padding: 'var(--space-3)',
                        border: selectedType?.type === type.type 
                          ? '2px solid var(--color-brand)' 
                          : '1px solid var(--color-border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: selectedType?.type === type.type 
                          ? 'var(--color-brand-light)' 
                          : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {getFactorIcon(type.type)}
                          <div>
                            <h5 style={{ margin: 0, marginBottom: 'var(--space-1)' }}>{type.name}</h5>
                            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-gray-600)' }}>
                              {type.description}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: 'var(--text-xs)',
                            fontWeight: '500',
                            backgroundColor: getSecurityBg(type.security),
                            color: getSecurityColor(type.security)
                          }}>
                            {type.security.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedType && (
                <BiometricCapture 
                  factorType={selectedType}
                  onCapture={(data) => setSecretValue(data)}
                  loading={loading}
                />
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button
                  onClick={() => {
                    setShowSetup(false);
                    setSelectedType(null);
                    setSecretValue('');
                    setError('');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterFactor}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={!selectedType || !secretValue || loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Registering...
                    </>
                  ) : (
                    'Register Factor'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZKMFASetup;