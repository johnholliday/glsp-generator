# PowerShell script to set up global access to GLSP Generator
# Run with: .\scripts\setup-global-access.ps1

Write-Host "🚀 Setting up global access to GLSP Generator..." -ForegroundColor Blue

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$generatorDir = Join-Path $rootDir "packages\generator"

# Check if we're in the right directory
if (-not (Test-Path (Join-Path $rootDir "package.json"))) {
    Write-Host "❌ Error: Must run from GLSP generator monorepo root" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Building generator package..." -ForegroundColor Yellow
Push-Location $generatorDir
try {
    # Build the generator
    & yarn build:no-version
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    
    Write-Host "✅ Generator built successfully" -ForegroundColor Green
    
    # Create global link
    Write-Host "🔗 Creating global link..." -ForegroundColor Yellow
    & yarn link
    if ($LASTEXITCODE -ne 0) {
        throw "Link creation failed"
    }
    
    Write-Host "✅ Global link created" -ForegroundColor Green
    
    # Get the global bin directory
    $npmBin = & npm bin -g
    $glspPath = Join-Path $npmBin "glsp"
    $glspgenPath = Join-Path $npmBin "glspgen"
    
    # Check if commands are available
    Write-Host "`n📍 Checking installation..." -ForegroundColor Yellow
    
    if (Test-Path $glspPath) {
        Write-Host "✅ glsp command available at: $glspPath" -ForegroundColor Green
    }
    
    if (Test-Path $glspgenPath) {
        Write-Host "✅ glspgen command available at: $glspgenPath" -ForegroundColor Green
    }
    
    # Test the command
    Write-Host "`n🧪 Testing glsp command..." -ForegroundColor Yellow
    & glsp --version
    
    Write-Host "`n✨ Setup complete!" -ForegroundColor Green
    Write-Host "`nYou can now use the following commands from anywhere:" -ForegroundColor Cyan
    Write-Host "  glsp generate <grammar.langium> -o <output-dir>" -ForegroundColor White
    Write-Host "  glspgen generate <grammar.langium> -o <output-dir>" -ForegroundColor White
    Write-Host "`nFor VSCode integration:" -ForegroundColor Cyan
    Write-Host "  1. Open VSCode" -ForegroundColor White
    Write-Host "  2. Install the GLSP extension from packages\vscode-extension" -ForegroundColor White
    Write-Host "  3. Right-click any .langium file for context menu options" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}