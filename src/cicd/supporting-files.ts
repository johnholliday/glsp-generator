import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import Handlebars from 'handlebars';

export interface SupportingFilesOptions {
    generateNpmIgnore?: boolean;
    generateVscodeIgnore?: boolean;
    generateChangelog?: boolean;
    generateContributing?: boolean;
    generateIssueTemplates?: boolean;
    generatePullRequestTemplate?: boolean;
    generateCodeOfConduct?: boolean;
    generateSecurity?: boolean;
    generateDockerfile?: boolean;
    generateDependabot?: boolean;
}

export class SupportingFilesGenerator {
    private npmIgnoreTemplate!: HandlebarsTemplateDelegate;
    private vscodeIgnoreTemplate!: HandlebarsTemplateDelegate;
    private changelogTemplate!: HandlebarsTemplateDelegate;
    private contributingTemplate!: HandlebarsTemplateDelegate;
    private bugReportTemplate!: HandlebarsTemplateDelegate;
    private featureRequestTemplate!: HandlebarsTemplateDelegate;
    private pullRequestTemplate!: HandlebarsTemplateDelegate;
    private codeOfConductTemplate!: HandlebarsTemplateDelegate;
    private securityTemplate!: HandlebarsTemplateDelegate;
    private dockerfileTemplate!: HandlebarsTemplateDelegate;
    private dependabotTemplate!: HandlebarsTemplateDelegate;
    
    constructor() {
        this.loadTemplates();
    }
    
