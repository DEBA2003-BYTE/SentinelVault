#!/bin/bash

echo "🚀 Starting SentinelVault with OPA..."

# Function to check if OPA is running
check_opa() {
    curl -s http://localhost:8181/health > /dev/null 2>&1
    return $?
}

# Function to start OPA
start_opa() {
    echo "🔄 Starting OPA server..."
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        echo "✅ Using Docker to start OPA..."
        
        # Stop existing container if running
        docker stop sentinelvault-opa 2>/dev/null || true
        docker rm sentinelvault-opa 2>/dev/null || true
        
        # Start OPA container
        docker run -d \
            --name sentinelvault-opa \
            -p 8181:8181 \
            --restart unless-stopped \
            openpolicyagent/opa:latest \
            run --server --addr=0.0.0.0:8181 --log-level=info
        
        echo "⏳ Waiting for OPA to be ready..."
        sleep 5
        
    elif command -v opa &> /dev/null; then
        echo "✅ Using OPA binary..."
        
        # Kill existing OPA process if running
        pkill -f "opa run --server" 2>/dev/null || true
        
        # Start OPA server in background
        nohup opa run --server --addr=0.0.0.0:8181 --log-level=info > opa.log 2>&1 &
        
        echo "⏳ Waiting for OPA to be ready..."
        sleep 3
        
    else
        echo "⚠️  Neither Docker nor OPA binary found!"
        echo "📥 Quick install options:"
        echo "   Docker: brew install docker (then start Docker Desktop)"
        echo "   OPA: brew install opa"
        echo ""
        echo "🔄 Continuing without OPA (optional feature)..."
        return 1
    fi
    
    # Check if OPA is now running
    if check_opa; then
        echo "✅ OPA is running at http://localhost:8181"
        return 0
    else
        echo "❌ OPA failed to start"
        return 1
    fi
}

# Main execution
echo "🔍 Checking if OPA is already running..."
if check_opa; then
    echo "✅ OPA is already running"
else
    start_opa
fi

echo ""
echo "🚀 Starting SentinelVault backend..."
echo "📍 MongoDB: Will attempt connection with retry logic"
echo "📍 OPA: $(if check_opa; then echo "Running at http://localhost:8181"; else echo "Not running (optional)"; fi)"
echo "📍 Server: Will start on http://localhost:3000"
echo ""

# Start the backend
bun run dev