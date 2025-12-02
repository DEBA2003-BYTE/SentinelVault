# Force Browser Refresh Guide

## The Problem
Your browser is caching the old version of the Admin page, so you're not seeing the new "Actions" column with the "View" button.

## Solution: Force Refresh

### Option 1: Hard Refresh (Recommended)

**On macOS:**
- **Chrome/Edge**: `Cmd + Shift + R` or `Cmd + Shift + Delete`
- **Safari**: `Cmd + Option + E` (Empty Caches), then `Cmd + R`
- **Firefox**: `Cmd + Shift + R`

**Steps:**
1. Open the Admin page in your browser
2. Press the keyboard shortcut above
3. The page should reload with the new version

### Option 2: Clear Browser Cache

**Chrome/Edge:**
1. Press `Cmd + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page

**Safari:**
1. Go to Safari → Preferences → Advanced
2. Check "Show Develop menu in menu bar"
3. Go to Develop → Empty Caches
4. Refresh the page

**Firefox:**
1. Press `Cmd + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"
4. Refresh the page

### Option 3: Restart Frontend Dev Server

```bash
# Stop the frontend (Ctrl+C in the terminal)
# Then restart:
cd frontend
npm run dev
```

### Option 4: Open in Incognito/Private Mode

This bypasses all cache:
- **Chrome**: `Cmd + Shift + N`
- **Safari**: `Cmd + Shift + N`
- **Firefox**: `Cmd + Shift + P`

Then navigate to `http://localhost:5173`

## Verify the Fix

After refreshing, you should see:

### In the Access Logs Table:
- **10 columns** (not 9):
  1. Timestamp
  2. Action
  3. User Email
  4. IP Address
  5. Device Fingerprint
  6. Location
  7. Risk Score
  8. Status
  9. Reason
  10. **Actions** ← NEW COLUMN with "View" button

### Location Display:
- Should show actual location name or coordinates
- Not "Unknown, Unknown"

## If Still Not Working

1. **Check if frontend rebuilt:**
   ```bash
   cd frontend
   # Look for "✓ built in XXXms" message
   ```

2. **Check browser console for errors:**
   - Press `F12` or `Cmd + Option + I`
   - Look for any red errors
   - Share them if you see any

3. **Verify the file was updated:**
   ```bash
   grep -n "Actions" frontend/src/pages/Admin.tsx
   # Should show line numbers where "Actions" appears
   ```

4. **Nuclear option - Delete node_modules and rebuild:**
   ```bash
   cd frontend
   rm -rf node_modules .vite
   npm install
   npm run dev
   ```

## Expected Result

After the refresh, clicking the "View" button should open a modal showing:
- Overall Risk Score with pie chart
- Interactive map with location
- Policy breakdown (9 policies)
- Access details
- Decision reason

The location should display properly based on the data format in your logs.
