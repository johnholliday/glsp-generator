# GLSP Generator Docker Guide

This guide covers how to use the GLSP Generator Docker image for both CLI and API modes.

## Quick Start

### Pull the Image

```bash
docker pull ghcr.io/ghcr.io/johnholliday/glsp-generator:latest
```

### CLI Mode

Generate a VSIX package from a Langium grammar file:

```bash
docker run --rm -v $(pwd):/workspace ghcr.io/ghcr.io/johnholliday/glsp-generator:latest dist/cli.js generate /workspace/my-grammar.langium -o /workspace/output
```

### API Mode

Run the generator as an API server:

```bash
docker run -d -p 51620:51620 ghcr.io/ghcr.io/johnholliday/glsp-generator:latest dist/api-server.js
```

## Detailed Usage

### CLI Mode Examples

#### Generate VSIX Package
```bash
# Generate VSIX with default settings
docker run --rm -v $(pwd):/workspace ghcr.io/johnholliday/glsp-generator:latest \
  dist/cli.js generate /workspace/state-machine.langium \
  -o /workspace/output

# Generate with custom name
docker run --rm -v $(pwd):/workspace ghcr.io/johnholliday/glsp-generator:latest \
  dist/cli.js generate /workspace/state-machine.langium \
  -o /workspace/output \
  -n my-custom-extension
```

#### Validate Grammar
```bash
docker run --rm -v $(pwd):/workspace ghcr.io/johnholliday/glsp-generator:latest \
  dist/cli.js validate /workspace/my-grammar.langium
```

#### Generate VSIX Only (no full scaffold)
```bash
docker run --rm -v $(pwd):/workspace ghcr.io/johnholliday/glsp-generator:latest \
  dist/cli.js generate /workspace/my-grammar.langium \
  -o /workspace/output \
  --vsix-only
```

### API Mode

#### Start the Server
```bash
# Run in foreground
docker run --rm -p 51620:51620 ghcr.io/johnholliday/glsp-generator:latest dist/api-server.js

# Run in background
docker run -d --name glspgen -p 51620:51620 ghcr.io/johnholliday/glsp-generator:latest dist/api-server.js

# With custom port
docker run -d -p 8080:51620 ghcr.io/johnholliday/glsp-generator:latest dist/api-server.js
```

#### API Endpoints

**Health Check**
```bash
curl http://localhost:51620/health
```

**Generate VSIX**
```bash
curl -X POST http://localhost:51620/generate/vsix \
  -F "grammar=@my-grammar.langium" \
  -F "name=my-extension" \
  -F "version=1.0.0" \
  --output my-extension.vsix
```

**Generate Theia Application**
```bash
curl -X POST http://localhost:51620/generate/theia \
  -F "grammar=@my-grammar.langium" \
  -F "name=my-app" \
  --output my-app-theia.zip
```

**Validate Grammar**
```bash
curl -X POST http://localhost:51620/validate \
  -F "grammar=@my-grammar.langium"
```

### Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
services:
  # API server
  glspgen:
    image: ghcr.io/johnholliday/glsp-generator:latest
    command: dist/api-server.js
    ports:
      - "51620:51620"
    volumes:
      - ./workspace:/workspace

  # CLI for one-off commands
  glsp-cli:
    image: ghcr.io/johnholliday/glsp-generator:latest
    volumes:
      - .:/workspace
    working_dir: /workspace
    profiles:
      - cli
```

Run API server:
```bash
docker-compose up -d glspgen
```

Run CLI commands:
```bash
docker-compose run --rm glsp-cli dist/cli.js generate grammar.langium -o output
```

## Volume Mounts

The container expects input/output files in `/workspace`. Always mount your local directory:

```bash
# Linux/Mac
-v $(pwd):/workspace

# Windows PowerShell
-v ${PWD}:/workspace

# Windows Command Prompt
-v %cd%:/workspace
```

## Environment Variables

You can configure the generator using environment variables:

```bash
docker run --rm \
  -e LOG_LEVEL=debug \
  -e SEQ_ENABLED=true \
  -e SEQ_URL=http://localhost:5341 \
  -v $(pwd):/workspace \
  ghcr.io/johnholliday/glsp-generator:latest dist/cli.js generate /workspace/grammar.langium
```

## Multi-Architecture Support

The image supports both AMD64 and ARM64 architectures. Docker will automatically pull the correct version for your platform.

## Troubleshooting

### Permission Issues
If you encounter permission issues with generated files:

```bash
# Run with your user ID
docker run --rm --user $(id -u):$(id -g) -v $(pwd):/workspace ...
```

### Network Issues
For API mode behind a proxy:

```bash
docker run -d \
  -e HTTP_PROXY=http://proxy.example.com:8080 \
  -e HTTPS_PROXY=http://proxy.example.com:8080 \
  -p 51620:51620 \
  ghcr.io/johnholliday/glsp-generator:latest dist/api-server.js
```

### Memory Issues
For large grammar files, increase memory limit:

```bash
docker run --rm -m 2g -v $(pwd):/workspace ...
```

## Security

The container runs as a non-root user (`app`) with UID 1001. This provides better security but may cause permission issues with volume mounts. Use the `--user` flag if needed.

## Integration with VS Code Extension

The VS Code extension can be configured to use the Docker API:

1. Start the API server: `docker run -d -p 51620:51620 ghcr.io/ghcr.io/johnholliday/glsp-generator:latest dist/api-server.js`
2. In VS Code settings:
   - Set `glsp.generator.useApi` to `true`
   - Set `glsp.generator.apiUrl` to `http://localhost:51620`

## Building from Source

To build the image locally:

```bash
cd packages/generator
yarn docker:build
```

## License

See the main project repository for license information.