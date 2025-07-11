# Script to refresh Docker container, handling conflicts automatically

Write-Host "🔄 Refreshing Docker container..." -ForegroundColor Blue

# Stop and remove any existing container with the same name
$existingContainer = docker ps -a --format '{{.Names}}' | Where-Object { $_ -eq 'glspgen' }
if ($existingContainer) {
    Write-Host "📦 Found existing glspgen container, removing it..." -ForegroundColor Yellow
    docker stop glspgen 2>$null
    docker rm glspgen 2>$null
}

# Remove any orphaned containers
Write-Host "🧹 Cleaning up orphaned containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Build the new image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
yarn workspace @glsp/generator docker:build:local
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Start the container
Write-Host "🚀 Starting container..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}

# Wait a moment for the container to start
Start-Sleep -Seconds 2

# Check if container is running
$runningContainer = docker ps --format '{{.Names}}' | Where-Object { $_ -eq 'glspgen' }
if ($runningContainer) {
    Write-Host "✅ Container 'glspgen' is running successfully!" -ForegroundColor Green
    
    # Test the health endpoint
    Write-Host "🏥 Testing health endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:51620/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health check passed!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Health check failed (service may still be starting)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}