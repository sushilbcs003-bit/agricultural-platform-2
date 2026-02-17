#!/bin/bash

echo "📱 Mobile Testing Setup"
echo "======================"
echo ""

# Try to find local IP address
echo "🔍 Finding your local IP address..."

# Try multiple methods to find IP
LOCAL_IP=""

# Method 1: Check active network interface
if command -v ipconfig &> /dev/null; then
  # Try en0 (Wi-Fi) first
  LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null)
  if [ -z "$LOCAL_IP" ]; then
    # Try en1 (Ethernet)
    LOCAL_IP=$(ipconfig getifaddr en1 2>/dev/null)
  fi
fi

# Method 2: Check ifconfig output
if [ -z "$LOCAL_IP" ] && command -v ifconfig &> /dev/null; then
  LOCAL_IP=$(ifconfig | grep -E "inet " | grep -v "127.0.0.1" | grep -v "169.254" | awk '{print $2}' | head -1)
fi

# Method 3: Check system_profiler (macOS)
if [ -z "$LOCAL_IP" ] && command -v system_profiler &> /dev/null; then
  LOCAL_IP=$(system_profiler SPNetworkDataType 2>/dev/null | grep "IP Address" | grep -v "127.0.0.1" | awk '{print $3}' | head -1)
fi

if [ -z "$LOCAL_IP" ]; then
  echo "❌ Could not automatically detect your IP address."
  echo ""
  echo "Please find your IP address manually:"
  echo "  1. System Preferences → Network → Wi-Fi/Ethernet → View IP"
  echo "  2. Or run: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
  echo ""
  read -p "Enter your local IP address (e.g., 192.168.1.100): " LOCAL_IP
else
  echo "✅ Found IP address: $LOCAL_IP"
  read -p "Is this correct? (y/n) [y]: " confirm
  if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
    read -p "Enter your local IP address: " LOCAL_IP
  fi
fi

if [ -z "$LOCAL_IP" ]; then
  echo "❌ IP address is required. Exiting."
  exit 1
fi

echo ""
echo "🔧 Updating configuration files..."

# Backup original files
echo "📦 Creating backups..."
cp docker-compose.yml docker-compose.yml.bak.mobile
cp frontend/src/pages/FarmerRegistration.js frontend/src/pages/FarmerRegistration.js.bak.mobile

# Update docker-compose.yml
echo "  ✓ Updating docker-compose.yml..."
sed -i.tmp "s|REACT_APP_API_URL=http://localhost:3001|REACT_APP_API_URL=http://${LOCAL_IP}:3001|g" docker-compose.yml
rm -f docker-compose.yml.tmp

# Update FarmerRegistration.js
echo "  ✓ Updating FarmerRegistration.js..."
sed -i.tmp "s|http://localhost:3001/api/master-data|http://${LOCAL_IP}:3001/api/master-data|g" frontend/src/pages/FarmerRegistration.js
rm -f frontend/src/pages/FarmerRegistration.js.tmp

echo ""
echo "✅ Configuration updated!"
echo ""
echo "📱 Next steps:"
echo "  1. Rebuild the frontend container:"
echo "     docker compose up -d --build frontend"
echo ""
echo "  2. Access from your mobile device:"
echo "     http://${LOCAL_IP}:3002"
echo ""
echo "  3. Ensure both devices are on the same Wi-Fi network"
echo ""
echo "💡 To revert changes, restore from backups:"
echo "   cp docker-compose.yml.bak.mobile docker-compose.yml"
echo "   cp frontend/src/pages/FarmerRegistration.js.bak.mobile frontend/src/pages/FarmerRegistration.js"
echo ""

read -p "Rebuild frontend now? (y/n) [y]: " rebuild
if [ "$rebuild" != "n" ] && [ "$rebuild" != "N" ]; then
  echo ""
  echo "🔨 Rebuilding frontend container..."
  docker compose up -d --build frontend
  echo ""
  echo "✅ Done! You can now access the app from your mobile at:"
  echo "   http://${LOCAL_IP}:3002"
fi
