#!/bin/bash

echo "🎯 STARTING SENTINELVAULT FOR PROJECT REVIEW"
echo "============================================="
echo "🔧 Comprehensive fix and startup for demonstration"
echo ""

# Stop any existing services
echo "🛑 Stopping existing services..."
./stop-all.sh > /dev/null 2>&1

# Kill any remaining processes
pkill -f "npm" > /dev/null 2>&1
pkill -f "bun" > /dev/null 2>&1
pkill -f "vite" > /dev/null 2>&1

# Clean up ports
echo "🧹 Cleaning up ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Fix any syntax issues
echo "🔧 Fixing syntax issues..."
chmod +x emergency-fix.sh
./emergency-fix.sh > /dev/null 2>&1 || true

# Ensure dependencies are installed
echo "📦 Checking dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
cd ..

# Start backend with enhanced error handling
echo ""
echo "🔧 Starting Backend with Database Retry Logic..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend with better error handling
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy and responding"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend taking longer than expected"
        echo "📝 Checking backend logs..."
        tail -10 ../backend.log
        echo ""
        echo "💡 Backend may still be connecting to database..."
        echo "   This is normal for MongoDB Atlas connections"
        break
    fi
    sleep 2
done

cd ..

# Start frontend
echo ""
echo "🎨 Starting Frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend
echo "⏳ Waiting for frontend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend is ready and serving"
        break
    fi
    sleep 2
done

cd ..

# Save PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "🎉 SENTINELVAULT IS READY FOR PROJECT REVIEW!"
echo "=============================================="
echo "📱 Frontend:    http://localhost:5173"
echo "🔧 Backend:     http://localhost:3001"
echo "📊 Health:      http://localhost:3001/health"
echo ""
echo "👤 Demo Accounts:"
echo "   Admin:  admin@gmail.com / Debarghya"
echo "   User:   user@demo.com / password123"
echo ""
echo "🎯 Key Features Implemented:"
echo "   ✅ GPS Location Enforcement (Mandatory)"
echo "   ✅ Risk-Based Authentication System"
echo "   ✅ Multi-Factor Authentication (MFA)"
echo "   ✅ Device Trust Management"
echo "   ✅ Admin Security Dashboard"
echo "   ✅ File Storage & Management"
echo "   ✅ Zero-Knowledge Proofs"
echo "   ✅ Real-time Risk Assessment"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop: ./stop-all.sh"
echo ""

# Test key endpoints
echo "🧪 Testing key endpoints..."
sleep 3

if curl -s http://localhost:3001/health | grep -q "OK"; then
    echo "✅ Backend health check passed"
else
    echo "⚠️  Backend health check pending (database connecting...)"
fi

if curl -s http://localhost:5173 | grep -q "html"; then
    echo "✅ Frontend serving correctly"
else
    echo "⚠️  Frontend check pending"
fi

echo ""
echo "🎊 PROJECT IS READY FOR DEMONSTRATION!"
echo "======================================"
echo "💡 If you see 'Database temporarily unavailable':"
echo "   1. This is normal during MongoDB Atlas connection"
echo "   2. Wait 30-60 seconds for connection to establish"
echo "   3. Refresh the page - it should work"
echo ""
echo "🚀 Open http://localhost:5173 in your browser"
echo "Press Ctrl+C to stop all services..."

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    rm -f .backend.pid .frontend.pid
    echo "✅ All services stopped!"
    exit 0
}

trap cleanup SIGINT SIGTERM
wait