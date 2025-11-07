import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Loader, Info, X } from 'lucide-react';

interface GPSLocation {
  latitude: number;
  longitude: number;
  country: string;
  city: string;
  accuracy: number;
}

interface GPSLocationDetectorProps {
  onLocationDetected: (location: GPSLocation) => void;
  onLocationDenied: () => void;
  required?: boolean;
}

const GPSLocationDetector: React.FC<GPSLocationDetectorProps> = ({
  onLocationDetected,
  onLocationDenied,
  required = true
}) => {
  const [status, setStatus] = useState<'requesting' | 'detecting' | 'success' | 'denied' | 'error'>('requesting');
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [error, setError] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by this browser');
      if (required) {
        onLocationDenied();
      }
      return;
    }

    setStatus('detecting');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;
          
          // Use reverse geocoding to get country and city
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const detectedLocation: GPSLocation = {
              latitude,
              longitude,
              country: data.countryCode || 'Unknown',
              city: data.city || data.locality || 'Unknown City',
              accuracy: accuracy || 0
            };
            
            setLocation(detectedLocation);
            setStatus('success');
            onLocationDetected(detectedLocation);
          } else {
            // Fallback with coordinates only
            const detectedLocation: GPSLocation = {
              latitude,
              longitude,
              country: 'Unknown',
              city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              accuracy: accuracy || 0
            };
            
            setLocation(detectedLocation);
            setStatus('success');
            onLocationDetected(detectedLocation);
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setStatus('error');
          setError('Failed to determine location details');
          if (required) {
            onLocationDenied();
          }
        }
      },
      (error) => {
        console.error('GPS location error:', error);
        setStatus('denied');
        
        let errorMessage = 'Location access denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setError(errorMessage);
        if (required) {
          onLocationDenied();
        }
      },
      options
    );
  };

  const skipLocation = () => {
    if (!required) {
      setStatus('denied');
      onLocationDenied();
    }
  };

  useEffect(() => {
    // Auto-request location on mount
    requestLocation();
  }, []);

  if (status === 'success' && location) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <MapPin size={20} style={{ color: '#155724' }} />
          <span style={{ fontWeight: '500', color: '#155724' }}>Location Detected</span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#155724' }}>
          📍 {location.city}, {location.country}
          {location.accuracy > 0 && (
            <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
              (±{Math.round(location.accuracy)}m accuracy)
            </span>
          )}
        </div>
      </div>
    );
  }

  if (status === 'detecting') {
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: '#d1ecf1',
        border: '1px solid #bee5eb',
        borderRadius: '8px',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Loader size={24} style={{ color: '#0c5460', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: '500', color: '#0c5460' }}>Detecting Your Location...</span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#0c5460', marginBottom: '1rem' }}>
          Please allow location access when prompted by your browser.
          This helps us verify your identity and protect your account.
        </div>
        <div style={{ fontSize: '0.75rem', color: '#0c5460', opacity: 0.8 }}>
          We only use city-level location data for security purposes.
          Your precise coordinates are not stored.
        </div>
      </div>
    );
  }

  if (status === 'denied' || status === 'error') {
    return (
      <div style={{
        padding: '1.5rem',
        backgroundColor: required ? '#f8d7da' : '#fff3cd',
        border: `1px solid ${required ? '#f5c6cb' : '#ffeaa7'}`,
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertCircle size={20} style={{ color: required ? '#721c24' : '#856404' }} />
          <span style={{ fontWeight: '500', color: required ? '#721c24' : '#856404' }}>
            {required ? 'Location Access Required' : 'Location Access Denied'}
          </span>
        </div>
        
        <div style={{ fontSize: '0.875rem', color: required ? '#721c24' : '#856404', marginBottom: '1rem' }}>
          {error || 'Location access is required to use this service for security purposes.'}
        </div>

        {required ? (
          <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#721c24', marginBottom: '0.5rem' }}>
              <strong>Why do we need your location?</strong>
            </div>
            <ul style={{ fontSize: '0.8rem', color: '#721c24', margin: 0, paddingLeft: '1.2rem' }}>
              <li>Detect unusual login patterns from different countries</li>
              <li>Prevent unauthorized access from suspicious locations</li>
              <li>Comply with security regulations and data protection laws</li>
              <li>Only city/country level data is used - not precise coordinates</li>
            </ul>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={requestLocation}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Try Again
          </button>
          
          {!required && (
            <button
              onClick={skipLocation}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#856404',
                border: '1px solid #856404',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Continue Without Location
            </button>
          )}
          
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: required ? '#721c24' : '#856404',
              border: `1px solid ${required ? '#721c24' : '#856404'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Info size={14} />
            {showExplanation ? 'Hide' : 'Why?'}
          </button>
        </div>

        {showExplanation && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: required ? '#721c24' : '#856404'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <strong>How to enable location access:</strong>
              <button
                onClick={() => setShowExplanation(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: required ? '#721c24' : '#856404'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li>Click the location icon in your browser's address bar</li>
              <li>Select "Allow" or "Always allow" for location access</li>
              <li>Refresh the page if needed</li>
              <li>For mobile: Check your browser's location permissions in device settings</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  // Initial requesting state
  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <MapPin size={20} style={{ color: '#856404' }} />
        <span style={{ fontWeight: '500', color: '#856404' }}>Location Permission Required</span>
      </div>
      
      <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '1rem' }}>
        SentinelVault uses your location for security purposes to detect unusual login patterns
        and protect your account from unauthorized access.
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={requestLocation}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Allow Location Access
        </button>
        
        {!required && (
          <button
            onClick={skipLocation}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#856404',
              border: '1px solid #856404',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

export default GPSLocationDetector;