# Test Generation Feature

## Overview
The Test Generation feature automatically creates comprehensive test suites for generated GLSP extensions, including unit tests, integration tests, end-to-end tests, and test utilities. It ensures high code quality and maintainability.

## Purpose
- Generate comprehensive test coverage automatically
- Create test data factories and builders
- Provide integration test scaffolding
- Enable E2E testing with Playwright
- Support multiple testing frameworks

## Current Implementation

### Components

#### 1. **Test Generator** (`src/test-generation/test-generator.ts`)
- Orchestrates test generation
- Manages test types selection
- Configures test frameworks
- Generates test documentation

#### 2. **Unit Test Generator** (`src/test-generation/unit-test-generator.ts`)
- Component-level tests
- Model validation tests
- Handler logic tests
- Utility function tests

#### 3. **Integration Test Generator** (`src/test-generation/integration-test-generator.ts`)
- Client-server communication tests
- Command execution tests
- Model synchronization tests
- Event handling tests

#### 4. **E2E Test Generator** (`src/test-generation/e2e-test-generator.ts`)
- Full application flow tests
- User interaction simulation
- Visual regression tests
- Cross-browser testing

#### 5. **Factory Generator** (`src/test-generation/factory-generator.ts`)
- Test data factories
- Model builders
- Mock generators
- Fixture creation

### Generated Test Structure
```
tests/
├── unit/
│   ├── model/
│   │   ├── node.test.ts
│   │   ├── edge.test.ts
│   │   └── validation.test.ts
│   ├── handlers/
│   │   ├── create-handler.test.ts
│   │   └── update-handler.test.ts
│   └── utils/
│       └── helpers.test.ts
├── integration/
│   ├── client-server.test.ts
│   ├── commands.test.ts
│   └── synchronization.test.ts
├── e2e/
│   ├── create-diagram.test.ts
│   ├── edit-elements.test.ts
│   └── export-import.test.ts
├── fixtures/
│   ├── models.ts
│   └── diagrams.ts
└── utils/
    ├── factories.ts
    ├── builders.ts
    └── test-helpers.ts
```

## Generated Test Examples

### Unit Tests
```typescript
// tests/unit/model/node.test.ts
import { describe, it, expect } from 'vitest'
import { createNode, validateNode } from '../../../src/model'
import { NodeFactory } from '../../utils/factories'

describe('Node Model', () => {
  describe('createNode', () => {
    it('should create a valid node with required properties', () => {
      const node = createNode({
        id: 'node1',
        name: 'Test Node',
        position: { x: 100, y: 100 }
      })
      
      expect(node).toMatchObject({
        id: 'node1',
        name: 'Test Node',
        position: { x: 100, y: 100 }
      })
    })
    
    it('should generate ID if not provided', () => {
      const node = createNode({
        name: 'Test Node',
        position: { x: 0, y: 0 }
      })
      
      expect(node.id).toBeDefined()
      expect(node.id).toMatch(/^node-\w+$/)
    })
  })
  
  describe('validateNode', () => {
    it('should validate correct node structure', () => {
      const node = NodeFactory.create()
      const result = validateNode(node)
      
      expect(result.valid).toBe(true)
    })
    
    it('should reject invalid node structure', () => {
      const invalidNode = { id: 123, name: true }
      const result = validateNode(invalidNode)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Property "id" must be a string')
    })
  })
})
```

### Integration Tests
```typescript
// tests/integration/client-server.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GLSPServer, GLSPClient } from '@eclipse-glsp/test-framework'
import { createTestDiagram } from '../fixtures/diagrams'

describe('Client-Server Integration', () => {
  let server: GLSPServer
  let client: GLSPClient
  
  beforeEach(async () => {
    server = await GLSPServer.start({ port: 0 })
    client = await GLSPClient.connect(server.port)
  })
  
  afterEach(async () => {
    await client.disconnect()
    await server.stop()
  })
  
  it('should synchronize model between client and server', async () => {
    const diagram = createTestDiagram()
    
    // Initialize diagram on server
    await server.initializeDiagram(diagram)
    
    // Client should receive the model
    const clientModel = await client.getModel()
    expect(clientModel).toEqual(diagram)
  })
  
  it('should execute create node command', async () => {
    await server.initializeDiagram(createTestDiagram())
    
    // Execute command
    const result = await client.executeCommand('createNode', {
      position: { x: 100, y: 100 },
      nodeType: 'task'
    })
    
    expect(result.success).toBe(true)
    expect(result.nodeId).toBeDefined()
    
    // Verify node was created
    const model = await client.getModel()
    const newNode = model.nodes.find(n => n.id === result.nodeId)
    expect(newNode).toBeDefined()
    expect(newNode.type).toBe('task')
  })
})
```

