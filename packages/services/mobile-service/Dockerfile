# Multi-stage build for Mobile Service
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/services/mobile-service/package.json ./packages/services/mobile-service/
COPY packages/shared/common/package.json ./packages/shared/common/
COPY packages/shared/database/package.json ./packages/shared/database/
COPY packages/shared/types/package.json ./packages/shared/types/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build --workspace=@sabs/mobile-service

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/services/mobile-service/package.json ./packages/services/mobile-service/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/packages/services/mobile-service/dist ./packages/services/mobile-service/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared

# Security: Remove unnecessary packages
RUN apk del --purge $(apk info --installed | grep -v -E '^(musl|busybox|alpine-baselayout|alpine-keys|ca-certificates|libcrypto|libssl|libc-utils|nodejs|npm)' | awk '{print $1}') || true

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3004, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "packages/services/mobile-service/dist/main.js"]