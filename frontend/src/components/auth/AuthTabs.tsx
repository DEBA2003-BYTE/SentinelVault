import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Info, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import LocationPicker from './LocationPicker';

const AuthTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'about' | 'feedback'>('login');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackComplaint, setFeedbackComplaint] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    setFeedbackError('');

    if (feedbackComplaint.length < 10) {
      setFeedbackError('Please provide more details (at least 10 characters)');
      setFeedbackLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: feedbackEmail,
          complaint: feedbackComplaint
        })
      });

      if (response.ok) {
        setFeedbackSubmitted(true);
        setFeedbackEmail('');
        setFeedbackComplaint('');
      } else {
        const data = await response.json();
        setFeedbackError(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setFeedbackError('Network error. Please try again.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Zero-Knowledge Proofs",
      description: "Advanced cryptographic verification without revealing sensitive information.",
      color: "var(--color-brand)"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Device Authentication", 
      description: "Unique device fingerprinting for enhanced security.",
      color: "#10b981"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk Assessment",
      description: "Real-time risk scoring based on behavior and location.",
      color: "#f59e0b"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Policy Engine",
      description: "Flexible, rule-based access control with OPA integration.",
      color: "#8b5cf6"
    }
  ];

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [mfaRiskScore, setMfaRiskScore] = useState<number>(0);
  const [showReregisterOption, setShowReregisterOption] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gpsLocation) {
      setLoginError('GPS location is required. Please allow location access.');
      return;
    }
    
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          gps: gpsLocation ? { lat: gpsLocation.lat, lon: gpsLocation.lon } : undefined,
          location: gpsLocation ? {
            type: 'Point',
            coordinates: [gpsLocation.lon, gpsLocation.lat],
            name: 'Login location'
          } : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Check if MFA is required
        if (data.status === 'mfa_required') {
          setMfaRequired(true);
          setMfaUserId(data.userId);
          setMfaRiskScore(data.originalRiskScore || data.risk || 0);
          setLoginError('');
        } else if (data.status === 'blocked') {
          setLoginError(data.message || 'Your account has been blocked. Please contact the administrator.');
        } else {
          // Normal login success
          localStorage.setItem('token', data.token);
          window.location.href = '/dashboard';
        }
      } else {
        if (data.status === 'blocked') {
          setLoginError(data.message || 'Your account has been blocked. Please contact the administrator.');
        } else {
          setLoginError(data.error || 'Login failed');
        }
      }
    } catch (err) {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMfaVerification = async () => {
    if (!mfaUserId) return;

    setLoginLoading(true);
    setLoginError('');

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setLoginError('Biometric authentication is not supported on this browser. Please use Chrome, Edge, Safari, or Firefox.');
        setLoginLoading(false);
        return;
      }

      // Request biometric authentication using WebAuthn
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: new Uint8Array(32), // In production, get this from server
        timeout: 60000,
        userVerification: 'required', // Require biometric verification
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
      };

      let credential;
      try {
        credential = await navigator.credentials.get({
          publicKey: publicKeyCredentialRequestOptions
        }) as PublicKeyCredential;
      } catch (webauthnError: any) {
        console.error('WebAuthn error:', webauthnError);
        if (webauthnError.name === 'NotAllowedError') {
          setLoginError('Biometric authentication was cancelled or failed. You can re-register your fingerprint below.');
          setShowReregisterOption(true);
        } else if (webauthnError.name === 'NotSupportedError') {
          setLoginError('Your device does not support biometric authentication.');
        } else {
          setLoginError('Biometric authentication failed. You can re-register your fingerprint below.');
          setShowReregisterOption(true);
        }
        setLoginLoading(false);
        return;
      }

      if (!credential) {
        setLoginError('Biometric authentication failed. Please try again.');
        setLoginLoading(false);
        return;
      }

      // Generate device fingerprint for additional verification
      const userAgent = navigator.userAgent;
      const language = navigator.language;
      const platform = navigator.platform;
      const deviceString = `${userAgent}-${language}-${platform}`;
      const deviceFingerprint = btoa(deviceString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

      // Biometric verification successful - the fact that we got here means the user's 
      // fingerprint/face was verified by the device's secure enclave
      console.log('✅ Biometric verification successful, credential ID:', credential.id);

      // Send verification to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/verify-mfa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: mfaUserId,
          deviceFingerprint,
          biometricVerified: true,
          credentialId: credential.id,
          originalRiskScore: mfaRiskScore, // Send original risk score for logging
          location: gpsLocation ? {
            type: 'Point',
            coordinates: [gpsLocation.lon, gpsLocation.lat],
            name: 'MFA verification location'
          } : undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        localStorage.setItem('token', data.token);
        window.location.href = '/dashboard';
      } else {
        setLoginError(data.error || data.message || 'MFA verification failed');
        setMfaRequired(false);
        setMfaUserId(null);
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setLoginError('Network error during MFA verification. Please try again.');
      setMfaRequired(false);
      setMfaUserId(null);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleReregisterFingerprint = async () => {
    if (!mfaUserId) return;

    setLoginLoading(true);
    setLoginError('');

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setLoginError('Biometric authentication is not supported on this browser.');
        setLoginLoading(false);
        return;
      }

      // Create new WebAuthn credential
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(32),
        rp: {
          name: 'SentinelVault',
          id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
        },
        user: {
          id: new Uint8Array(16),
          name: loginEmail,
          displayName: loginEmail
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000
      };

      let credential;
      try {
        credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        }) as PublicKeyCredential;
      } catch (error: any) {
        console.error('WebAuthn registration error:', error);
        setLoginError('Failed to register fingerprint. Please try again or contact support.');
        setLoginLoading(false);
        return;
      }

      if (!credential) {
        setLoginError('Failed to register fingerprint. Please try again.');
        setLoginLoading(false);
        return;
      }

      // After successful registration, try MFA verification again
      setLoginError('');
      setShowReregisterOption(false);
      
      // Automatically trigger verification after re-registration
      await handleMfaVerification();
      
    } catch (error) {
      console.error('Re-registration error:', error);
      setLoginError('Failed to re-register fingerprint. Please try again.');
      setLoginLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: activeTab === 'about' ? '900px' : '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '20px',
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* Tabs Header */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => setActiveTab('login')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              border: 'none',
              background: activeTab === 'login' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: activeTab === 'login' ? 'var(--color-brand)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'login' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.3s ease'
            }}
          >
            <Shield size={18} />
            Login
          </button>
          <button
            onClick={() => setActiveTab('about')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              border: 'none',
              background: activeTab === 'about' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: activeTab === 'about' ? 'var(--color-brand)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'about' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.3s ease'
            }}
          >
            <Info size={18} />
            About
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={{
              flex: 1,
              padding: 'var(--space-4)',
              border: 'none',
              background: activeTab === 'feedback' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              color: activeTab === 'feedback' ? 'var(--color-brand)' : 'var(--color-gray-600)',
              fontWeight: activeTab === 'feedback' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              transition: 'all 0.3s ease'
            }}
          >
            <MessageSquare size={18} />
            Feedback
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: 'var(--space-8)' }}>
          {/* Login Tab */}
          {activeTab === 'login' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
                }}>
                  <Shield size={40} style={{ color: 'white' }} />
                </div>
                <h1 style={{ 
                  marginBottom: 'var(--space-2)',
                  fontSize: '2rem',
                  fontWeight: 'var(--font-bold)',
                  background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Welcome Back
                </h1>
                <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-lg)' }}>
                  Sign in to your secure cloud storage
                </p>
              </div>

              {loginError && (
                <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                  <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
                  {loginError}
                </div>
              )}

              {/* MFA Required Screen */}
              {mfaRequired ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                    boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
                  }}>
                    <Shield size={40} style={{ color: 'white' }} />
                  </div>
                  <h2 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 'var(--font-bold)',
                    marginBottom: 'var(--space-2)',
                    color: '#f59e0b'
                  }}>
                    Biometric Verification Required
                  </h2>
                  <p style={{ 
                    color: 'var(--color-gray-600)',
                    marginBottom: 'var(--space-4)',
                    lineHeight: '1.6'
                  }}>
                    Your login attempt has a risk score of <strong>{mfaRiskScore}</strong>. 
                    Please verify your identity using biometric authentication.
                  </p>
                  <div style={{
                    padding: 'var(--space-4)',
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-6)',
                    textAlign: 'left'
                  }}>
                    <p style={{ 
                      fontSize: 'var(--text-sm)',
                      color: '#92400e',
                      marginBottom: 'var(--space-2)'
                    }}>
                      <strong>👆 Biometric Authentication</strong>
                    </p>
                    <p style={{ 
                      fontSize: 'var(--text-xs)',
                      color: '#78350f',
                      lineHeight: '1.5',
                      marginBottom: 'var(--space-2)'
                    }}>
                      Use your fingerprint sensor, Face ID, Touch ID, or Windows Hello to verify your identity.
                    </p>
                    <p style={{ 
                      fontSize: 'var(--text-xs)',
                      color: '#78350f',
                      lineHeight: '1.5'
                    }}>
                      Click the button below and follow your device's biometric authentication prompt.
                    </p>
                  </div>
                  <button
                    onClick={handleMfaVerification}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%',
                      marginBottom: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-6)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-semibold)'
                    }}
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <div className="spinner" />
                        Verifying Biometrics...
                      </>
                    ) : (
                      <>
                        👆 Use Fingerprint / Face ID
                      </>
                    )}
                  </button>
                  
                  <div style={{ 
                    textAlign: 'center', 
                    margin: 'var(--space-3) 0',
                    color: 'var(--color-gray-600)',
                    fontSize: 'var(--text-sm)'
                  }}>
                    or
                  </div>
                  
                  {showReregisterOption && (
                    <button
                      onClick={handleReregisterFingerprint}
                      className="btn btn-warning"
                      style={{ 
                        width: '100%',
                        marginBottom: 'var(--space-3)',
                        backgroundColor: '#f59e0b',
                        color: 'white'
                      }}
                      disabled={loginLoading}
                    >
                      🔄 Re-register Fingerprint
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setMfaRequired(false);
                      setMfaUserId(null);
                      setLoginEmail('');
                      setLoginPassword('');
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    disabled={loginLoading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {/* GPS Location Detection - Required for login */}
                  <LocationPicker
                    onLocationChange={(location) => {
                      console.log('AuthTabs: Location changed:', location);
                      if (location) {
                        const gps = { lat: location.lat, lon: location.lon };
                        setGpsLocation(gps);
                        console.log('AuthTabs: GPS state set to:', gps);
                      } else {
                        setGpsLocation(null);
                        console.log('AuthTabs: GPS state cleared');
                      }
                    }}
                    required={true}
                  />
                  
                  {/* Debug: Show GPS state */}
                  {gpsLocation && (
                    <div style={{
                      padding: 'var(--space-2)',
                      background: '#e0f2fe',
                      border: '1px solid #0284c7',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 'var(--space-4)',
                      fontSize: 'var(--text-xs)',
                      color: '#0c4a6e'
                    }}>
                      ✓ GPS Ready: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lon.toFixed(4)}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="login-email" className="form-label">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="form-input"
                    required
                    disabled={loginLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="form-input"
                    required
                    disabled={loginLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    marginBottom: 'var(--space-4)',
                    padding: 'var(--space-3) var(--space-6)'
                  }}
                  disabled={loginLoading || !gpsLocation}
                >
                  {loginLoading ? (
                    <>
                      <div className="spinner" />
                      Signing in...
                    </>
                  ) : !gpsLocation ? (
                    'Waiting for GPS Location...'
                  ) : (
                    'Sign In'
                  )}
                </button>

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: 'var(--color-gray-600)' }}>Don't have an account? </span>
                      <Link to="/register">Create one</Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
                }}>
                  <Shield size={40} style={{ color: 'white' }} />
                </div>
                <h1 style={{ 
                  marginBottom: 'var(--space-2)',
                  fontSize: '2rem',
                  fontWeight: 'var(--font-bold)',
                  background: 'linear-gradient(135deg, var(--color-brand) 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  SentinelVault
                </h1>
                <p style={{ color: 'var(--color-gray-600)', fontSize: 'var(--text-lg)' }}>
                  Next-generation secure cloud storage with zero-knowledge proofs and advanced security.
                </p>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 'var(--space-4)',
                marginBottom: 'var(--space-6)'
              }}>
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: 'var(--space-4)',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      <div style={{ color: feature.color }}>
                        {feature.icon}
                      </div>
                      <h3 style={{ 
                        fontSize: 'var(--text-base)', 
                        fontWeight: 'var(--font-semibold)',
                        margin: 0
                      }}>
                        {feature.title}
                      </h3>
                    </div>
                    <p style={{ 
                      color: 'var(--color-gray-600)', 
                      fontSize: 'var(--text-sm)',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--color-gray-600)', marginBottom: 'var(--space-4)' }}>
                  Ready to experience secure cloud storage?
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                  <button
                    onClick={() => setActiveTab('login')}
                    className="btn btn-primary"
                    style={{ padding: 'var(--space-3) var(--space-6)' }}
                  >
                    Sign In
                  </button>
                  <Link to="/register" className="btn btn-secondary" style={{ padding: 'var(--space-3) var(--space-6)' }}>
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div>
              {feedbackSubmitted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#d1fae5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)'
                  }}>
                    <CheckCircle size={30} style={{ color: '#10b981' }} />
                  </div>
                  <h2 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 'var(--font-bold)',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--color-success)'
                  }}>
                    Thank You!
                  </h2>
                  <p style={{ 
                    color: 'var(--color-gray-600)',
                    marginBottom: 'var(--space-6)',
                    lineHeight: '1.6'
                  }}>
                    Your feedback has been submitted successfully. Our team will review it and get back to you if needed.
                  </p>
                  <button
                    onClick={() => setFeedbackSubmitted(false)}
                    className="btn btn-primary"
                    style={{ padding: 'var(--space-3) var(--space-6)' }}
                  >
                    Submit Another Feedback
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <MessageSquare size={48} style={{ color: 'var(--color-brand)', marginBottom: 'var(--space-3)' }} />
                    <h2 style={{ 
                      fontSize: '1.5rem',
                      fontWeight: 'var(--font-bold)',
                      marginBottom: 'var(--space-2)'
                    }}>
                      We Value Your Feedback
                    </h2>
                    <p style={{ color: 'var(--color-gray-600)' }}>
                      Help us improve SentinelVault by sharing your experience or reporting issues.
                    </p>
                  </div>

                  {feedbackError && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
                      <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
                      {feedbackError}
                    </div>
                  )}

                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="form-group">
                      <label htmlFor="feedback-email" className="form-label">
                        Your Email Address
                      </label>
                      <input
                        id="feedback-email"
                        type="email"
                        value={feedbackEmail}
                        onChange={(e) => setFeedbackEmail(e.target.value)}
                        className="form-input"
                        placeholder="your@email.com"
                        required
                        disabled={feedbackLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="feedback-complaint" className="form-label">
                        Your Feedback
                      </label>
                      <textarea
                        id="feedback-complaint"
                        value={feedbackComplaint}
                        onChange={(e) => setFeedbackComplaint(e.target.value)}
                        className="form-input"
                        rows={4}
                        placeholder="Please describe your issue, suggestion, or feedback..."
                        required
                        disabled={feedbackLoading}
                        style={{ resize: 'vertical', minHeight: '100px' }}
                      />
                      <div style={{ 
                        fontSize: 'var(--text-xs)', 
                        color: 'var(--color-gray-500)', 
                        marginTop: 'var(--space-1)',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>Minimum 10 characters required</span>
                        <span>{feedbackComplaint.length}/1000</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ 
                        width: '100%', 
                        padding: 'var(--space-3) var(--space-6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-2)'
                      }}
                      disabled={feedbackLoading || feedbackComplaint.length < 10}
                    >
                      {feedbackLoading ? (
                        <>
                          <div className="spinner" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthTabs;