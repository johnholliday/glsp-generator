#!/usr/bin/env pwsh
# Build and test the GLSP generator

Write-Host "Building GLSP Generator..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning tests..." -ForegroundColor Blue
npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host "Tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nTesting CLI..." -ForegroundColor Blue
node dist/cli.js validate src/__tests__/fixtures/test-grammar.langium

if ($LASTEXITCODE -ne 0) {
    Write-Host "CLI validation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
Write-Host "`nGenerating example extension..." -ForegroundColor Blue
node dist/cli.js generate src/__tests__/fixtures/test-grammar.langium -o ./example-output

Write-Host "`nDone! Check ./example-output for the generated extension." -ForegroundColor Green
