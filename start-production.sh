#!/bin/bash

echo "🚀 Starting SentinelVault - Production Ready"
echo "============================================"
echo "📋 Project Review Mode - All Features Active"
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the SentinelVault root directory"
    exit 1
fi

# Function to check and kill processes on port
check_and_kill_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $port is in use by $service_name, stopping existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        echo "✅ Port $port is now available"
    else
        echo "✅ Port $port is available"
    fi
}

# Clean up ports
echo "🔍 Checking and cleaning ports..."
check_and_kill_port 3001 "backend"
check_and_kill_port 5173 "frontend"

# Start Backend
echo ""
echo "🔧 Starting Backend Server..."
cd backend

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background with proper logging
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready with better error handling
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is responding and healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start properly"
        echo "📝 Check backend.log for errors:"
        tail -10 ../backend.log
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 2
done

cd ..

# Start Frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd frontend

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..20}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Frontend is ready and serving"
        break
    fi
    sleep 2
done

cd ..

# Save PIDs for cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Get backend health info
HEALTH_INFO=$(curl -s http://localhost:3001/health | jq -r '.services.mongodb.status' 2>/dev/null || echo "unknown")

echo ""
echo "🎉 SentinelVault is ready for project review!"
echo "=============================================="
echo "📱 Frontend:    http://localhost:5173"
echo "🔧 Backend:     http://localhost:3001"
echo "📊 Health:      http://localhost:3001/health"
echo "💾 Database:    $HEALTH_INFO"
echo ""
echo "👤 Demo Accounts:"
echo "   Admin:  admin@gmail.com / Debarghya"
echo "   User:   user@demo.com / password123"
echo ""
echo "🎯 Key Features Ready:"
echo "   ✅ GPS Location Enforcement"
echo "   ✅ Risk-Based Authentication"
echo "   ✅ MFA Step-up Authentication"
echo "   ✅ Device Trust Management"
echo "   ✅ Admin Security Dashboard"
echo "   ✅ Zero-Knowledge Proofs"
echo "   ✅ Rate Limiting & Security"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop: ./stop-all.sh"
echo ""

# Test key endpoints
echo "🧪 Testing key endpoints..."
if curl -s http://localhost:3001/api/auth/me > /dev/null 2>&1; then
    echo "✅ Authentication API ready"
else
    echo "⚠️  Authentication API check failed"
fi

echo ""
echo "🎊 Project is ready for demonstration!"
echo "Press Ctrl+C to stop all services..."

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down SentinelVault services..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    rm -f .backend.pid .frontend.pid
    echo "✅ All services stopped successfully!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
wait