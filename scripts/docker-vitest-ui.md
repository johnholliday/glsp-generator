# Running Vitest UI with Docker in WSL2

This guide explains how to run Vitest UI in a Docker container to overcome WSL2 localhost connection issues.

## Background

When running Vitest UI in WSL2, you may encounter "localhost refused to connect" errors due to WSL2 networking limitations. Docker provides a solution by properly exposing ports.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- WSL2 environment

## Quick Start

1. Build and run the Vitest UI container:
   ```bash
   docker-compose -f docker-compose.test.yml up --build
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:51204/__vitest__/
   ```

3. To stop the container:
   ```bash
   docker-compose -f docker-compose.test.yml down
   ```

## Docker Configuration

### Dockerfile.test
- Uses Node 20 Alpine image for lightweight container
- Installs build dependencies (python3, make, g++, git)
- Copies and installs project dependencies using Yarn Berry
- Exposes port 51204 for Vitest UI
- Runs Vitest UI bound to 0.0.0.0 for external access

### docker-compose.test.yml
- Maps port 51204 from container to host
- Mounts source directories for live code updates
- Excludes node_modules to use container's dependencies
- Sets NODE_ENV=test

## Live Code Updates

The Docker setup mounts your local directories:
- `./src` → `/app/src`
- `./test` → `/app/test`
- `./vitest.config.ts` → `/app/vitest.config.ts`

This means you can edit files locally and see test results update in real-time without rebuilding the container.

## Troubleshooting

### Port Already in Use
If port 51204 is already in use:
```bash
# Find process using the port
lsof -i :51204

# Or use a different port
docker-compose -f docker-compose.test.yml run --service-ports -p 8080:51204 vitest-ui
```

### Container Build Fails
If the container fails to build:
```bash
# Clean Docker cache
docker system prune -f

# Rebuild without cache
docker-compose -f docker-compose.test.yml build --no-cache
```

### Tests Not Updating
If tests don't reflect code changes:
```bash
# Restart the container
docker-compose -f docker-compose.test.yml restart

# Or recreate it
docker-compose -f docker-compose.test.yml up --force-recreate
```

## Alternative Commands

### Run specific test suites
```bash
# Run only unit tests
docker-compose -f docker-compose.test.yml run vitest-ui yarn vitest run test/unit

# Run with coverage
docker-compose -f docker-compose.test.yml run vitest-ui yarn vitest run --coverage
```

### Interactive shell
```bash
# Get a shell in the container
docker-compose -f docker-compose.test.yml run vitest-ui sh
```

### View container logs
```bash
# Follow logs
docker-compose -f docker-compose.test.yml logs -f
```

## Benefits

1. **Consistent Environment**: Same Node.js version and dependencies
2. **No WSL2 Networking Issues**: Proper localhost binding
3. **Live Reload**: Code changes reflected immediately
4. **Isolated Dependencies**: No conflicts with host system
5. **Easy Cleanup**: Remove container and image when done

## Cleanup

To remove the Docker resources:
```bash
# Stop and remove container
docker-compose -f docker-compose.test.yml down

# Remove the image
docker rmi glsp-generator_vitest-ui

# Remove all test-related volumes
docker volume prune
```