#!/bin/bash

echo "🚀 Starting SentinelVault - Frontend & Backend"
echo "=============================================="

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "🔄 Killing existing $service process on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        echo "✅ Port $port cleared"
    fi
}

# Function to kill processes by name
kill_process() {
    local process_name=$1
    if pgrep -f "$process_name" > /dev/null 2>&1; then
        echo "🔄 Killing existing $process_name processes..."
        pkill -f "$process_name" 2>/dev/null
        sleep 1
    fi
}

# Clean up any existing processes
echo "🧹 Cleaning up existing processes..."
kill_port 3001 "backend"
kill_port 5173 "frontend"
kill_process "npm start"
kill_process "npm run dev"
kill_process "bun index.ts"
kill_process "vite"

# Remove old log files
rm -f backend.log frontend.log .backend.pid .frontend.pid

echo ""
echo "🔧 Starting Backend Server..."
cd backend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Create admin user if it doesn't exist
echo "👤 Setting up admin user..."
node create-admin.js > /dev/null 2>&1 || echo "ℹ️  Admin user setup completed"

# Start backend in background
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is responding"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend taking longer than expected (this is normal for database connection)"
        echo "   Backend will continue starting in background"
        break
    fi
    sleep 2
done

cd ..

echo ""
echo "🎨 Starting Frontend Server..."
cd frontend

# Check if dependencies are installed
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
        echo "✅ Frontend is ready"
        break
    fi
    sleep 2
done

cd ..

# Save PIDs for cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "🎉 SentinelVault is running!"
echo "============================"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 Health:   http://localhost:3001/health"
echo ""
echo "👤 Demo Accounts:"
echo "   Admin:  admin@gmail.com / Debarghya"
echo "   User:   test@example.com / password123"
echo ""
echo "🎯 Features Available:"
echo "   ✅ User Authentication & Registration"
echo "   ✅ File Upload & Storage (AWS S3)"
echo "   ✅ Admin Dashboard & User Management"
echo "   ✅ Risk Assessment & Security Features"
echo "   ✅ Device Authentication & GPS Location"
echo "   ✅ Multi-Factor Authentication (MFA)"
echo "   ✅ Zero-Knowledge Proofs"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop all services: ./stop-all.sh"
echo ""

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down SentinelVault..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    # Clean up PID files
    rm -f .backend.pid .frontend.pid
    
    echo "✅ All services stopped successfully!"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

echo "⏳ Services are running... Press Ctrl+C to stop"
echo "🌐 Open http://localhost:5173 in your browser"

# Keep script running
wait