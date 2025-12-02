import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useZKP } from '../../contexts/ZKPContext';
import { useRejectionReason } from '../../contexts/ReasonContext';
import { ApiError } from '../../services/api';
import RiskIndicator from '../common/RiskIndicator';
import RejectionReasonModal from '../security/RejectionReasonModal';
import DeviceAuthStatus from '../security/DeviceAuthStatus';
import LocationPicker from './LocationPicker';
import MFAStepUp from './MFAStepUp';
import RiskScorePopup from '../security/RiskScorePopup';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [useZKPAuth] = useState(false); // ZKP is optional - disabled by default
  const [zkpStep, setZkpStep] = useState<'idle' | 'generating' | 'verifying'>('idle');
  const [deviceAuthInfo, setDeviceAuthInfo] = useState<any>(null);
  const [keystrokes, setKeystrokes] = useState<{ timestamp: number; key: string }[]>([]);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showMFAStepUp, setShowMFAStepUp] = useState(false);
  const [mfaRiskData, setMfaRiskData] = useState<any>(null);
  const [showRiskPopup, setShowRiskPopup] = useState(false);
  const [riskData, setRiskData] = useState<{ score: number; breakdown?: any; status?: string; lockReason?: string } | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  
  const { deviceContext } = useAuth();
  const { generateIdentityProof } = useZKP();
  const { showReason } = useRejectionReason();
  const navigate = useNavigate();

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

  const handleRiskPopupContinue = () => {
    // User clicked ENTER on allowed popup
    if (pendingToken) {
      localStorage.setItem('token', pendingToken);
      setPendingToken(null);
    }
    setShowRiskPopup(false);
    navigate('/dashboard');
  };

  const handleRiskPopupMFA = async () => {
    // User clicked Give FingerPrint on MFA required popup
    setShowRiskPopup(false);
    // TODO: Implement WebAuthn MFA flow
    // For now, show the existing MFA step-up
    setMfaRiskData({
      riskScore: riskData?.score || 50,
      reason: 'Additional verification required',
      availableMethods: ['fingerprint_hash']
    });
    setShowMFAStepUp(true);
  };

  const handleRiskPopupClose = () => {
    // User closed blocked popup
    setShowRiskPopup(false);
    setRiskData(null);
    setPendingToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if GPS location is available
    if (!gpsLocation) {
      setError('GPS location is required. Please allow location access and wait for detection.');
      return;
    }
    
    console.log('LoginForm: Submitting with GPS:', gpsLocation);
    
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

      // Login with OPA-based RBA
      const loginResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          deviceFingerprint: deviceContext?.fingerprint,
          deviceId: deviceContext?.deviceId || deviceContext?.fingerprint,
          location: gpsLocation ? {
            type: 'Point',
            coordinates: [gpsLocation.lon, gpsLocation.lat],
            name: deviceContext?.location?.name || 'Unknown'
          } : undefined,
          gps: gpsLocation ? { lat: gpsLocation.lat, lon: gpsLocation.lon } : undefined,
          keystroke: keystrokes.length > 1 ? {
            meanIKI: keystrokes.reduce((sum, k, i) => i > 0 ? sum + (k.timestamp - keystrokes[i-1].timestamp) : sum, 0) / Math.max(1, keystrokes.length - 1),
            samples: keystrokes.length
          } : undefined,
          localTimestamp: new Date().toISOString(),
          zkpProof
        })
      });

      // Always parse JSON response, even for error status codes
      let loginData;
      try {
        loginData = await loginResponse.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setError('Login failed. Please try again.');
        return;
      }
      
      // Debug logging
      console.log('Login response:', {
        status: loginResponse.status,
        ok: loginResponse.ok,
        data: loginData
      });
      
      // DEBUG: Show response in alert
      if (loginResponse.status === 403) {
        alert(`DEBUG 403 Response:\nstatus field: ${loginData.status}\nrisk: ${loginData.risk}\nmessage: ${loginData.message}`);
      }

      // Handle blocked status FIRST (before checking response.ok)
      if (loginData.status === 'blocked') {
        console.log('User is blocked, showing popup');
        alert('DEBUG: User is blocked, showing popup'); // DEBUG
        // Show blocked popup
        setRiskData({
          score: loginData.risk || 100,
          breakdown: loginData.breakdown,
          status: 'blocked',
          lockReason: loginData.lockReason || loginData.message
        });
        setShowRiskPopup(true);
        setLoading(false); // Stop loading
        return;
      }

      // Handle other error responses (401)
      if (!loginResponse.ok) {
        console.log('Login error:', loginData.error || loginData.message);
        setError(loginData.error || loginData.message || 'Login failed');
        return;
      }

      // Handle RBA responses
      if (loginData.status === 'mfa_required') {
        // Show MFA popup
        setRiskData({
          score: loginData.risk || 50,
          breakdown: loginData.breakdown,
          status: 'mfa_required'
        });
        setShowRiskPopup(true);
        return;
      }

      if (loginData.status === 'ok' || loginData.token) {
        // Show allowed popup
        setRiskData({
          score: loginData.risk || 0,
          breakdown: loginData.breakdown,
          status: 'allowed'
        });
        setPendingToken(loginData.token);
        setShowRiskPopup(true);
        return;
      }

      // Legacy response handling
      setRiskScore(loginData.riskScore || 0);
      setDeviceAuthInfo(loginData.deviceInfo);
      
      if (loginData.opaDecision === 'deny') {
        showReason({
          details: 'Login denied by security policy',
          riskScore: loginData.riskScore || 0,
          factors: {
            location: deviceContext?.location?.name || 'Unknown',
            registeredLocation: loginData.user?.registeredLocation,
            fingerprintMatch: deviceContext?.fingerprint === loginData.user?.deviceFingerprint,
            deviceFingerprint: deviceContext?.fingerprint
          }
        });
        return;
      }

      // Store token and navigate
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error caught:', err);
      if (err instanceof ApiError) {
        setError(err.message);
        
        // If it's a policy denial, show detailed reason
        if (err.status === 403) {
          showReason({
            details: err.message,
            riskScore: riskScore || 0,
            factors: {
              location: deviceContext?.location?.name || 'Unknown',
              deviceFingerprint: deviceContext?.fingerprint
            }
          });
        }
      } else {
        console.error('Non-API error:', err);
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
        <LocationPicker
          onLocationChange={(location) => {
            console.log('LoginForm: Location changed:', location);
            if (location) {
              setGpsLocation({ lat: location.lat, lon: location.lon });
              console.log('LoginForm: GPS location set:', { lat: location.lat, lon: location.lon });
            } else {
              setGpsLocation(null);
              console.log('LoginForm: GPS location cleared');
            }
          }}
          required={true}
        />
        
        {/* Debug: Show GPS location state */}
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
            GPS Ready: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lon.toFixed(4)}
          </div>
        )}

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
            disabled={loading || !gpsLocation}
          >
            {loading ? (
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

      {/* Risk Score Popup */}
      <RiskScorePopup
        isOpen={showRiskPopup}
        riskScore={riskData?.score || 0}
        breakdown={riskData?.breakdown}
        lockReason={riskData?.lockReason}
        onContinue={handleRiskPopupContinue}
        onStartMFA={handleRiskPopupMFA}
        onClose={handleRiskPopupClose}
      />
    </div>
  );
};

export default LoginForm;