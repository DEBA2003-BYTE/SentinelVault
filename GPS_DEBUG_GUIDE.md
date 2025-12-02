# GPS Location Debugging Guide

## Current Status
The LocationPicker component with Leaflet.js is now integrated. If you're experiencing issues, follow these debugging steps:

## Debugging Steps

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab for these messages:

**Expected Success Messages:**
```
LocationPicker: Starting geolocation detection...
LocationPicker: Geolocation API available
LocationPicker: Position received: {latitude: XX.XXXX, longitude: YY.YYYY}
LocationPicker: Reverse geocoded name: [Address]
LoginForm: Location changed: {lat: XX.XXXX, lon: YY.YYYY, name: "[Address]"}
LoginForm: GPS location set: {lat: XX.XXXX, lon: YY.YYYY}
```

**Error Messages to Look For:**
```
LocationPicker: Geolocation error: [error message]
LocationPicker: Reverse geocoding failed: [error]
```

### 2. Check Location Permissions

#### Chrome/Edge:
1. Click the lock icon in the address bar
2. Check "Location" permission
3. Should be set to "Allow"
4. If blocked, change to "Allow" and refresh the page

#### Firefox:
1. Click the lock icon in the address bar
2. Click "Connection secure" > "More information"
3. Go to "Permissions" tab
4. Find "Access Your Location"
5. Uncheck "Use Default" and check "Allow"

#### Safari:
1. Safari > Settings > Websites > Location
2. Find localhost
3. Set to "Allow"

### 3. Visual Indicators

On the login page, you should see:

**When Loading:**
- Gray box with spinner
- Text: "Detecting your location..."

**When Successful:**
- Green box with MapPin icon
- Text: "Location Detected"
- Address displayed
- Interactive map showing your location
- Blue debug box showing coordinates (e.g., "GPS Ready: 40.7128, -74.0060")

**When Failed:**
- Red box with AlertCircle icon
- Text: "Location Access Required"
- Error message explaining the issue

### 4. Button State

The "Sign In" button should:
- Show "Waiting for GPS Location..." when location is not ready (disabled)
- Show "Sign In" when location is ready (enabled)
- Show "Signing in..." when submitting (disabled)

### 5. Common Issues

#### Issue: "User denied Geolocation"
**Solution:** 
- Clear site permissions in browser settings
- Refresh the page
- Allow location when prompted

#### Issue: "Timeout expired"
**Solution:**
- Check if location services are enabled on your device
- Try moving to a location with better GPS signal
- Increase timeout in LocationPicker.tsx (currently 10000ms)

#### Issue: Map not displaying
**Solution:**
- Check browser console for Leaflet errors
- Verify Leaflet CSS is loaded (check Network tab)
- Check if `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` loads successfully

#### Issue: "Geolocation is not supported"
**Solution:**
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Ensure you're accessing via HTTPS or localhost
- Check if browser has geolocation API support

### 6. Testing Checklist

- [ ] Browser console shows "LocationPicker: Starting geolocation detection..."
- [ ] Browser prompts for location permission
- [ ] You clicked "Allow" on the permission prompt
- [ ] Console shows "LocationPicker: Position received"
- [ ] Green "Location Detected" box appears
- [ ] Map displays with a marker
- [ ] Blue debug box shows coordinates
- [ ] "Sign In" button is enabled (not grayed out)
- [ ] Clicking on map updates the location

### 7. Manual Testing

If automatic detection fails, you can:
1. Wait for the map to load (even if it shows an error)
2. Click anywhere on the map to manually set your location
3. The location will update and the form will become enabled

### 8. Network Requirements

The component requires internet access for:
- OpenStreetMap tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Reverse geocoding: `https://nominatim.openstreetmap.org/reverse`
- Leaflet CSS: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`

Check the Network tab in DevTools to ensure these resources load successfully.

### 9. Backend Verification

Once location is captured, verify it's sent to the backend:

**Check the login request payload:**
```json
{
  "email": "user@example.com",
  "password": "********",
  "gps": {
    "lat": 40.7128,
    "lon": -74.0060
  },
  "location": {
    "lat": 40.7128,
    "lon": -74.0060
  }
}
```

### 10. Quick Fix

If all else fails, try this sequence:
1. Close all browser tabs for localhost
2. Clear browser cache and cookies for localhost
3. Restart the dev server
4. Open http://localhost:5173/login in a new incognito/private window
5. Allow location when prompted
6. Check console for debug messages

## Current URLs

- Frontend: http://localhost:5173/
- Login Page: http://localhost:5173/login
- Register Page: http://localhost:5173/register

## Files Modified

- `frontend/src/components/auth/LocationPicker.tsx` - Main location component
- `frontend/src/components/auth/LoginForm.tsx` - Uses LocationPicker
- `frontend/src/components/auth/RegisterForm.tsx` - Uses LocationPicker
- `frontend/index.html` - Added Leaflet CSS

## Next Steps

If you're still experiencing issues after following this guide:
1. Share the exact error message from the console
2. Share a screenshot of the login page
3. Confirm which browser and version you're using
4. Check if location services are enabled on your device
