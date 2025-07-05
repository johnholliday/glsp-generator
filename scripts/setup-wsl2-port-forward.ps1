# PowerShell script to set up port forwarding for WSL2 Vitest UI
# Run this script in an elevated PowerShell window on Windows

param(
    [int]$Port = 51204
)

Write-Host "Setting up WSL2 port forwarding for Vitest UI..." -ForegroundColor Cyan

# Get WSL2 IP address
$wsl2_ip = (wsl hostname -I).Trim().Split()[0]
Write-Host "WSL2 IP address: $wsl2_ip" -ForegroundColor Green

# Remove existing port proxy if any
netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=localhost 2>$null

# Add port forwarding rule
netsh interface portproxy add v4tov4 listenport=$Port listenaddress=localhost connectport=$Port connectaddress=$wsl2_ip

# Show current port proxy rules
Write-Host "`nCurrent port forwarding rules:" -ForegroundColor Yellow
netsh interface portproxy show all

# Add firewall rule if needed
$ruleName = "WSL2 Vitest UI Port $Port"
Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $Port -Protocol TCP -Action Allow | Out-Null

Write-Host "`nPort forwarding setup complete!" -ForegroundColor Green
Write-Host "You can now access Vitest UI at: http://localhost:$Port/__vitest__/" -ForegroundColor Cyan
Write-Host "`nTo remove port forwarding later, run:" -ForegroundColor Yellow
Write-Host "netsh interface portproxy delete v4tov4 listenport=$Port listenaddress=localhost" -ForegroundColor White