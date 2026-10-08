# PrernaNode API — production image
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first so this layer only rebuilds when package*.json changes
COPY package*.json ./
RUN npm ci --omit=dev

# App source
COPY . .

# Logs directory used by utils/logger.js — created ahead of time so a non-root user
# (added below) doesn't need write access to /app itself
RUN mkdir -p /app/logs

# Run as a non-root user (security: don't run the process as root in the container)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown -R appuser:appgroup /app
USER appuser

ENV NODE_ENV=production
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
