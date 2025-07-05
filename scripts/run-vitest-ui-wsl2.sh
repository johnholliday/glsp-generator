#!/bin/bash
# Script to run Vitest UI in WSL2 with instructions for Windows access

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
PORT=51204

echo "🚀 Starting Vitest UI for WSL2..."
echo ""

# Get WSL2 IP address
WSL_IP=$(hostname -I | awk '{print $1}')
echo "📍 WSL2 IP Address: $WSL_IP"
echo ""

# Instructions for Windows users
echo "═══════════════════════════════════════════════════════════════════"
echo "📋 INSTRUCTIONS FOR WINDOWS ACCESS:"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Option 1: Run this PowerShell command as Administrator in Windows:"
echo ""
echo "  netsh interface portproxy add v4tov4 listenport=$PORT listenaddress=localhost connectport=$PORT connectaddress=$WSL_IP"
echo ""
echo "Then access: http://localhost:$PORT/__vitest__/"
echo ""
echo "Option 2: Direct access using WSL2 IP:"
echo ""
echo "  http://$WSL_IP:$PORT/__vitest__/"
echo ""
echo "Option 3: Use SSH tunnel from Windows PowerShell:"
echo ""
echo "  ssh -L $PORT:localhost:$PORT $(whoami)@$WSL_IP"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Starting Vitest UI..."
echo "Press Ctrl+C to stop"
echo ""

cd "$PROJECT_ROOT"

# Run Vitest UI bound to all interfaces
yarn vitest --ui --api.port=$PORT --api.host=0.0.0.0