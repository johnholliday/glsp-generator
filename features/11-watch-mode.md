# Watch Mode Feature

## Overview
The Watch Mode feature provides continuous development support by automatically regenerating GLSP extensions when grammar files change. It includes live reload, development server integration, and incremental updates for rapid iteration.

## Purpose
- Enable rapid development iteration
- Automatically regenerate on file changes
- Provide live reload capabilities
- Integrate with development servers
- Support incremental generation

## Current Implementation

### Components

#### 1. **Grammar Watcher** (`src/watch/watcher.ts`)
- File system monitoring
- Change detection and debouncing
- Regeneration orchestration
- Error recovery
- Statistics tracking

#### 2. **Dev Server** (`src/watch/dev-server.ts`)
- Live reload server
- WebSocket connections
- Static file serving
- HMR (Hot Module Replacement) support
- Proxy configuration

#### 3. **Watch Options**
- Debounce timing
- File patterns
- Ignore patterns
- Server configuration
- Regeneration strategies

### Watch Mode Features

#### File Monitoring
```typescript
interface WatchOptions {
  debounceMs: number      // Default: 300ms
  serve: boolean          // Enable dev server
  port: number           // Dev server port
  clearConsole: boolean  // Clear on regeneration
  verbose: boolean       // Detailed logging
  incremental: boolean   // Incremental updates
}
```

#### Development Server
- **Live Reload**: Automatic browser refresh
- **WebSocket**: Real-time updates
- **Static Serving**: Serve generated files
- **API Proxy**: Forward API requests
- **CORS Support**: Cross-origin handling

#### Change Detection
- Grammar file changes
- Configuration updates
- Template modifications
- Dependency changes
- Asset updates

## Usage Examples

### CLI Watch Mode
```bash
# Basic watch mode
glsp-generator watch my-dsl.langium

# With development server
glsp-generator watch my-dsl.langium --serve --port 3000

# With custom debounce
glsp-generator watch my-dsl.langium --debounce 500

# Verbose output
glsp-generator watch my-dsl.langium --verbose
```

### Watch Mode Output
```
🚀 GLSP Generator - Watch Mode
📁 Watching: my-dsl.langium
🌐 Dev server: http://localhost:3000

[10:23:45] Starting initial generation...
[10:23:46] ✓ Generated 15 files in 1.2s
[10:23:46] 👀 Watching for changes...

[10:24:12] 🔄 Change detected: my-dsl.langium
[10:24:12] Regenerating...
[10:24:13] ✓ Generated 2 files in 0.3s (incremental)
[10:24:13] 🔄 Live reload triggered

[10:25:03] ⚠️  Validation warning in my-dsl.langium:
  Line 45: Property 'name' is already defined

[10:25:30] 📊 Statistics:
  • Total regenerations: 3
  • Average time: 0.6s
  • Files generated: 17
  • Errors: 0
```

### Programmatic Usage
```typescript
import { GrammarWatcher } from '@glsp/generator/watch'

const watcher = new GrammarWatcher('grammar.langium', './output', {
  debounceMs: 300,
  serve: true,
  port: 3000,
  clearConsole: true
})

// Event handling
watcher.on('change', (file) => {
  console.log(`File changed: ${file}`)
})

watcher.on('generate:start', () => {
  console.log('Generation started')
})

watcher.on('generate:complete', (stats) => {
  console.log(`Generated in ${stats.duration}ms`)
})

watcher.on('error', (error) => {
  console.error('Generation error:', error)
})

// Start watching
await watcher.start()

// Stop watching
await watcher.stop()
```

## Advanced Features

### Incremental Generation
```typescript
// Only regenerate affected files
interface IncrementalOptions {
  enabled: boolean
  cache: boolean
  diffing: boolean
  optimization: 'speed' | 'memory'
}

// Tracks dependencies
- Grammar imports
- Template includes
- Configuration references
- Asset dependencies
```

### Development Server Features
```typescript
// dev-server.config.js
export default {
  port: 3000,
  host: 'localhost',
  
  // Live reload
  liveReload: {
    enabled: true,
    port: 35729,
    delay: 100
  },
  
  // API proxy
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true
    }
  },
  
  // Static files
  static: {
    directory: './output',
    watch: true
  },
  
  // Middleware
  middleware: [
    compression(),
    cors()
  ]
}
```

### Watch Patterns
```json
{
  "watch": {
    "patterns": [
      "**/*.langium",
      ".glsprc.json",
      "templates/**/*"
    ],
    "ignore": [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/tmp/**"
    ],
    "depth": 10,
    "followSymlinks": false
  }
}
```

## Implementation Details

### File Watching Strategy
```typescript
class GrammarWatcher {
  private watcher: FSWatcher
  private debounceTimer?: NodeJS.Timeout
  private isGenerating = false
  private changeQueue: Set<string> = new Set()
  
  private setupWatcher() {
    this.watcher = watch(this.patterns, {
      ignored: this.ignorePatterns,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    })
    
    this.watcher
      .on('change', this.handleChange.bind(this))
      .on('add', this.handleAdd.bind(this))
      .on('unlink', this.handleUnlink.bind(this))
  }
  
  private handleChange(path: string) {
    this.changeQueue.add(path)
    this.debouncedRegenerate()
  }
  
  private debouncedRegenerate = debounce(() => {
    if (!this.isGenerating) {
      this.regenerate()
    }
  }, this.options.debounceMs)
}
```

### Error Recovery
```typescript
// Graceful error handling
private async regenerate() {
  try {
    this.isGenerating = true
    await this.generator.generate(this.grammarPath, this.outputDir)
    this.notifySuccess()
  } catch (error) {
    this.notifyError(error)
    // Continue watching despite errors
  } finally {
    this.isGenerating = false
    this.changeQueue.clear()
  }
}
```

## Best Practices
1. **Appropriate Debouncing**: Balance responsiveness vs performance
2. **Ignore Patterns**: Exclude generated/temporary files
3. **Error Handling**: Continue watching after errors
4. **Clear Output**: Show clear status messages
5. **Resource Cleanup**: Properly stop watchers

## Configuration
```json
{
  "watch": {
    "debounce": 300,
    "clearConsole": true,
    "notify": true,
    "incremental": {
      "enabled": true,
      "cache": ".watch-cache"
    },
    "server": {
      "enabled": true,
      "port": 3000,
      "open": true
    },
    "ui": {
      "showStats": true,
      "colors": true,
      "emoji": true
    }
  }
}
```

## Future Enhancements
1. **Hot Module Replacement**: True HMR support
2. **Multiple File Watch**: Watch multiple grammars
3. **Remote Development**: Cloud-based watching
4. **Build Optimization**: Smart caching strategies
5. **IDE Integration**: VSCode/Theia integration

## Dependencies
- `chokidar`: File system watching
- `ws`: WebSocket support
- `express`: Development server
- `livereload`: Live reload protocol
- `chalk`: Terminal colors

## Testing
- File change simulation tests
- Debounce behavior tests
- Server integration tests
- Error recovery tests
- Performance benchmarks

## Related Features
- [CLI Interface](./03-cli-interface.md)
- [Performance Optimization](./06-performance-optimization.md)
- [Development Server](./17-dev-server.md)