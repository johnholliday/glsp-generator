# VS Code Extension Docker Integration

This document explains how the GLSP Generator VS Code extension integrates with the Docker-based API.

## Architecture Overview

The VS Code extension supports two modes of operation:

1. **CLI Mode** (Default): Executes the local `glsp` CLI directly
2. **API Mode**: Communicates with a Docker-hosted API server

```
┌─────────────────┐       ┌─────────────────┐
│  VS Code IDE    │       │  Docker Host    │
├─────────────────┤       ├─────────────────┤
│ GLSP Extension  │──────►│ GLSP API Server │
│                 │ HTTP  │ (Port 51620)     │
│ - Commands      │       │                 │
│ - API Client    │       │ - Express.js    │
│ - File Watcher  │       │ - Multer        │
└─────────────────┘       │ - Generator     │
                          └─────────────────┘
```

## Configuration

### Extension Settings

The extension provides these configuration options:

```json
{
  "glsp.generator.useApi": {
    "type": "boolean",
    "default": false,
    "description": "Use GLSP Generator API instead of CLI"
  },
  "glsp.generator.apiUrl": {
    "type": "string",
    "default": "http://localhost:51620",
    "description": "URL of the GLSP Generator API server"
  }
}
```

### Enabling API Mode

1. Start the Docker API server:
   ```bash
   docker run -d -p 51620:51620 ghcr.io/johnholliday/glsp-generator dist/api-server.js
   ```

