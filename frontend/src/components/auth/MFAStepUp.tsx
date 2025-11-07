import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, X, Fingerprint, Camera } from 'lucide-react';

interface MFAStepUpProps {
  isOpen: boolean;
  onClose: () => void;
  onMFAComplete: (success: boolean) => void;
  riskScore: number;
  riskReason: string;
  availableMethods: string[];
}

const MFAStepUp: React.FC<MFAStepUpProps> = ({
  isOpen,
  onMFAComplete,
  riskScore,
  riskReason,
  availableMethods
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [mfaStep, setMfaStep] = useState<'select' | 'verify' | 'success' | 'error'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);

  if (!isOpen) return null;

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setMfaStep('verify');
  };

  const handleMFAVerification = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulate MFA verification based on selected method
      if (selectedMethod === 'fingerprint_hash') {
        // Simulate fingerprint capture
        await simulateFingerprintCapture();
      } else if (selectedMethod === 'face_recognition_hash') {
        // Simulate face recognition
        await simulateFaceRecognition();
      }

      // If successful, mark device as trusted if requested
      if (trustDevice) {
        await markDeviceAsTrusted();
      }

      setMfaStep('success');
      setTimeout(() => {
        onMFAComplete(true);
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'MFA verification failed');
      setMfaStep('error');
    } finally {
      setLoading(false);
    }
  };

  const simulateFingerprintCapture = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Fingerprint not recognized. Please try again.'));
        }
      }, 2000);
    });
  };

  const simulateFaceRecognition = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 85% success rate
        if (Math.random() > 0.15) {
          resolve();
        } else {
          reject(new Error('Face not recognized. Please ensure good lighting and try again.'));
        }
      }, 3000);
    });
  };

  const markDeviceAsTrusted = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/risk-evaluation/trust-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceFingerprint: 'current_device_fingerprint', // Would get from context
          trustAfterMFA: true
        })
      });

      if (!response.ok) {
        console.warn('Failed to mark device as trusted');
      }
    } catch (error) {
      console.warn('Error marking device as trusted:', error);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'Low';
    if (score < 70) return 'Medium';
    return 'High';
  };

  return (
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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} style={{ color: '#f59e0b' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              Additional Verification Required
            </h2>
          </div>
          <button
            onClick={() => onMFAComplete(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Risk Information */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: '#d97706' }} />
            <span style={{ fontWeight: '500', color: '#92400e' }}>
              Risk Level: {getRiskLevel(riskScore)} (Score: {riskScore})
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
            {riskReason}
          </p>
        </div>

        {/* MFA Steps */}
        {mfaStep === 'select' && (
          <div>
            <p style={{ marginBottom: '1rem', color: '#374151' }}>
              Please complete additional verification to continue:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {availableMethods.includes('fingerprint_hash') && (
                <button
                  onClick={() => handleMethodSelect('fingerprint_hash')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Fingerprint size={24} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontWeight: '500' }}>Fingerprint Authentication</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Use your fingerprint to verify your identity
                    </div>
                  </div>
                </button>
              )}

              {availableMethods.includes('face_recognition_hash') && (
                <button
                  onClick={() => handleMethodSelect('face_recognition_hash')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <Camera size={24} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontWeight: '500' }}>Face Recognition</div>
                    <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Use your camera to verify your identity
                    </div>
                  </div>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                id="trustDevice"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="trustDevice" style={{ fontSize: '0.875rem', color: '#374151' }}>
                Trust this device for future logins
              </label>
            </div>
          </div>
        )}

        {mfaStep === 'verify' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              {selectedMethod === 'fingerprint_hash' ? (
                <Fingerprint size={48} style={{ color: '#3b82f6', margin: '0 auto' }} />
              ) : (
                <Camera size={48} style={{ color: '#3b82f6', margin: '0 auto' }} />
              )}
            </div>
            
            <h3 style={{ marginBottom: '0.5rem' }}>
              {selectedMethod === 'fingerprint_hash' ? 'Place Your Finger' : 'Look at the Camera'}
            </h3>
            
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {selectedMethod === 'fingerprint_hash' 
                ? 'Place your finger on the sensor to verify your identity'
                : 'Position your face in the camera frame for verification'
              }
            </p>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#dc2626',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleMFAVerification}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>
          </div>
        )}

        {mfaStep === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Verification Successful!</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {trustDevice ? 'Device has been marked as trusted. ' : ''}
              Redirecting you to your dashboard...
            </p>
          </div>
        )}

        {mfaStep === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <X size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Verification Failed</h3>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              {error}
            </p>
            <button
              onClick={() => setMfaStep('select')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFAStepUp;