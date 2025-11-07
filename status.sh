#!/bin/bash

echo "📊 SentinelVault Service Status"
echo "==============================="

# Function to check if port is in use and get process info
check_service() {
    local port=$1
    local name=$2
    local url=$3
    
    if lsof -ti:$port > /dev/null 2>&1; then
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $name (port $port) - Running and responding"
        else
            echo "⚠️  $name (port $port) - Running but not responding"
        fi
    else
        echo "❌ $name (port $port) - Not running"
    fi
}

# Check services
check_service 5173 "Frontend" "http://localhost:5173"
check_service 3001 "Backend" "http://localhost:3001/health"
check_service 8181 "OPA Risk Engine" "http://localhost:8181/health"

echo ""
echo "🐳 Docker Containers:"
echo "===================="

# Check OPA containers
if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(sentinelvault-opa|opa-bundle-server)" > /dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(sentinelvault-opa|opa-bundle-server)"
else
    echo "❌ No OPA containers running"
fi

echo ""
echo "🔗 Service URLs:"
echo "==============="
echo "📍 Frontend:    http://localhost:5173"
echo "📍 Backend:     http://localhost:3001"
echo "📍 OPA Server:  http://localhost:8181"
echo "📍 Health:      http://localhost:3001/health"
echo "📍 OPA Health:  http://localhost:8181/health"

echo ""
echo "🧪 Quick Tests:"
echo "==============="

# Test backend health
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

# Test OPA health
if curl -s http://localhost:8181/health > /dev/null 2>&1; then
    echo "✅ OPA health check passed"
else
    echo "❌ OPA health check failed"
fi

# Test policy data
if curl -s http://localhost:8181/v1/data/trusted_devices > /dev/null 2>&1; then
    DEVICE_COUNT=$(curl -s http://localhost:8181/v1/data/trusted_devices | jq '. | length' 2>/dev/null || echo "unknown")
    echo "✅ OPA policy data loaded ($DEVICE_COUNT trusted devices)"
else
    echo "❌ OPA policy data not accessible"
fi

echo ""
echo "🛠️  Management Commands:"
echo "========================"
echo "🚀 Start all:  ./start-all.sh"
echo "🛑 Stop all:   ./stop-all.sh"
echo "🧪 Test OPA:   ./test-opa-policies.sh"
echo "📊 Status:     ./status.sh"