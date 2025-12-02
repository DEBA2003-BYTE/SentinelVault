# Leaflet.js GPS Location Integration

## Overview
Integrated Leaflet.js for interactive GPS location tracking in the authentication flow.

## Features

### Interactive Map
- **Auto-detection**: Automatically detects user's GPS location on component mount
- **Manual adjustment**: Users can click on the map to adjust their location
- **Reverse geocoding**: Converts coordinates to human-readable addresses using OpenStreetMap Nominatim API
- **Visual feedback**: Shows location status with color-coded indicators

### Components

#### LocationPicker (`frontend/src/components/auth/LocationPicker.tsx`)
Main component that provides:
- Real-time GPS location detection
- Interactive Leaflet map with click-to-select functionality
- Reverse geocoding for location names
- Error handling for denied permissions
- Loading states

### Usage

#### In LoginForm
```tsx
<LocationPicker
  onLocationChange={(location) => {
    if (location) {
      setGpsLocation({ lat: location.lat, lon: location.lon });
    }
  }}
  required={true}
/>
```

#### In RegisterForm
```tsx
<LocationPicker 
  onLocationChange={handleLocationChange} 
  required={true} 
/>
```

## Installation

Dependencies installed:
```bash
npm install leaflet react-leaflet @types/leaflet --legacy-peer-deps
```

## Configuration

### Leaflet CSS
Added to `frontend/index.html`:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossorigin=""/>
```

### Map Tiles
Using OpenStreetMap tiles (free, no API key required):
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Reverse Geocoding
Using Nominatim API (free, no API key required):
```
https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}
```

## Features

1. **High Accuracy GPS**: Uses `enableHighAccuracy: true` for precise location
2. **Timeout Handling**: 10-second timeout for location requests
3. **Error States**: Clear error messages when location access is denied
4. **Loading States**: Visual feedback during location detection
5. **Interactive Map**: 300px height map with zoom level 13
6. **Click to Adjust**: Users can click anywhere on the map to update location
7. **Location Name Display**: Shows human-readable address from reverse geocoding

## Security Considerations

- GPS location is required for non-admin users
- Location data is sent to backend for risk assessment
- Coordinates are stored in GeoJSON format in the database
- Location history is tracked for anomaly detection

## Browser Compatibility

Requires browsers that support:
- Geolocation API
- Modern JavaScript (ES6+)
- CSS Grid and Flexbox

## Future Enhancements

- [ ] Add location history visualization
- [ ] Show trusted locations on map
- [ ] Add geofencing capabilities
- [ ] Offline map support
- [ ] Custom map markers for different risk levels
