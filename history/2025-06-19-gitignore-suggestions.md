# Suggested .gitignore Additions

**Date**: 2025-06-19
**Purpose**: Recommendations for .gitignore based on new folder structure

## Recommended Additions

Add the following lines to your .gitignore file if you want to keep certain folders local:

```gitignore
# Claude Code history (optional - keep if you want to track actions)
# history/

# Temporary scripts (review before committing)
scripts/*.tmp.js
scripts/*.tmp.ps1

# Keep prompts in version control (they're part of the project roadmap)
# Do not ignore prompts/
```

## Rationale

- **history/**: Contains timestamped documentation of Claude Code actions. You may want to:
  - Keep it in git for audit trail
  - Or ignore it if it's just for personal reference
  
- **scripts/**: Should generally be committed as they contain useful utilities, but temporary scripts should be ignored

- **prompts/**: Should definitely be in version control as it's your project roadmap

## Full Recommended .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
dist/
lib/
*.tsbuildinfo

# Yarn Berry
.yarn/*
!.yarn/cache
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# Testing
coverage/
*.log

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/

# OS
.DS_Store
Thumbs.db

# Optional: Claude Code history
# history/

# Temporary files
*.tmp
*.temp
scripts/*.tmp.*
```
