#!/bin/bash
# Test the Vitest version with properly typed mocks

echo "🧪 Testing Vitest with Proper Types"
echo "==================================="
echo ""

# First check if Vitest is installed
if ! npm list vitest > /dev/null 2>&1; then
    echo "📦 Installing Vitest..."
    npm install -D vitest
fi

echo "🔍 Running the properly typed Vitest test..."
echo ""

# Run the new test file
npx vitest run src/__tests__/generator-with-di.vitest.test.ts --reporter=verbose

echo ""
echo "✅ If the test passed, you've successfully:"
echo "   1. Fixed the ES module (chalk) issues"
echo "   2. Fixed the TypeScript type errors"
echo "   3. Migrated from Jest to Vitest"
echo ""
echo "📝 The key fixes were:"
echo "   - Using vi.fn<[paramTypes], ReturnType>() for proper typing"
echo "   - Replacing vi.spyOn with vi.spyOn"
echo "   - Casting mockParser as IGrammarParser when needed"
