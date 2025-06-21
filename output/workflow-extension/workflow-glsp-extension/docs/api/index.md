# API Documentation

## Overview

This document provides comprehensive API documentation for the GLSP extension.

## Table of Contents

- [Interfaces](./interfaces.md) - Model interface definitions
- [Types](./types.md) - Type definitions and enumerations
- [Server API](./server.md) - Server-side handlers and commands
- [Client API](./client.md) - Client-side commands and views

## Quick Links

### Core Interfaces
- [Workflow](./interfaces.md#workflow) - Model interface for Workflow elements.
- [Task](./interfaces.md#task) - Model interface for Task elements.
- [Flow](./interfaces.md#flow) - Model interface for Flow elements.
- [Parameter](./interfaces.md#parameter) - Model interface for Parameter elements.

### Key Types


## Getting Started

To use these APIs in your project:

```typescript
import { Workflow, Task, Flow } from 'extension-name';

// Create a new model element
const element: Workflow = {
    // ... properties
};
```

## API Conventions

- All model interfaces extend from base interfaces
- Properties marked as optional can be undefined
- Array properties default to empty arrays
- References use the `@id` notation
