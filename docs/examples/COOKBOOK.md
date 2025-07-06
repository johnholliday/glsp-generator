# GLSP Grammar Cookbook

A collection of patterns, best practices, and recipes for creating GLSP-friendly Langium grammars.

## Table of Contents

1. [Common Modeling Patterns](#common-modeling-patterns)
2. [Best Practices for GLSP-Friendly Grammars](#best-practices-for-glsp-friendly-grammars)
3. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
4. [Performance Considerations](#performance-considerations)
5. [Naming Conventions](#naming-conventions)
6. [Advanced Patterns](#advanced-patterns)

## Common Modeling Patterns

### Basic Element Pattern

Every GLSP diagram element should have at least an ID and name:

```langium
interface Element {
    id: string
    name?: string
}

interface Node extends Element {
    position: Position
    size?: Size
}

interface Edge extends Element {
    source: @Node
    target: @Node
}
```

### Position and Size Pattern

For visual elements, always include position and optional size:

```langium
interface Position {
    x: number
    y: number
}

interface Size {
    width: number
    height: number
}
```

### Container Pattern

For hierarchical diagrams with containment:

```langium
interface Container extends Node {
    children: Node[]
    layout?: LayoutType
    autoResize?: boolean
}

type LayoutType = 'none' | 'horizontal' | 'vertical' | 'grid'
```

### Port-Based Connection Pattern

For component diagrams with explicit connection points:

```langium
interface Component extends Node {
    ports: Port[]
}

interface Port {
    id: string
    name: string
    type: PortType
    position: PortPosition
}

interface Connection extends Edge {
    sourcePort?: @Port
    targetPort?: @Port
}

type PortType = 'input' | 'output' | 'bidirectional'
```

### State Machine Pattern

For state-based diagrams:

```langium
interface StateMachine {
    states: State[]
    transitions: Transition[]
    initialState: @State
}

interface State extends Node {
    isInitial?: boolean
    isFinal?: boolean
    // Use optional arrays for actions
    entryActions?: Action[]
    exitActions?: Action[]
}

interface Transition extends Edge {
    trigger?: string
    guard?: string
    actions?: Action[]
}
```

### Workflow Pattern

For process and workflow diagrams:

```langium
interface Process {
    tasks: Task[]
    flows: Flow[]
    startEvent: @StartEvent
    endEvents: EndEvent[]
}

interface Task extends Node {
    type: TaskType
    assignee?: string
    inputs?: Parameter[]
    outputs?: Parameter[]
}

interface Flow extends Edge {
    condition?: string
    priority?: number
}
```

## Best Practices for GLSP-Friendly Grammars

### 1. Always Include Visual Properties

GLSP needs position information for rendering:

```langium
// GOOD: Includes visual properties
interface DiagramElement extends Node {
    position: Position  // Required for GLSP
    size?: Size        // Optional but recommended
    style?: Style      // For custom styling
}

// BAD: No visual properties
interface DataElement {
    value: string
    // Missing position/size
}
```

### 2. Use Clear Type Hierarchies

Establish clear base types for nodes and edges:

```langium
// GOOD: Clear hierarchy
interface BaseElement {
    id: string
}

interface Node extends BaseElement {
    position: Position
}

interface Edge extends BaseElement {
    source: @Node
    target: @Node
}

// All diagram elements extend from Node or Edge
interface MyNode extends Node {
    // Additional properties
}
```

### 3. Make References Explicit

Use `@` for cross-references:

```langium
// GOOD: Clear references
interface Association {
    source: @Class
    target: @Class
    sourceMultiplicity?: string
    targetMultiplicity?: string
}

// AVOID: String-based references
interface Association {
    sourceId: string  // Requires manual resolution
    targetId: string
}
```

### 4. Use Optional Arrays Wisely

For collections that might be empty:

```langium
// GOOD: Optional arrays for truly optional collections
interface Class {
    attributes: Attribute[]      // Always has array (can be empty)
    operations?: Operation[]     // May not have operations section
    interfaces?: @Interface[]    // May not implement interfaces
}
```

### 5. Include Metadata

Add metadata for tooling support:

```langium
interface Element {
    id: string
    name?: string
    description?: string
    metadata?: Metadata
}

interface Metadata {
    created?: string
    modified?: string
    author?: string
    version?: string
    tags?: string[]
}
```

## Anti-Patterns to Avoid

### 1. Circular Required References

Avoid circular dependencies in required properties:

```langium
// BAD: Circular required references
interface Parent {
    child: @Child  // Required circular reference
}

interface Child {
    parent: @Parent  // Creates initialization problem
}

// GOOD: Make at least one optional
interface Parent {
    children: @Child[]
}

interface Child {
    parent?: @Parent  // Optional back-reference
}
```

### 2. Deep Inheritance Chains

Avoid excessively deep inheritance:

```langium
// BAD: Too deep
interface A { a: string }
interface B extends A { b: string }
interface C extends B { c: string }
interface D extends C { d: string }
interface E extends D { e: string }
interface F extends E { f: string }

// GOOD: Flatter with composition
interface Base {
    id: string
    metadata?: Metadata
}

interface SpecializedElement extends Base {
    features: Feature[]
    capabilities: Capability[]
}
```

### 3. Overuse of Union Types

Don't overuse union types for everything:

```langium
// BAD: Everything is a union
type Value = string | number | boolean | Object | Array | null | undefined

// GOOD: Specific types with clear discrimination
interface StringValue {
    type: 'string'
    value: string
}

interface NumberValue {
    type: 'number'
    value: number
    unit?: string
}

type Value = StringValue | NumberValue | BooleanValue
```

### 4. Missing Type Discriminators

Always include discriminators for union types:

```langium
// BAD: No way to distinguish
type Shape = Rectangle | Circle

interface Rectangle {
    width: number
    height: number
}

interface Circle {
    radius: number
}

// GOOD: Clear discriminators
interface Rectangle {
    shape: 'rectangle'
    width: number
    height: number
}

interface Circle {
    shape: 'circle'
    radius: number
}
```

## Performance Considerations

### 1. Limit Array Sizes

For large diagrams, consider pagination or lazy loading:

```langium
interface Diagram {
    elements: Element[]  // Consider limits
    // Add pagination support
    pageSize?: number
    currentPage?: number
}
```

### 2. Avoid Deep Nesting

Flatten structures where possible:

```langium
// CONSIDER: Flattening deep structures
interface FlatDiagram {
    nodes: Node[]        // All nodes in flat array
    edges: Edge[]        // All edges in flat array
    hierarchy: ParentChild[]  // Separate hierarchy info
}

interface ParentChild {
    parent: @Node
    child: @Node
}
```

### 3. Index Key Properties

Design for efficient lookups:

```langium
interface Element {
    id: string      // Primary key
    name: string    // Often used for search
    type: string    // For filtering
    // These properties enable efficient indexing
}
```

## Naming Conventions

### Interface Names

- Use **PascalCase** for interfaces
- Use descriptive, domain-specific names
- Avoid generic names like "Item" or "Thing"

```langium
// GOOD
interface CustomerOrder { }
interface InvoiceLineItem { }
interface ShippingAddress { }

// AVOID
interface Thing { }
interface Data { }
interface Object { }
```

### Property Names

- Use **camelCase** for properties
- Be consistent with pluralization
- Use clear, descriptive names

```langium
interface Order {
    orderNumber: string     // camelCase
    items: OrderItem[]      // Plural for arrays
    customer: @Customer     // Singular for single reference
    isUrgent?: boolean      // Boolean prefix
}
```

### Type Names

- Use **PascalCase** for union type names
- Use **kebab-case** for string literal types
- Group related types

```langium
// Type unions
type DiagramElement = Node | Edge | Port

// String literals
type Status = 'active' | 'inactive' | 'pending'
type EventType = 'mouse-click' | 'key-press' | 'drag-drop'
```

## Advanced Patterns

### Extensible Type System

Allow for future extensions:

```langium
interface ExtensibleElement {
    id: string
    type: string
    properties?: Property[]
    extensions?: Extension[]
}

interface Property {
    key: string
    value: PropertyValue
}

interface Extension {
    namespace: string
    data: any
}
```

### Multi-View Support

Support different diagram views:

```langium
interface MultiViewElement {
    id: string
    views: ViewData[]
}

interface ViewData {
    viewType: ViewType
    position?: Position
    size?: Size
    visible?: boolean
    style?: ViewStyle
}

type ViewType = 'structural' | 'behavioral' | 'deployment'
```

### Semantic Anchoring

Link visual elements to semantic model:

```langium
interface SemanticElement {
    id: string
    semanticId: string      // Link to domain model
    modelType: string       // Domain model type
    visualType: string      // Visual representation type
}
```

### Change Tracking

Support for model versioning:

```langium
interface VersionedElement {
    id: string
    version: number
    previousVersion?: @VersionedElement
    changes?: Change[]
}

interface Change {
    property: string
    oldValue?: any
    newValue?: any
    timestamp: string
}
```

### Validation Rules

Embed validation in the model:

```langium
interface ValidatedElement {
    id: string
    validations?: ValidationRule[]
}

interface ValidationRule {
    type: ValidationType
    expression: string
    message?: string
    severity?: Severity
}

type ValidationType = 'required' | 'unique' | 'range' | 'pattern' | 'custom'
type Severity = 'error' | 'warning' | 'info'
```

## Example: Complete GLSP-Ready Grammar

Here's a complete example combining best practices:

```langium
grammar MyDiagram

// Base types
interface Element {
    id: string
    name?: string
    description?: string
    metadata?: Metadata
}

interface Metadata {
    created: string
    modified?: string
    author?: string
    tags?: string[]
}

// Visual elements
interface Node extends Element {
    position: Position
    size?: Size
    style?: NodeStyle
}

interface Edge extends Element {
    source: @Node
    target: @Node
    waypoints?: Position[]
    style?: EdgeStyle
}

// Position and size
interface Position {
    x: number
    y: number
}

interface Size {
    width: number
    height: number
}

// Styles
interface NodeStyle {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
}

interface EdgeStyle {
    lineColor?: string
    lineWidth?: number
    lineStyle?: LineStyle
}

type LineStyle = 'solid' | 'dashed' | 'dotted'

// Domain-specific elements
interface MyNode extends Node {
    nodeType: NodeType
    properties: Property[]
    ports?: Port[]
}

interface MyEdge extends Edge {
    edgeType: EdgeType
    label?: string
}

interface Port {
    id: string
    name: string
    type: PortType
    position: PortPosition
}

interface PortPosition {
    side: Side
    offset?: number
}

interface Property {
    key: string
    value: string
    type?: PropertyType
}

// Type definitions
type NodeType = 'component' | 'interface' | 'service'
type EdgeType = 'association' | 'dependency' | 'flow'
type PortType = 'input' | 'output' | 'bidirectional'
type Side = 'top' | 'right' | 'bottom' | 'left'
type PropertyType = 'string' | 'number' | 'boolean'
```

This grammar is GLSP-ready because it:
- Includes all necessary visual properties
- Has clear type hierarchies
- Uses proper references
- Includes metadata support
- Follows naming conventions
- Is extensible and maintainable