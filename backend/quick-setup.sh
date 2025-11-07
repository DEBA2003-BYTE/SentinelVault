#!/bin/bash

echo "🚀 SentinelVault Quick Setup"
echo "=========================="

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Start OPA if possible
echo "🔄 Starting OPA..."
if ./scripts/start-opa.sh; then
    echo "✅ OPA started successfully"
    OPA_STARTED=true
else
    echo "⚠️  OPA not started - continuing without it"
    OPA_STARTED=false
fi

# Wait a moment for OPA to be ready
if [ "$OPA_STARTED" = true ]; then
    sleep 3
fi

# Create admin user
echo "👑 Creating admin user..."
if bun run create-admin; then
    echo "✅ Admin user created"
else
    echo "⚠️  Admin user creation failed or already exists"
fi

# Initialize policies if OPA is running
if [ "$OPA_STARTED" = true ]; then
    echo "📋 Initializing OPA policies..."
    if bun run init-policies; then
        echo "✅ OPA policies initialized"
    else
        echo "⚠️  Policy initialization failed"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo "==================="
echo "📍 MongoDB: Check your .env file for connection string"
echo "📍 OPA: $(if [ "$OPA_STARTED" = true ]; then echo "Running at http://localhost:8181"; else echo "Not running (optional)"; fi)"
echo "📍 Admin: admin@gmail.com / Debarghya"
echo ""
echo "🚀 Start the server with:"
echo "   bun run dev"
echo ""
echo "🔍 Check health:"
echo "   curl http://localhost:3000/health"