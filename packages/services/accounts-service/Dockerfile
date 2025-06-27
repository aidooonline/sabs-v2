# Use Node.js 20 LTS Alpine for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/services/accounts-service/package*.json ./packages/services/accounts-service/
COPY packages/shared/*/package*.json ./packages/shared/

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the accounts service
RUN npm run build -w @sabs/accounts-service

# Production image, copy all the files and run NestJS
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/packages/services/accounts-service/dist ./dist
COPY --from=builder /app/packages/services/accounts-service/package*.json ./
COPY --from=deps /app/node_modules ./node_modules

USER nestjs

EXPOSE 3002

ENV PORT=3002

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/onboarding/health/check || exit 1

CMD ["node", "dist/main.js"]