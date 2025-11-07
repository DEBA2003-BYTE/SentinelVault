#!/bin/bash

echo "🚀 Starting SentinelVault - Local Development Mode"
echo "=================================================="
echo "⚠️  Note: Running without OPA Docker container"
echo "   Risk policies will use fallback scoring"
echo ""

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use"
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

# Check required ports
echo "🔍 Checking ports..."
check_port 3001 || exit 1
check_port 5173 || exit 1

# Start Backend
echo ""
echo "🔧 Starting Backend Server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is responding
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
fi

cd ..

# Start Frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

cd ..

# Save PIDs for cleanup
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "🎉 SentinelVault is starting up!"
echo "================================"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 Health:   http://localhost:3001/health"
echo ""
echo "⚠️  Note: OPA policies will use fallback scoring"
echo "   For full OPA integration, start Docker and use ./start-all.sh"
echo ""
echo "🛑 To stop all services: ./stop-all.sh"
echo ""
echo "⏳ Services are starting... Frontend will open automatically"