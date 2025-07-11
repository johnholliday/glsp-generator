# Prompt 023: Build & Release Automation

## Goal
Create a comprehensive release automation system that handles versioning, changelog generation, building, testing, and publishing with minimal manual intervention.

## Why
- Manual release process is error-prone
- Changelog creation is tedious
- Version bumping across packages is complex
- No automated quality gates
- Missing release documentation
- Inconsistent release artifacts

## What
An automated release pipeline with semantic versioning, changelog generation, quality gates, and multi-platform publishing.

### Success Criteria
- [ ] Single command releases
- [ ] Automatic semantic versioning
- [ ] Changelog generation from commits
- [ ] Pre-release quality gates
- [ ] Multi-platform artifact building
- [ ] Automated publishing to registries
- [ ] Git tag and GitHub release creation
- [ ] Rollback capabilities

## Implementation Blueprint

### Phase 1: Release Command

CREATE scripts/release.js:
```javascript
#!/usr/bin/env node
import { ReleaseManager } from './lib/release-manager.js';

const manager = new ReleaseManager();

async function release() {
  try {
    // Pre-flight checks
    await manager.preflightChecks();
    
    // Determine version bump
    const versionType = await manager.determineVersionBump();
    
    // Update versions
    const newVersion = await manager.bumpVersion(versionType);
    
    // Generate changelog
    await manager.generateChangelog(newVersion);
    
    // Run quality gates
    await manager.runQualityGates();
    
    // Build artifacts
    await manager.buildArtifacts();
    
    // Create git tag
    await manager.createGitTag(newVersion);
    
    // Publish packages
    await manager.publish();
    
    // Create GitHub release
    await manager.createGitHubRelease(newVersion);
    
    console.log(`✅ Released version ${newVersion}`);
  } catch (error) {
    await manager.rollback();
    throw error;
  }
}

release();
```

### Phase 2: Changelog Generation

CREATE scripts/lib/changelog-generator.js:
```javascript
export class ChangelogGenerator {
  async generate(version, commits) {
    const sections = {
      breaking: [],
      features: [],
      fixes: [],
      other: []
    };
    
    // Categorize commits
    commits.forEach(commit => {
      if (commit.breaking) sections.breaking.push(commit);
      else if (commit.type === 'feat') sections.features.push(commit);
      else if (commit.type === 'fix') sections.fixes.push(commit);
      else sections.other.push(commit);
    });
    
    // Generate markdown
    return this.renderChangelog(version, sections);
  }
}
```

### Phase 3: Quality Gates

CREATE scripts/lib/quality-gates.js:
```javascript
export class QualityGates {
  async run() {
    const gates = [
      { name: 'Tests', fn: () => this.runTests() },
      { name: 'Linting', fn: () => this.runLinting() },
      { name: 'Type Check', fn: () => this.runTypeCheck() },
      { name: 'Coverage', fn: () => this.checkCoverage() },
      { name: 'Bundle Size', fn: () => this.checkBundleSize() },
      { name: 'Security', fn: () => this.runSecurityAudit() }
    ];
    
    for (const gate of gates) {
      console.log(`Running ${gate.name}...`);
      await gate.fn();
    }
  }
}
```

### Integration

UPDATE package.json:
```json
{
  "scripts": {
    "release": "node scripts/release.js",
    "release:dry-run": "node scripts/release.js --dry-run",
    "release:alpha": "node scripts/release.js --prerelease alpha",
    "release:beta": "node scripts/release.js --prerelease beta"
  }
}
```

CREATE .github/workflows/release.yml:
```yaml
name: Release
on:
  workflow_dispatch:
    inputs:
      version:
        type: choice
        options: [patch, minor, major]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install
      - run: yarn release --type ${{ inputs.version }}
      - uses: softprops/action-gh-release@v1
```

## Final Validation Checklist
- [ ] Release completes without manual steps
- [ ] Changelog accurately reflects changes
- [ ] Version numbers update correctly
- [ ] Quality gates prevent bad releases
- [ ] Artifacts build for all platforms
- [ ] Publishing works to all registries
- [ ] Rollback restores previous state
- [ ] GitHub release includes all artifacts