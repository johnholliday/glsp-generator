#!/bin/bash

# GLSP Generator Docker Publishing Script
# This script builds, tags, and publishes the Docker image

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="${DOCKER_IMAGE:-johnholliday/glsp-generator}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
MAJOR=$(echo $VERSION | cut -d. -f1)
MINOR=$(echo $VERSION | cut -d. -f2)

echo -e "${GREEN}🐳 GLSP Generator Docker Publishing${NC}"
echo -e "Version: ${YELLOW}$VERSION${NC}"
echo -e "Image: ${YELLOW}$DOCKER_IMAGE${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  Not logged in to Docker Hub${NC}"
    echo "Please run: docker login"
    exit 1
fi

# Check if buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker buildx not found${NC}"
    echo "Please install Docker Desktop or enable buildx"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Build the image
echo -e "${YELLOW}Building multi-platform image...${NC}"

# Create/use buildx builder
docker buildx create --name glsp-builder --use 2>/dev/null || docker buildx use glsp-builder

# Build arguments
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse HEAD)

# Build and push in one step
docker buildx build \
    --platform $PLATFORMS \
    --build-arg VERSION=$VERSION \
    --build-arg BUILD_DATE=$BUILD_DATE \
    --build-arg VCS_REF=$VCS_REF \
    -t $DOCKER_IMAGE:$VERSION \
    -t $DOCKER_IMAGE:$MAJOR.$MINOR \
    -t $DOCKER_IMAGE:$MAJOR \
    -t $DOCKER_IMAGE:latest \
    --push \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully built and pushed all tags${NC}"
    echo ""
    echo -e "${GREEN}Published tags:${NC}"
    echo -e "  - $DOCKER_IMAGE:latest"
    echo -e "  - $DOCKER_IMAGE:$VERSION"
    echo -e "  - $DOCKER_IMAGE:$MAJOR.$MINOR"
    echo -e "  - $DOCKER_IMAGE:$MAJOR"
    echo ""
    echo -e "${GREEN}Users can now pull with:${NC}"
    echo -e "  docker pull $DOCKER_IMAGE:latest"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Optional: Push to GitHub Container Registry
if [ -n "$GITHUB_TOKEN" ]; then
    echo ""
    echo -e "${YELLOW}Pushing to GitHub Container Registry...${NC}"
    
    GHCR_IMAGE="ghcr.io/${GITHUB_REPOSITORY_OWNER:-johnholliday}/glsp-generator"
    
    # Login to GHCR
    echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_ACTOR --password-stdin
    
    # Tag and push
    docker buildx build \
        --platform $PLATFORMS \
        --build-arg VERSION=$VERSION \
        --build-arg BUILD_DATE=$BUILD_DATE \
        --build-arg VCS_REF=$VCS_REF \
        -t $GHCR_IMAGE:$VERSION \
        -t $GHCR_IMAGE:$MAJOR.$MINOR \
        -t $GHCR_IMAGE:$MAJOR \
        -t $GHCR_IMAGE:latest \
        --push \
        .
    
    echo -e "${GREEN}✅ Also pushed to GitHub Container Registry${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Docker publishing completed successfully!${NC}"