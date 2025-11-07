#!/bin/bash

echo "🔧 Fixing hardcoded API URLs in frontend..."

# Replace all hardcoded localhost:3000 with environment variable
find frontend/src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|http://localhost:3000|\${import.meta.env.VITE_API_URL \|\| '\''http://localhost:3001'\''}|g'

echo "✅ Fixed all hardcoded API URLs"
echo "🔄 Restarting frontend to apply changes..."