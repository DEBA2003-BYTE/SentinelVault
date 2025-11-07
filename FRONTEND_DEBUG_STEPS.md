# 🐛 Frontend Login Debugging Steps

## ✅ Backend is Working!

I've confirmed that:
- ✅ Backend is running on port 3000
- ✅ Admin user exists with correct credentials
- ✅ Login endpoint works with curl
- ✅ Login works with full device context payload

**The issue is in the frontend React app.**

## 🔍 Step-by-Step Debugging

### Step 1: Open Test Page
1. Open this file in your browser: `file:///path/to/SentinelVault/test-frontend-login.html`
2. Or serve it: `python3 -m http.server 8000` and open `http://localhost:8000/test-frontend-login.html`
3. Click "Test Simple Login"
4. **If this works**, the issue is in your React app
5. **If this fails**, there's a CORS or network issue

### Step 2: Check Browser Console
1. Open your React app: `http://localhost:5173/login`
2. Open DevTools (F12)
3. Go to **Console** tab
4. Try to login
5. Look for these messages:
   - `Login payload: {...}` - What's being sent
   - `API Error: {...}` - What error is returned
   - Any red error messages

### Step 3: Check Network Tab
1. Keep DevTools open (F12)
2. Go to **Network** tab
3. Try to login
4. Click on the `login` request (it will be red if failed)
5. Check these tabs:
   - **Headers**: See the request URL and method
   - **Payload**: See exactly what data was sent
   - **Response**: See what the server returned

### Step 4: Check for Common Issues

#### Issue A: Request not reaching backend
**Symptoms**: No request appears in Network tab

**Solutions**:
```javascript
// Check if API_BASE_URL is correct
console.log('API URL:', import.meta.env.VITE_API_URL);
// Should show: http://localhost:3000
```

#### Issue B: CORS Error
**Symptoms**: Error message contains "CORS" or "Access-Control-Allow-Origin"

**Solutions**:
1. Check backend is running: `curl http://localhost:3000/health`
2. Restart backend: `cd backend && bun run dev`

#### Issue C: 400 Bad Request
**Symptoms**: Network tab shows status 400

**Solutions**:
1. Check backend terminal for validation errors
2. Check what payload was sent in Network tab → Payload
3. Compare with expected format

#### Issue D: Empty/Undefined Values
**Symptoms**: Login payload shows `undefined` or `null` values

**Solutions**:
```javascript
// In browser console, test device context:
const getDeviceContext = async () => {
  const fingerprint = 'test123';
  const location = 'Unknown';
  return {
    fingerprint,
    location,
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

const context = await getDeviceContext();
console.log('Device Context:', context);
```

## 🔧 Quick Fixes

### Fix 1: Simplify Login (Temporary)
Edit `frontend/src/services/api.ts`:

```typescript
async login(email: string, password: string, context?: any) {
  // TEMPORARY: Remove all optional fields
  const payload = { 
    email, 
    password
  };
  console.log('Simplified payload:', payload);
  
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}
```

**If this works**, the issue is with the device context data.

### Fix 2: Clear Browser Cache
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Fix 3: Check Environment Variables
```bash
# In frontend directory
cat .env
# Should show: VITE_API_URL=http://localhost:3000
```

### Fix 4: Restart Everything
```bash
# Stop all
./stop-all.sh

# Start all
./start-all.sh
```

## 📊 What to Report

If still not working, please provide:

1. **Browser Console Output**:
   - Copy all messages from Console tab
   - Include the "Login payload" log
   - Include any error messages

2. **Network Tab Details**:
   - Request URL
   - Request Method
   - Status Code
   - Request Payload (from Payload tab)
   - Response (from Response tab)

3. **Backend Terminal Output**:
   - Any error messages
   - Validation errors
   - Stack traces

## 🧪 Test Commands

### Test 1: Backend Health
```bash
curl http://localhost:3000/health
```
**Expected**: `{"status":"OK",...}`

### Test 2: Direct Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"Debarghya"}'
```
**Expected**: `{"message":"Login successful","token":"..."}`

### Test 3: Frontend API URL
```bash
# In frontend directory
grep VITE_API_URL .env
```
**Expected**: `VITE_API_URL=http://localhost:3000`

## 💡 Most Likely Issues

Based on the symptoms, the most likely issues are:

1. **Device context generating invalid data** (most likely)
   - Solution: Use simplified login (Fix 1 above)

2. **Frontend not sending request to correct URL**
   - Solution: Check .env file has correct VITE_API_URL

3. **Browser caching old code**
   - Solution: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

4. **CORS issue** (unlikely since backend has CORS enabled)
   - Solution: Restart backend

## 🎯 Next Steps

1. Run the test HTML page to confirm backend works
2. Check browser console for exact error
3. Try simplified login (Fix 1)
4. Report what you see in console and network tab

The backend is definitely working, so we just need to find what the frontend is doing differently!