    private loadTemplates(): void {
        this.npmIgnoreTemplate = Handlebars.compile(`# Source files
src/
scripts/
test/
tests/
*.test.ts
*.spec.ts

# Development files
.github/
.vscode/
.idea/
*.log
*.tgz
.DS_Store
Thumbs.db

# Config files
.eslintrc*
.prettierrc*
jest.config.*
tsconfig.json
tsconfig.*.json
webpack.config.*
rollup.config.*
*.config.js
*.config.ts

# Documentation source
docs/src/
*.md
!README.md
!LICENSE.md

# Build artifacts
*.map
coverage/
.nyc_output/
reports/
dist/**/*.test.*
dist/**/*.spec.*

# CI/CD
.travis.yml
.gitlab-ci.yml
azure-pipelines.yml
Jenkinsfile
Dockerfile
docker-compose.yml

# Examples and templates
examples/
templates/
fixtures/

# Misc
.env*
.npmrc
yarn.lock
package-lock.json
pnpm-lock.yaml
`);

        this.vscodeIgnoreTemplate = Handlebars.compile(`# Ignore everything by default
**

# Include specific files for VS Code extension
!package.json
!package.nls.json
!README.md
!CHANGELOG.md
!LICENSE
!icon.png
!images/**

# Include compiled output
!lib/**
!dist/**
!out/**

# Exclude test files
**/*.test.js
**/*.spec.js
**/*.test.d.ts
**/*.spec.d.ts
**/test/**
**/tests/**

# Exclude source maps
**/*.map

# Exclude source files
src/**
*.ts
!*.d.ts

# Exclude development files
.vscode/**
.github/**
.gitignore
.eslintrc*
.prettierrc*
tsconfig.json
webpack.config.js
`);

        this.changelogTemplate = Handlebars.compile(`# Changelog

All notable changes to {{projectName}} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of {{projectName}}
- Support for {{projectName}} language in Theia
- GLSP-based graphical editor
- Model validation and type checking
- Auto-layout support
- Property panel for element editing

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

## [0.1.0] - {{currentDate}}

### Added
- Initial project setup
- Basic language support
- GLSP server implementation
- Theia extension integration

[Unreleased]: https://github.com/{{githubOrg}}/{{projectName}}/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/{{githubOrg}}/{{projectName}}/releases/tag/v0.1.0
`);

        this.contributingTemplate = Handlebars.compile(`# Contributing to {{projectName}}

Thank you for your interest in contributing to {{projectName}}! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Issues

- Check if the issue already exists
- Use the issue templates when available
- Provide detailed reproduction steps
- Include error messages and logs
- Specify your environment (OS, Node version, etc.)

### Suggesting Features

- Check if already requested
- Use the feature request template
- Explain the use case
- Consider implementation complexity

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

3. **Make your changes**
   - Follow the coding standards
   - Add/update tests
   - Update documentation

4. **Commit your changes**
   - Use [Conventional Commits](https://www.conventionalcommits.org/)
   - Examples:
     - \`feat: add new validation rule\`
     - \`fix: resolve connection issue\`
     - \`docs: update API documentation\`

5. **Run tests**
   \`\`\`bash
   yarn test
   yarn lint
   yarn build
   \`\`\`

6. **Push and create PR**
   - Fill out the PR template
   - Link related issues
   - Request reviews

## Development Setup

### Prerequisites

- Node.js {{nodeVersion}} or higher
- Yarn 1.22.x
- Git

### Setup

1. Clone your fork
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/{{projectName}}.git
   cd {{projectName}}
   \`\`\`

2. Install dependencies
   \`\`\`bash
   yarn install
   \`\`\`

3. Build the project
   \`\`\`bash
   yarn build
   \`\`\`

4. Run tests
   \`\`\`bash
   yarn test
   \`\`\`

### Development Workflow

- \`yarn dev\` - Start development mode with watch
- \`yarn test:watch\` - Run tests in watch mode
- \`yarn lint:fix\` - Auto-fix linting issues
- \`yarn format\` - Format code with Prettier

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types
- Document public APIs with JSDoc
- Use meaningful variable names

### Testing

- Write tests for new features
- Maintain >{{coverageThreshold}}% code coverage
- Use descriptive test names
- Test edge cases

### Git Workflow

- Keep commits focused and atomic
- Write clear commit messages
- Rebase on main before merging
- Squash commits when appropriate

## Release Process

Releases are automated through GitHub Actions when tags are pushed.

### Version Numbers

We follow Semantic Versioning:
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

## Questions?

- Open a [Discussion](https://github.com/{{githubOrg}}/{{projectName}}/discussions)
- Join our [Discord/Slack](#)
- Email: {{contactEmail}}

Thank you for contributing! 🎉
`);

        this.bugReportTemplate = Handlebars.compile(`---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug, needs-triage
assignees: ''
---

## Bug Description
A clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. Windows 10, macOS 12.0, Ubuntu 20.04]
- Node Version: [e.g. 18.17.0]
- {{projectName}} Version: [e.g. 1.0.0]
- Theia Version: [e.g. 1.42.0]
- Browser: [e.g. Chrome 118, Firefox 119]

## Error Logs
\`\`\`
Paste any error messages here
\`\`\`

## Additional Context
Add any other context about the problem here.

## Possible Solution
If you have suggestions on how to fix the bug, please describe them here.
`);

        this.featureRequestTemplate = Handlebars.compile(`---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement, needs-triage
assignees: ''
---

## Feature Description
A clear and concise description of the feature you'd like.

## Use Case
Describe the use case or problem this feature would solve.

## Proposed Solution
Describe how you envision this feature working.

## Alternatives Considered
Describe any alternative solutions or features you've considered.

## Additional Context
Add any other context, mockups, or examples about the feature request here.

## Implementation Ideas
If you have ideas on how to implement this feature, please share them.

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3
`);

        this.pullRequestTemplate = Handlebars.compile(`## Description
Brief description of what this PR does.

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)
Add screenshots to help reviewers understand the changes.

## Additional Notes
Any additional information that might be helpful for reviewers.
`);

        this.codeOfConductTemplate = Handlebars.compile(`# Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, caste, color, religion, or sexual
identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior:

* The use of sexualized language or imagery, and sexual attention or advances
* Trolling, insulting or derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information without explicit permission
* Other conduct which could reasonably be considered inappropriate

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
{{contactEmail}}.

All complaints will be reviewed and investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
[https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html
`);

        this.securityTemplate = Handlebars.compile(`# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| {{majorVersion}}.x.x   | :white_check_mark: |
| < {{majorVersion}}.0   | :x:                |

## Reporting a Vulnerability

We take the security of {{projectName}} seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:
- Open a public issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:
- Email us at {{securityEmail}}
- Include detailed steps to reproduce
- Include the impact of the vulnerability
- Suggest a fix if you have one

### What to expect:
1. **Acknowledgment**: Within 48 hours
2. **Initial Assessment**: Within 1 week
3. **Status Updates**: Every week until resolved
4. **Fix Timeline**: Depends on severity
   - Critical: 1-7 days
   - High: 1-2 weeks
   - Medium: 2-4 weeks
   - Low: Next release

### After the fix:
- We will notify you when the fix is released
- Credit will be given (unless you prefer to remain anonymous)
- A security advisory will be published

## Security Best Practices

When using {{projectName}}:

1. **Keep dependencies updated**
   \`\`\`bash
   yarn audit
   yarn upgrade
   \`\`\`

2. **Use environment variables for secrets**
   Never commit sensitive data to the repository

3. **Enable security features**
   - Use HTTPS in production
   - Enable CORS appropriately
   - Validate all inputs

4. **Monitor security advisories**
   - Watch this repository
   - Subscribe to security notifications

## Security Features

{{projectName}} includes:
- Input validation
- XSS protection
- CSRF protection (when applicable)
- Secure defaults
- Regular dependency updates

Thank you for helping keep {{projectName}} and its users safe!
`);

        this.dockerfileTemplate = Handlebars.compile(`# Build stage
FROM node:{{nodeVersion}}-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy source and build
COPY . .
RUN yarn build

# Remove dev dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Runtime stage
FROM node:{{nodeVersion}}-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/lib ./lib
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 5007

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "lib/backend/main.js", "--hostname=0.0.0.0"]
`);

        this.dependabotTemplate = Handlebars.compile(`version: 2
updates:
  # NPM dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    open-pull-requests-limit: 10
    reviewers:
      - "{{githubOrg}}/maintainers"
    labels:
      - "dependencies"
      - "npm"
    groups:
      theia:
        patterns:
          - "@theia/*"
      glsp:
        patterns:
          - "@eclipse-glsp/*"
      dev-dependencies:
        dependency-type: "development"
        
  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    reviewers:
      - "{{githubOrg}}/maintainers"
    labels:
      - "dependencies"
      - "github-actions"
      
  # Docker dependencies
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "{{githubOrg}}/maintainers"
    labels:
      - "dependencies"
      - "docker"
`);
    }
    
    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: SupportingFilesOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateNpmIgnore: true,
            generateVscodeIgnore: true,
            generateChangelog: true,
            generateContributing: true,
            generateIssueTemplates: true,
            generatePullRequestTemplate: true,
            generateCodeOfConduct: true,
            generateSecurity: true,
            generateDockerfile: true,
            generateDependabot: true,
            ...options
        };
        
        const generatedFiles: string[] = [];
        const templateData = {
            projectName: grammar.projectName,
            githubOrg: 'your-org', // TODO: Make configurable
            contactEmail: 'contact@example.com',
            securityEmail: 'security@example.com',
            nodeVersion: '18',
            majorVersion: '1',
            coverageThreshold: 80,
            currentDate: new Date().toISOString().split('T')[0]
        };
        
        // Generate .npmignore
        if (opts.generateNpmIgnore) {
            const npmIgnorePath = path.join(outputDir, '.npmignore');
            const content = this.npmIgnoreTemplate({});
            await fs.writeFile(npmIgnorePath, content);
            generatedFiles.push(npmIgnorePath);
        }
        
        // Generate .vscodeignore
        if (opts.generateVscodeIgnore) {
            const vscodeIgnorePath = path.join(outputDir, '.vscodeignore');
            const content = this.vscodeIgnoreTemplate({});
            await fs.writeFile(vscodeIgnorePath, content);
            generatedFiles.push(vscodeIgnorePath);
        }
        
        // Generate CHANGELOG.md
        if (opts.generateChangelog) {
            const changelogPath = path.join(outputDir, 'CHANGELOG.md');
            const content = this.changelogTemplate(templateData);
            await fs.writeFile(changelogPath, content);
            generatedFiles.push(changelogPath);
        }
        
        // Generate CONTRIBUTING.md
        if (opts.generateContributing) {
            const contributingPath = path.join(outputDir, 'CONTRIBUTING.md');
            const content = this.contributingTemplate(templateData);
            await fs.writeFile(contributingPath, content);
            generatedFiles.push(contributingPath);
        }
        
        // Generate issue templates
        if (opts.generateIssueTemplates) {
            const issueTemplatesDir = path.join(outputDir, '.github', 'ISSUE_TEMPLATE');
            await fs.ensureDir(issueTemplatesDir);
            
            const bugReportPath = path.join(issueTemplatesDir, 'bug_report.md');
            const bugContent = this.bugReportTemplate(templateData);
            await fs.writeFile(bugReportPath, bugContent);
            generatedFiles.push(bugReportPath);
            
            const featureRequestPath = path.join(issueTemplatesDir, 'feature_request.md');
            const featureContent = this.featureRequestTemplate(templateData);
            await fs.writeFile(featureRequestPath, featureContent);
            generatedFiles.push(featureRequestPath);
        }
        
        // Generate pull request template
        if (opts.generatePullRequestTemplate) {
            const prTemplatePath = path.join(outputDir, '.github', 'pull_request_template.md');
            await fs.ensureDir(path.dirname(prTemplatePath));
            const content = this.pullRequestTemplate(templateData);
            await fs.writeFile(prTemplatePath, content);
            generatedFiles.push(prTemplatePath);
        }
        
        // Generate CODE_OF_CONDUCT.md
        if (opts.generateCodeOfConduct) {
            const cocPath = path.join(outputDir, 'CODE_OF_CONDUCT.md');
            const content = this.codeOfConductTemplate(templateData);
            await fs.writeFile(cocPath, content);
            generatedFiles.push(cocPath);
        }
        
        // Generate SECURITY.md
        if (opts.generateSecurity) {
            const securityPath = path.join(outputDir, 'SECURITY.md');
            const content = this.securityTemplate(templateData);
            await fs.writeFile(securityPath, content);
            generatedFiles.push(securityPath);
        }
        
        // Generate Dockerfile
        if (opts.generateDockerfile) {
            const dockerfilePath = path.join(outputDir, 'Dockerfile');
            const content = this.dockerfileTemplate(templateData);
            await fs.writeFile(dockerfilePath, content);
            generatedFiles.push(dockerfilePath);
            
            // Also generate .dockerignore
            const dockerignorePath = path.join(outputDir, '.dockerignore');
            const dockerignoreContent = `node_modules
.git
.github
coverage
dist
*.log
.env*
test
tests
docs
.vscode
.idea
`;
            await fs.writeFile(dockerignorePath, dockerignoreContent);
            generatedFiles.push(dockerignorePath);
        }
        
        // Generate Dependabot config
        if (opts.generateDependabot) {
            const dependabotPath = path.join(outputDir, '.github', 'dependabot.yml');
            await fs.ensureDir(path.dirname(dependabotPath));
            const content = this.dependabotTemplate(templateData);
            await fs.writeFile(dependabotPath, content);
            generatedFiles.push(dependabotPath);
        }
        
        return generatedFiles;
    }
}