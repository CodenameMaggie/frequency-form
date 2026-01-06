# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies like dotenv)
RUN npm ci

# Copy application code
COPY . .

# Debug: List what was copied
RUN ls -la /app/lib/ || echo "lib directory not found!"

# Expose port
EXPOSE 3000

# Start bot server
CMD ["npm", "run", "start:bots"]
