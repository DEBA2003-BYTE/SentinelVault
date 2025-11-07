# 🐛 Debug Login Issues

## Current Issue
Getting 400 Bad Request when trying to login from frontend with admin@gmail.com

## Steps to Debug

### 1. Check Backend Logs
When you try to login from the frontend, check your backend terminal for error messages. You should see:
```
Login validation error: [array of validation errors]
```

### 2. Check Browser Console
Open browser DevTools (F12) and check the Console tab. You should see:
```
Login payload: { email, password, deviceFingerprint, location, clientInfo, zkpProof }
API Error: { status: 400, error: ... }
```

### 3. Test with Curl (This Works!)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Debarghya"}'
```

This should return success with a token.

### 4. Common Issues

#### Issue: clientInfo contains non-serializable data
**Solution**: Check if `clientInfo` has circular references or functions

#### Issue: zkpProof is being sent but is invalid
**Solution**: ZKP is now disabled by default, so this shouldn't happen

#### Issue: deviceFingerprint or location is undefined
**Solution**: The schema allows these to be optional, so this shouldn't cause errors

## Quick Fix

### Option 1: Simplify the Login Request
Edit `frontend/src/services/api.ts` and temporarily remove optional fields:

```typescript
async login(email: string, password: string, context?: any) {
  const payload = { 
    email, 
    password
    // Remove all optional fields for testing
  };
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}
```

### Option 2: Check What's Being Sent
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Click on the "login" request
5. Check the "Payload" tab to see exactly what's being sent

## Expected Payload Format

```json
{
  "email": "admin@gmail.com",
  "password": "Debarghya",
  "deviceFingerprint": "abc123...",
  "location": "Kolkata, India",
  "clientInfo": {
    "screenResolution": "1920x1080",
    "colorDepth": 24,
    "pixelRatio": 1,
    "timezone": "Asia/Kolkata",
    "platform": "MacIntel",
    "language": "en-US",
    "cookieEnabled": true,
    "doNotTrack": null
  }
}
```

## Backend Schema

The backend expects:
```typescript
{
  email: string (required, must be valid email),
  password: string (required),
  deviceFingerprint: string (optional),
  location: string (optional),
  clientInfo: any (optional),
  zkpProof: { proof: string, publicSignals: string[] } (optional)
}
```

## Next Steps

1. **Check backend terminal** for validation errors
2. **Check browser console** for the exact payload being sent
3. **Compare** the payload with the expected format above
4. **Report** what you see in the validation error

The backend is working (curl test passes), so the issue is with what the frontend is sending.