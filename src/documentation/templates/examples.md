# Examples

This document provides practical examples of using the GLSP server.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Model Operations](#model-operations)
3. [Custom Extensions](#custom-extensions)
4. [Advanced Scenarios](#advanced-scenarios)

## Basic Usage

### Connecting to the Server

```typescript
import { GLSPClient } from '@eclipse-glsp/client';

const client = new GLSPClient({
    serverUrl: 'ws://localhost:5007',
    clientId: 'example-client'
});

await client.initialize();
```

### Loading a Model

```typescript
const modelId = 'example.model';
await client.initializeClientSession({
    clientSessionId: 'session-1',
    diagramType: 'workflow'
});

const model = await client.requestModel({
    sourceUri: `file://${modelId}`,
    diagramType: 'workflow'
});
```

## Model Operations

{{examples}}

## Custom Extensions

### Adding a Custom Action Handler

```typescript
@injectable()
export class CustomActionHandler implements ActionHandler {
    actionKinds = ['custom-action'];

    execute(action: Action, modelState: GModelState): void {
        // Handle the custom action
        console.log('Handling custom action:', action);
    }
}
```

### Creating a Custom Validator

```typescript
@injectable()
export class CustomValidator implements ModelValidator {
    validate(model: GModelRoot): ValidationMarker[] {
        const markers: ValidationMarker[] = [];
        
        // Add validation logic
        model.index.all().forEach(element => {
            if (/* validation condition */) {
                markers.push({
                    elementId: element.id,
                    severity: 'warning',
                    message: 'Validation message'
                });
            }
        });
        
        return markers;
    }
}
```

## Advanced Scenarios

### Batch Operations

```typescript
// Execute multiple operations in a single transaction
const operations = [
    { kind: 'createNode', elementTypeId: 'node:task', location: { x: 100, y: 100 } },
    { kind: 'createNode', elementTypeId: 'node:task', location: { x: 300, y: 100 } },
    { kind: 'createEdge', sourceId: 'node1', targetId: 'node2' }
];

await client.send({
    kind: 'compound',
    actions: operations
});
```

### Model Export

```typescript
// Export the model in a specific format
const exportedModel = await client.send({
    kind: 'exportModel',
    format: 'json'
});

// Save to file
fs.writeFileSync('exported-model.json', JSON.stringify(exportedModel, null, 2));
```