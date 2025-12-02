import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';

interface CurrentLocationProps {
  onLocationChange?: (location: { lat: number; lon: number; name: string } | null) => void;
}

const CurrentLocation: React.FC<CurrentLocationProps> = ({ onLocationChange }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [location, setLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setStatus('loading');
    setError('');

    if (!navigator.geolocation) {
      setStatus('error');
      setError('Geolocation is not supported by your browser');
      onLocationChange?.(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          let locationName = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          if (response.ok) {
            const data = await response.json();
            locationName = `${data.city || data.locality || 'Unknown'}, ${data.countryName || 'Unknown'}`;
          }
          
          const loc = {
            lat: latitude,
            lon: longitude,
            name: locationName
          };
          
          setLocation(loc);
          setStatus('success');
          onLocationChange?.(loc);
          
          console.log('✅ GPS Location captured:', loc);
        } catch (err) {
          console.error('Geocoding error:', err);
          const loc = {
            lat: latitude,
            lon: longitude,
            name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          };
          setLocation(loc);
          setStatus('success');
          onLocationChange?.(loc);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setStatus('error');
        setError(err.message || 'Location access denied');
        onLocationChange?.(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  if (status === 'loading') {
    return (
      <div style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        background: '#fffbeb',
        border: '2px solid #fbbf24',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <Loader size={20} style={{ color: '#f59e0b', animation: 'spin 1s linear infinite' }} />
        <div>
          <div style={{ fontWeight: '600', color: '#92400e' }}>Getting your location...</div>
          <div style={{ fontSize: '0.875rem', color: '#92400e', marginTop: '0.25rem' }}>
            Please allow location access when prompted
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        padding: '1rem',
        borderRadius: '0.5rem',
        background: '#fef2f2',
        border: '2px solid #ef4444',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <AlertCircle size={20} style={{ color: '#dc2626' }} />
          <div>
            <div style={{ fontWeight: '600', color: '#991b1b' }}>Location Required</div>
            <div style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: '0.25rem' }}>
              {error}
            </div>
          </div>
        </div>
        <button
          onClick={requestLocation}
          style={{
            padding: '0.5rem 1rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: 'white',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#991b1b'
        }}>
          <strong>How to enable:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.25rem', paddingLeft: 0 }}>
            <li>Click the location icon in your browser's address bar</li>
            <li>Select "Allow" for location access</li>
            <li>Click "Try Again" button above</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      borderRadius: '0.5rem',
      background: '#ecfdf5',
      border: '2px solid #10b981',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <CheckCircle size={20} style={{ color: '#059669' }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={16} />
          Current Location
        </div>
        <div style={{ fontSize: '0.875rem', color: '#065f46', marginTop: '0.25rem' }}>
          📍 {location?.name}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.125rem' }}>
          {location?.lat.toFixed(4)}, {location?.lon.toFixed(4)}
        </div>
      </div>
      <button
        onClick={requestLocation}
        style={{
          padding: '0.375rem',
          background: 'transparent',
          border: '1px solid #10b981',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          color: '#059669',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Refresh location"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default CurrentLocation;
