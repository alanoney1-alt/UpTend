#!/bin/bash

# UpTend AI Features - API Key Setup Wizard
# This script helps you configure all required API keys

echo "🚀 UpTend AI Features - Setup Wizard"
echo "===================================="
echo ""

ENV_FILE="/Users/ao/uptend/.env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

echo "✅ Found .env file"
echo ""

# Function to add or update env variable
update_env() {
    local key=$1
    local value=$2

    if grep -q "^${key}=" "$ENV_FILE"; then
        # Update existing
        sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
        echo "✅ Updated $key"
    else
        # Add new
        echo "${key}=${value}" >> "$ENV_FILE"
        echo "✅ Added $key"
    fi
}

# 1. Anthropic API Key
echo "📝 Step 1: Anthropic Claude API Key"
echo "Get your key from: https://console.anthropic.com/settings/keys"
echo ""
read -p "Enter your Anthropic API key (or press Enter to skip): " ANTHROPIC_KEY

if [ ! -z "$ANTHROPIC_KEY" ]; then
    update_env "ANTHROPIC_API_KEY" "$ANTHROPIC_KEY"
else
    echo "⏭️  Skipped - AI features will use mock responses"
fi
echo ""

# 2. SendGrid API Key
echo "📝 Step 2: SendGrid API Key (for email notifications)"
echo "Get your key from: https://app.sendgrid.com/settings/api_keys"
echo ""
read -p "Enter your SendGrid API key (or press Enter to skip): " SENDGRID_KEY

if [ ! -z "$SENDGRID_KEY" ]; then
    update_env "SENDGRID_API_KEY" "$SENDGRID_KEY"

    read -p "Enter your FROM email address (e.g., noreply@uptend.com): " FROM_EMAIL
    update_env "SENDGRID_FROM_EMAIL" "$FROM_EMAIL"
else
    echo "⏭️  Skipped - Email notifications disabled"
fi
echo ""

# 3. Cloudflare R2 (optional)
echo "📝 Step 3: Cloudflare R2 Storage (optional - for photo uploads)"
echo "Get credentials from: https://dash.cloudflare.com/r2/overview"
echo ""
read -p "Do you want to configure R2 storage? (y/n): " SETUP_R2

if [ "$SETUP_R2" = "y" ]; then
    read -p "Enter R2 Account ID: " R2_ACCOUNT_ID
    read -p "Enter R2 Access Key ID: " R2_ACCESS_KEY
    read -p "Enter R2 Secret Access Key: " R2_SECRET_KEY
    read -p "Enter R2 Bucket Name: " R2_BUCKET

    update_env "R2_ACCOUNT_ID" "$R2_ACCOUNT_ID"
    update_env "R2_ACCESS_KEY_ID" "$R2_ACCESS_KEY"
    update_env "R2_SECRET_ACCESS_KEY" "$R2_SECRET_KEY"
    update_env "R2_BUCKET_NAME" "$R2_BUCKET"
else
    echo "⏭️  Skipped - Will use local file storage"
fi
echo ""

# 4. Google Maps API (already have Google Places key)
echo "📝 Step 4: Google Maps API"
echo "You already have a Google API key configured!"
echo "Current key: $(grep GOOGLE_PLACES_API_KEY $ENV_FILE | cut -d'=' -f2 | cut -c1-20)..."
echo ""
read -p "Enable this key for Maps APIs in Google Cloud Console? (y/n): " ENABLE_MAPS

if [ "$ENABLE_MAPS" = "y" ]; then
    echo ""
    echo "🌐 Open this URL to enable Maps APIs:"
    echo "https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
    echo "https://console.cloud.google.com/apis/library/directions-backend.googleapis.com"
    echo ""
    read -p "Press Enter when done..."
    echo "✅ Google Maps APIs enabled"
fi
echo ""

# Summary
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Configured services:"
grep -q "ANTHROPIC_API_KEY=" "$ENV_FILE" && echo "  ✅ Anthropic Claude API" || echo "  ❌ Anthropic Claude API (using mocks)"
grep -q "SENDGRID_API_KEY=" "$ENV_FILE" && echo "  ✅ SendGrid Email" || echo "  ❌ SendGrid Email (disabled)"
grep -q "R2_ACCOUNT_ID=" "$ENV_FILE" && echo "  ✅ Cloudflare R2 Storage" || echo "  ❌ R2 Storage (using local)"
grep -q "GOOGLE_PLACES_API_KEY=" "$ENV_FILE" && echo "  ✅ Google Maps API" || echo "  ❌ Google Maps API"
echo ""
echo "Next steps:"
echo "  1. Restart your server: npm run dev"
echo "  2. Test AI features in the dashboard"
echo "  3. Check CRON jobs are running: tail -f server.log"
echo ""
