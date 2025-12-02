// Device fingerprinting utility
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas fingerprinting
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  const canvasFingerprint = canvas.toDataURL();

  // Screen information
  const screen = {
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth
  };

  // Navigator information
  const navigator = {
    userAgent: window.navigator.userAgent,
    language: window.navigator.language,
    platform: window.navigator.platform,
    cookieEnabled: window.navigator.cookieEnabled,
    doNotTrack: window.navigator.doNotTrack,
    hardwareConcurrency: window.navigator.hardwareConcurrency || 0
  };

  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Combine all fingerprint data
  const fingerprintData = {
    canvas: canvasFingerprint.slice(-50), // Last 50 chars to reduce size
    screen,
    navigator,
    timezone,
    timestamp: Date.now()
  };

  // Generate hash-like fingerprint
  const fingerprint = btoa(JSON.stringify(fingerprintData))
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 32);

  return fingerprint;
};

export interface GPSLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  name?: string;
  lat: number;
  lon: number;
}

export const getGPSLocation = async (): Promise<GPSLocation | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get readable location
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          let locationName = 'Unknown Location';
          if (response.ok) {
            const data = await response.json();
            locationName = `${data.city || data.locality || 'Unknown City'}, ${data.countryName || 'Unknown Country'}`;
          }
          
          const gpsLocation: GPSLocation = {
            type: 'Point',
            coordinates: [longitude, latitude], // GeoJSON format: [lon, lat]
            name: locationName,
            lat: latitude,
            lon: longitude
          };
          
          console.log('GPS location detected:', gpsLocation);
          resolve(gpsLocation);
        } catch (error) {
          console.warn('Reverse geocoding failed:', error);
          // Fallback with coordinates only
          const { latitude, longitude } = position.coords;
          resolve({
            type: 'Point',
            coordinates: [longitude, latitude],
            name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
            lat: latitude,
            lon: longitude
          });
        }
      },
      (error) => {
        console.warn('GPS location access denied or failed:', error.message);
        resolve(null);
      },
      options
    );
  });
};

export const getLocationInfo = async (): Promise<GPSLocation | null> => {
  // Try GPS first
  const gpsLocation = await getGPSLocation();
  if (gpsLocation) {
    return gpsLocation;
  }

  // Fallback to IP-based location (simplified)
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      return {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
        name: `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`,
        lat: data.latitude,
        lon: data.longitude
      };
    }
  } catch (error) {
    console.warn('IP-based location detection failed:', error);
  }
  
  return null;
};

export const getDeviceContext = async () => {
  const fingerprint = generateDeviceFingerprint();
  const location = await getLocationInfo();
  
  return {
    fingerprint,
    location: location,
    gps: location ? { lat: location.lat, lon: location.lon } : null,
    deviceId: fingerprint, // Use fingerprint as deviceId for RBA
    localTimestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    // Additional client info for enhanced fingerprinting
    clientInfo: {
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unspecified'
    }
  };
};