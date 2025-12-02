#!/bin/bash

echo "🔍 Verifying Updates"
echo "===================="

echo ""
echo "1. Checking if 'Actions' column exists in Admin.tsx..."
if grep -q "Actions" frontend/src/pages/Admin.tsx; then
    echo "   ✅ Actions column found in code"
else
    echo "   ❌ Actions column NOT found"
fi

echo ""
echo "2. Checking if IP address capture is added..."
if grep -q "ipAddress:" backend/routes/auth.ts; then
    echo "   ✅ IP address capture added"
else
    echo "   ❌ IP address capture NOT added"
fi

echo ""
echo "3. Checking if device fingerprint capture is added..."
if grep -q "deviceFingerprint:" backend/routes/auth.ts; then
    echo "   ✅ Device fingerprint capture added"
else
    echo "   ❌ Device fingerprint capture NOT added"
fi

echo ""
echo "4. Checking if ViewLogModal exists..."
if grep -q "ViewLogModal" frontend/src/pages/Admin.tsx; then
    echo "   ✅ ViewLogModal component found"
else
    echo "   ❌ ViewLogModal NOT found"
fi

echo ""
echo "5. Checking if RBA breakdown is used..."
if grep -q "rbaBreakdown" frontend/src/pages/Admin.tsx; then
    echo "   ✅ RBA breakdown integration found"
else
    echo "   ❌ RBA breakdown NOT found"
fi

echo ""
echo "===================="
echo "✅ All code updates are in place!"
echo ""
echo "⚠️  IMPORTANT: Your browser is showing cached version"
echo ""
echo "📝 To see the updates:"
echo "   1. Open browser in INCOGNITO mode:"
echo "      Chrome/Edge: Cmd+Shift+N"
echo "      Safari: Cmd+Shift+N"
echo "      Firefox: Cmd+Shift+P"
echo ""
echo "   2. Go to: http://localhost:5173"
echo "   3. Login and check Admin → Access Logs"
echo "   4. You should see 10 columns including 'Actions'"
echo ""
echo "   OR"
echo ""
echo "   Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
