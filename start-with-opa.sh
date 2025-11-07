#!/bin/bash

echo "🚀 Starting SentinelVault - Full Stack with OPA Risk Engine"
echo "=========================================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the SentinelVault root directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to check if Docker is running
check_docker() {
    docker info > /dev/null 2>&1
    return $?
}

# Check Docker
echo "🐳 Checking Docker..."
if ! check_docker; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi
echo "✅ Docker is running"

# Stop any existing OPA containers
echo "🛑 Stopping existing OPA containers..."
docker-compose -f docker-compose.opa.yml down > /dev/null 2>&1

# Start OPA Risk Engine
echo ""
echo "🛡️  Starting OPA Risk Engine..."
echo "⏳ Starting OPA server with policy bundle..."

# Start OPA with Docker Compose
docker-compose -f docker-compose.opa.yml up -d > opa.log 2>&1

# Wait for OPA to be ready
echo "⏳ Waiting for OPA to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8181/health > /dev/null 2>&1; then
        echo "✅ OPA Risk Engine is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ OPA failed to start. Check opa.log for errors"
        echo "💡 Make sure Docker is running and try: docker-compose -f docker-compose.opa.yml up -d"
        exit 1
    fi
    sleep 2
done

# Load policy data
echo "📋 Loading policy data into OPA..."
if curl -s -X PUT "http://localhost:8181/v1/data" \
    -H "Content-Type: application/json" \
    -d @backend/policies/data.json > /dev/null 2>&1; then
    echo "✅ Policy data loaded successfully"
else
    echo "⚠️  Warning: Failed to load policy data. Policies will use default data."
fi

# Start Backend
echo ""
echo "🔧 Starting Backend Server..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is responding"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Backend is not responding"
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
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

cd ..

echo ""
echo "🎉 SentinelVault with OPA Risk Engine is running!"
echo "================================================="
echo "📍 Frontend:    http://localhost:5173"
echo "📍 Backend:     http://localhost:3001"
echo "📍 OPA Server:  http://localhost:8181"
echo "📍 Health:      http://localhost:3001/health"
echo "📍 OPA Health:  http://localhost:8181/health"
echo ""
echo "👤 Admin Login:"
echo "   Email:    admin@gmail.com"
echo "   Password: Debarghya"
echo ""
echo "🛡️  OPA Risk Engine Features:"
echo "   • GPS Location Enforcement"
echo "   • 10 Security Policies Active"
echo "   • Real-time Risk Assessment"
echo "   • MFA Step-up Authentication"
echo "   • Admin Security Dashboard"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo "   OPA:      docker logs sentinelvault-opa"
echo ""
echo "🧪 Test OPA Policies:"
echo "   ./test-opa-policies.sh"
echo "   ./test-policy-examples.sh"
echo ""
echo "🛑 To stop all services: ./stop-all.sh"

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down SentinelVault services..."
    
    # Kill backend and frontend processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    
    # Stop OPA containers
    echo "🛡️  Stopping OPA Risk Engine..."
    docker-compose -f docker-compose.opa.yml down > /dev/null 2>&1
    echo "✅ OPA Risk Engine stopped"
    
    echo ""
    echo "✅ All services stopped successfully!"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running
echo "Press Ctrl+C to stop all services..."
wait