// Component System Grammar
// A component-based architecture DSL for system design
// This example demonstrates:
// - Component definitions with ports and interfaces
// - Connectors and bindings
// - Hierarchical composition
// - Configuration and deployment

grammar ComponentSystem

// System definition
interface System {
    name: string
    version?: string
    description?: string
    components: Component[]
    connectors?: Connector[]
    deployments?: Deployment[]
    configurations?: Configuration[]
}

// Component definition
interface Component {
    name: string
    type: ComponentType
    stereotype?: ComponentStereotype
    
    // Interfaces
    provides?: ProvidedInterface[]
    requires?: RequiredInterface[]
    
    // Ports
    ports?: Port[]
    
    // Properties
    properties?: Property[]
    
    // Composition
    subcomponents?: Component[]
    bindings?: Binding[]
    
    // Behavior
    stateMachine?: @StateMachine
    operations?: Operation[]
    
    // Constraints
    constraints?: Constraint[]
}

// Provided interface
interface ProvidedInterface {
    name: string
    interface: @Interface
    port?: @Port
    visibility?: Visibility
}

// Required interface
interface RequiredInterface {
    name: string
    interface: @Interface
    port?: @Port
    cardinality?: Cardinality
}

// Port definition
interface Port {
    name: string
    type: PortType
    direction: PortDirection
    protocol?: @Protocol
    multiplicity?: number
}

// Interface definition
interface Interface {
    name: string
    operations: Operation[]
    events?: Event[]
    parent?: @Interface         // Interface inheritance
}

// Operation signature
interface Operation {
    name: string
    parameters?: Parameter[]
    returnType?: DataType
    exceptions?: string[]
    isAsync?: boolean
}

// Parameter definition
interface Parameter {
    name: string
    type: DataType
    direction?: ParameterDirection
    defaultValue?: string
}

// Event definition
interface Event {
    name: string
    parameters?: Parameter[]
    direction: EventDirection
}

// Protocol definition
interface Protocol {
    name: string
    messages: Message[]
    sequenceRules?: SequenceRule[]
}

// Message in protocol
interface Message {
    name: string
    payload?: DataType
    direction: MessageDirection
}

// Sequence rules for protocols
interface SequenceRule {
    name: string
    expression: string          // Protocol sequence expression
}

// Connector between components
interface Connector {
    name: string
    type: ConnectorType
    from: EndPoint
    to: EndPoint
    properties?: Property[]
}

// Endpoint for connectors
interface EndPoint {
    component: @Component
    port?: @Port
    interface?: string          // Interface name
}

// Binding within composite components
interface Binding {
    name?: string
    source: BindingEnd
    target: BindingEnd
}

// Binding endpoint
interface BindingEnd {
    component?: @Component      // Empty for parent component
    port: @Port
}

// Component properties
interface Property {
    name: string
    type: DataType
    value?: string
    visibility?: Visibility
    isConfigurable?: boolean
}

// Configuration
interface Configuration {
    name: string
    target: @Component
    propertyValues: PropertyValue[]
}

// Property value assignment
interface PropertyValue {
    property: @Property
    value: string
}

// Deployment specification
interface Deployment {
    name: string
    components: ComponentInstance[]
    nodes: Node[]
    allocations: Allocation[]
}

// Component instance
interface ComponentInstance {
    name: string
    component: @Component
    configuration?: @Configuration
}

// Deployment node
interface Node {
    name: string
    type: NodeType
    resources?: Resource[]
}

// Resource specification
interface Resource {
    name: string
    type: ResourceType
    capacity?: string
}

// Allocation of components to nodes
interface Allocation {
    instance: @ComponentInstance
    node: @Node
    resources?: ResourceRequirement[]
}

// Resource requirements
interface ResourceRequirement {
    resource: @Resource
    amount: string
}

// Constraint definition
interface Constraint {
    name: string
    type: ConstraintType
    expression: string
}

// State machine reference
interface StateMachine {
    name: string
    // Simplified - would reference a full state machine grammar
}

// Component types
type ComponentType = 
    | 'atomic'          // Basic component
    | 'composite'       // Contains subcomponents
    | 'template'        // Parameterized component

// Component stereotypes
type ComponentStereotype = 
    | 'service'
    | 'controller'
    | 'repository'
    | 'gateway'
    | 'filter'
    | 'adapter'

// Port types
type PortType = 'service' | 'event' | 'data' | 'control'

// Port directions
type PortDirection = 'in' | 'out' | 'inout'

// Connector types
type ConnectorType = 
    | 'assembly'        // Component assembly
    | 'delegation'      // Interface delegation
    | 'data'           // Data flow
    | 'event'          // Event channel

// Data types
type DataType = 
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'object'
    | 'array'
    | @Interface       // Complex type

// Visibility
type Visibility = 'public' | 'private' | 'protected'

// Cardinality
type Cardinality = '0..1' | '1' | '0..*' | '1..*'

// Parameter direction
type ParameterDirection = 'in' | 'out' | 'inout'

// Event direction
type EventDirection = 'in' | 'out'

// Message direction
type MessageDirection = 'request' | 'response' | 'notification'

// Node types
type NodeType = 'server' | 'device' | 'cloud' | 'edge'

// Resource types
type ResourceType = 'cpu' | 'memory' | 'storage' | 'network'

// Constraint types
type ConstraintType = 'invariant' | 'precondition' | 'postcondition'