# Test Plan for GLSP Generator

## Overview
Total test suites: 20+
Total test cases: 100+
Current coverage: Target 100%
Last updated: 2025-06-22
Test Framework: Vitest (migrated from Jest)

## Quick Commands (PowerShell)
- Run all tests: `yarn test`
- Run with coverage: `yarn test:coverage`
- Watch mode: `yarn test:watch`
- UI mode: `yarn test:ui`
- Specific file: `yarn test src\utils\langium-ast-parser.test.ts`
- Validate templates: `yarn validate:templates`
- Validate generated extension: `yarn validate:generated <path>`

## Test Suites

### 1. Parser Tests
**File**: `src/utils/langium-ast-parser.test.ts`
**Purpose**: Validates grammar parsing functionality
**Test count**: 8+ tests
**Coverage**: Target 100%
**Key scenarios**:
- Valid grammar parsing
- Invalid grammar detection
- Edge cases (empty files, large files)
- Interface inheritance parsing
- Type alias parsing
- Property modifiers (optional, array, reference)
**Run**: `yarn test src\utils\langium-ast-parser.test.ts`

### 2. Generator Tests
**File**: `src/generator.test.ts`
**Purpose**: Tests the main generation logic
**Test count**: 5+ tests
**Coverage**: Target 100%
**Key scenarios**:
- Full extension generation
- Template rendering
- File system operations
- Error handling
**Run**: `yarn test src\generator.test.ts`

### 3. Handlebars Helpers Tests
**File**: `src/handlebars-helpers.test.ts`
**Purpose**: Tests template helper functions
**Test count**: 10+ tests
**Coverage**: Target 100%
**Key scenarios**:
- String transformations (toPascalCase, toCamelCase)
- Array operations (hasElements, join)
- Logical operations (eq, neq, and, or)
**Run**: `yarn test src\handlebars-helpers.test.ts`

### 4. Legacy Parser Tests
**File**: `src/langium-parser.test.ts`
**Purpose**: Tests for backward compatibility
**Test count**: 5+ tests
**Coverage**: Target 100%
**Key scenarios**:
- Basic parsing functionality
- Compatibility with AST parser
**Run**: `yarn test src\langium-parser.test.ts`

### 5. Template Validation Tests
**File**: `src/scripts/validate-templates.test.ts`
**Purpose**: Tests Yarn 1.22 compatibility validation
**Test count**: 15+ tests
**Coverage**: Target 100%
**Key scenarios**:
- Detection of Yarn Berry patterns
- Workspace protocol detection
- yarn dlx command detection
- PnP configuration detection
- Clean template validation
- Package.json specific checks
- Edge cases with Handlebars expressions
**Run**: `yarn test src\scripts\validate-templates.test.ts`

### 6. CLI Tests
**File**: `src/__tests__/cli.test.ts`
**Purpose**: Tests the Yargs-based CLI interface
**Test count**: 1 passing test + 7 todo tests + 2 integration tests
**Coverage**: Target 100%
**Key scenarios**:
- CLI module loading and configuration ✅
- Command structure validation (todo)
- Version and help commands (integration tests)
- Error handling (todo)
- Interactive mode (todo)
**Run**: `yarn test src\__tests__\cli.test.ts`
**Note**: Integration tests require built CLI (`yarn build` first)

### 7. Watch Mode Tests
**File**: `src/watch/watcher.test.ts`
**Purpose**: Tests file watching and auto-regeneration
**Test count**: 7+ tests
**Coverage**: Target 100%
**Key scenarios**:
- File change detection
- Debouncing logic
- Error recovery
- Dev server integration
- Resource cleanup
**Run**: `yarn test src/watch/watcher.test.ts`

### 8. Watch Mode Integration Tests
**File**: `src/watch/integration.test.ts`
**Purpose**: Tests actual watch process
**Test count**: 1+ integration test
**Key scenarios**:
- Process spawning
- File change triggering regeneration
- Output verification
**Run**: `yarn test src/watch/integration.test.ts`
**Note**: Requires built CLI and may be slower

## Validation Scripts

### Template Validation
**Purpose**: Ensures templates are compatible with Yarn 1.22
**Command**: `yarn validate:templates`
**What it does**:
- Scans all .hbs files in src/templates/
- Detects Yarn Berry-specific patterns
- Reports errors and warnings
- Generates validation-report.json
**Expected outcome**: No errors, minimal warnings

