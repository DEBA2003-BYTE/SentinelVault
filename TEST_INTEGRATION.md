# 🧪 Frontend-Backend Integration Test

## Current Status Check

### Backend Status
```bash
curl http://localhost:3000/health
```
**Expected**: `{"status":"OK","services":{"api":"running","mongodb":{"status":"connected"}}}`

### Frontend Status
Open browser to: `http://localhost:5173`
**Expected**: Login page loads

## Integration Points Verified

### ✅ 1. API URL Configuration
- **Frontend**: `VITE_API_URL=http://localhost:3000`
- **Backend**: Running on port 3000
- **Status**: ✅ Matching

### ✅ 2. CORS Configuration
- **Backend**: `app.use(cors())` - allows all origins
- **Status**: ✅ Enabled

### ✅ 3. Request/Response Schema Match

#### Login Request Schema
**Frontend sends**:
```typescript
{
  email: string,
  password: string,
  deviceFingerprint?: string,
  location?: string,
  clientInfo?: object,
  zkpProof?: object
}
```

**Backend expects**:
```typescript
{
  email: string (required),
  password: string (required),
  deviceFingerprint?: string (optional),
  location?: string (optional),
  clientInfo?: any (optional),
  zkpProof?: { proof: string, publicSignals: string[] } (optional)
}
```

**Status**: ✅ Matching

### ✅ 4. Device Context Generation
**Frontend generates**:
```typescript
{
  fingerprint: string,
  location: string | 'Unknown',
  clientInfo: {
    screenResolution: string,
    colorDepth: number,
    pixelRatio: number,
    timezone: string,
    platform: string,
    language: string,
    cookieEnabled: boolean,
    doNotTrack: string | 'unspecified'
  }
}
```

**Status**: ✅ All fields properly typed

### ✅ 5. Authentication Flow

#### Admin Login
- **Email**: admin@gmail.com
- **Password**: Debarghya
- **Device Auth**: Bypassed ✅
- **Expected**: Success from any device

#### User Registration
- **Any Email**: test@example.com
- **Any Password**: password123
- **Device Auth**: Not required ✅
- **Expected**: Success from any device

#### User Login (Non-Admin)
- **Email**: test@example.com
- **Password**: password123
- **Device Auth**: Required ⚠️
- **Expected**: Success only from registered device

## Test Procedures

### Test 1: Backend Direct Test (Curl)
```bash
# Test admin login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Debarghya"}'
```

**Expected Result**: 
```json
{
  "message": "Login successful",
  "token": "eyJ...",
  "user": {
    "email": "admin@gmail.com",
    "isAdmin": true
  }
}
```

### Test 2: Frontend Login Test
1. Open browser to `http://localhost:5173/login`
2. Open DevTools (F12) → Console tab
3. Enter credentials:
   - Email: `admin@gmail.com`
   - Password: `Debarghya`
4. Click "Sign In"

**Check Console for**:
```
Login payload: { email, password, deviceFingerprint, location, clientInfo }
```

**Expected Result**: Redirect to dashboard

### Test 3: Frontend Registration Test
1. Open browser to `http://localhost:5173/register`
2. Enter new credentials:
   - Email: `newuser@example.com`
   - Password: `password123`
3. Click "Sign Up"

**Expected Result**: Success, redirect to dashboard

## Common Issues & Solutions

### Issue: "Failed to load resource: 400 Bad Request"

**Debug Steps**:
1. Check backend terminal for validation errors
2. Check browser console for payload details
3. Verify all required fields are present

**Solution**: 
- Ensure `email` and `password` are not empty
- Check that `clientInfo` doesn't have circular references

### Issue: "Device authentication failed" for admin

**Debug Steps**:
1. Check if user exists in database
2. Verify user has `isAdmin: true`
3. Check backend logs for the actual check

**Solution**:
```bash
# Recreate admin user
cd backend
bun run create-admin
```

### Issue: CORS error

**Symptoms**: 
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**: Backend already has CORS enabled, restart backend:
```bash
cd backend
bun run dev
```

### Issue: "Cannot connect to server"

**Symptoms**: `curl: (7) Failed to connect to localhost port 3000`

**Solution**: Backend not running, start it:
```bash
cd backend
bun run dev
```

## Verification Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Admin user created
- [ ] Curl test passes
- [ ] Frontend login page loads
- [ ] Browser console shows no errors
- [ ] Login payload is logged correctly

## Current Configuration

### Backend (.env)
```env
PORT=3000
MONGODB_URI=mongodb+srv://...
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Debarghya
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
```

## Success Criteria

✅ Admin can login from frontend  
✅ Users can register from frontend  
✅ Users can login from frontend  
✅ No CORS errors  
✅ No validation errors  
✅ Proper error messages displayed  

## Next Steps if Still Failing

1. **Clear browser cache and localStorage**:
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```

2. **Restart both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   bun run dev
   
   # Terminal 2 - Frontend
   cd frontend
   bun run dev
   ```

3. **Check exact error**:
   - Backend terminal: Look for validation errors
   - Browser console: Look for API errors
   - Network tab: Check request/response details

4. **Test with minimal payload**:
   Temporarily edit `frontend/src/services/api.ts`:
   ```typescript
   async login(email: string, password: string, context?: any) {
     const payload = { email, password }; // Minimal payload
     const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(payload)
     });
     return handleResponse(response);
   }
   ```

This will help identify if the issue is with optional fields.