# Prompt 001: Template Validation System

## Objective
Create a validation system that ensures all generated code is compatible with Yarn 1.22 and prevents Yarn Berry-specific features from appearing in the generated Theia extensions.

## Background
The GLSP Generator project uses Yarn Berry (v3+), but the generated Theia extensions MUST use Yarn Classic (v1.22). This split is critical because Theia requires Yarn 1.x. We need automated validation to prevent accidental inclusion of Yarn Berry features in templates.

## Requirements

### 1. Template Scanner Script
Create `scripts/validate-templates.js` that:
- Scans all `.hbs` files in `src/templates/`
- Detects Yarn Berry-specific patterns:
  - `workspace:` protocol references
  - `.yarnrc.yml` references
  - `yarn dlx` commands
  - PnP-specific imports or configuration
  - Berry-specific package.json fields

### 2. Generated Code Validator
Create `scripts/validate-generated.js` that:
- Takes a generated extension directory as input
- Validates with actual Yarn 1.22:
  - `package.json` is parseable by Yarn 1.22
  - All dependencies resolve correctly
  - Scripts execute without errors
- Reports any compatibility issues

### 3. Pre-commit Hook
Add validation to prevent bad templates from being committed:
- Use husky or similar for git hooks
- Run template validation before allowing commit
- Provide clear error messages with file and line numbers

### 4. CI Integration
Add GitHub Actions workflow that:
- Validates all templates on every PR
- Generates a test extension and validates it
- Tests on both Windows and Linux
- Uses actual Yarn 1.22 for validation

## Implementation Details

### Template Scanner Patterns
```javascript
const prohibitedPatterns = [
  /workspace:\*/g,          // Workspace protocol
  /\.yarnrc\.yml/g,        // Berry config file
  /yarn dlx/g,             // Berry-specific command
  /pnpMode/g,              // PnP configuration
  /pnpIgnorePattern/g,     // PnP specific
  /packageManager:/g,      // Corepack field
];
```

### Validation Report Format
```json
{
  "valid": false,
  "errors": [
    {
      "file": "templates/package.json.hbs",
      "line": 15,
      "pattern": "workspace:*",
      "message": "Workspace protocol is not supported in Yarn 1.22"
    }
  ],
  "warnings": []
}
```

## Acceptance Criteria

1. ✅ Script correctly identifies all Yarn Berry-specific patterns in templates
2. ✅ Generated extension passes Yarn 1.22 validation
3. ✅ Pre-commit hook prevents committing invalid templates
4. ✅ CI workflow runs on every PR
5. ✅ Clear error messages guide developers to fix issues
6. ✅ Documentation in TESTPLAN.md for running validations
7. ✅ Works on both Windows (PowerShell) and Linux

## Testing Requirements

Create comprehensive tests in `src/scripts/validate-templates.test.js`:
- Test detection of each prohibited pattern
- Test validation of valid templates
- Test error reporting format
- Test with actual template files
- Mock file system for unit tests

## Files to Create/Modify

1. `scripts/validate-templates.js` - Template scanner
2. `scripts/validate-generated.js` - Generated code validator
3. `scripts/validate-templates.test.js` - Tests
4. `.github/workflows/validate-templates.yml` - CI workflow
5. `.husky/pre-commit` - Git hook
6. Update `package.json` with validation scripts
7. Update `TESTPLAN.md` with validation instructions

## Dependencies
- None (this is a foundational enhancement)

## Notes
- This is the highest priority enhancement as it prevents critical compatibility issues
- Consider making validation part of the build process
- Should run quickly to not slow down development
