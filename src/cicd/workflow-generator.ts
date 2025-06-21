import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import Handlebars from 'handlebars';

export interface WorkflowGeneratorOptions {
    generateBuildWorkflow?: boolean;
    generateReleaseWorkflow?: boolean;
    generateSecurityWorkflow?: boolean;
    generateDependencyUpdateWorkflow?: boolean;
    generateNightlyWorkflow?: boolean;
    nodeVersions?: string[];
    platforms?: string[];
    includeE2ETests?: boolean;
    includeCoverage?: boolean;
    coverageThreshold?: number;
    publishToNpm?: boolean;
    publishToOpenVsx?: boolean;
}

export class WorkflowGenerator {
    private buildWorkflowTemplate!: HandlebarsTemplateDelegate;
    private releaseWorkflowTemplate!: HandlebarsTemplateDelegate;
    private securityWorkflowTemplate!: HandlebarsTemplateDelegate;
    private dependencyUpdateTemplate!: HandlebarsTemplateDelegate;
    private nightlyBuildTemplate!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplates();
        this.registerHelpers();
    }
    
    private preprocessTemplate(template: string): string {
        // Remove backslash escapes first, then replace GitHub Actions expressions
        return template
            .replace(/\\\$/g, '$')
            .replace(/\$\{\{/g, '___GH_EXPR_START___');
    }
    
    private loadTemplates(): void {
        const buildTemplate = `name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: \${{ matrix.os }}
    
    strategy:
      fail-fast: false
      matrix:
        os: [{{#each platforms}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}]
        node-version: [{{#each nodeVersions}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}]
{{#if excludeWindows}}
        exclude:
          - os: windows-latest
            node-version: 16.x
{{/if}}
        
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Get yarn cache directory
      id: yarn-cache-dir
      run: echo "dir=\$(yarn cache dir)" >> \$GITHUB_OUTPUT
      shell: bash
      
    - uses: actions/cache@v3
      with:
        path: \${{ steps.yarn-cache-dir.outputs.dir }}
        key: \${{ runner.os }}-yarn-\${{ hashFiles('**/yarn.lock') }}
        restore-keys: |
          \${{ runner.os }}-yarn-
        
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Lint
      run: yarn lint
      if: matrix.os == 'ubuntu-latest'
      
    - name: Build
      run: yarn build
      
    - name: Test
      run: yarn test{{#if includeCoverage}} --coverage{{/if}}
      
{{#if includeCoverage}}
    - name: Check coverage
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18.x'
      run: |
        COVERAGE=\$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        echo "Coverage: \$COVERAGE%"
        if (( \$(echo "\$COVERAGE < {{coverageThreshold}}" | bc -l) )); then
          echo "Coverage \$COVERAGE% is below threshold {{coverageThreshold}}%"
          exit 1
        fi
        
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18.x'
      with:
        token: \$\{{ secrets.CODECOV_TOKEN }}
        files: ./coverage/lcov.info
        fail_ci_if_error: true
{{/if}}
      
{{#if includeE2ETests}}
    - name: Install Playwright
      if: matrix.os == 'ubuntu-latest'
      run: npx playwright install --with-deps chromium
      
    - name: E2E Tests
      if: matrix.os == 'ubuntu-latest'
      run: yarn test:e2e
      
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: always() && matrix.os == 'ubuntu-latest'
      with:
        name: e2e-results-\$\{{ matrix.node-version }}
        path: |
          test-results/
          playwright-report/
{{/if}}
      
    - name: Bundle size check
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18.x'
      run: |
        yarn build:production
        SIZE=\$(du -sb dist | cut -f1)
        echo "Bundle size: \$SIZE bytes"
        if [ \$SIZE -gt 10000000 ]; then
          echo "Bundle size exceeds 10MB limit"
          exit 1
        fi
        
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      if: matrix.os == 'ubuntu-latest' && matrix.node-version == '18.x'
      with:
        name: {{projectName}}-artifacts
        path: |
          lib/
          dist/
          
  check-licenses:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
    - run: npm install -g yarn@1.22.19
    - run: yarn install --frozen-lockfile
    - name: Check licenses
      run: |
        yarn licenses list --production > licenses.txt
        if grep -E "(GPL|AGPL|LGPL)" licenses.txt; then
          echo "Found GPL licensed dependencies"
          exit 1
        fi
`;
        
        this.buildWorkflowTemplate = Handlebars.compile(this.preprocessTemplate(buildTemplate));

        const releaseTemplate = `name: Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., 1.2.3)'
        required: true
        type: string

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: \$\{{ secrets.GITHUB_TOKEN }}
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
{{#if publishToNpm}}
        registry-url: 'https://registry.npmjs.org'
{{/if}}
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Get version
      id: version
      run: |
        if [ "\$\{{ github.event_name }}" = "workflow_dispatch" ]; then
          VERSION=\$\{{ github.event.inputs.version }}
        else
          VERSION=\${GITHUB_REF#refs/tags/v}
        fi
        echo "version=\$VERSION" >> \$GITHUB_OUTPUT
        
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Run tests
      run: yarn test
      
    - name: Build
      run: yarn build:production
      
    - name: Generate changelog
      run: |
        npm install -g conventional-changelog-cli
        conventional-changelog -p angular -i CHANGELOG.md -s -r 1
        
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        tag_name: v\$\{{ steps.version.outputs.version }}
        name: Release v\$\{{ steps.version.outputs.version }}
        body_path: CHANGELOG.md
        draft: false
        prerelease: false
        files: |
          dist/**/*.vsix
          dist/**/*.tar.gz
        
{{#if publishToNpm}}
    - name: Publish to npm
      run: |
        echo "//registry.npmjs.org/:_authToken=\$\{{ secrets.NPM_TOKEN }}" > ~/.npmrc
        yarn publish --new-version \$\{{ steps.version.outputs.version }}
      env:
        NODE_AUTH_TOKEN: \$\{{ secrets.NPM_TOKEN }}
{{/if}}
        
{{#if publishToOpenVsx}}
    - name: Publish to Open VSX
      run: |
        npm install -g ovsx
        ovsx publish -p \$\{{ secrets.OVSX_TOKEN }}
      env:
        OVSX_PAT: \$\{{ secrets.OVSX_TOKEN }}
{{/if}}

    - name: Create Docker image
      run: |
        docker build -t {{projectName}}:\$\{{ steps.version.outputs.version }} .
        docker tag {{projectName}}:\$\{{ steps.version.outputs.version }} {{projectName}}:latest
        
    - name: Push Docker image
      if: github.event_name == 'push'
      run: |
        echo "\$\{{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u \$\{{ github.actor }} --password-stdin
        docker tag {{projectName}}:\$\{{ steps.version.outputs.version }} ghcr.io/\$\{{ github.repository }}:{{projectName}}:\$\{{ steps.version.outputs.version }}
        docker tag {{projectName}}:latest ghcr.io/\$\{{ github.repository }}/{{projectName}}:latest
        docker push ghcr.io/\$\{{ github.repository }}/{{projectName}}:\$\{{ steps.version.outputs.version }}
        docker push ghcr.io/\$\{{ github.repository }}/{{projectName}}:latest
`;

        this.releaseWorkflowTemplate = Handlebars.compile(this.preprocessTemplate(releaseTemplate));

        const securityTemplate = `name: Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 8 * * 1' # Weekly on Monday

permissions:
  contents: read
  security-events: write

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - name: Dependency Review
        uses: actions/dependency-review-action@v3
        with:
          fail-on-severity: moderate
          
  codeql:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, typescript
        queries: security-and-quality
        
    - name: Autobuild
      uses: github/codeql-action/autobuild@v2
      
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      
  snyk:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: \$\{{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
        
  audit:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Audit dependencies
      run: |
        yarn audit --level moderate
        npm audit --production
        
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
        
    - name: TruffleHog OSS
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: \$\{{ github.event.repository.default_branch }}
        head: HEAD
        extra_args: --debug --only-verified
`;

        this.securityWorkflowTemplate = Handlebars.compile(this.preprocessTemplate(securityTemplate));

        const dependencyUpdateTemplate = `name: Dependency Updates

on:
  schedule:
    - cron: '0 3 * * 1' # Weekly on Monday at 3 AM
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        token: \$\{{ secrets.GITHUB_TOKEN }}
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Update dependencies
      run: |
        # Update minor and patch versions
        yarn upgrade --latest --pattern "^@eclipse-glsp/*"
        yarn upgrade --latest --pattern "^@theia/*"
        yarn upgrade --latest
        
    - name: Test updated dependencies
      run: |
        yarn install
        yarn lint
        yarn build
        yarn test
        
    - name: Create Pull Request
      uses: peter-evans/create-pull-request@v5
      with:
        token: \$\{{ secrets.GITHUB_TOKEN }}
        commit-message: 'chore: update dependencies'
        title: 'Automated dependency updates'
        body: |
          ## Automated Dependency Updates
          
          This PR contains automated dependency updates for the week.
          
          ### Changes
          - Updated @eclipse-glsp packages
          - Updated @theia packages  
          - Updated other dependencies to latest compatible versions
          
          ### Checklist
          - [ ] All tests pass
          - [ ] Build succeeds
          - [ ] No security vulnerabilities introduced
          - [ ] Manually tested core functionality
          
        branch: deps/automated-update
        delete-branch: true
        labels: dependencies, automated
        
  security-updates:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Check for security updates
      run: |
        yarn audit --json > audit.json || true
        
    - name: Apply security fixes
      run: |
        yarn audit fix --force || true
        
    - name: Create security PR if needed
      uses: peter-evans/create-pull-request@v5
      with:
        token: \$\{{ secrets.GITHUB_TOKEN }}
        commit-message: 'security: fix vulnerabilities'
        title: '🔒 Security: Fix vulnerabilities'
        body: |
          ## Security Updates
          
          This PR applies automated security fixes for known vulnerabilities.
          
          ⚠️ **Please review carefully** as forced updates may introduce breaking changes.
          
        branch: security/automated-fixes
        delete-branch: true
        labels: security, automated, priority
`;

        this.dependencyUpdateTemplate = Handlebars.compile(this.preprocessTemplate(dependencyUpdateTemplate));

        const nightlyBuildTemplate = `name: Nightly Build

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  nightly:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        ref: develop
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Install dependencies
      run: yarn install --frozen-lockfile
      
    - name: Set nightly version
      run: |
        VERSION=\$(node -p "require('./package.json').version")
        NIGHTLY_VERSION="\${VERSION}-nightly.\$(date +%Y%m%d)"
        npm version \$NIGHTLY_VERSION --no-git-tag-version
        echo "version=\$NIGHTLY_VERSION" >> \$GITHUB_ENV
        
    - name: Build
      run: yarn build:production
      
    - name: Run full test suite
      run: |
        yarn test --coverage
        yarn test:integration
        yarn test:e2e
        
    - name: Performance benchmarks
      run: |
        yarn benchmark
        
    - name: Bundle analysis
      run: |
        yarn analyze
        mkdir -p reports
        mv dist/report.html reports/bundle-analysis.html
        
    - name: Create nightly release
      uses: softprops/action-gh-release@v1
      with:
        tag_name: nightly-\$\{{ env.version }}
        name: Nightly Build \$\{{ env.version }}
        body: |
          ## Nightly Build
          
          **⚠️ This is an automated nightly build and may be unstable.**
          
          Version: \$\{{ env.version }}
          Commit: \$\{{ github.sha }}
          
          ### Test Results
          - ✅ Unit tests passed
          - ✅ Integration tests passed
          - ✅ E2E tests passed
          
        draft: false
        prerelease: true
        files: |
          dist/**/*.vsix
          reports/**/*
          
    - name: Cleanup old nightly releases
      uses: dev-drprasad/delete-older-releases@v0.2.1
      with:
        keep_latest: 5
        delete_tag_pattern: nightly
      env:
        GITHUB_TOKEN: \$\{{ secrets.GITHUB_TOKEN }}
        
  performance-regression:
    runs-on: ubuntu-latest
    needs: nightly
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 18
        
    - name: Install Yarn 1.22
      run: npm install -g yarn@1.22.19
      
    - name: Run performance tests
      run: |
        yarn install --frozen-lockfile
        yarn build
        yarn perf:test
        
    - name: Compare with baseline
      run: |
        yarn perf:compare
        
    - name: Comment on PR if regression
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '⚠️ Performance regression detected in nightly build. Please review the benchmark results.'
          })
`;

        this.nightlyBuildTemplate = Handlebars.compile(this.preprocessTemplate(nightlyBuildTemplate));
    }
    
    private registerHelpers(): void {
        Handlebars.registerHelper('json', (context: any) => {
            return JSON.stringify(context, null, 2);
        });
    }
    
    private restoreGitHubExpressions(template: string): string {
        // Restore the GitHub Actions expression syntax
        return template.replace(/___GH_EXPR_START___/g, '${{');
    }
    
    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: WorkflowGeneratorOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateBuildWorkflow: true,
            generateReleaseWorkflow: true,
            generateSecurityWorkflow: true,
            generateDependencyUpdateWorkflow: true,
            generateNightlyWorkflow: true,
            nodeVersions: ['16.x', '18.x', '20.x'],
            platforms: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
            includeE2ETests: true,
            includeCoverage: true,
            coverageThreshold: 80,
            publishToNpm: true,
            publishToOpenVsx: true,
            ...options
        };
        
        const generatedFiles: string[] = [];
        
        // Create .github/workflows directory
        const workflowsDir = path.join(outputDir, '.github', 'workflows');
        await fs.ensureDir(workflowsDir);
        
        // Generate build workflow
        if (opts.generateBuildWorkflow) {
            const buildPath = path.join(workflowsDir, 'build.yml');
            const content = this.generateBuildWorkflow(grammar, config, opts);
            await fs.writeFile(buildPath, content);
            generatedFiles.push(buildPath);
        }
        
        // Generate release workflow
        if (opts.generateReleaseWorkflow) {
            const releasePath = path.join(workflowsDir, 'release.yml');
            const content = this.generateReleaseWorkflow(grammar, config, opts);
            await fs.writeFile(releasePath, content);
            generatedFiles.push(releasePath);
        }
        
        // Generate security workflow
        if (opts.generateSecurityWorkflow) {
            const securityPath = path.join(workflowsDir, 'security.yml');
            const content = this.generateSecurityWorkflow(grammar, config, opts);
            await fs.writeFile(securityPath, content);
            generatedFiles.push(securityPath);
        }
        
        // Generate dependency update workflow
        if (opts.generateDependencyUpdateWorkflow) {
            const depsPath = path.join(workflowsDir, 'dependencies.yml');
            const content = this.generateDependencyUpdateWorkflow(grammar, config, opts);
            await fs.writeFile(depsPath, content);
            generatedFiles.push(depsPath);
        }
        
        // Generate nightly build workflow
        if (opts.generateNightlyWorkflow) {
            const nightlyPath = path.join(workflowsDir, 'nightly.yml');
            const content = this.generateNightlyWorkflow(grammar, config, opts);
            await fs.writeFile(nightlyPath, content);
            generatedFiles.push(nightlyPath);
        }
        
        return generatedFiles;
    }
    
    private generateBuildWorkflow(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        options: WorkflowGeneratorOptions
    ): string {
        const data = {
            projectName: grammar.projectName,
            platforms: options.platforms,
            nodeVersions: options.nodeVersions,
            includeE2ETests: options.includeE2ETests,
            includeCoverage: options.includeCoverage,
            coverageThreshold: options.coverageThreshold,
            excludeWindows: options.platforms?.includes('windows-latest') && options.nodeVersions?.includes('16.x')
        };
        
        // Generate the template
        const result = this.buildWorkflowTemplate(data);
        
        // Post-process to replace GitHub Actions placeholders
        return this.restoreGitHubExpressions(result);
    }
    
    private generateReleaseWorkflow(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        options: WorkflowGeneratorOptions
    ): string {
        const data = {
            projectName: grammar.projectName,
            publishToNpm: options.publishToNpm,
            publishToOpenVsx: options.publishToOpenVsx
        };
        
        // Generate the template
        const result = this.releaseWorkflowTemplate(data);
        
        // Post-process to replace GitHub Actions placeholders
        return this.restoreGitHubExpressions(result);
    }
    
    private generateSecurityWorkflow(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        options: WorkflowGeneratorOptions
    ): string {
        // Generate the template
        const result = this.securityWorkflowTemplate({
            projectName: grammar.projectName
        });
        
        // Post-process to replace GitHub Actions placeholders
        return this.restoreGitHubExpressions(result);
    }
    
    private generateDependencyUpdateWorkflow(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        options: WorkflowGeneratorOptions
    ): string {
        // Generate the template
        const result = this.dependencyUpdateTemplate({
            projectName: grammar.projectName
        });
        
        // Post-process to replace GitHub Actions placeholders
        return this.restoreGitHubExpressions(result);
    }
    
    private generateNightlyWorkflow(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        options: WorkflowGeneratorOptions
    ): string {
        // Generate the template
        const result = this.nightlyBuildTemplate({
            projectName: grammar.projectName
        });
        
        // Post-process to replace GitHub Actions placeholders
        return this.restoreGitHubExpressions(result);
    }
}