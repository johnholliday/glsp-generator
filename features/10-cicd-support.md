# CI/CD Support Feature

## Overview
The CI/CD Support feature generates comprehensive continuous integration and deployment configurations for GLSP extensions, including GitHub Actions workflows, GitLab CI pipelines, release automation, and Docker support.

## Purpose
- Automate build, test, and deployment processes
- Ensure code quality through CI checks
- Streamline release management
- Support multiple CI/CD platforms
- Enable containerized deployments

## Current Implementation

### Components

#### 1. **Workflow Generator** (`src/cicd/workflow-generator.ts`)
- Creates CI/CD pipeline configurations
- Generates platform-specific workflows
- Configures build matrices
- Sets up deployment stages

#### 2. **Release Scripts** (`src/cicd/release-scripts.ts`)
- Automated version bumping
- Changelog generation
- Release note creation
- Tag management
- Package publishing

#### 3. **Supporting Files** (`src/cicd/supporting-files.ts`)
- Dockerfile generation
- Docker Compose configs
- Build scripts
- Deployment configurations
- Environment templates

### Generated CI/CD Structure
```
.github/
├── workflows/
│   ├── ci.yml              # Main CI workflow
│   ├── release.yml         # Release workflow
│   ├── nightly.yml         # Nightly builds
│   └── security.yml        # Security scanning
├── actions/
│   └── setup-environment/  # Custom actions
└── dependabot.yml          # Dependency updates

.gitlab/
├── .gitlab-ci.yml          # GitLab CI pipeline
└── ci/
    ├── scripts/            # CI scripts
    └── templates/          # Job templates

scripts/
├── release.sh              # Release script
├── version.sh              # Version management
└── publish.sh              # Publishing script

docker/
├── Dockerfile              # Container image
├── docker-compose.yml      # Compose config
└── .dockerignore          # Ignore file
```

## Generated Workflow Examples

### GitHub Actions CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18.x'
  YARN_VERSION: '1.22.x'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup Yarn
        run: npm install -g yarn@${{ env.YARN_VERSION }}
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            node_modules
            .yarn/cache
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Run linter
        run: yarn lint
        
      - name: Check types
        run: yarn typecheck

  test:
    name: Test - ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [16.x, 18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Run tests
        run: yarn test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: ${{ matrix.os }}-node${{ matrix.node }}

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup environment
        uses: ./.github/actions/setup-environment
        
      - name: Build extension
        run: yarn build
        
      - name: Build Docker image
        run: docker build -t my-dsl-glsp:${{ github.sha }} .
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            dist/
            lib/
            
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run security audit
        run: yarn audit --level moderate
        
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Release Workflow
```yaml
# .github/workflows/release.yml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (major|minor|patch)'
        required: true
        default: 'patch'

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0
          
      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          registry-url: 'https://registry.npmjs.org'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Run tests
        run: yarn test
        
      - name: Bump version
        run: |
          yarn version ${{ github.event.inputs.version }}
          echo "VERSION=$(node -p "require('./package.json').version")" >> $GITHUB_ENV
          
      - name: Generate changelog
        run: yarn changelog
        
      - name: Build package
        run: yarn build
        
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ env.VERSION }}
          name: Release v${{ env.VERSION }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false
          
      - name: Publish to NPM
        run: yarn publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          
      - name: Publish to Open VSX
        run: yarn ovsx publish
        env:
          OVSX_TOKEN: ${{ secrets.OVSX_TOKEN }}
```

### GitLab CI Pipeline
```yaml
# .gitlab-ci.yml
stages:
  - prepare
  - quality
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  YARN_CACHE_FOLDER: "$CI_PROJECT_DIR/.yarn-cache"

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .yarn-cache/

before_script:
  - apt-get update -qq && apt-get install -y -qq git
  - curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  - export NVM_DIR="$HOME/.nvm"
  - source "$NVM_DIR/nvm.sh"
  - nvm install $NODE_VERSION
  - npm install -g yarn@1.22.x

install:
  stage: prepare
  script:
    - yarn install --frozen-lockfile --cache-folder $YARN_CACHE_FOLDER
  artifacts:
    paths:
      - node_modules/

lint:
  stage: quality
  needs: ["install"]
  script:
    - yarn lint
    - yarn typecheck

test:unit:
  stage: test
  needs: ["install"]
  script:
    - yarn test:unit --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test:integration:
  stage: test
  needs: ["install"]
  script:
    - yarn test:integration

build:
  stage: build
  needs: ["test:unit", "test:integration"]
  script:
    - yarn build
  artifacts:
    paths:
      - dist/
      - lib/
    expire_in: 1 week

build:docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
    - tags

deploy:staging:
  stage: deploy
  needs: ["build:docker"]
  script:
    - echo "Deploying to staging..."
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/lib ./lib

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/server.js"]
```

## Usage Examples

### CLI CI/CD Generation
```bash
# Generate CI/CD for all platforms
glsp-generator cicd --all

# Generate for specific platforms
glsp-generator cicd --github --gitlab

# With custom configuration
glsp-generator cicd \
  --node-versions "16,18,20" \
  --platforms "ubuntu,windows,macos" \
  --publish-npm \
  --docker
```

### Configuration
```json
{
  "cicd": {
    "platforms": ["github", "gitlab"],
    "nodejs": {
      "versions": ["16.x", "18.x", "20.x"],
      "packageManager": "yarn"
    },
    "testing": {
      "coverage": {
        "threshold": 80,
        "reports": ["lcov", "cobertura"]
      },
      "platforms": ["ubuntu-latest", "windows-latest", "macos-latest"]
    },
    "release": {
      "branches": ["main"],
      "automated": true,
      "changelogGenerator": "conventional-changelog",
      "npm": {
        "publish": true,
        "access": "public"
      },
      "github": {
        "releases": true,
        "assets": ["dist/*.vsix"]
      }
    },
    "docker": {
      "enabled": true,
      "registry": "docker.io",
      "baseImage": "node:18-alpine"
    },
    "security": {
      "scanning": true,
      "audit": true,
      "snyk": true
    }
  }
}
```

## Advanced Features

### Matrix Testing
```yaml
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        node: 18.x
        electron: 22
      - os: windows-latest
        node: 18.x
        electron: 22
      - os: macos-latest
        node: 18.x
        electron: 22
```

### Deployment Strategies
```yaml
# Blue-green deployment
deploy:production:
  script:
    - ./scripts/deploy.sh blue-green
  environment:
    name: production
    url: https://app.example.com
  when: manual
  only:
    - tags
```

### Secret Management
```yaml
# GitHub Actions secrets
env:
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
  DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
  SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## Best Practices
1. **Fast Feedback**: Run quick checks first
2. **Parallel Jobs**: Maximize parallelization
3. **Cache Dependencies**: Cache node_modules
4. **Matrix Testing**: Test multiple environments
5. **Security Scanning**: Include security checks

## Future Enhancements
1. **Kubernetes Configs**: K8s deployment manifests
2. **Terraform Scripts**: Infrastructure as code
3. **Multi-Cloud**: AWS/Azure/GCP deployment
4. **Monitoring**: Observability configuration
5. **A/B Testing**: Feature flag integration

## Dependencies
- `@actions/core`: GitHub Actions toolkit
- `semantic-release`: Automated versioning
- `conventional-changelog`: Changelog generation
- `docker`: Container support

## Testing
- Workflow syntax validation
- Pipeline simulation tests
- Script execution tests
- Docker build tests
- Deployment verification

## Related Features
- [Test Generation](./08-test-generation.md)
- [Configuration System](./04-configuration.md)
- [Release Management](./16-release-management.md)