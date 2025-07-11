# GLSP Generator Enhancement Prompts

This directory contains structured enhancement requests for the GLSP Generator project. Each prompt is designed to be used with Claude Code to implement specific features or improvements.

## Usage

1. Select a prompt file based on priority and dependencies
2. Copy the prompt content to Claude Code
3. Review and implement the enhancement
4. Update the status in this README
5. Create appropriate tests and documentation

## Prompt Status

| Seq | File | Description | Status | Dependencies | Priority |
|-----|------|-------------|---------|--------------|----------|
| 001 | [prompt-001-template-validation.md](prompt-001-template-validation.md) | Yarn compatibility validation system | 🟢 Completed | None | HIGH |
| 002 | [prompt-002-grammar-test-suite.md](prompt-002-grammar-test-suite.md) | Comprehensive grammar examples and tests | 🟢 Completed | None | HIGH |
| 003 | [prompt-003-extension-config.md](prompt-003-extension-config.md) | .glsprc.json configuration system | 🟢 Completed | None | MEDIUM |
| 004 | [prompt-004-watch-mode.md](prompt-004-watch-mode.md) | Development watch mode | 🟢 Completed | None | HIGH |
| 005 | [prompt-005-validation-diagnostics.md](prompt-005-validation-diagnostics.md) | Enhanced validation and error messages | 🟢 Completed | 001 | MEDIUM |
| 006 | [prompt-006-doc-generator.md](prompt-006-doc-generator.md) | Documentation generation from grammar | 🟢 Completed | None | MEDIUM |
| 007 | [prompt-007-test-infrastructure.md](prompt-007-test-infrastructure.md) | Test generation for extensions | 🟢 Completed | 002 | LOW |
| 008 | [prompt-008-cicd-templates.md](prompt-008-cicd-templates.md) | CI/CD workflow generation | 🟢 Completed | None | LOW |
| 009 | [prompt-009-custom-templates.md](prompt-009-custom-templates.md) | Custom template system | 🟢 Completed | None | LOW |
| 010 | [prompt-010-performance.md](prompt-010-performance.md) | Performance optimizations | 🟢 Completed | None | LOW |
| 011 | [prompt-011-migration-tools.md](prompt-011-migration-tools.md) | Grammar migration tools | 🔴 Removed | None | LOW |
| 012 | [prompt-012-type-safety.md](prompt-012-type-safety.md) | Enhanced type safety features | 🟢 Completed | None | MEDIUM |
| 013 | [prompt-013-dev-cli.md](prompt-013-dev-cli.md) | Development CLI with Yargs and Yarn Link | 🟢 Completed | None | HIGH |
| 014 | [prompt-014-grammar-attributes.md](prompt-014-grammar-attributes.md) | Grammar Attributes Support | 🔴 Not Started | 002 | MEDIUM |
| 015 | [prompt-015-first-time-setup.md](prompt-015-first-time-setup.md) | First-Time Setup Automation | 🔴 Not Started | None | HIGH |
| 016 | [prompt-016-env-configuration.md](prompt-016-env-configuration.md) | Developer Environment Configuration | 🔴 Not Started | None | HIGH |
| 017 | [prompt-017-developer-commands.md](prompt-017-developer-commands.md) | Improved Developer Commands | 🔴 Not Started | 015, 016 | HIGH |
| 018 | [prompt-018-error-handling.md](prompt-018-error-handling.md) | Better Error Messages & Recovery | 🔴 Not Started | None | MEDIUM |
| 019 | [prompt-019-vscode-workspace.md](prompt-019-vscode-workspace.md) | VS Code Workspace Enhancements | 🔴 Not Started | None | MEDIUM |
| 020 | [prompt-020-interactive-cli.md](prompt-020-interactive-cli.md) | Interactive CLI Experience | 🔴 Not Started | 018 | MEDIUM |
| 021 | [prompt-021-contributing-docs.md](prompt-021-contributing-docs.md) | Developer Documentation (CONTRIBUTING.md) | 🔴 Not Started | None | MEDIUM |
| 022 | [prompt-022-testing-tools.md](prompt-022-testing-tools.md) | Testing & Debugging Tools | 🔴 Not Started | 002 | LOW |
| 023 | [prompt-023-release-automation.md](prompt-023-release-automation.md) | Build & Release Automation | 🔴 Not Started | 022 | LOW |
| 024 | [prompt-024-developer-dashboard.md](prompt-024-developer-dashboard.md) | Developer Dashboard | 🔴 Not Started | None | LOW |
| 025 | [prompt-025-grammar-dev-tools.md](prompt-025-grammar-dev-tools.md) | Grammar Development Tools | 🔴 Not Started | 019 | LOW |
| 026 | [prompt-026-docker-dev-experience.md](prompt-026-docker-dev-experience.md) | Docker Development Experience | 🔴 Not Started | 016 | LOW |

## Status Legend

- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- 🔵 On Hold
- ⚫ Cancelled
- 🔴 Removed (No longer applicable)

## Implementation Order Recommendation

Based on dependencies and priority:

1. **Phase 1 - Critical** (Do these first)
   - 001: Template Validation (ensures Yarn compatibility)
   - 002: Grammar Test Suite (provides test cases)
   - 004: Watch Mode (improves development experience)
   - 013: Development CLI (enables testing from anywhere)

2. **Phase 2 - Enhanced Features**
   - 003: Extension Config
   - 005: Validation Diagnostics
   - 006: Documentation Generator
   - 012: Type Safety
   - 014: Grammar Attributes

3. **Phase 3 - Advanced**
   - 007: Test Infrastructure
   - 008: CI/CD Templates
   - 009: Custom Templates
   - 010: Performance
   - 011: Migration Tools (Removed)

4. **Phase 4 - Developer Experience** (New)
   - 015: First-Time Setup Automation
   - 016: Developer Environment Configuration
   - 017: Improved Developer Commands
   - 018: Better Error Messages & Recovery
   - 019: VS Code Workspace Enhancements
   - 020: Interactive CLI Experience
   - 021: Developer Documentation
   - 022: Testing & Debugging Tools
   - 023: Build & Release Automation
   - 024: Developer Dashboard
   - 025: Grammar Development Tools
   - 026: Docker Development Experience

## Notes

- Each prompt is self-contained with clear acceptance criteria
- Update this README when starting or completing a prompt
- Add any new prompts with sequential numbering
- Consider dependencies when selecting implementation order
