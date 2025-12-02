import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { getGPSLocation, type GPSLocation } from '../../utils/deviceFingerprint';

interface GPSRequirementProps {
  onLocationReady: (location: GPSLocation) => void;
  onLocationFailed: () => void;
}

const GPSRequirement: React.FC<GPSRequirementProps> = ({ onLocationReady, onLocationFailed }) => {
  const [status, setStatus] = useState<'requesting' | 'loading' | 'success' | 'error'>('requesting');
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setStatus('loading');
    setError('');

    try {
      const gpsLocation = await getGPSLocation();
      
      if (gpsLocation) {
        setLocation(gpsLocation);
        setStatus('success');
        onLocationReady(gpsLocation);
      } else {
        setStatus('error');
        setError('Location access denied or unavailable');
        onLocationFailed();
      }
    } catch (err) {
      setStatus('error');
      setError('Failed to get location');
      onLocationFailed();
    }
  };

  return (
    <div style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 'var(--space-4)',
      border: '2px solid',
      borderColor: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#f59e0b',
      background: status === 'success' ? '#ecfdf5' : status === 'error' ? '#fef2f2' : '#fffbeb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {status === 'loading' && (
          <>
            <Loader size={24} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#92400e' }}>Requesting Location...</div>
              <div style={{ fontSize: '0.875rem', color: '#92400e', marginTop: '0.25rem' }}>
                Please allow location access when prompted
              </div>
            </div>
          </>
        )}

        {status === 'requesting' && (
          <>
            <MapPin size={24} style={{ color: '#f59e0b' }} />
            <div>
              <div style={{ fontWeight: '600', color: '#92400e' }}>GPS Location Required</div>
              <div style={{ fontSize: '0.875rem', color: '#92400e', marginTop: '0.25rem' }}>
                Click "Allow" when your browser asks for location permission
              </div>
            </div>
          </>
        )}

        {status === 'success' && location && (
          <>
            <CheckCircle size={24} style={{ color: '#10b981' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#065f46' }}>Location Detected ✓</div>
              <div style={{ fontSize: '0.875rem', color: '#065f46', marginTop: '0.25rem' }}>
                📍 {location.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.125rem' }}>
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={24} style={{ color: '#ef4444' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#991b1b' }}>Location Required</div>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: '0.25rem' }}>
                {error}
              </div>
              <button
                onClick={requestLocation}
                style={{
                  marginTop: 'var(--space-2)',
                  padding: '0.375rem 0.75rem',
                  fontSize: '0.875rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>

      {status === 'error' && (
        <div style={{
          marginTop: 'var(--space-3)',
          padding: 'var(--space-3)',
          background: 'white',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          color: '#991b1b'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>How to enable location:</div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            <li>Click the location icon in your browser's address bar</li>
            <li>Select "Allow" for location access</li>
            <li>Refresh the page if needed</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GPSRequirement;
