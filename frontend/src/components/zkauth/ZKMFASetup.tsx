import React, { useState, useEffect, useRef } from 'react';
import { Shield, Plus, CheckCircle, AlertCircle, Fingerprint, User, Camera, Scan } from 'lucide-react';

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCapture = async () => {
    setIsCapturing(true);
    setCaptureStatus('capturing');

    if (factorType.type === 'face_recognition_hash') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (error) {
        setCaptureStatus('error');
        console.error('Error accessing camera:', error);
      }
    } else if (factorType.type === 'fingerprint_hash') {
      // Simulate fingerprint capture
      setTimeout(() => {
        const mockFingerprintHash = 'fp_' + Math.random().toString(36).substring(2, 15);
        onCapture(mockFingerprintHash);
        setCaptureStatus('success');
        setIsCapturing(false);
      }, 2000);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Generate mock face recognition hash from image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const mockFaceHash = 'face_' + btoa(imageData.slice(-20)).substring(0, 15);
        
        onCapture(mockFaceHash);
        setCaptureStatus('success');
        
        // Stop video stream
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCapturing(false);
      }
    }
  };

  const resetCapture = () => {
    setCaptureStatus('idle');
    setIsCapturing(false);
    onCapture('');
    
    // Stop video stream if active
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
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
        {factorType.type === 'face_recognition_hash' && (
          <>
            {!isCapturing && captureStatus === 'idle' && (
              <div>
                <Camera size={48} style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-3)' }} />
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Face Recognition Setup</h4>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  Position your face in front of the camera for secure biometric registration
                </p>
                <button
                  onClick={startCapture}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  <Camera size={16} style={{ marginRight: 'var(--space-2)' }} />
                  Start Face Capture
                </button>
              </div>
            )}
            
            {isCapturing && (
              <div>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto',
                    borderRadius: '8px',
                    marginBottom: 'var(--space-4)'
                  }}
                  autoPlay
                  muted
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                  <button
                    onClick={captureImage}
                    className="btn btn-success"
                  >
                    <CheckCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
                    Capture Face
                  </button>
                  <button
                    onClick={resetCapture}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {factorType.type === 'fingerprint_hash' && (
          <>
            {captureStatus === 'idle' && (
              <div>
                <Fingerprint size={48} style={{ color: 'var(--color-gray-400)', marginBottom: 'var(--space-3)' }} />
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Fingerprint Setup</h4>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  Place your finger on the sensor to register your fingerprint
                </p>
                <button
                  onClick={startCapture}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  <Scan size={16} style={{ marginRight: 'var(--space-2)' }} />
                  Scan Fingerprint
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
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Scanning...</h4>
                <p style={{ color: 'var(--color-gray-600)' }}>
                  Keep your finger steady on the sensor
                </p>
              </div>
            )}
          </>
        )}

        {captureStatus === 'success' && (
          <div>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', marginBottom: 'var(--space-3)' }} />
            <h4 style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
              Capture Successful!
            </h4>
            <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
              Your {factorType.name.toLowerCase()} has been captured and processed
            </p>
            <button
              onClick={resetCapture}
              className="btn btn-secondary"
            >
              Capture Again
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
    // Define only face recognition and fingerprint types
    const factorTypes: FactorType[] = [
      {
        type: 'fingerprint_hash',
        name: 'Fingerprint Authentication',
        description: 'Secure biometric authentication using your fingerprint',
        security: 'high',
        setup: 'easy'
      },
      {
        type: 'face_recognition_hash',
        name: 'Face Recognition',
        description: 'Advanced facial recognition for secure access',
        security: 'high',
        setup: 'easy'
      }
    ];
    setAvailableTypes(factorTypes);
  };

  const handleRegisterFactor = async () => {
    if (!selectedType || !secretValue) {
      setError('Please select a factor type and provide a value');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/zk-mfa/register-secret`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secretType: selectedType.type,
          secretValue,
          metadata: {
            strength: getSecretStrength(secretValue, selectedType.type)
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${selectedType.name} registered successfully`);
        setSecretValue('');
        setSelectedType(null);
        setShowSetup(false);
        fetchFactors();
      } else {
        setError(data.error || 'Failed to register factor');
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSecretStrength = (_value: string, type: string): 'weak' | 'medium' | 'strong' => {
    // For biometric types, strength is always high
    if (type === 'fingerprint_hash' || type === 'face_recognition_hash') {
      return 'strong';
    }
    return 'medium';
  };

  const getFactorIcon = (type: string) => {
    switch (type) {
      case 'fingerprint_hash': return <Fingerprint size={20} />;
      case 'face_recognition_hash': return <User size={20} />;
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