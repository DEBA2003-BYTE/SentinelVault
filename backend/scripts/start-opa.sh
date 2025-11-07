#!/bin/bash

# SentinelVault OPA Startup Script
echo "🚀 Starting OPA for SentinelVault..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found, starting OPA container..."
    
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
    
    # Check if OPA is healthy
    if curl -f http://localhost:8181/health &> /dev/null; then
        echo "✅ OPA is running successfully at http://localhost:8181"
        echo "🔗 Health check: http://localhost:8181/health"
        echo "🔗 Policies: http://localhost:8181/v1/policies"
    else
        echo "❌ OPA failed to start properly"
        exit 1
    fi
    
elif command -v opa &> /dev/null; then
    echo "✅ OPA binary found, starting OPA server..."
    
    # Kill existing OPA process if running
    pkill -f "opa run --server" 2>/dev/null || true
    
    # Start OPA server in background
    nohup opa run --server --addr=0.0.0.0:8181 --log-level=info > opa.log 2>&1 &
    OPA_PID=$!
    
    echo "⏳ Waiting for OPA to be ready..."
    sleep 3
    
    # Check if OPA is healthy
    if curl -f http://localhost:8181/health &> /dev/null; then
        echo "✅ OPA is running successfully at http://localhost:8181 (PID: $OPA_PID)"
        echo "📝 Logs: tail -f opa.log"
    else
        echo "❌ OPA failed to start properly"
        exit 1
    fi
    
else
    echo "❌ Neither Docker nor OPA binary found!"
    echo "📥 Install options:"
    echo "   1. Docker: https://docs.docker.com/get-docker/"
    echo "   2. OPA binary: https://www.openpolicyagent.org/docs/latest/#running-opa"
    echo "   3. Or run: curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_darwin_amd64 && chmod +x opa && sudo mv opa /usr/local/bin/"
    exit 1
fi