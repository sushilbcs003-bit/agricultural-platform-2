# Root Dockerfile for Railway deployment
# This orchestrates the multi-service application using Docker Compose
FROM docker:24-dind

# Install docker-compose and required tools
RUN apk add --no-cache docker-compose curl bash

# Set working directory
WORKDIR /app

# Copy docker-compose file
COPY docker-compose.prod.yml docker-compose.yml

# Copy all source code
COPY backend ./backend
COPY frontend ./frontend
COPY ai-service ./ai-service

# Expose ports
EXPOSE 3000 3001 5000

# Create startup script with proper error handling
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo '' >> /start.sh && \
    echo 'echo "=========================================="' >> /start.sh && \
    echo 'echo "Starting Docker-in-Docker on Railway"' >> /start.sh && \
    echo 'echo "Note: Kernel module warnings are harmless"' >> /start.sh && \
    echo 'echo "=========================================="' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Start Docker daemon in background' >> /start.sh && \
    echo '# Warnings about kernel modules/mounts are expected and harmless' >> /start.sh && \
    echo 'dockerd-entrypoint.sh > /tmp/dockerd.log 2>&1 &' >> /start.sh && \
    echo 'DOCKERD_PID=$!' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Wait for Docker daemon to be ready' >> /start.sh && \
    echo 'echo "Waiting for Docker daemon..."' >> /start.sh && \
    echo 'for i in {1..30}; do' >> /start.sh && \
    echo '  if docker info > /dev/null 2>&1; then' >> /start.sh && \
    echo '    echo "✓ Docker daemon is ready"' >> /start.sh && \
    echo '    break' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo '  if [ $i -eq 30 ]; then' >> /start.sh && \
    echo '    echo "✗ Docker daemon failed to start"' >> /start.sh && \
    echo '    echo "Last 50 lines of dockerd log:"' >> /start.sh && \
    echo '    tail -50 /tmp/dockerd.log' >> /start.sh && \
    echo '    exit 1' >> /start.sh && \
    echo '  fi' >> /start.sh && \
    echo '  sleep 1' >> /start.sh && \
    echo 'done' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Start docker compose' >> /start.sh && \
    echo 'echo "Starting docker compose..."' >> /start.sh && \
    echo 'exec docker compose up' >> /start.sh && \
    chmod +x /start.sh

# Use the startup script
CMD ["/start.sh"]
