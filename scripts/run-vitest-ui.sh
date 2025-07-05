#!/bin/bash
# Script to run Vitest UI in Docker for WSL2 environments

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🐳 Starting Vitest UI in Docker..."
echo "📁 Project root: $PROJECT_ROOT"

cd "$PROJECT_ROOT"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Build and run the container
echo "🔨 Building Docker image..."
docker-compose -f docker-compose.test.yml build

echo "🚀 Starting Vitest UI..."
echo "📺 Open http://localhost:51204/__vitest__/ in your browser"
echo ""
echo "Press Ctrl+C to stop the container"
echo ""

docker-compose -f docker-compose.test.yml up

# Cleanup on exit
echo ""
echo "🧹 Cleaning up..."
docker-compose -f docker-compose.test.yml down