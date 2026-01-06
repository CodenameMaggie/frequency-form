# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Force cache bust - updated 2026-01-06
ENV CACHE_BUST=2026-01-06-v2

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies like dotenv)
RUN npm ci

# Copy lib directory first (explicitly)
COPY lib/ /app/lib/

# Copy server directory (explicitly)
COPY server/ /app/server/

# Copy api directory (explicitly)
COPY api/ /app/api/

# Copy rest of application code
COPY . .

# Debug: Verify critical directories exist
RUN echo "=== Checking lib directory ===" && ls -la /app/lib/ && echo "=== lib files found! ===" || echo "ERROR: lib directory not found!"
RUN echo "=== Checking server directory ===" && ls -la /app/server/ | head -20 && echo "=== server files found! ===" || echo "ERROR: server directory not found!"
RUN echo "=== Checking api/bots directory ===" && ls -la /app/api/bots/ | head -10 && echo "=== api/bots files found! ===" || echo "ERROR: api/bots directory not found!"

# Expose port
EXPOSE 3000

# Start bot server
CMD ["npm", "run", "start:bots"]