2. Configure VS Code:
   - Open Settings (Ctrl/Cmd + ,)
   - Search for "glsp"
   - Enable "Use Api"
   - Set API URL (default: http://localhost:51620)

## How It Works

### 1. Command Registration

The extension registers commands in `package.json`:

```json
{
  "commands": [
    {
      "command": "glsp.generateVSIX",
      "title": "Generate VSIX Package"
    },
    {
      "command": "glsp.generateTheiaApp",
      "title": "Generate Theia Application"
    }
  ]
}
```

### 2. Command Execution

When a command is triggered, the extension:

1. **Checks Configuration**: Determines CLI or API mode
2. **Validates Input**: Ensures grammar file exists
3. **Executes Generation**: Via CLI or API
4. **Handles Output**: Saves files and shows notifications

### 3. API Client Implementation

The `ApiClient` class handles HTTP communication:

```typescript
class ApiClient {
  async generateVSIX(grammarPath: string, outputPath: string) {
    // 1. Read grammar file
    const grammarContent = await fs.readFile(grammarPath);
    
    // 2. Create multipart form data
    const formData = createFormData({
      grammar: grammarContent,
      name: 'my-extension',
      version: '1.0.0'
    });
    
    // 3. POST to API
    const response = await fetch(`${apiUrl}/generate/vsix`, {
      method: 'POST',
      body: formData
    });
    
    // 4. Save VSIX file
    const vsixData = await response.blob();
    await fs.writeFile(outputPath, vsixData);
  }
}
```

### 4. CLI Runner Implementation

The `GeneratorRunner` class executes local CLI:

```typescript
class GeneratorRunner {
  async generateVSIX(grammarPath: string, outputPath: string) {
    // 1. Find CLI executable
    const cliPath = await this.findCLI();
    
    // 2. Spawn process
    const process = spawn('node', [
      cliPath,
      'generate',
      grammarPath,
      '-o', outputPath,
      '--vsix-only'
    ]);
    
    // 3. Handle output
    process.stdout.on('data', (data) => {
      this.outputChannel.append(data.toString());
    });
    
    // 4. Wait for completion
    await new Promise((resolve, reject) => {
      process.on('close', (code) => {
        code === 0 ? resolve() : reject();
      });
    });
  }
}
```

## API Endpoints Used

### Generate VSIX Only
```
POST /generate/vsix
Content-Type: multipart/form-data

Fields:
- grammar: File content
- name: Extension name (optional)
- version: Extension version (optional)

Response: VSIX file (binary)
```

### Generate Theia Application
```
POST /generate/theia
Content-Type: multipart/form-data

Fields:
- grammar: File content
- name: Application name (optional)

Response: ZIP file (binary)
```

### Validate Grammar
```
POST /validate
Content-Type: multipart/form-data

Fields:
- grammar: File content

Response: JSON validation result
```

### Health Check
```
GET /health

Response: JSON with status and endpoints
```

## Error Handling

The extension handles various error scenarios:

### API Connection Errors
```typescript
try {
  const healthy = await apiClient.checkHealth();
  if (!healthy) {
    vscode.window.showErrorMessage(
      'GLSP API server is not responding. Please start the Docker container.'
    );
    return;
  }
} catch (error) {
  // Fall back to CLI mode
  this.useCliMode();
}
```

### Generation Errors
```typescript
const result = await apiClient.generateVSIX(grammarPath, outputPath);
if (!result.success) {
  vscode.window.showErrorMessage(
    `Generation failed: ${result.error}`
  );
}
```

## Benefits of API Mode

### 1. **No Local Installation Required**
- Users don't need Node.js or npm
- No dependency conflicts
- Consistent environment

### 2. **Better Performance**
- API server stays warm
- Shared template cache
- Faster subsequent generations

### 3. **Remote Development**
- Works with VS Code Remote
- Supports GitHub Codespaces
- Compatible with dev containers

### 4. **Scalability**
- Can run API on powerful server
- Supports multiple concurrent users
- Easy to add caching/queuing

## Workflow Examples

### Local Development
```bash
# Start API locally
docker run -d -p 51620:51620 ghcr.io/johnholliday/glsp-generator dist/api-server.js

# Use extension normally
# Right-click .langium file → Generate VSIX
```

### Team Environment
```yaml
# docker-compose.yml
services:
  glspgen:
    image: ghcr.io/johnholliday/glsp-generator:latest
    command: dist/api-server.js
    ports:
      - "51620:51620"
    restart: unless-stopped
```

Team members configure extension to use shared API.

### CI/CD Integration
```yaml
# GitHub Actions
- name: Start GLSP API
  run: |
    docker run -d -p 51620:51620 ghcr.io/johnholliday/glsp-generator dist/api-server.js
    
- name: Generate Extensions
  run: |
    # Use API to generate multiple extensions
    for grammar in grammars/*.langium; do
      curl -X POST http://localhost:51620/generate/vsix \
        -F "grammar=@$grammar" \
        --output "$(basename $grammar .langium).vsix"
    done
```

## Security Considerations

### 1. **File Access**
- API runs in container with limited access
- Grammar files are uploaded, not accessed directly
- Generated files are downloaded, not written locally

### 2. **Network Security**
- Use HTTPS in production
- Configure firewall rules
- Consider API authentication

### 3. **Resource Limits**
- Docker container has memory limits
- API has request size limits
- Concurrent request handling

## Troubleshooting

### Extension Can't Connect to API
1. Check Docker container is running: `docker ps`
2. Verify port mapping: `docker port <container>`
3. Test API health: `curl http://localhost:51620/health`
4. Check VS Code settings for correct URL

### Generation Takes Too Long
1. Check Docker resources: `docker stats`
2. Increase container memory if needed
3. Monitor API logs: `docker logs <container>`

### Generated Files Have Wrong Permissions
1. Run container with user mapping
2. Or adjust file permissions after download

## Future Enhancements

1. **WebSocket Support**: Real-time progress updates
2. **Authentication**: Secure API access
3. **Caching**: Cache generated extensions
4. **Queue System**: Handle large-scale generation
5. **Metrics**: Track usage and performance

## Related Documentation

- [VS Code Extension Guide](../packages/vscode-extension/README.md)
- [Docker Usage Guide](./DOCKER.md)
- [API Reference](../packages/generator/src/api-server.ts)