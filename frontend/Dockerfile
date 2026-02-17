ARG BASE_IMAGE=node:18-alpine
FROM ${BASE_IMAGE}

# Version label
LABEL version="v2"
LABEL description="Agricultural Platform Frontend Application"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

EXPOSE 3000

# Serve the built app
CMD ["serve", "-s", "build", "-l", "3000"]
