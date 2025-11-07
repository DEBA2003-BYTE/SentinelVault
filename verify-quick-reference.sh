#!/bin/bash

echo "🔍 Verifying QUICK_REFERENCE.md Implementation"
echo "=============================================="
echo ""

# Check 1: Device fingerprint in registration
echo "✅ Check 1: Device fingerprint in registration"
if grep -q "deviceFingerprint: context.fingerprint" frontend/src/contexts/AuthContext.tsx; then
    echo "   ✓ Device fingerprint sent during registration"
else
    echo "   ✗ Device fingerprint NOT sent during registration"
fi
echo ""

# Check 2: Location in registration
echo "✅ Check 2: Location in registration"
if grep -q "location: context.location" frontend/src/contexts/AuthContext.tsx; then
    echo "   ✓ Location sent during registration"
else
    echo "   ✗ Location NOT sent during registration"
fi
echo ""

# Check 3: Dashboard shows device info
echo "✅ Check 3: Dashboard shows device info"
if grep -q "Device & Identity Status" frontend/src/components/zkproofs/ZKPStatusCard.tsx; then
    echo "   ✓ Dashboard has 'Device & Identity Status' card"
else
    echo "   ✗ Dashboard missing 'Device & Identity Status' card"
fi
echo ""

# Check 4: Admin shows user emails
echo "✅ Check 4: Admin shows user emails"
if grep -q "User Email" frontend/src/pages/Admin.tsx; then
    echo "   ✓ Admin dashboard shows user emails"
else
    echo "   ✗ Admin dashboard missing user emails"
fi
echo ""

# Check 5: Admin shows device fingerprints
echo "✅ Check 5: Admin shows device fingerprints"
if grep -q "Device Fingerprint" frontend/src/pages/Admin.tsx; then
    echo "   ✓ Admin dashboard shows device fingerprints"
else
    echo "   ✗ Admin dashboard missing device fingerprints"
fi
echo ""

# Check 6: Admin shows locations
echo "✅ Check 6: Admin shows locations"
if grep -q "Location" frontend/src/pages/Admin.tsx; then
    echo "   ✓ Admin dashboard shows locations"
else
    echo "   ✗ Admin dashboard missing locations"
fi
echo ""

# Check 7: Backend generates device fingerprint if missing
echo "✅ Check 7: Backend generates device fingerprint if missing"
if grep -q "Generate a basic device fingerprint" backend/routes/auth.ts; then
    echo "   ✓ Backend generates device fingerprint as fallback"
else
    echo "   ✗ Backend does NOT generate device fingerprint"
fi
echo ""

echo "=============================================="
echo "Verification Complete!"
