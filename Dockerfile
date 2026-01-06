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

# Copy lib directory EXPLICITLY FIRST
COPY lib /app/lib

# Copy server directory
COPY server /app/server

# Copy api directory
COPY api /app/api

# Copy rest of application code
COPY . .

# Debug: Verify lib was copied
RUN echo "=== CHECKING LIB DIRECTORY ===" && \
    ls -la /app/lib/ && \
    echo "=== lib/api-wrapper.js exists:" && \
    ls -la /app/lib/api-wrapper.js && \
    echo "=== SUCCESS: lib directory found!" || echo "ERROR: lib directory NOT found!"

# Expose port
EXPOSE 3000

# Start bot server
CMD ["npm", "run", "start:bots"]
