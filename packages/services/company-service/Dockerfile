# Multi-stage build for Company Service
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/services/company-service/package.json ./packages/services/company-service/
COPY packages/shared/common/package.json ./packages/shared/common/
COPY packages/shared/database/package.json ./packages/shared/database/
COPY packages/shared/types/package.json ./packages/shared/types/

# Install all dependencies (including dev dependencies for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build --workspace=@sabs/company-service

# Production stage
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/services/company-service/package.json ./packages/services/company-service/

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/packages/services/company-service/dist ./packages/services/company-service/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared ./packages/shared

# Security: Remove unnecessary packages
RUN apk del --purge $(apk info --installed | grep -v -E '^(musl|busybox|alpine-baselayout|alpine-keys|ca-certificates|libcrypto|libssl|libc-utils|nodejs|npm)' | awk '{print $1}') || true

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3002, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application
CMD ["node", "packages/services/company-service/dist/main.js"]