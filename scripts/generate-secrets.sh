#!/bin/bash

# Generate secure secrets for production deployment
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Generating Secure Secrets for Production"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ openssl is required but not installed."
    exit 1
fi

echo -e "${YELLOW}Generating secrets...${NC}"
echo ""

# Generate JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Generate JWT Refresh Secret (64 characters)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

# Generate Encryption Key (32 characters exactly)
ENCRYPTION_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Generate Database Password (32 characters)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Generate Redis Password (32 characters)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo -e "${GREEN}✅ Secrets Generated Successfully${NC}"
echo ""
echo "=============================================="
echo "Copy these values to your deployment platform:"
echo "=============================================="
echo ""
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "POSTGRES_PASSWORD=$DB_PASSWORD"
echo ""
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""
echo "=============================================="
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "1. Store these secrets securely"
echo "2. Never commit them to Git"
echo "3. Add them to your deployment platform's secrets"
echo "4. Use different secrets for each environment"
echo ""

# Optionally save to .env.production (not committed)
read -p "Save to .env.production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > .env.production << EOF
# Production Environment Variables
# Generated: $(date)
# DO NOT COMMIT THIS FILE!

# Security Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Database
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_USER=agricultural_user
POSTGRES_DB=agricultural_platform

# Redis
REDIS_PASSWORD=$REDIS_PASSWORD

# Environment
NODE_ENV=production
EOF
    echo -e "${GREEN}✅ Saved to .env.production${NC}"
    echo "⚠️  Remember to add .env.production to .gitignore"
fi
