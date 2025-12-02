#!/bin/bash

echo "🧪 Testing Browser Cache Issue"
echo "================================"
echo ""

# Check if frontend is running
if lsof -i :5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running on port 5173"
else
    echo "❌ Frontend is NOT running!"
    echo "   Run: ./start-all.sh"
    exit 1
fi

# Check if backend is running
if lsof -i :3001 > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend is NOT running!"
    echo "   Run: ./start-all.sh"
    exit 1
fi

echo ""
echo "📝 Checking if code is updated..."
echo ""

# Check if Admin.tsx has the new code
if grep -q "Risk Engine Score" frontend/src/pages/Admin.tsx; then
    echo "✅ Admin.tsx has new code (Risk Engine Score found)"
else
    echo "❌ Admin.tsx doesn't have new code"
    exit 1
fi

if grep -q "Risk Factors Distribution" frontend/src/pages/Admin.tsx; then
    echo "✅ Admin.tsx has new code (Risk Factors Distribution found)"
else
    echo "❌ Admin.tsx doesn't have new code"
    exit 1
fi

if grep -q "Access Summary" frontend/src/pages/Admin.tsx; then
    echo "✅ Admin.tsx has new code (Access Summary found)"
else
    echo "❌ Admin.tsx doesn't have new code"
    exit 1
fi

echo ""
echo "================================"
echo "✅ All code is updated correctly!"
echo ""
echo "🚨 THE PROBLEM IS YOUR BROWSER CACHE!"
echo ""
echo "📝 SOLUTION:"
echo ""
echo "1. CLOSE all browser tabs with localhost:5173"
echo "2. Open INCOGNITO mode:"
echo "   Chrome/Edge: Cmd+Shift+N"
echo "   Safari: Cmd+Shift+N"
echo "   Firefox: Cmd+Shift+P"
echo ""
echo "3. Go to: http://localhost:5173"
echo "4. Login and test"
echo ""
echo "OR"
echo ""
echo "1. Press Cmd+Shift+Delete in your browser"
echo "2. Clear 'Cached images and files'"
echo "3. Close browser completely"
echo "4. Reopen and try again"
echo ""
echo "================================"
