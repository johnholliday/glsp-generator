# Vitest UI in WSL2 - Complete Guide

## The Problem
WSL2 uses a virtual network adapter, making localhost connections from Windows to WSL2 services challenging.

## Solution Options

### Option 1: Direct WSL2 IP Access (Simplest)

1. Run the Vitest UI:
   ```bash
   ./scripts/run-vitest-ui-wsl2.sh
   ```

2. Note the WSL2 IP address shown (e.g., 172.26.196.194)

3. Open in Windows browser:
   ```
   http://172.26.196.194:51204/__vitest__/
   ```

### Option 2: Windows Port Forwarding (Most Reliable)

1. Open PowerShell as Administrator in Windows

2. Run the port forwarding setup script:
   ```powershell
   # Get WSL2 IP
   $wsl_ip = (wsl hostname -I).Trim().Split()[0]
   
   # Setup port forwarding
   netsh interface portproxy add v4tov4 listenport=51204 listenaddress=localhost connectport=51204 connectaddress=$wsl_ip
   
   # Check it worked
   netsh interface portproxy show all
   ```

3. Start Vitest UI in WSL2:
   ```bash
   yarn vitest --ui --api.port=51204 --api.host=0.0.0.0
   ```

4. Access in Windows browser:
   ```
   http://localhost:51204/__vitest__/
   ```

### Option 3: Docker with Bridge Network (Alternative)

1. Create a new docker-compose file:
   ```yaml
   services:
     vitest-ui:
       build:
         context: .
         dockerfile: Dockerfile.test
       ports:
         - "51204:51204"
       environment:
         - NODE_ENV=test
       command: ["yarn", "vitest", "--ui", "--api.port=51204", "--api.host=0.0.0.0"]
   ```

2. Run with:
   ```bash
   docker-compose -f docker-compose.test.yml up
   ```

### Option 4: VS Code Port Forwarding (If using VS Code)

1. Open VS Code connected to WSL2
2. Run Vitest UI normally
3. VS Code will auto-detect and offer to forward the port
4. Click "Open in Browser" in the VS Code notification

## Troubleshooting

### "Connection Reset" Error
- The service is running but Windows can't reach it
- Use the Windows port forwarding method (Option 2)

### "Connection Refused" Error
- Service isn't running or wrong IP
- Check WSL2 IP: `wsl hostname -I`
- Verify service is running: `ss -tlnp | grep 51204`

### Port Already in Use
```bash
# Find what's using the port
lsof -i :51204

# Kill it if needed
kill -9 <PID>
```

### Firewall Issues
In Windows PowerShell (as Admin):
```powershell
# Add firewall rule
New-NetFirewallRule -DisplayName "WSL2 Vitest UI" -Direction Inbound -LocalPort 51204 -Protocol TCP -Action Allow
```

### WSL2 IP Changes After Restart
WSL2 IP changes on restart. Re-run the port forwarding command or use the script.

## Quick Test

1. In WSL2, check if Vitest UI is accessible locally:
   ```bash
   curl -I http://localhost:51204/__vitest__/
   ```

2. Get your WSL2 IP:
   ```bash
   hostname -I | awk '{print $1}'
   ```

3. From Windows PowerShell, test connection:
   ```powershell
   Test-NetConnection -ComputerName <WSL2-IP> -Port 51204
   ```

## Permanent Solution

Add this to your Windows startup to auto-configure port forwarding:

1. Create `C:\Users\<YourName>\Documents\wsl-port-forward.ps1`:
   ```powershell
   $ports = @(51204, 3000, 8080)  # Add your commonly used ports
   $wsl_ip = (wsl hostname -I).Trim().Split()[0]
   
   foreach ($port in $ports) {
       netsh interface portproxy delete v4tov4 listenport=$port listenaddress=localhost 2>$null
       netsh interface portproxy add v4tov4 listenport=$port listenaddress=localhost connectport=$port connectaddress=$wsl_ip
   }
   
   Write-Host "WSL2 port forwarding configured for ports: $($ports -join ', ')"
   ```

2. Run on Windows startup via Task Scheduler