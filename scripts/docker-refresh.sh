#!/bin/bash
# Script to refresh Docker container, handling conflicts automatically

set -e

echo "🔄 Refreshing Docker container..."

# Stop and remove any existing container with the same name
if docker ps -a --format '{{.Names}}' | grep -q '^glspgen$'; then
    echo "📦 Found existing glspgen container, removing it..."
    docker stop glspgen 2>/dev/null || true
    docker rm glspgen 2>/dev/null || true
fi

# Remove any orphaned containers
echo "🧹 Cleaning up orphaned containers..."
docker-compose down --remove-orphans

# Build the new image
echo "🔨 Building Docker image..."
yarn workspace @glsp/generator docker:build:local

# Start the container
echo "🚀 Starting container..."
docker-compose up -d

# Wait a moment for the container to start
sleep 2

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q '^glspgen$'; then
    echo "✅ Container 'glspgen' is running successfully!"
    
    # Test the health endpoint
    echo "🏥 Testing health endpoint..."
    if curl -s http://localhost:51620/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed (service may still be starting)"
    fi
else
    echo "❌ Failed to start container"
    exit 1
fi