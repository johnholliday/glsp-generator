// BPMN Subset Grammar
// A subset of Business Process Model and Notation for process modeling
// This example demonstrates:
// - Complex process flows
// - Events, activities, and gateways
// - Pools and lanes for organization
// - Data objects and messages

grammar BPMNSubset

// Process definition
interface Process {
    id: string
    name: string
    processType?: ProcessType
    isExecutable?: boolean
    participants?: Participant[]
    flowElements: FlowElement[]
    dataObjects?: DataObject[]
    messages?: Message[]
}

// Participant (Pool)
interface Participant {
    id: string
    name: string
    processRef?: @Process
    lanes?: Lane[]
}

// Lane within a pool
interface Lane {
    id: string
    name: string
    flowNodeRefs: @FlowNode[]
}

// Base flow element
interface FlowElement {
    id: string
    name?: string
    documentation?: string
}

// Base flow node
interface FlowNode extends FlowElement {
    incoming?: @SequenceFlow[]
    outgoing?: @SequenceFlow[]
    lane?: @Lane
}

// Events
interface Event extends FlowNode {
    eventType: EventType
    trigger?: EventTrigger
    isInterrupting?: boolean
}

// Start event
interface StartEvent extends Event {
    isInterrupting: boolean
}

// End event
interface EndEvent extends Event {
    result?: EventResult
}

// Intermediate event
interface IntermediateEvent extends Event {
    attachedTo?: @Activity      // For boundary events
    cancelActivity?: boolean
}

// Activities
interface Activity extends FlowNode {
    activityType: ActivityType
    markers?: ActivityMarker[]
    resources?: Resource[]
    inputData?: @DataObject[]
    outputData?: @DataObject[]
}

// Task
interface Task extends Activity {
    taskType: TaskType
    implementation?: string
}

// Subprocess
interface SubProcess extends Activity {
    flowElements: FlowElement[]
    isExpanded?: boolean
    triggeredByEvent?: boolean
}

// Gateways
interface Gateway extends FlowNode {
    gatewayType: GatewayType
    gatewayDirection?: GatewayDirection
}

// Sequence flows
interface SequenceFlow extends FlowElement {
    sourceRef: @FlowNode
    targetRef: @FlowNode
    conditionExpression?: Expression
    isDefault?: boolean
}

// Data objects
interface DataObject extends FlowElement {
    dataType?: string
    isCollection?: boolean
    dataState?: string
}

// Messages
interface Message {
    id: string
    name: string
    dataType?: string
}

// Resources
interface Resource {
    id: string
    name: string
    type: ResourceType
}

// Expressions
interface Expression {
    language?: string           // e.g., "javascript", "feel"
    body: string
}

// Process types
type ProcessType = 'none' | 'public' | 'private'

// Event types
type EventType = 'start' | 'end' | 'intermediate' | 'boundary'

// Event triggers
type EventTrigger = 
    | 'none'
    | 'message'
    | 'timer'
    | 'error'
    | 'escalation'
    | 'cancel'
    | 'compensation'
    | 'conditional'
    | 'link'
    | 'signal'
    | 'terminate'
    | 'multiple'
    | 'parallelMultiple'

// Event results
type EventResult = 
    | 'none'
    | 'message'
    | 'error'
    | 'escalation'
    | 'cancel'
    | 'compensation'
    | 'signal'
    | 'terminate'
    | 'multiple'

// Activity types
type ActivityType = 'task' | 'subprocess' | 'callActivity'

// Task types
type TaskType = 
    | 'none'
    | 'user'
    | 'manual'
    | 'service'
    | 'script'
    | 'businessRule'
    | 'send'
    | 'receive'

// Activity markers
type ActivityMarker = 
    | 'loop'
    | 'parallelMultiInstance'
    | 'sequentialMultiInstance'
    | 'adHoc'
    | 'compensation'

// Gateway types
type GatewayType = 
    | 'exclusive'       // XOR
    | 'inclusive'       // OR
    | 'parallel'        // AND
    | 'eventBased'      // Event-based
    | 'complex'         // Complex

// Gateway directions
type GatewayDirection = 'converging' | 'diverging' | 'mixed'

// Resource types
type ResourceType = 'human' | 'equipment' | 'system'