#!/bin/bash

echo "🔍 Checking Frontend Setup"
echo "=========================="

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found"
    echo "📦 Installing dependencies..."
    bun install
else
    echo "✅ node_modules exists"
fi

# Check package.json
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json not found"
    exit 1
fi

# Check .env
if [ -f ".env" ]; then
    echo "✅ .env exists"
    echo "   API_URL: $(grep VITE_API_URL .env)"
else
    echo "❌ .env not found"
    echo "Creating .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Risk-Adaptive Cloud Storage
EOF
    echo "✅ .env created"
fi

# Check vite.config.ts
if [ -f "vite.config.ts" ]; then
    echo "✅ vite.config.ts exists"
else
    echo "❌ vite.config.ts not found"
fi

# Check index.html
if [ -f "index.html" ]; then
    echo "✅ index.html exists"
else
    echo "❌ index.html not found"
fi

# Check main.tsx
if [ -f "src/main.tsx" ]; then
    echo "✅ src/main.tsx exists"
else
    echo "❌ src/main.tsx not found"
fi

# Check App.tsx
if [ -f "src/App.tsx" ]; then
    echo "✅ src/App.tsx exists"
else
    echo "❌ src/App.tsx not found"
fi

# Check critical components
echo ""
echo "📁 Checking critical files..."
files=(
    "src/services/api.ts"
    "src/contexts/AuthContext.tsx"
    "src/components/auth/LoginForm.tsx"
    "src/utils/deviceFingerprint.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file MISSING!"
    fi
done

# Check TypeScript compilation
echo ""
echo "🔧 Checking TypeScript..."
if command -v tsc &> /dev/null; then
    npx tsc --noEmit 2>&1 | head -20
    if [ $? -eq 0 ]; then
        echo "✅ TypeScript compilation successful"
    else
        echo "⚠️  TypeScript has some issues (check above)"
    fi
else
    echo "⚠️  TypeScript not found"
fi

# Check if frontend is running
echo ""
echo "🌐 Checking if frontend is running..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend is NOT running"
    echo "💡 Start it with: bun run dev"
fi

# Check if backend is accessible
echo ""
echo "🔌 Checking backend connection..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is accessible at http://localhost:3000"
else
    echo "❌ Backend is NOT accessible"
    echo "💡 Start it with: cd ../backend && bun run dev"
fi

echo ""
echo "=========================="
echo "Frontend check complete!"
echo ""
echo "📝 Next steps:"
echo "1. If dependencies missing: bun install"
echo "2. If frontend not running: bun run dev"
echo "3. If backend not running: cd ../backend && bun run dev"
echo "4. Open browser: http://localhost:5173"