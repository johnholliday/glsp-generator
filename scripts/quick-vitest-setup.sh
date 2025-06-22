#!/bin/bash
# Quick Vitest setup for GLSP Generator
# Run with: bash quick-vitest-setup.sh

echo "🚀 Quick Vitest Setup for GLSP Generator"
echo "======================================="
echo ""

# Step 1: Install Vitest
echo "📦 Step 1: Installing Vitest..."
npm install -D vitest @vitest/ui

echo ""
echo "✅ Vitest installed!"
echo ""

# Step 2: Update one test file as a proof of concept
echo "🔄 Step 2: Converting one test file to verify it works..."

# Create a Vitest version of the problematic test
cp src/__tests__/generator-with-di.test.ts src/__tests__/generator-with-di.vitest.test.ts

# Update imports in the new file
sed -i 's/@jest\/globals/vitest/g' src/__tests__/generator-with-di.vitest.test.ts
sed -i 's/jest\./vi\./g' src/__tests__/generator-with-di.vitest.test.ts

echo "✅ Created Vitest version of test file"
echo ""

# Step 3: Run the test with Vitest
echo "🧪 Step 3: Running test with Vitest..."
echo "----------------------------------------"
npx vitest run src/__tests__/generator-with-di.vitest.test.ts --reporter=verbose

echo ""
echo "📊 Results:"
echo "-----------"
echo "If the test passed, your ES module issues are solved!"
echo ""
echo "🎯 Next Steps:"
echo "1. If it worked, run the full migration:"
echo "   - Update all test files (jest -> vi)"
echo "   - Remove Jest dependencies"
echo "   - Update package.json scripts"
echo ""
echo "2. Or just use Vitest for new tests while keeping Jest for old ones"
echo ""
echo "📝 Files created:"
echo "   - vitest.config.ts (configuration)"
echo "   - src/__tests__/setup.vitest.ts (test setup)"
echo "   - src/__tests__/generator-with-di.vitest.test.ts (example test)"
