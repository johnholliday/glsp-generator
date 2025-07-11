# PowerShell script to build and install the VSCode extension
# Run with: .\scripts\install-vscode-extension.ps1

Write-Host "🎨 Installing GLSP VSCode Extension..." -ForegroundColor Blue

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$extensionDir = Join-Path $rootDir "packages\vscode-extension"

# Check if we're in the right directory
if (-not (Test-Path (Join-Path $rootDir "package.json"))) {
    Write-Host "❌ Error: Must run from GLSP generator monorepo root" -ForegroundColor Red
    exit 1
}

# Check if VSCode is installed
$codePath = Get-Command code -ErrorAction SilentlyContinue
if (-not $codePath) {
    Write-Host "❌ Error: VSCode 'code' command not found in PATH" -ForegroundColor Red
    Write-Host "Please ensure VSCode is installed and the 'code' command is available" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Building VSCode extension..." -ForegroundColor Yellow
Push-Location $extensionDir
try {
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
        & yarn install
        if ($LASTEXITCODE -ne 0) {
            throw "Dependency installation failed"
        }
    }
    
    # Compile the extension
    Write-Host "🔨 Compiling TypeScript..." -ForegroundColor Yellow
    & yarn compile
    if ($LASTEXITCODE -ne 0) {
        throw "Compilation failed"
    }
    
    Write-Host "✅ Extension compiled successfully" -ForegroundColor Green
    
    # Package the extension
    Write-Host "📦 Packaging VSIX..." -ForegroundColor Yellow
    & yarn package
    if ($LASTEXITCODE -ne 0) {
        throw "Packaging failed"
    }
    
    # Find the generated VSIX file
    $vsixFile = Get-ChildItem -Path . -Filter "*.vsix" | Select-Object -First 1
    if (-not $vsixFile) {
        throw "No VSIX file found after packaging"
    }
    
    Write-Host "✅ VSIX created: $($vsixFile.Name)" -ForegroundColor Green
    
    # Install the extension
    Write-Host "🚀 Installing extension in VSCode..." -ForegroundColor Yellow
    & code --install-extension $vsixFile.FullName
    if ($LASTEXITCODE -ne 0) {
        throw "Extension installation failed"
    }
    
    Write-Host "`n✨ Installation complete!" -ForegroundColor Green
    Write-Host "`nThe GLSP Generator VSCode extension is now installed." -ForegroundColor Cyan
    Write-Host "`nTo use it:" -ForegroundColor Yellow
    Write-Host "  1. Open any folder containing .langium files" -ForegroundColor White
    Write-Host "  2. Right-click on a .langium file" -ForegroundColor White
    Write-Host "  3. Select from GLSP context menu options:" -ForegroundColor White
    Write-Host "     - GLSP: Generate VSIX" -ForegroundColor Gray
    Write-Host "     - GLSP: Test VSIX in Extension Host" -ForegroundColor Gray
    Write-Host "     - GLSP: Generate Project Only" -ForegroundColor Gray
    Write-Host "     - GLSP: Validate Grammar" -ForegroundColor Gray
    
    # Offer to reload VSCode
    Write-Host "`nReload VSCode to activate the extension? (Y/N) " -ForegroundColor Yellow -NoNewline
    $reload = Read-Host
    if ($reload -eq 'Y' -or $reload -eq 'y') {
        Write-Host "Reloading VSCode..." -ForegroundColor Blue
        & code --reload-window
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}