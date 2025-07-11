# Docker Publishing Guide

This guide explains how to publish the GLSP Generator Docker image to GitHub Container Registry.

## Prerequisites

1. GitHub account with repository access
2. Docker CLI logged in to ghcr.io: `docker login ghcr.io`
3. Repository write access for packages
4. Multi-architecture build support: `docker buildx create --use`

## Quick Publish

From the `packages/generator` directory:

```bash
# Build, tag, and push in one command
yarn docker:publish
```

## Step-by-Step Process

### 1. Build the Image

Build for multiple architectures:

```bash
yarn docker:build:multiarch
```

Or build for current architecture only:

```bash
yarn docker:build
```

### 2. Tag the Image

Tag with version and latest:

```bash
yarn docker:tag
```

This creates:
- `ghcr.io/johnholliday/glsp-generator:latest`
- `ghcr.io/johnholliday/glsp-generator:2.1.175` (version from package.json)

### 3. Push to GitHub Container Registry

```bash
yarn docker:push
```

### 4. Test the Published Image

```bash
yarn docker:test
```

## Automated Publishing

### GitHub Actions

Push to `main` branch or create a release to trigger automatic publishing:

```yaml
# .github/workflows/docker-publish.yml
name: Docker Publish

on:
  push:
    branches: [main]
  release:
    types: [published]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/johnholliday/glsp-generator
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./packages/generator/Dockerfile
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

### Required Secrets

GitHub Actions automatically uses `GITHUB_TOKEN` for authentication to ghcr.io.
No additional secrets need to be configured.

## Version Management

### Semantic Versioning

The project follows semantic versioning:
- `MAJOR.MINOR.PATCH` (e.g., 2.1.175)
- `latest` tag always points to newest version

### Version Bumping

Version is automatically bumped during build:

```bash
yarn build  # Increments patch version
```

### Manual Tagging

For specific versions:

```bash
# Tag specific version
docker tag glsp-generator ghcr.io/johnholliday/glsp-generator:2.2.0

# Tag as latest
docker tag glsp-generator ghcr.io/johnholliday/glsp-generator:latest

# Push both
docker push ghcr.io/johnholliday/glsp-generator:2.2.0
docker push ghcr.io/johnholliday/glsp-generator:latest
```

## Multi-Architecture Builds

### Supported Platforms
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, Apple Silicon)

### Build for Specific Platform

```bash
# AMD64 only
docker buildx build --platform linux/amd64 -t ghcr.io/johnholliday/glsp-generator:amd64 .

# ARM64 only
docker buildx build --platform linux/arm64 -t ghcr.io/johnholliday/glsp-generator:arm64 .
```

### Verify Multi-Arch Support

```bash
docker manifest inspect ghcr.io/johnholliday/glsp-generator:latest
```

## Security Best Practices

### 1. Use Personal Access Tokens
For local development, use GitHub Personal Access Tokens:
- Go to GitHub Settings → Developer settings → Personal access tokens
- Create a token with `write:packages` and `read:packages` scopes
- Use token with: `docker login ghcr.io -u USERNAME -p TOKEN`

### 2. Scan for Vulnerabilities

```bash
# Scan before publishing
docker scout cves ghcr.io/johnholliday/glsp-generator:latest
```

### 3. Sign Images (Optional)

```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Sign and push
docker push ghcr.io/johnholliday/glsp-generator:latest
```

## Rollback Procedure

If a bad version is published:

### 1. Identify Good Version
```bash
docker pull ghcr.io/johnholliday/glsp-generator:2.1.174  # Previous good version
```

### 2. Retag as Latest
```bash
docker tag ghcr.io/johnholliday/glsp-generator:2.1.174 ghcr.io/johnholliday/glsp-generator:latest
docker push ghcr.io/johnholliday/glsp-generator:latest
```

### 3. Document Issue
Create a GitHub issue explaining the problem and the rollback.

## Monitoring

### GitHub Container Registry Metrics
- View pull counts on GitHub Container Registry
- Monitor image size trends
- Check for security advisories

### Health Checks
```bash
# Test latest image
docker run --rm ghcr.io/johnholliday/glsp-generator dist/cli.js --version

# Test API health
docker run -d -p 3000:3000 ghcr.io/johnholliday/glsp-generator dist/api-server.js
curl http://localhost:3000/health
```

## Troubleshooting

### Build Failures

**Out of Memory**
```bash
# Increase memory for buildx
docker buildx create --name larger --driver-opt memory=8g --use
```

**Network Issues**
```bash
# Use local registry mirror
docker buildx build --build-arg REGISTRY_MIRROR=https://mirror.example.com ...
```

### Push Failures

**Authentication Error**
```bash
# Re-login with token
docker logout
docker login -u johnholliday
```

**Rate Limiting**
```bash
# Check rate limit status
TOKEN=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:ratelimitpreview/test:pull" | jq -r .token)
curl -s -H "Authorization: Bearer $TOKEN" https://registry-1.docker.io/v2/ratelimitpreview/test/manifests/latest -I
```

## Best Practices

1. **Always test locally** before publishing
2. **Use specific versions** in production, not `latest`
3. **Document breaking changes** in release notes
4. **Keep images small** - use multi-stage builds
5. **Update regularly** - rebuild for security patches
6. **Monitor usage** - track adoption and issues

## Additional Resources

- [GitHub Container Registry Documentation](https://docs.docker.com/docker-hub/)
- [Docker Buildx Guide](https://docs.docker.com/buildx/working-with-buildx/)
- [OCI Image Specification](https://github.com/opencontainers/image-spec)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)