# Template Validation System Implementation

Date: 2025-06-19
Prompt: 001 - Template Validation System

## Summary
Implemented a comprehensive validation system to ensure all generated code is compatible with Yarn 1.22 and prevents Yarn Berry-specific features from appearing in the generated Theia extensions.

## Files Created/Modified

### 1. Scripts
- `scripts/validate-templates.js` - Template scanner that detects Yarn Berry patterns
- `scripts/validate-generated.js` - Validates generated extensions with actual Yarn 1.22
- `src/scripts/validate-templates.test.js` - Comprehensive test suite for validation

### 2. Configuration
- `package.json` - Added validation scripts and husky dependency
- `.husky/pre-commit` - Git hook for template validation
- `.github/workflows/validate-templates.yml` - CI workflow for automated validation

### 3. Documentation
- `TESTPLAN.md` - Created comprehensive test documentation including validation instructions

## Key Features

### Template Scanner (`validate-templates.js`)
Detects the following Yarn Berry-specific patterns:
- `workspace:*` protocol references
- `.yarnrc.yml` configuration files
- `yarn dlx` commands
- PnP-specific imports and configuration
- `packageManager` field (Corepack)
- Berry-specific configuration options

### Generated Code Validator (`validate-generated.js`)
- Verifies Yarn version is 1.x
- Validates package.json compatibility
- Runs actual `yarn install` with Yarn 1.22
- Checks for Berry artifacts (.pnp.cjs, .yarn/, etc.)
- Tests build scripts

### Pre-commit Protection
- Husky hook prevents committing invalid templates
- Provides clear error messages with file and line numbers
- Runs automatically before each commit

### CI/CD Integration
- Tests on both Windows and Linux
- Uses Node.js 18.x and 20.x
- Generates test extensions and validates them
- Uploads artifacts for debugging failures

## Validation Report Format
Both scripts generate JSON reports:
```json
{
  "valid": false,
  "errors": [{
    "file": "templates/package.json.hbs",
    "line": 15,
    "pattern": "workspace:*",
    "message": "Workspace protocol is not supported in Yarn 1.22"
  }],
  "warnings": [],
  "summary": {
    "filesScanned": 7,
    "errorsFound": 1,
    "warningsFound": 0
  }
}
```

## Usage

### Manual Validation
```powershell
# Validate templates
yarn validate:templates

# Validate a generated extension
yarn validate:generated ./output/my-extension
```

### Automated Validation
- Pre-commit hook runs automatically
- CI runs on every PR and push to main branches
- Can be triggered manually via GitHub Actions

## Testing
Created comprehensive test suite with 15+ test cases covering:
- Each prohibited pattern detection
- Clean template validation
- Edge cases with Handlebars expressions
- Error handling and reporting

## Next Steps
- Monitor CI for any false positives
- Add more patterns as discovered
- Consider integration with the main build process
- Update patterns when Theia eventually supports Yarn Berry