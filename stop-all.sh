#!/bin/bash

echo "🛑 Stopping SentinelVault Services"
echo "=================================="

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local service=$2
    
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "🔄 Stopping $service (port $port)..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
        echo "✅ $service stopped"
    else
        echo "ℹ️  $service not running"
    fi
}

# Function to kill processes by name
kill_process() {
    local process_name=$1
    if pgrep -f "$process_name" > /dev/null 2>&1; then
        echo "🔄 Stopping $process_name processes..."
        pkill -f "$process_name" 2>/dev/null
        sleep 1
        echo "✅ $process_name processes stopped"
    fi
}

# Stop services by port
kill_port 3001 "Backend"
kill_port 5173 "Frontend"

# Stop processes by name
kill_process "npm start"
kill_process "npm run dev"
kill_process "bun index.ts"
kill_process "vite"

# Kill processes from PID files if they exist
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend process (PID: $BACKEND_PID) stopped"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend process (PID: $FRONTEND_PID) stopped"
    fi
    rm -f .frontend.pid
fi

# Clean up log files
echo ""
echo "🧹 Cleaning up..."
if [ -f "backend.log" ]; then
    rm backend.log
    echo "🗑️  Removed backend.log"
fi

if [ -f "frontend.log" ]; then
    rm frontend.log
    echo "🗑️  Removed frontend.log"
fi

echo ""
echo "✅ All SentinelVault services stopped successfully!"
echo ""
echo "🚀 To start again: ./start-all.sh"