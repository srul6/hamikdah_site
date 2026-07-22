#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "✅ Frontend build completed!"
echo "📁 Build directory: frontend/build/"
echo "📋 Contents:"
ls -la build/

echo ""
echo "🎯 Ready for deployment!"
echo "💡 This app serves frontend/build from the backend on Render."
echo "   Typical Render settings:"
echo "   - Build Command: npm run build   (from repo root — see package.json)"
echo "   - Start Command: cd backend && npm install && npm start"
echo ""
echo "💡 Set these frontend env vars on Render BEFORE the build"
echo "   (CRA bakes REACT_APP_* in at build time):"
echo "   - REACT_APP_GOOGLE_ADS_ID"
echo "   - REACT_APP_GOOGLE_ADS_CONVERSION_LABEL"
echo "   - REACT_APP_CLARITY_PROJECT_ID"
echo "   - REACT_APP_API_URL=https://hamikdah-site.onrender.com  (optional)"
echo "   - REACT_APP_GTM_ID=GTM-N8G5ZP2F  (optional; has a default)"
echo ""
echo "💡 Backend production env must keep:"
echo "   - NODE_ENV=production"
echo "   - CARDCOM_PLUGIN_ID (production plugin)"
echo "   - GREENINVOICE_API_KEY_ID / GREENINVOICE_API_KEY_SECRET"
echo "   - FRONTEND_URL pointing at the live site"
