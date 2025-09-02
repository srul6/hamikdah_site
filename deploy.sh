#!/bin/bash

echo "🚀 Starting deployment process..."

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "✅ Frontend build completed!"
echo "📁 Build directory created at: frontend/build/"
echo "📋 Contents:"
ls -la build/

echo "🎯 Ready for deployment!"
echo "💡 Make sure to set these in Render:"
echo "   - Build Command: cd frontend && npm install && npm run build"
echo "   - Publish Directory: frontend/build"
