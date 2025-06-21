# Architecture

This document describes the architecture of the generated GLSP server.

## Overview

The GLSP server follows a modular architecture based on the Eclipse GLSP framework. It provides a WebSocket-based API for graphical modeling clients.

## System Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   GLSP Client   │ ◄─────────────────► │   GLSP Server   │
└─────────────────┘                     └─────────────────┘
                                               │
                                               ▼
                                        ┌─────────────────┐
                                        │  Model Storage  │
                                        └─────────────────┘
```

## Components

{{components}}

## Data Flow

{{dataFlow}}

## Key Design Decisions

### 1. Dependency Injection
The server uses dependency injection for loose coupling between components.

### 2. Action-Based Communication
All client-server communication is based on actions, providing a uniform interface.

### 3. Model-View Separation
The server maintains a clear separation between the semantic model and the graphical model.

## Extension Points

The server can be extended through:

1. **Custom Action Handlers** - Handle new types of client actions
2. **Custom Operation Handlers** - Implement new model operations
3. **Custom Validators** - Add domain-specific validation rules
4. **Custom Layout Engines** - Implement automatic layout algorithms