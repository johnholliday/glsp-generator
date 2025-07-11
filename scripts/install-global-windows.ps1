#!/usr/bin/env pwsh
# Script to install GLSP Generator globally on Windows from WSL2 build

param(
    [string]$WslPath = "\\wsl$\Ubuntu\home\john\projects\utils\glsp-generator"
)

Write-Host "🚀 Installing GLSP Generator globally on Windows..." -ForegroundColor Cyan
Write-Host ""

# Convert WSL path if needed
if ($WslPath -notmatch "^\\\\wsl\$") {
    Write-Host "❌ Error: Please provide a WSL UNC path (e.g., \\wsl$\Ubuntu\home\...)" -ForegroundColor Red
    exit 1
}

$generatorPath = Join-Path $WslPath "packages\generator"

# Check if the path exists
if (-not (Test-Path $generatorPath)) {
    Write-Host "❌ Error: Cannot find generator package at: $generatorPath" -ForegroundColor Red
    Write-Host "   Make sure you've built the project in WSL2 first" -ForegroundColor Yellow
    exit 1
}

# Check if dist folder exists
$distPath = Join-Path $generatorPath "dist"
if (-not (Test-Path $distPath)) {
    Write-Host "❌ Error: dist folder not found. Please build the project in WSL2 first:" -ForegroundColor Red
    Write-Host "   yarn build" -ForegroundColor Yellow
    exit 1
}

# Create a temporary directory for Windows installation
$tempDir = Join-Path $env:TEMP "glsp-generator-install"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "📦 Copying built files from WSL to Windows temp directory..." -ForegroundColor Green
Copy-Item -Path $generatorPath\* -Destination $tempDir -Recurse -Force

# Update package.json to ensure proper bin paths for Windows
$packageJsonPath = Join-Path $tempDir "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Ensure bin paths work on Windows
if ($packageJson.bin) {
    $packageJson.bin.glsp = "./dist/cli.js"
    $packageJson.bin.glspgen = "./dist/cli.js"
}

$packageJson | ConvertTo-Json -Depth 100 | Set-Content $packageJsonPath

# Change to temp directory and install globally
Write-Host "📨 Installing globally with npm..." -ForegroundColor Green
Push-Location $tempDir
try {
    # Clean any existing installations
    npm uninstall -g @glsp/generator 2>$null
    npm uninstall -g glsp 2>$null
    npm uninstall -g glspgen 2>$null
    
    # Install globally
    npm install -g . --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully installed!" -ForegroundColor Green
        
        # Verify installation
        Write-Host ""
        Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan
        
        $commands = @("glsp", "glspgen")
        $foundCommand = $false
        
        foreach ($cmd in $commands) {
            try {
                $version = & $cmd --version 2>$null
                if ($version) {
                    Write-Host "✅ $cmd is available (version: $version)" -ForegroundColor Green
                    $foundCommand = $true
                }
            } catch {
                Write-Host "⚠️  $cmd not found in PATH" -ForegroundColor Yellow
            }
        }
        
        if (-not $foundCommand) {
            Write-Host ""
            Write-Host "⚠️  Commands not immediately available. You may need to:" -ForegroundColor Yellow
            Write-Host "   1. Close and reopen your terminal" -ForegroundColor Yellow
            Write-Host "   2. Or add npm global bin to your PATH:" -ForegroundColor Yellow
            
            $npmBin = npm config get prefix
            Write-Host "      $npmBin" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Installation failed" -ForegroundColor Red
    }
} finally {
    Pop-Location
    # Clean up temp directory
    Remove-Item -Recurse -Force $tempDir
}

Write-Host ""
Write-Host "✨ Done! You can now use 'glsp' or 'glspgen' commands in Windows." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Try: glspgen --version" -ForegroundColor White
Write-Host "2. Right-click any .langium file in VS Code to use GLSP commands" -ForegroundColor White