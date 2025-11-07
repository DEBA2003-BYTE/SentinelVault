#!/bin/bash

echo "🔧 COMPREHENSIVE PROJECT FIX FOR REVIEW"
echo "========================================"

# Stop any running services
echo "🛑 Stopping existing services..."
./stop-all.sh > /dev/null 2>&1

# Clean up any broken processes
echo "🧹 Cleaning up processes..."
pkill -f "npm start" > /dev/null 2>&1
pkill -f "npm run dev" > /dev/null 2>&1
pkill -f "bun index.ts" > /dev/null 2>&1

# Fix any remaining template literal issues
echo "🔧 Fixing template literal syntax..."
find frontend/src -name "*.tsx" -o -name "*.ts" | while read file; do
    # Fix any remaining broken template literals
    sed -i '' 's/`\${import\.meta\.env\.VITE_API_URL || '\''http:\/\/localhost:3001'\''}`/`${import.meta.env.VITE_API_URL || '\''http:\/\/localhost:3001'\''}`/g' "$file" 2>/dev/null || true
done

# Ensure all dependencies are installed
echo "📦 Checking dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install > /dev/null 2>&1
fi
cd ../frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install > /dev/null 2>&1
fi
cd ..

echo "✅ All fixes applied!"
echo "🚀 Ready to start with ./start-all.sh"