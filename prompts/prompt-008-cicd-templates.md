# Prompt 008: CI/CD Templates

## Objective
Generate GitHub Actions workflows and other CI/CD configurations for the produced Theia GLSP extensions, enabling automated building, testing, and publishing.

## Background
Users need to manually set up CI/CD for their generated extensions. Providing pre-configured workflows would enable immediate automation and best practices.

## Requirements

### 1. GitHub Actions Workflows
Generate workflows for:
- Build and test on push/PR
- Release and publish
- Nightly builds
- Dependency updates
- Security scanning
- Cross-platform testing

### 2. Build Workflow
Create `.github/workflows/build.yml`:
- Checkout code
- Setup Node.js
- Install Yarn 1.22
- Install dependencies
- Build extension
- Run tests
- Upload artifacts

### 3. Release Workflow
Create `.github/workflows/release.yml`:
- Trigger on version tags
- Build production artifacts
- Create GitHub release
- Publish to npm
- Publish to Open VSX
- Generate changelog

### 4. Platform Testing
Ensure workflows test on:
- Windows (PowerShell)
- Linux (Ubuntu)
- macOS (optional)
- Multiple Node versions
- Different Theia versions

### 5. Quality Gates
Include checks for:
- Code coverage thresholds
- Linting passes
- No security vulnerabilities
- Bundle size limits
- Performance benchmarks

### 6. Additional Configs
Generate supporting files:
- `.npmignore`
- `.vscodeignore`
- `CHANGELOG.md` template
- Release scripts
- Version bump scripts

## Implementation Details

### Build Workflow Template
```yaml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [16.x, 18.x]
        
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Get yarn cache directory
      id: yarn-cache-dir
      run: echo "dir=$(yarn cache dir)" >> $GITHUB_OUTPUT
      
    - uses: actions/cache@v3
      with:
        path: ${{ steps.yarn-cache-dir.outputs.dir }}
        key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
        
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Build
      run: yarn build
      
    - name: Test
      run: yarn test --coverage
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18.x'
      
    - name: E2E Tests
      run: yarn test:e2e
      if: matrix.os == 'ubuntu-latest'
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: {{extension.name}}-${{ matrix.os }}-${{ matrix.node-version }}
        path: |
          lib/
          dist/
```

### Release Workflow
```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
        
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18
        registry-url: 'https://registry.npmjs.org'
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Build
      run: yarn build
      
    - name: Generate changelog
      run: yarn changelog
      
    - name: Create Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        body_path: CHANGELOG.md
        
    - name: Publish to npm
      run: yarn publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        
    - name: Publish to Open VSX
      run: npx ovsx publish
      env:
        OVSX_PAT: ${{ secrets.OVSX_TOKEN }}
```

### Version Management Script
```json
{
  "scripts": {
    "version": "yarn version --new-version",
    "version:patch": "yarn version --patch",
    "version:minor": "yarn version --minor", 
    "version:major": "yarn version --major",
    "prepublishOnly": "yarn test && yarn build",
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

## Acceptance Criteria

1. ✅ Complete GitHub Actions workflows
2. ✅ Cross-platform build support
3. ✅ Automated testing in CI
4. ✅ Release automation
5. ✅ Publishing to registries
6. ✅ Quality gates enforced
7. ✅ Works with Yarn 1.22

## Testing Requirements

Create tests for workflow generation:
- Validate YAML syntax
- Check for required steps
- Verify environment variables
- Test script generation
- Validate platform compatibility

## Files to Create/Modify

1. `src/cicd/workflow-generator.ts`
2. `src/cicd/templates/build.yml.hbs`
3. `src/cicd/templates/release.yml.hbs`
4. `src/cicd/templates/security.yml.hbs`
5. `src/cicd/release-scripts.ts`
6. `src/generator.ts` - Add CI/CD generation
7. CLI flag `--generate-ci`

## Dependencies
- None (but complements test generation)

## Notes
- Consider GitLab CI and Azure DevOps templates
- Workflows should be customizable
- Consider Docker build support
- Add semantic release support
- Consider monorepo workflows
