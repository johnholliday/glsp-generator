# Prompt 004: Development Watch Mode

## Objective
Implement a watch mode that automatically regenerates the GLSP extension when the Langium grammar file changes, significantly improving the development experience.

## Background
Currently, developers must manually run the generate command each time they modify their grammar. A watch mode would enable rapid iteration and immediate feedback during grammar development.

## Requirements

### 1. File Watching
Implement file watching for:
- Primary grammar file specified
- Imported grammar files (if any)
- Template files (optional, for template development)
- Configuration file (`.glsprc.json`)

### 2. Incremental Generation
Optimize regeneration by:
- Detecting what changed (grammar vs config vs templates)
- Only regenerating affected files when possible
- Preserving user modifications in safe zones
- Fast validation before generation

### 3. CLI Command
Add watch command:
```powershell
# Basic watch mode
node dist/cli.js watch grammar.langium -o output

# Watch with live reload server
node dist/cli.js watch grammar.langium -o output --serve

# Watch with custom config
node dist/cli.js watch grammar.langium -o output --config custom.glsprc.json
```

### 4. Development Server (Optional)
When `--serve` is specified:
- Start a development server
- Serve the generated extension
- WebSocket for live reload
- Browser auto-refresh on changes

### 5. Change Detection & Debouncing
Implement smart change detection:
- Debounce rapid changes (500ms default)
- Batch multiple file changes
- Ignore temporary files and backups
- Clear console between generations

### 6. Error Handling in Watch Mode
Handle errors gracefully:
- Don't exit on grammar errors
- Display clear error messages
- Show errors in browser (if serving)
- Recover when errors are fixed

## Implementation Details

### Watcher Implementation
```typescript
import { watch } from 'chokidar';
import { debounce } from 'lodash';

class GrammarWatcher {
  private watcher: FSWatcher;
  private generateDebounced: Function;

  constructor(
    private grammarPath: string,
    private outputDir: string,
    private options: WatchOptions
  ) {
    this.generateDebounced = debounce(
      this.regenerate.bind(this),
      options.debounceMs || 500
    );
  }

  start() {
    console.log('👀 Watching for changes...');
    
    this.watcher = watch(this.grammarPath, {
      persistent: true,
      ignoreInitial: false
    });

    this.watcher.on('change', () => {
      console.log('♻️  Grammar changed, regenerating...');
      this.generateDebounced();
    });
  }

  private async regenerate() {
    try {
      const start = Date.now();
      await generateGLSPExtension(this.grammarPath, this.outputDir);
      const duration = Date.now() - start;
      console.log(`✅ Regenerated in ${duration}ms`);
      
      if (this.options.serve) {
        this.notifyBrowsers();
      }
    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      // Don't exit, wait for fixes
    }
  }
}
```

### Console Output Format
```
GLSP Generator - Watch Mode
==========================
Watching: state-machine.langium
Output: ./output
Config: .glsprc.json
Server: http://localhost:3000 (--serve enabled)

[10:30:45] 👀 Watching for changes...
[10:31:12] ♻️  Grammar changed, regenerating...
[10:31:13] ✅ Regenerated in 1247ms
[10:31:13] 🔄 Browser reloaded

[10:32:05] ♻️  Grammar changed, regenerating...
[10:32:05] ❌ Generation failed: 
   Error at line 15: Expected '}' but found 'interface'
   Waiting for fixes...

[10:32:30] ♻️  Grammar changed, regenerating...
[10:32:31] ✅ Regenerated in 1180ms
```

## Acceptance Criteria

1. ✅ Watch mode detects grammar file changes
2. ✅ Regeneration happens automatically
3. ✅ Errors don't crash the watcher
4. ✅ Clear console output with timestamps
5. ✅ Optional development server with live reload
6. ✅ Debouncing prevents excessive regeneration
7. ✅ Works on Windows and Linux

## Testing Requirements

Create tests in `src/watch/watcher.test.ts`:
- Test file change detection
- Test debouncing logic
- Test error recovery
- Test multiple file watching
- Mock file system events
- Test server integration

## Files to Create/Modify

1. `src/watch/watcher.ts` - Main watcher implementation
2. `src/watch/dev-server.ts` - Development server (optional)
3. `src/cli.ts` - Add watch command
4. `scripts/test-watch-mode.js` - Manual testing script
5. `src/watch/watcher.test.ts` - Jest tests
6. Update `package.json` with watch dependencies
7. Update `README.md` with watch mode docs

## Dependencies
- chokidar: Cross-platform file watching
- ws: WebSocket support (if implementing server)
- chalk: Colored console output
- lodash: Debounce utility

## Notes
- Consider supporting multiple grammar files
- Watch mode could later support hot module replacement
- Performance is critical - avoid unnecessary regeneration
- Consider integrating with VS Code extension
