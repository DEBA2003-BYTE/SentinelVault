import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useZKP } from '../../contexts/ZKPContext';
import { useRejectionReason } from '../../contexts/ReasonContext';
import { ApiError } from '../../services/api';
import RiskIndicator from '../common/RiskIndicator';
import RejectionReasonModal from '../security/RejectionReasonModal';
import RiskAssessmentModal from '../security/RiskAssessmentModal';
import DeviceAuthStatus from '../security/DeviceAuthStatus';
import GPSLocationDetector from './GPSLocationDetector';
import MFAStepUp from './MFAStepUp';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [useZKPAuth] = useState(false); // ZKP is optional - disabled by default
  const [zkpStep, setZkpStep] = useState<'idle' | 'generating' | 'verifying'>('idle');
  const [deviceAuthInfo, setDeviceAuthInfo] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [keystrokes, setKeystrokes] = useState<{ timestamp: number; key: string }[]>([]);
  const [gpsLocation, setGpsLocation] = useState<any>(null);
  const [locationRequired, setLocationRequired] = useState(true);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [showMFAStepUp, setShowMFAStepUp] = useState(false);
  const [mfaRiskData, setMfaRiskData] = useState<any>(null);
  
  const { login, deviceContext } = useAuth();
  const { generateIdentityProof } = useZKP();
  const { showReason } = useRejectionReason();
  const navigate = useNavigate();

  const handleLocationDetected = (location: any) => {
    setGpsLocation(location);
    setLocationBlocked(false);
    console.log('GPS location detected:', location);
  };

  const handleLocationDenied = () => {
    setLocationBlocked(true);
    setError('Location access is required to use this service for security purposes.');
    console.log('GPS location access denied');
  };

  const handleMFAComplete = (success: boolean) => {
    setShowMFAStepUp(false);
    if (success) {
      // MFA successful, proceed with login
      navigate('/dashboard');
    } else {
      // MFA failed or cancelled
      setError('Multi-factor authentication is required to continue.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Block login if location is required but not available
    if (locationRequired && !gpsLocation && locationBlocked) {
      setError('Location access is required to use this service. Please allow location access and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setRiskScore(null);

    try {
      let zkpProof = null;

      // Generate ZKP proof if enabled
      if (useZKPAuth) {
        setZkpStep('generating');
        try {
          zkpProof = await generateIdentityProof();
          setZkpStep('verifying');
        } catch (zkpError) {
          console.error('ZKP generation failed:', zkpError);
          setError('Identity proof generation failed. Proceeding with standard login.');
          setZkpStep('idle');
        }
      }

      // Try comprehensive risk assessment login first
      try {
        const comprehensiveResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login-comprehensive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            keystrokes,
            deviceFingerprint: deviceContext?.fingerprint,
            location: gpsLocation ? `${gpsLocation.city}, ${gpsLocation.country}` : deviceContext?.location,
            gpsLocation: gpsLocation, // Include full GPS data
            zkpProof
          })
        });

        const comprehensiveData = await comprehensiveResponse.json();

        if (comprehensiveResponse.status === 403 && comprehensiveData.risk_assessment) {
          // High risk - show detailed risk assessment
          setRiskAssessment(comprehensiveData.risk_assessment);
          setShowRiskModal(true);
          setError(comprehensiveData.error);
          return;
        }

        if (comprehensiveResponse.status === 202 && comprehensiveData.require_mfa) {
          // Medium risk - require MFA step-up
          setRiskAssessment(comprehensiveData.risk_assessment);
          setMfaRiskData({
            riskScore: comprehensiveData.risk_assessment?.risk_score || 50,
            reason: comprehensiveData.risk_assessment?.reasons?.join(', ') || 'Elevated risk detected',
            availableMethods: ['fingerprint_hash', 'face_recognition_hash'] // Would come from user's MFA setup
          });
          setShowMFAStepUp(true);
          return;
        }

        if (comprehensiveResponse.ok) {
          // Success with risk assessment
          setRiskAssessment(comprehensiveData.risk_assessment);
          // Continue with normal login flow using the token
          localStorage.setItem('token', comprehensiveData.token);
          navigate('/dashboard');
          return;
        }
      } catch (comprehensiveError) {
        console.log('Comprehensive login failed, falling back to standard login');
      }

      // Fallback to standard login
      const response = await login(email, password, zkpProof);
      setRiskScore(response.riskScore || 0);
      setDeviceAuthInfo(response.deviceInfo);
      
      if (response.opaDecision === 'deny') {
        // Show rejection reason modal
        showReason({
          details: 'Login denied by security policy',
          riskScore: response.riskScore || 0,
          factors: {
            location: deviceContext?.location,
            registeredLocation: response.user.registeredLocation,
            fingerprintMatch: deviceContext?.fingerprint === response.user.deviceFingerprint,
            deviceFingerprint: deviceContext?.fingerprint
          }
        });
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        
        // If it's a policy denial, show detailed reason
        if (err.status === 403) {
          showReason({
            details: err.message,
            riskScore: riskScore || 0,
            factors: {
              location: deviceContext?.location,
              deviceFingerprint: deviceContext?.fingerprint
            }
          });
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setZkpStep('idle');
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
        maxWidth: '450px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '20px',
        padding: 'var(--space-8)'
      }}>
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
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0, fontSize: 'var(--text-lg)' }}>
            Sign in to your secure cloud storage
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
            {error}
          </div>
        )}

        {/* Device Authentication Status - Only show after failed login */}
        {deviceAuthInfo && !deviceAuthInfo.isRecognized && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <DeviceAuthStatus 
              deviceInfo={deviceAuthInfo}
              showDetails={true}
            />
          </div>
        )}

        {riskScore !== null && (
          <div style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
            <RiskIndicator score={riskScore} />
          </div>
        )}

        {/* ZKP is now automatic - no checkbox needed */}

        {zkpStep !== 'idle' && (
          <div className="zkp-status" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="zkp-step">
              {zkpStep === 'generating' && (
                <>
                  <Key className="w-4 h-4 animate-spin" />
                  <span>Generating identity proof...</span>
                </>
              )}
              {zkpStep === 'verifying' && (
                <>
                  <CheckCircle className="w-4 h-4 animate-pulse" />
                  <span>Verifying cryptographic proof...</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* GPS Location Detection - Required for login */}
        <GPSLocationDetector
          onLocationDetected={handleLocationDetected}
          onLocationDenied={handleLocationDenied}
          required={locationRequired}
        />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                setKeystrokes(prev => [...prev, {
                  timestamp: Date.now(),
                  key: e.key
                }]);
              }}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <Link 
              to="/admin-login" 
              style={{ 
                color: '#dc2626', 
                textDecoration: 'none', 
                fontSize: 'var(--text-sm)',
                fontWeight: '500'
              }}
            >
              🔐 Admin Login
            </Link>
          </div>
          <div>
            <span style={{ color: 'var(--color-gray-600)' }}>Don't have an account? </span>
            <Link to="/register">Sign up</Link>
          </div>
        </div>
      </div>

      <RejectionReasonModal />
      
      <RiskAssessmentModal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        riskAssessment={riskAssessment}
      />

      {/* MFA Step-up Modal */}
      {mfaRiskData && (
        <MFAStepUp
          isOpen={showMFAStepUp}
          onClose={() => setShowMFAStepUp(false)}
          onMFAComplete={handleMFAComplete}
          riskScore={mfaRiskData.riskScore}
          riskReason={mfaRiskData.reason}
          availableMethods={mfaRiskData.availableMethods}
        />
      )}
    </div>
  );
};

export default LoginForm;