#!/bin/bash
# Script to get current build version information

VERSION_FILE="VERSION"
if [ -f "$VERSION_FILE" ]; then
    VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
else
    VERSION="unknown"
fi

echo "=========================================="
echo "Current Build Version Information"
echo "=========================================="
echo "Version: $VERSION"
echo ""

echo "Frontend Images:"
docker images agricultural-platform-frontend --format "  {{.Repository}}:{{.Tag}} (Created: {{.CreatedAt}})" | head -5
echo ""

echo "Backend Images:"
docker images agricultural-platform-backend --format "  {{.Repository}}:{{.Tag}} (Created: {{.CreatedAt}})" | head -5
echo ""

echo "Currently Running Containers:"
docker compose ps --format "  {{.Name}}: {{.Image}}"
echo ""

echo "=========================================="






