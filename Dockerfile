# Use Node.js 18 LTS Alpine for smaller image size
FROM node:18-alpine

# Install FFmpeg for video processing
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads/processed uploads/thumbnails && \
    chmod -R 755 uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Set environment variables for production
ENV NODE_ENV=production
ENV DOCKER_ENV=true

# Start the application
CMD ["node", "server.js"]
