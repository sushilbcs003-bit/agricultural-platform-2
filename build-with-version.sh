#!/bin/bash
# Build script with version tagging

set -e

VERSION_FILE="VERSION"
if [ ! -f "$VERSION_FILE" ]; then
    echo "Error: VERSION file not found. Creating default version 1.0.0"
    echo "1.0.0" > "$VERSION_FILE"
fi

VERSION=$(cat "$VERSION_FILE" | tr -d '[:space:]')
BUILD_TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BUILD_TAG="${VERSION}-${BUILD_TIMESTAMP}"

echo "=========================================="
echo "Building Docker images with version tags"
echo "Version: $VERSION"
echo "Build Timestamp: $BUILD_TIMESTAMP"
echo "Build Tag: $BUILD_TAG"
echo "=========================================="

# Build frontend
echo ""
echo "Building frontend..."
docker compose build frontend
docker tag agricultural-platform-frontend:latest agricultural-platform-frontend:$VERSION
docker tag agricultural-platform-frontend:latest agricultural-platform-frontend:$BUILD_TAG
echo "✅ Frontend tagged as: $VERSION and $BUILD_TAG"

# Build backend
echo ""
echo "Building backend..."
docker compose build backend
docker tag agricultural-platform-backend:latest agricultural-platform-backend:$VERSION
docker tag agricultural-platform-backend:latest agricultural-platform-backend:$BUILD_TAG
echo "✅ Backend tagged as: $VERSION and $BUILD_TAG"

echo ""
echo "=========================================="
echo "Build completed successfully!"
echo "Images tagged with:"
echo "  - latest"
echo "  - $VERSION"
echo "  - $BUILD_TAG"
echo "=========================================="

