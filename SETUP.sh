#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  SETUP.sh — Run this ONCE to set up your Jyotish platform
#  Open VS Code terminal (Ctrl+`) and run: bash SETUP.sh
# ─────────────────────────────────────────────────────────────

echo "🪐 Setting up Jyotish Platform..."

# 1. Create Next.js project (skip if already done)
# npx create-next-app@latest jyotish-platform --typescript --tailwind --app --src-dir --import-alias "@/*"
# cd jyotish-platform

# 2. Install all dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Create required directories
echo "📁 Creating folder structure..."
mkdir -p src/lib/engine/dasha
mkdir -p src/lib/engine/bala
mkdir -p src/lib/db/models
mkdir -p src/lib/atlas
mkdir -p src/app/api/chart/calculate
mkdir -p src/app/api/chart/\[id\]
mkdir -p src/app/api/panchang
mkdir -p src/app/api/atlas/search
mkdir -p src/app/api/auth/\[...nextauth\]
mkdir -p src/app/api/webhooks/razorpay
mkdir -p src/app/\(public\)/panchang
mkdir -p src/app/\(app\)/my/charts
mkdir -p src/app/\(app\)/chart/\[id\]
mkdir -p src/app/\(app\)/account
mkdir -p src/components/chakra
mkdir -p src/components/dasha
mkdir -p src/components/panchang
mkdir -p src/components/bala
mkdir -p src/components/ui
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/config
mkdir -p __tests__/engine
mkdir -p __tests__/fixtures
mkdir -p scripts
mkdir -p ephe

echo "✅ Directories created"

# 4. Copy env file
cp .env.example .env.local
echo "⚠️  Edit .env.local with your actual values!"

# 5. Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.*.local

# Swiss Ephemeris data files (large binary)
ephe/*.se1
ephe/*.se2

# SQLite atlas database (generated from GeoNames)
src/lib/atlas/atlas.db

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF

echo "✅ .gitignore created"

# 6. Initialize git
git init
git add .
git commit -m "feat: initial Jyotish platform setup"

echo ""
echo "─────────────────────────────────────────────"
echo "✅ Setup complete!"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Download Swiss Ephemeris data files:"
echo "   → astro.com/ftp/swisseph/ephe/"
echo "   → Download: sepl_18.se1, semo_18.se1, seas_18.se1"
echo "   → Put them in: ./ephe/ folder"
echo ""
echo "2. Edit .env.local with your actual values:"
echo "   → MongoDB Atlas connection string"
echo "   → Google OAuth credentials"
echo "   → Upstash Redis URL + token"
echo ""
echo "3. Run the test suite:"
echo "   npm run test:engine"
echo ""
echo "4. Start Claude Code:"
echo "   claude"
echo ""
echo "5. Ask Claude Code:"
echo "   'write src/lib/engine/calculator.ts'"
echo "─────────────────────────────────────────────"
