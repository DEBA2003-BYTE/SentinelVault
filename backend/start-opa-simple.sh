#!/bin/bash

echo "🐳 Starting OPA with Docker..."

# Stop existing container
docker stop sentinelvault-opa 2>/dev/null || true
docker rm sentinelvault-opa 2>/dev/null || true

# Start OPA
docker run -d \
    --name sentinelvault-opa \
    -p 8181:8181 \
    --restart unless-stopped \
    openpolicyagent/opa:latest \
    run --server --addr=0.0.0.0:8181

echo "⏳ Waiting for OPA..."
sleep 5

# Test OPA
if curl -s http://localhost:8181/health > /dev/null; then
    echo "✅ OPA is running at http://localhost:8181"
else
    echo "❌ OPA failed to start"
    exit 1
fi