import fs from 'fs-extra';
import path from 'path';
import { ParsedGrammar } from '../types/grammar.js';
import { GLSPConfig } from '../config/types.js';
import Handlebars from 'handlebars';

export interface ReleaseScriptsOptions {
    generateVersionScripts?: boolean;
    generateChangelogScripts?: boolean;
    generatePublishScripts?: boolean;
    generateReleaseScript?: boolean;
    conventionalCommits?: boolean;
    semanticRelease?: boolean;
}

export class ReleaseScriptsGenerator {
    private versionScriptTemplate!: HandlebarsTemplateDelegate;
    private changelogScriptTemplate!: HandlebarsTemplateDelegate;
    private publishScriptTemplate!: HandlebarsTemplateDelegate;
    private releaseScriptTemplate!: HandlebarsTemplateDelegate;
    private semanticReleaseConfigTemplate!: HandlebarsTemplateDelegate;

    constructor() {
        this.loadTemplates();
    }

    private loadTemplates(): void {
        this.versionScriptTemplate = Handlebars.compile(`#!/usr/bin/env node
/**
 * Version management script for {{projectName}}
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // major, minor, patch, or specific version

function getCurrentVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
}

function updateVersion(newVersion) {
    // Update package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\\n');
    
    // Update other files that contain version
    const filesToUpdate = [
        'src/common/version.ts',
        'README.md',
        'docs/README.md'
    ];
    
    filesToUpdate.forEach(file => {
        if (fs.existsSync(file)) {
            let content = fs.readFileSync(file, 'utf8');
            content = content.replace(/\\d+\\.\\d+\\.\\d+/g, newVersion);
            fs.writeFileSync(file, content);
        }
    });
}

function createVersionCommit(version) {
    execSync('git add -A');
    execSync(\`git commit -m "chore: release v\${version}"\`);
    execSync(\`git tag -a v\${version} -m "Release version \${version}"\`);
}

try {
    const currentVersion = getCurrentVersion();
    let newVersion;
    
    if (semver.valid(versionType)) {
        // Specific version provided
        newVersion = versionType;
    } else {
        // Increment version
        newVersion = semver.inc(currentVersion, versionType);
    }
    
    if (!newVersion) {
        console.error('Invalid version type:', versionType);
        process.exit(1);
    }
    
    console.log(\`Updating version from \${currentVersion} to \${newVersion}\`);
    
    updateVersion(newVersion);
    createVersionCommit(newVersion);
    
    console.log(\`✅ Version updated to \${newVersion}\`);
    console.log('Run "git push --follow-tags" to push the changes and tag');
    
} catch (error) {
    console.error('❌ Version update failed:', error.message);
    process.exit(1);
}
`);

        this.changelogScriptTemplate = Handlebars.compile(`#!/usr/bin/env node
/**
 * Changelog generation script for {{projectName}}
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHANGELOG_FILE = 'CHANGELOG.md';
const UNRELEASED_FILE = 'UNRELEASED.md';

function getLatestTag() {
    try {
        return execSync('git describe --tags --abbrev=0').toString().trim();
    } catch {
        return null;
    }
}

function getCommitsSinceTag(tag) {
    const cmd = tag 
        ? \`git log \${tag}..HEAD --pretty=format:"%h %s"\`
        : 'git log --pretty=format:"%h %s"';
    
    return execSync(cmd).toString().trim().split('\\n').filter(Boolean);
}

function categorizeCommits(commits) {
    const categories = {
        breaking: [],
        features: [],
        fixes: [],
        performance: [],
        refactor: [],
        docs: [],
        tests: [],
        chore: [],
        other: []
    };
    
    commits.forEach(commit => {
        const [hash, ...messageParts] = commit.split(' ');
        const message = messageParts.join(' ');
        
        if (message.includes('BREAKING CHANGE:') || message.includes('!:')) {
            categories.breaking.push({ hash, message });
        } else if (message.startsWith('feat:') || message.startsWith('feature:')) {
            categories.features.push({ hash, message });
        } else if (message.startsWith('fix:') || message.startsWith('bugfix:')) {
            categories.fixes.push({ hash, message });
        } else if (message.startsWith('perf:')) {
            categories.performance.push({ hash, message });
        } else if (message.startsWith('refactor:')) {
            categories.refactor.push({ hash, message });
        } else if (message.startsWith('docs:')) {
            categories.docs.push({ hash, message });
        } else if (message.startsWith('test:') || message.startsWith('tests:')) {
            categories.tests.push({ hash, message });
        } else if (message.startsWith('chore:')) {
            categories.chore.push({ hash, message });
        } else {
            categories.other.push({ hash, message });
        }
    });
    
    return categories;
}

function generateChangelogEntry(version, date, categories) {
    let entry = \`## [\${version}] - \${date}\\n\\n\`;
    
    if (categories.breaking.length > 0) {
        entry += '### ⚠️ BREAKING CHANGES\\n\\n';
        categories.breaking.forEach(({ hash, message }) => {
            entry += \`- \${message} (\${hash})\\n\`;
        });
        entry += '\\n';
    }
    
    if (categories.features.length > 0) {
        entry += '### ✨ Features\\n\\n';
        categories.features.forEach(({ hash, message }) => {
            entry += \`- \${message} (\${hash})\\n\`;
        });
        entry += '\\n';
    }
    
    if (categories.fixes.length > 0) {
        entry += '### 🐛 Bug Fixes\\n\\n';
        categories.fixes.forEach(({ hash, message }) => {
            entry += \`- \${message} (\${hash})\\n\`;
        });
        entry += '\\n';
    }
    
    if (categories.performance.length > 0) {
        entry += '### ⚡ Performance\\n\\n';
        categories.performance.forEach(({ hash, message }) => {
            entry += \`- \${message} (\${hash})\\n\`;
        });
        entry += '\\n';
    }
    
    return entry;
}

function updateChangelog(entry) {
    let changelog = '';
    
    if (fs.existsSync(CHANGELOG_FILE)) {
        changelog = fs.readFileSync(CHANGELOG_FILE, 'utf8');
    } else {
        changelog = \`# Changelog\\n\\nAll notable changes to {{projectName}} will be documented in this file.\\n\\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\\n\\n\`;
    }
    
    // Insert new entry after the header
    const lines = changelog.split('\\n');
    let insertIndex = lines.findIndex(line => line.startsWith('## '));
    if (insertIndex === -1) insertIndex = lines.length;
    
    lines.splice(insertIndex, 0, entry);
    
    fs.writeFileSync(CHANGELOG_FILE, lines.join('\\n'));
}

try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    const date = new Date().toISOString().split('T')[0];
    const latestTag = getLatestTag();
    
    console.log('Generating changelog for version', version);
    
    const commits = getCommitsSinceTag(latestTag);
    const categories = categorizeCommits(commits);
    const entry = generateChangelogEntry(version, date, categories);
    
    updateChangelog(entry);
    
    // Clear unreleased file
    if (fs.existsSync(UNRELEASED_FILE)) {
        fs.writeFileSync(UNRELEASED_FILE, '# Unreleased\\n\\n');
    }
    
    console.log('✅ Changelog updated successfully');
    
} catch (error) {
    console.error('❌ Changelog generation failed:', error.message);
    process.exit(1);
}
`);

        this.publishScriptTemplate = Handlebars.compile(`#!/usr/bin/env node
/**
 * Publishing script for {{projectName}}
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipTests = args.includes('--skip-tests');

function runCommand(cmd, options = {}) {
    console.log(\`Running: \${cmd}\`);
    if (!dryRun) {
        return execSync(cmd, { stdio: 'inherit', ...options });
    }
}

function checkPrerequisites() {
    // Check if on main branch
    const branch = execSync('git branch --show-current').toString().trim();
    if (branch !== 'main' && !args.includes('--force')) {
        throw new Error('Must be on main branch to publish (use --force to override)');
    }
    
    // Check for uncommitted changes
    const status = execSync('git status --porcelain').toString().trim();
    if (status && !args.includes('--force')) {
        throw new Error('Uncommitted changes detected (use --force to override)');
    }
    
    // Check if tag exists
    const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
    try {
        execSync(\`git rev-parse v\${version}\`);
    } catch {
        throw new Error(\`Tag v\${version} does not exist. Run version script first.\`);
    }
}

async function publish() {
    try {
        console.log('🚀 Starting publish process...');
        
        // Check prerequisites
        checkPrerequisites();
        
        // Clean and install
        console.log('\\n📦 Installing dependencies...');
        runCommand('yarn install --frozen-lockfile');
        
        // Run tests
        if (!skipTests) {
            console.log('\\n🧪 Running tests...');
            runCommand('yarn test');
            runCommand('yarn lint');
        }
        
        // Build
        console.log('\\n🔨 Building...');
        runCommand('yarn build:production');
        
        // Publish to npm
        if (!args.includes('--skip-npm')) {
            console.log('\\n📤 Publishing to npm...');
            runCommand(\`npm publish \${dryRun ? '--dry-run' : ''}\`);
        }
        
        // Publish to Open VSX
        if (!args.includes('--skip-ovsx') && fs.existsSync('.vscodeignore')) {
            console.log('\\n📤 Publishing to Open VSX...');
            runCommand(\`npx ovsx publish \${dryRun ? '--dry-run' : ''}\`);
        }
        
        // Push tags
        if (!dryRun) {
            console.log('\\n📤 Pushing tags...');
            runCommand('git push --follow-tags');
        }
        
        console.log('\\n✅ Publishing completed successfully!');
        
    } catch (error) {
        console.error('\\n❌ Publishing failed:', error.message);
        process.exit(1);
    }
}

// Show help
if (args.includes('--help')) {
    console.log(\`
Usage: node scripts/publish.js [options]

Options:
  --dry-run      Run without actually publishing
  --skip-tests   Skip running tests
  --skip-npm     Skip publishing to npm
  --skip-ovsx    Skip publishing to Open VSX
  --force        Force publish even with warnings
  --help         Show this help message
\`);
    process.exit(0);
}

publish();
`);

        this.releaseScriptTemplate = Handlebars.compile(`#!/usr/bin/env node
/**
 * Complete release script for {{projectName}}
 * Combines version update, changelog generation, and publishing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const versionType = args[0] || 'patch';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prompt(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

async function release() {
    try {
        console.log('🚀 Starting release process...');
        
        // Run version script
        console.log('\\n📝 Updating version...');
        execSync(\`node scripts/version.js \${versionType}\`, { stdio: 'inherit' });
        
        // Generate changelog
        console.log('\\n📝 Generating changelog...');
        execSync('node scripts/changelog.js', { stdio: 'inherit' });
        
        // Commit changelog
        execSync('git add CHANGELOG.md');
        execSync('git commit --amend --no-edit');
        
        // Get version
        const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
        
        // Confirm release
        const answer = await prompt(\`\\nReady to release v\${version}? (y/N) \`);
        if (answer.toLowerCase() !== 'y') {
            console.log('Release cancelled');
            process.exit(0);
        }
        
        // Run publish
        console.log('\\n📤 Publishing...');
        execSync('node scripts/publish.js', { stdio: 'inherit' });
        
        console.log(\`\\n✅ Released v\${version} successfully!\`);
        
    } catch (error) {
        console.error('\\n❌ Release failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

release();
`);

        this.semanticReleaseConfigTemplate = Handlebars.compile(`{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    ["@semantic-release/github", {
      "assets": [
        {"path": "dist/**/*.vsix", "label": "VS Code Extension"},
        {"path": "dist/**/*.tar.gz", "label": "Source Archive"}
      ]
    }],
    ["@semantic-release/git", {
      "assets": ["package.json", "CHANGELOG.md"],
      "message": "chore(release): \${nextRelease.version} [skip ci]\\n\\n\${nextRelease.notes}"
    }]
  ]
}
`);
    }

