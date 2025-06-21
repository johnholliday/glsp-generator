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
| 007 | [prompt-007-test-infrastructure.md](prompt-007-test-infrastructure.md) | Test generation for extensions | 🔴 Not Started | 002 | LOW |
| 008 | [prompt-008-cicd-templates.md](prompt-008-cicd-templates.md) | CI/CD workflow generation | 🔴 Not Started | None | LOW |
| 009 | [prompt-009-custom-templates.md](prompt-009-custom-templates.md) | Custom template system | 🔴 Not Started | None | LOW |
| 010 | [prompt-010-performance.md](prompt-010-performance.md) | Performance optimizations | 🔴 Not Started | None | LOW |
| 011 | [prompt-011-migration-tools.md](prompt-011-migration-tools.md) | Grammar migration tools | 🔴 Not Started | None | LOW |
| 012 | [prompt-012-type-safety.md](prompt-012-type-safety.md) | Enhanced type safety features | 🟢 Completed | None | MEDIUM |
| 013 | [prompt-013-dev-cli.md](prompt-013-dev-cli.md) | Development CLI with Yargs and Yarn Link | 🟢 Completed | None | HIGH |

## Status Legend

- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- 🔵 On Hold
- ⚫ Cancelled

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

3. **Phase 3 - Advanced**
   - 007: Test Infrastructure
   - 008: CI/CD Templates
   - 009: Custom Templates
   - 010: Performance
   - 011: Migration Tools

## Notes

- Each prompt is self-contained with clear acceptance criteria
- Update this README when starting or completing a prompt
- Add any new prompts with sequential numbering
- Consider dependencies when selecting implementation order
