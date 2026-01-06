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

# Copy application code
COPY . .

# Debug: Verify critical directories and files exist
RUN echo "=== Directory structure ===" && ls -la /app/ && echo ""
RUN echo "=== lib directory ===" && ls -la /app/lib/ 2>/dev/null || echo "ERROR: lib directory not found!"
RUN echo "=== server directory ===" && ls -la /app/server/ 2>/dev/null | head -20 || echo "ERROR: server directory not found!"
RUN echo "=== api/bots directory ===" && ls -la /app/api/bots/ 2>/dev/null | head -10 || echo "ERROR: api/bots directory not found!"

# Expose port
EXPOSE 3000

# Start bot server
CMD ["npm", "run", "start:bots"]