### E2E Tests
```typescript
// tests/e2e/create-diagram.test.ts
import { test, expect } from '@playwright/test'
import { DiagramPage } from './pages/diagram-page'

test.describe('Diagram Creation', () => {
  let diagramPage: DiagramPage
  
  test.beforeEach(async ({ page }) => {
    diagramPage = new DiagramPage(page)
    await diagramPage.goto()
  })
  
  test('should create a new diagram', async () => {
    // Open new diagram dialog
    await diagramPage.clickNewDiagram()
    
    // Fill diagram details
    await diagramPage.fillDiagramName('My Test Diagram')
    await diagramPage.selectTemplate('blank')
    await diagramPage.clickCreate()
    
    // Verify diagram is created
    await expect(diagramPage.canvas).toBeVisible()
    await expect(diagramPage.title).toHaveText('My Test Diagram')
  })
  
  test('should add nodes using palette', async () => {
    await diagramPage.createNewDiagram('Test')
    
    // Drag task node from palette
    await diagramPage.dragFromPalette('task', { x: 200, y: 200 })
    
    // Verify node is created
    const nodes = await diagramPage.getNodes()
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toHaveAttribute('data-type', 'task')
    
    // Take screenshot for visual regression
    await expect(diagramPage.canvas).toHaveScreenshot('task-node-created.png')
  })
})
```

### Test Factories
```typescript
// tests/utils/factories.ts
import { Factory } from 'fishery'
import { Node, Edge, Position } from '../../src/types'

export const PositionFactory = Factory.define<Position>(() => ({
  x: faker.number.int({ min: 0, max: 1000 }),
  y: faker.number.int({ min: 0, max: 1000 })
}))

export const NodeFactory = Factory.define<Node>(({ sequence }) => ({
  id: `node-${sequence}`,
  name: faker.lorem.words(2),
  position: PositionFactory.build(),
  type: faker.helpers.arrayElement(['task', 'gateway', 'event']),
  children: []
}))

export const EdgeFactory = Factory.define<Edge>(({ sequence }) => ({
  id: `edge-${sequence}`,
  source: NodeFactory.build().id,
  target: NodeFactory.build().id,
  label: faker.lorem.word()
}))

// Builders for complex scenarios
export class DiagramBuilder {
  private nodes: Node[] = []
  private edges: Edge[] = []
  
  withNodes(count: number): this {
    this.nodes = NodeFactory.buildList(count)
    return this
  }
  
  withConnectedNodes(count: number): this {
    this.nodes = NodeFactory.buildList(count)
    
    // Create edges between consecutive nodes
    for (let i = 0; i < count - 1; i++) {
      this.edges.push(EdgeFactory.build({
        source: this.nodes[i].id,
        target: this.nodes[i + 1].id
      }))
    }
    
    return this
  }
  
  build() {
    return { nodes: this.nodes, edges: this.edges }
  }
}
```

## Usage Examples

### CLI Test Generation
```bash
# Generate all test types
glsp-generator test my-dsl.langium --all

# Generate specific test types
glsp-generator test my-dsl.langium --unit --integration

# With coverage target
glsp-generator test my-dsl.langium --coverage 80

# With specific framework
glsp-generator test my-dsl.langium --framework jest
```

### Configuration
```json
{
  "testing": {
    "framework": "vitest",
    "unit": {
      "enabled": true,
      "coverage": {
        "target": 80,
        "include": ["src/**/*.ts"],
        "exclude": ["src/**/*.test.ts"]
      }
    },
    "integration": {
      "enabled": true,
      "timeout": 30000
    },
    "e2e": {
      "enabled": true,
      "framework": "playwright",
      "browsers": ["chromium", "firefox"],
      "baseUrl": "http://localhost:3000"
    },
    "factories": {
      "faker": true,
      "builders": true
    }
  }
}
```

### Test Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/",
    "test:integration": "vitest run tests/integration/",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

## Best Practices
1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Isolation**: Each test should be independent
3. **Factories**: Use for consistent test data
4. **Mocking**: Mock external dependencies
5. **Coverage**: Aim for 80%+ code coverage

## Future Enhancements
1. **Mutation Testing**: Test the tests quality
2. **Property Testing**: Generate random test cases
3. **Visual Testing**: AI-powered visual regression
4. **Performance Testing**: Load and stress tests
5. **Contract Testing**: API contract validation

## Dependencies
- `vitest`: Fast unit test framework
- `@playwright/test`: E2E testing
- `fishery`: Test data factories
- `@faker-js/faker`: Fake data generation
- `@vitest/coverage-v8`: Coverage reporting

## Testing the Test Generator
- Meta-tests for generated tests
- Template validation tests
- Framework compatibility tests
- Coverage accuracy tests
- Performance benchmarks

## Related Features
- [Type Safety](./07-type-safety.md)
- [Code Generation](./02-code-generation.md)
- [CI/CD Support](./10-cicd-support.md)