### Generated Extension Validation
**Purpose**: Validates generated extensions work with Yarn 1.22
**Command**: `yarn validate:generated <extension-dir>`
**Example**: `yarn validate:generated .\test-output`
**What it does**:
- Validates package.json compatibility
- Runs yarn install with Yarn 1.22
- Checks for Berry artifacts
- Attempts to run build script
**Expected outcome**: Successful install and build

## CI/CD Integration

### GitHub Actions Workflow
**File**: `.github/workflows/validate-templates.yml`
**Triggers**: 
- Push to main/master/develop branches
- Pull requests
- Manual workflow dispatch
**Jobs**:
1. **validate-templates**: Runs on Ubuntu and Windows with Node 18.x and 20.x
2. **test-generated-extension**: Tests actual generation with Yarn 1.22
3. **run-tests**: Runs all unit tests with coverage

### Pre-commit Hook
**File**: `.husky/pre-commit`
**Purpose**: Prevents committing invalid templates
**What it does**:
- Runs template validation before each commit
- Blocks commit if validation fails
**Setup**: Run `yarn install` to install husky

## Coverage Report Interpretation
- **Statements**: Should be 95%+
- **Branches**: Should be 90%+
- **Functions**: Should be 100%
- **Lines**: Should be 95%+

## Adding New Tests
1. Create test file next to source file
2. Follow naming convention: `<filename>.test.ts` or `<filename>.test.js`
3. Update this document with:
   - Test suite details
   - Test count
   - Key scenarios
   - Run command
4. Run coverage to ensure no regression: `yarn test:coverage`

## Troubleshooting (PowerShell)

### Common Issues
- **Module not found errors**: Ensure `yarn build` was run first
- **Path issues in tests**: Use forward slashes in imports
- **Validation script not found**: Check scripts/ directory exists
- **Husky not working**: Run `yarn install` to set up git hooks
- **CI failures**: Check Node version compatibility

### Mock File System Issues (Vitest)
- Vitest is configured to handle fs-extra mocking
- Check `vitest.config.ts` for proper setup
- Use `vi.mock('fs-extra')` in tests when needed
- Mock modules are in `src/__mocks__/` directory

### Windows-Specific Issues
- Use forward slashes in import statements
- Use cross-platform path handling with path.join()
- Ensure line endings are consistent (CRLF)

### Async Test Timeouts
- Default timeout is 20000ms (20 seconds)
- Increase for slow operations in specific tests:
  ```typescript
  test('slow operation', async () => {
    // test code
  }, 30000); // 30 second timeout
  ```
- Or globally in vitest.config.ts

### Vitest-Specific Tips
- Use `vi.fn()` instead of `jest.fn()`
- Use `vi.mock()` instead of `jest.mock()`
- Use `vi.spyOn()` instead of `jest.spyOn()`
- Run UI mode for debugging: `yarn test:ui`
- Check coverage report: `yarn test:coverage`

## Running Validation in Development

### Manual Template Validation
```powershell
# Check all templates
yarn validate:templates

# After making template changes
yarn validate:templates

# Before committing (automatic with husky)
git commit -m "Update templates"
```

### Testing Generated Extensions
```powershell
# Using the new CLI commands
glsp gen src\__tests__\fixtures\test-grammar.langium test-output

# Or with the built CLI
node dist/cli.js generate src\__tests__\fixtures\test-grammar.langium -o test-output

# Validate with Yarn 1.22
yarn validate:generated test-output

# Clean up with new CLI
glsp clean -f

# Or manually
Remove-Item -Recurse -Force test-output
```

### Testing the New CLI
```powershell
# After building
yarn build

# Test version command
node dist/cli.js --version
node dist/cli.js -v  # Fixed and working ✅

# Test help
node dist/cli.js --help
node dist/cli.js gen --help

# Test interactive mode
node dist/cli.js

# For global testing
yarn setup:dev
glsp --version
```

## Validation Report Files

### validation-report.json
Generated by `validate:templates` script
```json
{
  "valid": true/false,
  "errors": [...],
  "warnings": [...],
  "summary": {
    "filesScanned": 7,
    "errorsFound": 0,
    "warningsFound": 0
  }
}
```

### yarn-validation-report.json
Generated by `validate:generated` script in the tested directory
Contains detailed information about:
- Package.json validation results
- Yarn install outcomes
- Build script results
- Detected compatibility issues

## Best Practices

1. **Always run validation** before committing template changes
2. **Test with actual Yarn 1.22** when modifying package.json template
3. **Update tests** when adding new validation rules
4. **Document new patterns** in prohibitedPatterns array
5. **Keep CI green** by running tests locally first