# Docker Image Versioning

This project uses semantic versioning for Docker images.

## Current Build Version

**Version: 1.0.0**

## Version Management

### VERSION File
The `VERSION` file in the project root contains the current version number (e.g., `1.0.0`).

### Image Tags
Each Docker image is tagged with:
- `latest` - Always points to the most recent build
- `{VERSION}` - Semantic version (e.g., `1.0.0`)
- `{VERSION}-{TIMESTAMP}` - Version with build timestamp (e.g., `1.0.0-20260103-223819`)

## Building with Version Tags

### Option 1: Use the build script (recommended)
```bash
./build-with-version.sh
```

This script will:
- Read the version from `VERSION` file
- Build frontend and backend images
- Tag images with `latest`, `{VERSION}`, and `{VERSION}-{TIMESTAMP}`

### Option 2: Manual build
```bash
# Update version if needed
echo "1.0.1" > VERSION

# Build and tag
docker compose build frontend backend
docker tag agricultural-platform-frontend:latest agricultural-platform-frontend:$(cat VERSION)
docker tag agricultural-platform-backend:latest agricultural-platform-backend:$(cat VERSION)
```

## Checking Current Build Info

Run the build info script:
```bash
./get-build-info.sh
```

Or manually check:
```bash
cat VERSION
docker images agricultural-platform-frontend agricultural-platform-backend
```

## Updating Version

To bump the version:

1. **Patch version** (bug fixes): `1.0.0` → `1.0.1`
   ```bash
   echo "1.0.1" > VERSION
   ```

2. **Minor version** (new features): `1.0.0` → `1.1.0`
   ```bash
   echo "1.1.0" > VERSION
   ```

3. **Major version** (breaking changes): `1.0.0` → `2.0.0`
   ```bash
   echo "2.0.0" > VERSION
   ```

Then rebuild:
```bash
./build-with-version.sh
docker compose up -d
```

## Image Information

### Frontend
- Repository: `agricultural-platform-frontend`
- Current Version: `1.0.0`
- Port: `3002:3000`

### Backend
- Repository: `agricultural-platform-backend`
- Current Version: `1.0.0`
- Port: `3001:3001`



