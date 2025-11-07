import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface LocationPermissionProps {
  onLocationDetected: (location: string) => void;
  onLocationFailed: () => void;
}

const LocationPermission: React.FC<LocationPermissionProps> = ({
  onLocationDetected,
  onLocationFailed
}) => {
  const [status, setStatus] = useState<'requesting' | 'granted' | 'denied' | 'detecting'>('requesting');
  const [location, setLocation] = useState<string>('');

  const requestLocation = async () => {
    setStatus('detecting');
    
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      setStatus('denied');
      onLocationFailed();
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const detectedLocation = `${data.city || data.locality || 'Unknown City'}, ${data.countryName || 'Unknown Country'}`;
            setLocation(detectedLocation);
            setStatus('granted');
            onLocationDetected(detectedLocation);
          } else {
            const coordLocation = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
            setLocation(coordLocation);
            setStatus('granted');
            onLocationDetected(coordLocation);
          }
        } catch (error) {
          console.warn('Location detection failed:', error);
          setStatus('denied');
          onLocationFailed();
        }
      },
      (error) => {
        console.warn('GPS access denied:', error);
        setStatus('denied');
        onLocationFailed();
      },
      options
    );
  };

  const skipLocation = () => {
    setStatus('denied');
    onLocationFailed();
  };

  if (status === 'granted') {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <CheckCircle size={20} style={{ color: '#155724' }} />
        <div>
          <div style={{ fontWeight: '500', color: '#155724' }}>Location Detected</div>
          <div style={{ fontSize: '0.875rem', color: '#155724' }}>{location}</div>
        </div>
      </div>
    );
  }

  if (status === 'detecting') {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#d1ecf1',
        border: '1px solid #bee5eb',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Loader size={20} style={{ color: '#0c5460', animation: 'spin 1s linear infinite' }} />
        <div>
          <div style={{ fontWeight: '500', color: '#0c5460' }}>Detecting Location...</div>
          <div style={{ fontSize: '0.875rem', color: '#0c5460' }}>Please allow location access when prompted</div>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <AlertCircle size={20} style={{ color: '#721c24' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '500', color: '#721c24' }}>Location Access Denied</div>
          <div style={{ fontSize: '0.875rem', color: '#721c24' }}>
            Location will be set as "Location Not Provided"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <MapPin size={20} style={{ color: '#856404' }} />
        <div style={{ fontWeight: '500', color: '#856404' }}>Location Permission Required</div>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#856404', marginBottom: '1rem' }}>
        SentinelVault uses your location for security purposes to detect unusual login patterns. 
        Your precise location is not stored - only city and country information.
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
      </div>
    </div>
  );
};

export default LocationPermission;