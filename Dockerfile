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

# Copy rest of application code
COPY . .

# Debug: Verify lib directory exists
RUN echo "=== Checking lib directory ===" && ls -la /app/lib/ && echo "=== lib files found! ===" || echo "ERROR: lib directory not found!"

# Expose port
EXPOSE 3000

# Start bot server
CMD ["npm", "run", "start:bots"]
