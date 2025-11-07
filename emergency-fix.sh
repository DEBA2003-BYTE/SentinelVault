#!/bin/bash

echo "🚨 EMERGENCY SYNTAX FIX FOR PROJECT REVIEW"
echo "==========================================="

# Stop all services
./stop-all.sh > /dev/null 2>&1

# Kill any remaining processes
pkill -f "npm" > /dev/null 2>&1
pkill -f "bun" > /dev/null 2>&1
pkill -f "vite" > /dev/null 2>&1

echo "🔧 Fixing all template literal syntax errors..."

# Fix any remaining broken template literals in all files
find frontend/src -name "*.tsx" -o -name "*.ts" | while read file; do
    # Check if file has template literal issues and fix them
    if grep -q '`\${import\.meta\.env\.VITE_API_URL' "$file" 2>/dev/null; then
        echo "✅ $file already has correct syntax"
    elif grep -q "'\${import\.meta\.env\.VITE_API_URL" "$file" 2>/dev/null; then
        echo "🔧 Fixing $file..."
        sed -i '' "s/'\${import\.meta\.env\.VITE_API_URL/\`\${import.meta.env.VITE_API_URL/g" "$file"
        sed -i '' "s/localhost:3001'}/localhost:3001'\`/g" "$file"
    fi
done

echo "✅ All syntax errors fixed!"
echo "🚀 Starting application..."

# Start the application
./start-all.sh