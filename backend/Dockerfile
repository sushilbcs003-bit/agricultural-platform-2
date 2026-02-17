ARG BASE_IMAGE=node:18-slim
FROM ${BASE_IMAGE}

# Version label
LABEL version="v2"
LABEL description="Agricultural Platform Backend API Service"

WORKDIR /app

# Install dependencies for Prisma on Debian-based image
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install Prisma CLI globally for generating client
RUN npm install -g prisma@^5.0.0

# Copy package files
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate || echo "Warning: Prisma generation failed, continuing with in-memory backend"

# Copy all source code (including index.js and src/)
COPY . .

EXPOSE 3001

# Start the server using npm start (runs index.js)
CMD ["npm", "start"]
