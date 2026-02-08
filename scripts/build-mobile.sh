#!/bin/bash

# uPYCK Mobile App Build Script
# This script builds the web app and syncs it with native platforms

set -e

echo "🚀 Building uPYCK Mobile App..."

# Build the web app first
echo "📦 Building web app..."
npm run build

# Sync with Capacitor
echo "🔄 Syncing with native platforms..."
npx cap sync

echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  iOS:     npx cap open ios"
echo "  Android: npx cap open android"
