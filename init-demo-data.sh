#!/bin/bash

echo "🎭 Initializing Demo Data for Project Review"
echo "============================================"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    sleep 2
done

echo ""
echo "👤 Creating demo accounts..."

# Create admin user
echo "Creating admin user..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gmail.com",
    "password": "Debarghya",
    "deviceFingerprint": "demo-admin-device",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "city": "New York",
      "country": "US"
    }
  }')

if echo "$ADMIN_RESPONSE" | grep -q "token"; then
    echo "✅ Admin user created successfully"
else
    echo "ℹ️  Admin user may already exist"
fi

# Create demo user
echo "Creating demo user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@demo.com",
    "password": "password123",
    "deviceFingerprint": "demo-user-device",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "city": "San Francisco",
      "country": "US"
    }
  }')

if echo "$USER_RESPONSE" | grep -q "token"; then
    echo "✅ Demo user created successfully"
else
    echo "ℹ️  Demo user may already exist"
fi

echo ""
echo "🎯 Demo accounts ready:"
echo "   Admin: admin@gmail.com / Debarghya"
echo "   User:  user@demo.com / password123"
echo ""
echo "✅ Demo data initialization complete!"