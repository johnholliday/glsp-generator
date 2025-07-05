# PowerShell script to help Windows users access Vitest UI in WSL2
# Run this script in Windows PowerShell as Administrator

Write-Host "Setting up Vitest UI access from Windows to WSL2..." -ForegroundColor Cyan

# Get WSL2 IP
$wsl_ip = (wsl hostname -I).Trim().Split()[0]
Write-Host "WSL2 IP: $wsl_ip" -ForegroundColor Green

# Setup port forwarding
$port = 51204
netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null
netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wsl_ip

Write-Host "`nPort forwarding configured!" -ForegroundColor Green

# Start Vitest UI in WSL2
Write-Host "`nStarting Vitest UI in WSL2..." -ForegroundColor Yellow
wsl bash -c "cd /home/john/projects/utils/glsp-generator && nohup yarn vitest --ui --api.port=51204 --api.host=0.0.0.0 > /tmp/vitest-ui.log 2>&1 &"

Start-Sleep -Seconds 3

# Test connection
Write-Host "`nTesting connection..." -ForegroundColor Yellow
$response = $null
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port/__vitest__/" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Vitest UI is accessible!" -ForegroundColor Green
        Write-Host "`nOpening in default browser..." -ForegroundColor Cyan
        Start-Process "http://localhost:$port/__vitest__/"
    }
} catch {
    Write-Host "✗ Could not connect to Vitest UI" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Try accessing directly: http://${wsl_ip}:$port/__vitest__/" -ForegroundColor White
    Write-Host "2. Check Windows Firewall settings" -ForegroundColor White
    Write-Host "3. Run this command to check WSL2 logs:" -ForegroundColor White
    Write-Host "   wsl cat /tmp/vitest-ui.log" -ForegroundColor Gray
}

Write-Host "`nTo stop Vitest UI later, run in WSL2:" -ForegroundColor Yellow
Write-Host "pkill -f 'vitest.*--ui'" -ForegroundColor White