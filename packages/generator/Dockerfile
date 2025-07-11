# Stage 1: Builder
FROM node:20-alpine AS builder

# Build arguments
ARG VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# Install build dependencies including Python 3 and symlink
RUN apk add --no-cache python3 python3-dev make g++ git && \
    ln -sf /usr/bin/python3 /usr/bin/python

# Enable corepack for Yarn 4.x
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy monorepo configuration files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Copy all workspace package.json files
COPY packages/generator/package.json ./packages/generator/
COPY packages/vscode-extension/package.json ./packages/vscode-extension/

# Install dependencies from monorepo root
RUN yarn install --immutable

# Copy generator source code
WORKDIR /app/packages/generator
COPY packages/generator/ .

# Build the project
RUN yarn build

# Stage 2: Runtime
FROM node:20-alpine

# Re-declare build arguments for use in labels
ARG VERSION=latest
ARG BUILD_DATE
ARG VCS_REF

# Install runtime dependencies including Python for npm install
RUN apk add --no-cache git python3 python3-dev make g++ && \
    ln -sf /usr/bin/python3 /usr/bin/python
RUN npm install -g @vscode/vsce

# Create app user
RUN addgroup -g 1001 -S app && \
    adduser -S -u 1001 -G app app

# Set working directory
WORKDIR /app

# Copy built application and dependencies including templates
COPY --from=builder --chown=app:app /app/packages/generator/dist ./dist
COPY --from=builder --chown=app:app /app/packages/generator/package.json ./package.json
# Copy all node_modules (Yarn workspaces uses root node_modules)
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
# Copy .pnp files if using PnP
COPY --from=builder --chown=app:app /app/.pnp* ./

# Create workspace and cache directories
RUN mkdir -p /workspace && chown app:app /workspace && \
    mkdir -p /app/.glsp-cache && chown app:app /app/.glsp-cache

# Add metadata labels
LABEL org.opencontainers.image.title="GLSP Generator" \
      org.opencontainers.image.description="Generate Theia GLSP extensions from Langium grammars" \
      org.opencontainers.image.authors="John F. Holliday" \
      org.opencontainers.image.vendor="John F. Holliday" \
      org.opencontainers.image.url="https://github.com/johnholliday/glsp-generator" \
      org.opencontainers.image.documentation="https://github.com/johnholliday/glsp-generator/blob/main/DOCKER.md" \
      org.opencontainers.image.source="https://github.com/johnholliday/glsp-generator" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.licenses="MIT" \
      maintainer="John F. Holliday"

# Set API port environment variable
ENV API_PORT=51620

# Health check for API mode
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:51620/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Switch to app user
USER app

# Expose API port
EXPOSE 51620

# Volume for input/output
VOLUME ["/workspace"]

# Default to CLI mode, can be overridden
ENTRYPOINT ["node"]
CMD ["dist/cli.js"]