    async generate(
        grammar: ParsedGrammar,
        config: GLSPConfig,
        outputDir: string,
        options: ReleaseScriptsOptions = {}
    ): Promise<string[]> {
        const opts = {
            generateVersionScripts: true,
            generateChangelogScripts: true,
            generatePublishScripts: true,
            generateReleaseScript: true,
            conventionalCommits: true,
            semanticRelease: false,
            ...options
        };

        const generatedFiles: string[] = [];

        // Create scripts directory
        const scriptsDir = path.join(outputDir, 'scripts');
        await fs.ensureDir(scriptsDir);

        // Generate version script
        if (opts.generateVersionScripts) {
            const versionPath = path.join(scriptsDir, 'version.js');
            const content = this.versionScriptTemplate({
                projectName: grammar.projectName
            });
            await fs.writeFile(versionPath, content);
            await fs.chmod(versionPath, '755');
            generatedFiles.push(versionPath);
        }

        // Generate changelog script
        if (opts.generateChangelogScripts) {
            const changelogPath = path.join(scriptsDir, 'changelog.js');
            const content = this.changelogScriptTemplate({
                projectName: grammar.projectName
            });
            await fs.writeFile(changelogPath, content);
            await fs.chmod(changelogPath, '755');
            generatedFiles.push(changelogPath);
        }

        // Generate publish script
        if (opts.generatePublishScripts) {
            const publishPath = path.join(scriptsDir, 'publish.js');
            const content = this.publishScriptTemplate({
                projectName: grammar.projectName
            });
            await fs.writeFile(publishPath, content);
            await fs.chmod(publishPath, '755');
            generatedFiles.push(publishPath);
        }

        // Generate release script
        if (opts.generateReleaseScript) {
            const releasePath = path.join(scriptsDir, 'release.js');
            const content = this.releaseScriptTemplate({
                projectName: grammar.projectName
            });
            await fs.writeFile(releasePath, content);
            await fs.chmod(releasePath, '755');
            generatedFiles.push(releasePath);
        }

        // Generate semantic-release config if requested
        if (opts.semanticRelease) {
            const configPath = path.join(outputDir, '.releaserc.json');
            const content = this.semanticReleaseConfigTemplate({});
            await fs.writeFile(configPath, content);
            generatedFiles.push(configPath);
        }

        // Update package.json scripts
        await this.updatePackageJsonScripts(outputDir, opts);

        return generatedFiles;
    }

