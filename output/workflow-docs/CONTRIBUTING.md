# Contributing to workflow

Thank you for your interest in contributing to workflow! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the issue tracker
2. Create a new issue with a clear title and description
3. Include steps to reproduce the issue
4. Add relevant labels

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`yarn test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/workflow.git

# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test

# Run in watch mode
yarn watch
```

## Coding Standards

- Use TypeScript for all new code
- Follow the existing code style
- Write tests for new functionality
- Update documentation as needed
- Keep commits atomic and descriptive

## Model Development

When modifying the language grammar:

1. Update the Langium grammar file
2. Regenerate the language support
3. Update examples and tests
4. Update documentation

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Add integration tests for complex features

## Documentation

- Update README.md for user-facing changes
- Update API documentation for interface changes
- Add examples for new features
- Keep documentation in sync with code

## Release Process

1. Version updates follow semantic versioning
2. Releases are created from the main branch
3. Changelog is updated with each release

## Questions?

Feel free to open an issue or start a discussion if you have questions about contributing.

Thank you for contributing to workflow!
