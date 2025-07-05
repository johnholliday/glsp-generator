# Vitest UI Workflow for Windows/WSL2

## Quick Start

### 1. Start Vitest UI
```bash
yarn test:ui:start
```

This starts the UI with **NO TESTS** loaded - this is intentional to prevent the continuous test loop.

### 2. Access from Windows
Open Microsoft Edge and go to:
```
http://172.26.196.194:51204/__vitest__/
```
(The IP address will be shown in the terminal output)

### 3. Load Tests in the UI
1. In the browser, you'll see "No test files found"
2. **Clear the filter box** at the top of the UI
3. All test files will now appear in the sidebar
4. Click on specific test files to run them

### 4. Stop Vitest UI
When done, run:
```bash
yarn test:ui:stop
```

## Workflow Benefits

✅ **No Auto-Run**: Tests don't run automatically on startup
✅ **Selective Testing**: Choose exactly which tests to run
✅ **Persistent Session**: Keeps running while you code
✅ **Live Updates**: Code changes are detected automatically
✅ **Manual Control**: You decide when to run tests

## UI Controls

- **Click test files** in the sidebar to run them
- **Filter box**: Type to filter test names
- **Run buttons**: Control test execution
- **Keyboard shortcuts**:
  - `a` - Run all tests
  - `f` - Run failed tests only
  - `p` - Change file pattern
  - `q` - Quit (in terminal)

## Recommended Workflow

1. Start UI: `yarn test:ui:start`
2. Open browser to the URL shown
3. Clear the filter to see all tests
4. Click on the test file you're working on
5. Make code changes
6. Tests auto-detect changes (but don't auto-run)
7. Click "Run" in UI when ready to test
8. Repeat steps 5-7 as needed
9. Stop UI: `yarn test:ui:stop`

## Troubleshooting

### Can't access from Windows?
Run this in PowerShell as Administrator:
```powershell
$wsl_ip = (wsl hostname -I).Trim().Split()[0]
netsh interface portproxy add v4tov4 listenport=51204 listenaddress=localhost connectport=51204 connectaddress=$wsl_ip
```

Then access at: `http://localhost:51204/__vitest__/`

### UI shows "No test files found"?
This is expected! Just clear the filter box in the UI.

### Tests running continuously?
The new setup prevents this. If it happens, stop and restart:
```bash
yarn test:ui:stop
yarn test:ui:start
```

### Want to run specific test suites?
Use the filter in the UI, for example:
- Type "parser" to see only parser tests
- Type "unit" to see only unit tests
- Click individual files to run them

## Advanced Options

### Run with specific test pattern
Edit `scripts/start-vitest-ui.js` and change:
```javascript
'this-file-does-not-exist.test.ts'  // Start with no tests
```
to:
```javascript
'src/parser/**/*.test.ts'  // Start with parser tests only
```

### Change port
Edit `PORT` variable in `scripts/start-vitest-ui.js`

## Windows PowerShell Shortcut

For easier access from Windows, run:
```powershell
.\scripts\Start-VitestUI.ps1
```

This will:
1. Start Vitest UI in WSL2
2. Automatically open your browser
3. Show the output in PowerShell