import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Smartphone, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';
import LocationPicker from './LocationPicker';

const RegisterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  
  const { register, deviceContext } = useAuth();
  const navigate = useNavigate();

  const handleLocationChange = (location: { lat: number; lon: number; name: string } | null) => {
    setCurrentLocation(location);
    console.log('Location updated:', location);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!currentLocation) {
      setError('GPS location is required. Please allow location access.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      // Temporarily store location in sessionStorage for AuthContext to use
      sessionStorage.setItem('pendingGPS', JSON.stringify({
        type: 'Point',
        coordinates: [currentLocation.lon, currentLocation.lat],
        name: currentLocation.name,
        lat: currentLocation.lat,
        lon: currentLocation.lon
      }));
      
      await register(email, password);
      sessionStorage.removeItem('pendingGPS');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-4)'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '20px',
        padding: 'var(--space-8)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-4)',
            boxShadow: '0 10px 25px -5px rgba(245, 87, 108, 0.4)'
          }}>
            <Shield size={40} style={{ color: 'white' }} />
          </div>
          <h1 style={{ 
            marginBottom: 'var(--space-2)',
            fontSize: '2rem',
            fontWeight: 'var(--font-bold)',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--color-gray-600)', marginBottom: 0, fontSize: 'var(--text-lg)' }}>
            Join our secure cloud storage platform
          </p>
        </div>

        {/* GPS Location Requirement */}
        <LocationPicker onLocationChange={handleLocationChange} required={true} />

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <AlertCircle size={16} style={{ marginRight: 'var(--space-2)' }} />
            {error}
          </div>
        )}

        {/* Device Registration Info */}
        {deviceContext && (
          <div className="device-registration-info" style={{ marginBottom: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>
              Device Registration
            </h4>
            <div className="registration-details">
              <div className="registration-item">
                <Smartphone className="w-4 h-4" />
                <div>
                  <span className="label">Device Fingerprint:</span>
                  <span className="value">{deviceContext.fingerprint.slice(0, 12)}...</span>
                </div>
              </div>
              {deviceContext.location && (
                <div className="registration-item">
                  <MapPin className="w-4 h-4" />
                  <div>
                    <span className="label">Location:</span>
                    <span className="value">{deviceContext.location.name || 'Unknown'}</span>
                  </div>
                </div>
              )}
              <div className="registration-item">
                <Globe className="w-4 h-4" />
                <div>
                  <span className="label">Browser:</span>
                  <span className="value">{deviceContext.userAgent.split(' ')[0]}</span>
                </div>
              </div>
            </div>
            <div className="registration-note">
              <small>This device and location will be registered for enhanced security.</small>
            </div>
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
              className="form-input"
              required
              disabled={loading}
              minLength={8}
            />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
              Must be at least 8 characters long
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: 'var(--space-4)' }}
            disabled={loading || !currentLocation}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Creating account...
              </>
            ) : !currentLocation ? (
              'Waiting for GPS Location...'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <span style={{ color: 'var(--color-gray-600)' }}>Already have an account? </span>
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;