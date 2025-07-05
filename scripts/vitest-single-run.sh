#!/bin/bash
# Simple solution: Just run tests once in UI mode

echo "🚀 Starting Vitest UI (Single Run Mode)"
echo ""
echo "📍 Access at: http://$(hostname -I | awk '{print $1}'):51204/__vitest__/"
echo ""
echo "⚠️  IMPORTANT: Tests will run ONCE and the UI will close"
echo "   This prevents the continuous loop issue"
echo ""
echo "To run again, just execute this script again"
echo ""

# Run Vitest in UI mode but with --run flag (no watch)
yarn vitest run --ui --api.port=51204 --api.host=0.0.0.0