    private async updatePackageJsonScripts(outputDir: string, options: ReleaseScriptsOptions): Promise<void> {
        const packageJsonPath = path.join(outputDir, 'package.json');

        if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJson(packageJsonPath);

            // Add release scripts
            packageJson.scripts = {
                ...packageJson.scripts,
                'version': 'node scripts/version.js',
                'version:patch': 'node scripts/version.js patch',
                'version:minor': 'node scripts/version.js minor',
                'version:major': 'node scripts/version.js major',
                'changelog': 'node scripts/changelog.js',
                'release': 'node scripts/release.js',
                'release:patch': 'node scripts/release.js patch',
                'release:minor': 'node scripts/release.js minor',
                'release:major': 'node scripts/release.js major',
                'publish:npm': 'node scripts/publish.js --skip-ovsx',
                'publish:ovsx': 'node scripts/publish.js --skip-npm',
                'publish:all': 'node scripts/publish.js'
            };

            if (options.semanticRelease) {
                packageJson.scripts['semantic-release'] = 'semantic-release';
            }

            // Add dev dependencies for changelog generation
            packageJson.devDependencies = {
                ...packageJson.devDependencies,
                'semver': '^7.5.4'
            };

            if (options.semanticRelease) {
                packageJson.devDependencies = {
                    ...packageJson.devDependencies,
                    'semantic-release': '^22.0.0',
                    '@semantic-release/changelog': '^6.0.3',
                    '@semantic-release/git': '^10.0.1'
                };
            }

            await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }
    }
}