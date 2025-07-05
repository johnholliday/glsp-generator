#!/bin/bash
# Run Vitest UI with only parser tests (faster and more focused)

echo "Starting Vitest UI with parser tests only..."
echo "This will prevent the continuous test loop issue."
echo ""
echo "Access the UI at:"
echo "  http://$(hostname -I | awk '{print $1}'):51204/__vitest__/"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run Vitest UI with only parser tests
yarn vitest --ui \
  --api.port=51204 \
  --api.host=0.0.0.0 \
  --run=false \
  src/parser/**/*.test.ts \
  test/unit/parser/**/*.test.ts