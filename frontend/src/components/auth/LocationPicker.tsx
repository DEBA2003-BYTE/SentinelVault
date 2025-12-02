import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, Loader, AlertCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationChange: (location: { lat: number; lon: number; name: string } | null) => void;
  required?: boolean;
}

// Component to handle map clicks
function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Your selected location</Popup>
    </Marker>
  );
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationChange, required = false }) => {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const requestLocation = async () => {
    console.log('LocationPicker: Requesting location...');
    setLoading(true);
    setError(null);
    
    if (!('geolocation' in navigator)) {
      console.error('LocationPicker: Geolocation not supported');
      setLoading(false);
      setError('Geolocation is not supported by your browser');
      setPermissionState('denied');
      if (required) {
        onLocationChange(null);
      }
      return;
    }

    console.log('LocationPicker: Geolocation API available');
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        console.log('LocationPicker: Position received:', pos.coords);
        
        const newPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setPosition(newPosition);
        setLoading(false);
        setPermissionState('granted');
        setError(null);
        
        // Immediately notify parent with coordinates
        const locationData = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'Location detected'
        };
        setLocationName('Location detected');
        onLocationChange(locationData);
        
        // Try reverse geocode in background (optional, non-blocking)
        setTimeout(async () => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              const name = data.display_name || 'Location detected';
              setLocationName(name);
              onLocationChange({
                lat: pos.coords.latitude,
                lon: pos.coords.longitude,
                name,
              });
            }
          } catch (err) {
            // Silently fail - coordinates already sent
          }
        }, 100);
      },
      (err) => {
        console.error('LocationPicker: Geolocation error:', err);
        setLoading(false);
        setPermissionState('denied');
        setError(err.message);
        if (required) {
          onLocationChange(null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Update parent when position changes (manual selection)
  useEffect(() => {
    if (position && position.lat && position.lng) {
      // Immediately notify parent with coordinates (don't wait for geocoding)
      const locationData = {
        lat: position.lat,
        lon: position.lng,
        name: locationName || 'Location detected'
      };
      onLocationChange(locationData);
      
      // Try reverse geocoding in background (optional)
      const reverseGeocode = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            const name = data.display_name || 'Location detected';
            setLocationName(name);
            onLocationChange({
              lat: position.lat,
              lon: position.lng,
              name,
            });
          }
        } catch (err) {
          // Silently fail - we already have coordinates
          console.log('Reverse geocoding skipped (not critical)');
        }
      };
      reverseGeocode();
    }
  }, [position]);

  // Show prompt to allow location
  if (permissionState === 'prompt' && !position) {
    return (
      <div style={{
        padding: 'var(--space-4)',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
        color: 'white',
      }}>
        <MapPin size={48} style={{ margin: '0 auto var(--space-3)', opacity: 0.9 }} />
        <h3 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--text-lg)', fontWeight: '600' }}>
          Location Required
        </h3>
        <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', opacity: 0.9 }}>
          We need your location for security verification
        </p>
        <button
          onClick={requestLocation}
          disabled={loading}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <MapPin size={20} />
              Allow Location Access
            </>
          )}
        </button>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{
        padding: 'var(--space-4)',
        textAlign: 'center',
        background: 'var(--color-gray-50)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
      }}>
        <Loader className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
        <p style={{ margin: 0, color: 'var(--color-gray-600)' }}>
          Detecting your location...
        </p>
      </div>
    );
  }

  // Show error with retry button
  if (error || permissionState === 'denied') {
    return (
      <div style={{
        padding: 'var(--space-4)',
        background: 'var(--color-red-50)',
        border: '1px solid var(--color-red-200)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-red-600)' }} />
          <strong style={{ color: 'var(--color-red-900)' }}>Location Access Required</strong>
        </div>
        <p style={{ margin: '0 0 var(--space-3)', color: 'var(--color-red-700)', fontSize: 'var(--text-sm)' }}>
          {error || 'Location access was denied'}. Please enable location access in your browser settings.
        </p>
        <button
          onClick={requestLocation}
          disabled={loading}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--text-sm)',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          {loading ? (
            <>
              <Loader size={16} className="animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <MapPin size={16} />
              Try Again
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-2)',
        padding: 'var(--space-3)',
        background: 'var(--color-green-50)',
        border: '1px solid var(--color-green-200)',
        borderRadius: 'var(--radius-md)',
      }}>
        <MapPin size={16} style={{ color: 'var(--color-green-600)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: '500', color: 'var(--color-green-900)' }}>
            Location Detected
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-green-700)' }}>
            {locationName}
          </div>
        </div>
      </div>

      <div style={{
        height: '300px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '2px solid var(--color-gray-200)',
      }}>
        {position && (
          <MapContainer
            center={[position.lat, position.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
        )}
      </div>
      
      <p style={{
        margin: 'var(--space-2) 0 0',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-gray-600)',
        textAlign: 'center',
      }}>
        Click on the map to adjust your location
      </p>
    </div>
  );
};

export default LocationPicker;
