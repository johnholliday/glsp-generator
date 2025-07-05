# PowerShell script to start Vitest UI in WSL2 and open in Windows browser
# Run this from Windows PowerShell

param(
    [switch]$SetupPortForwarding = $false
)

$ProjectPath = "/home/john/projects/utils/glsp-generator"
$Port = 51204

Write-Host "🚀 Starting Vitest UI in WSL2..." -ForegroundColor Cyan

# Get WSL2 IP
$wslIP = (wsl hostname -I).Trim().Split()[0]
Write-Host "📍 WSL2 IP: $wslIP" -ForegroundColor Green

# Setup port forwarding if requested
if ($SetupPortForwarding) {
    Write-Host "`n🔧 Setting up port forwarding..." -ForegroundColor Yellow
    
    # Check if running as admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    
    if (-not $isAdmin) {
        Write-Host "❌ Port forwarding requires Administrator privileges!" -ForegroundColor Red
        Write-Host "   Please run PowerShell as Administrator and use -SetupPortForwarding flag" -ForegroundColor Yellow
    } else {
        # Remove existing rule
        netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=localhost 2>$null
        
        # Add new rule
        netsh interface portproxy add v4tov4 listenport=$Port listenaddress=localhost connectport=$Port connectaddress=$wslIP
        
        Write-Host "✅ Port forwarding configured!" -ForegroundColor Green
        Write-Host "   You can now access Vitest UI at: http://localhost:$Port/__vitest__/" -ForegroundColor Cyan
    }
}

# Start Vitest UI in WSL
Write-Host "`n📦 Starting Vitest UI..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    param($path)
    wsl bash -c "cd $path && yarn test:ui:start"
} -ArgumentList $ProjectPath

# Wait for UI to start
Write-Host "⏳ Waiting for Vitest UI to start..." -ForegroundColor Gray
$maxAttempts = 30
$attempt = 0
$started = $false

while ($attempt -lt $maxAttempts -and -not $started) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        # Try direct WSL IP first
        $response = Invoke-WebRequest -Uri "http://${wslIP}:${Port}/__vitest__/" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $started = $true
            $url = "http://${wslIP}:${Port}/__vitest__/"
        }
    } catch {
        # Try localhost if port forwarding is set up
        if ($SetupPortForwarding) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:${Port}/__vitest__/" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    $started = $true
                    $url = "http://localhost:${Port}/__vitest__/"
                }
            } catch {}
        }
    }
    
    if (-not $started) {
        Write-Host "." -NoNewline
    }
}

Write-Host ""

if ($started) {
    Write-Host "`n✅ Vitest UI is running!" -ForegroundColor Green
    Write-Host "🌐 Opening in browser: $url" -ForegroundColor Cyan
    Start-Process $url
    
    Write-Host "`n📝 Tips:" -ForegroundColor Yellow
    Write-Host "   • Tests won't auto-run - use the UI controls" -ForegroundColor White
    Write-Host "   • Click specific test files to run them" -ForegroundColor White
    Write-Host "   • Use filters to focus on specific tests" -ForegroundColor White
    Write-Host "   • Press 'a' to run all, 'f' for failed tests" -ForegroundColor White
    
    Write-Host "`n🛑 To stop Vitest UI:" -ForegroundColor Yellow
    Write-Host "   • Run in WSL: yarn test:ui:stop" -ForegroundColor White
    Write-Host "   • Or close this PowerShell window" -ForegroundColor White
    
    # Keep job output visible
    Write-Host "`n📊 Vitest UI Output:" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────" -ForegroundColor Gray
    
    # Stream job output
    while ($job.State -eq 'Running') {
        Receive-Job -Job $job
        Start-Sleep -Milliseconds 100
    }
    
    # Get final output
    Receive-Job -Job $job
    Remove-Job -Job $job
} else {
    Write-Host "`n❌ Failed to start Vitest UI!" -ForegroundColor Red
    Write-Host "   Check WSL output for errors:" -ForegroundColor Yellow
    
    # Show job output for debugging
    Receive-Job -Job $job
    Remove-Job -Job $job
    
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Try running directly in WSL: cd $ProjectPath && yarn test:ui:start" -ForegroundColor White
    Write-Host "2. Check if port $Port is already in use" -ForegroundColor White
    Write-Host "3. Ensure yarn dependencies are installed" -ForegroundColor White
}