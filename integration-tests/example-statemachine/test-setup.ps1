#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test the integration test setup
.DESCRIPTION
    Validates that all components of the integration test are properly configured
#>

Write-Host "Testing Integration Test Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$hasErrors = $false

# Check files exist
Write-Host "`nChecking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "statemachine.langium",
    "debug.ps1",
    "debug.js",
    ".gitignore",
    "README.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
        $hasErrors = $true
    }
}

# Check PowerShell script is executable
Write-Host "`nChecking PowerShell script..." -ForegroundColor Yellow
try {
    $scriptInfo = Get-Command ".\debug.ps1" -ErrorAction Stop
    Write-Host "✓ PowerShell script is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ PowerShell script has errors" -ForegroundColor Red
    $hasErrors = $true
}

# Check Node.js script
Write-Host "`nChecking Node.js script..." -ForegroundColor Yellow
try {
    node -c debug.js
    Write-Host "✓ Node.js script syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js script has syntax errors" -ForegroundColor Red
    $hasErrors = $true
}

# Check grammar file
Write-Host "`nChecking grammar file..." -ForegroundColor Yellow
$grammarContent = Get-Content statemachine.langium -Raw
if ($grammarContent -match "grammar StateMachine" -and $grammarContent -match "entry StateMachine:") {
    Write-Host "✓ Grammar file appears valid" -ForegroundColor Green
} else {
    Write-Host "✗ Grammar file may be invalid" -ForegroundColor Red
    $hasErrors = $true
}

# Check generator is built
Write-Host "`nChecking GLSP generator..." -ForegroundColor Yellow
$generatorPath = "../../dist/cli.js"
if (Test-Path $generatorPath) {
    Write-Host "✓ Generator CLI found" -ForegroundColor Green
} else {
    Write-Host "✗ Generator CLI not found - run 'yarn build' in project root" -ForegroundColor Red
    $hasErrors = $true
}

# Summary
Write-Host "`nSummary:" -ForegroundColor Cyan
if ($hasErrors) {
    Write-Host "Some issues were found. Please fix them before running the debug script." -ForegroundColor Red
    exit 1
} else {
    Write-Host "All checks passed! You can now run:" -ForegroundColor Green
    Write-Host "  .\debug.ps1" -ForegroundColor White
    Write-Host "  .\debug.ps1 -Watch" -ForegroundColor White
    Write-Host "  node debug.js" -ForegroundColor White
    Write-Host "  node debug.js --watch" -ForegroundColor White
}