# Root Dockerfile for Railway deployment
# This orchestrates the multi-service application using Docker Compose
FROM docker:24-dind

# Install docker-compose
RUN apk add --no-cache docker-compose curl

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

# Start docker daemon and run compose
CMD dockerd-entrypoint.sh & \
    sleep 5 && \
    docker compose up
