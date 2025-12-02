#!/bin/bash

# Sentinel Vault - Development Server Startup Script
# This script starts both frontend and backend services

echo "🚀 Starting Sentinel Vault Development Environment..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Remove PID files
    rm -f .backend.pid .frontend.pid
    
    echo "✅ All services stopped"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Must be run from Sentinel Vault root directory (containing backend/ and frontend/ folders)"
    exit 1
fi

# Check if required tools are installed
command -v bun >/dev/null 2>&1 || { echo "❌ Error: bun is required but not installed. Please install bun first."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Error: npm is required but not installed. Please install npm first."; exit 1; }

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && bun install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Start backend
echo "🔧 Starting backend server..."
cd backend
bun run start &
BACKEND_PID=$!
cd ..

# Save backend PID
echo $BACKEND_PID > .backend.pid

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Save frontend PID
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "✅ Services started successfully!"
echo "📊 Backend: http://localhost:3000 (PID: $BACKEND_PID)"
echo "🌐 Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=================================="

# Wait for services to run (or until interrupted)
wait
