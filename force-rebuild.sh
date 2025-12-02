#!/bin/bash

echo "🔄 Force Rebuild - Clearing All Caches"
echo "======================================"

# Stop all services
echo "🛑 Stopping all services..."
./stop-all.sh 2>/dev/null || true
sleep 2

# Clear frontend caches
echo "🧹 Clearing frontend caches..."
cd frontend
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite
echo "✅ Frontend caches cleared"

# Rebuild frontend
echo "🔨 Rebuilding frontend..."
npm run build 2>/dev/null || true

cd ..

# Clear backend caches
echo "🧹 Clearing backend caches..."
cd backend
rm -rf dist
echo "✅ Backend caches cleared"

cd ..

# Start services
echo "🚀 Starting services..."
./start-all.sh

echo ""
echo "✅ Rebuild complete!"
echo "📝 Now open your browser in INCOGNITO mode:"
echo "   Chrome/Edge: Cmd+Shift+N"
echo "   Safari: Cmd+Shift+N"
echo "   Firefox: Cmd+Shift+P"
echo ""
echo "   Then go to: http://localhost:5173"
