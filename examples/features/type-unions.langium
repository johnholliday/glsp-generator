// Type Unions and Type Aliases Feature Showcase
// Demonstrates union types and type aliases in Langium
// This example shows:
// - Simple union types
// - Complex union types
// - Type aliases
// - Nested unions
// - Discriminated unions

grammar TypeUnions

// Configuration system with various union types
interface Configuration {
    name: string
    version: Version
    
    // Union type properties
    target: Target                  // Union of different targets
    value: ConfigValue              // Union of value types
    trigger: Trigger                // Union of trigger types
    
    // Arrays of union types
    actions: Action[]               // Each can be different action type
    conditions?: Condition[]        // Optional array of conditions
    
    // Nested union types
    deployment?: Deployment         // Contains more unions
}

// Simple union type for version
type Version = string | number | SemanticVersion

interface SemanticVersion {
    major: number
    minor: number
    patch: number
    prerelease?: string
    metadata?: string
}

// Union of different target types
type Target = 
    | ServerTarget 
    | ClientTarget 
    | MobileTarget 
    | EmbeddedTarget

interface ServerTarget {
    type: 'server'                  // Discriminator
    host: string
    port: number
    protocol: Protocol
}

interface ClientTarget {
    type: 'client'                  // Discriminator
    platform: ClientPlatform
    minVersion?: string
}

interface MobileTarget {
    type: 'mobile'                  // Discriminator
    os: MobileOS
    deviceTypes?: DeviceType[]
}

interface EmbeddedTarget {
    type: 'embedded'                // Discriminator
    board: string
    memory: MemorySpec
}

// Union type for configuration values
type ConfigValue = 
    | string                        // Simple string
    | number                        // Simple number
    | boolean                       // Simple boolean
    | StringArray                   // Array type
    | NumberArray                   // Array type
    | ObjectValue                   // Complex object
    | Reference                     // Reference to another config

interface StringArray {
    type: 'string-array'
    values: string[]
}

interface NumberArray {
    type: 'number-array'
    values: number[]
}

interface ObjectValue {
    type: 'object'
    properties: Property[]
}

interface Reference {
    type: 'reference'
    path: string
}

// Union type for triggers
type Trigger = 
    | TimeTrigger 
    | EventTrigger 
    | ConditionTrigger 
    | ManualTrigger

interface TimeTrigger {
    kind: 'time'
    schedule: Schedule
}

interface EventTrigger {
    kind: 'event'
    eventType: EventType
    source?: EventSource
}

interface ConditionTrigger {
    kind: 'condition'
    expression: Expression
    checkInterval?: number
}

interface ManualTrigger {
    kind: 'manual'
    requiredRole?: string
}

// Union type for actions
type Action = 
    | LogAction 
    | EmailAction 
    | WebhookAction 
    | ScriptAction 
    | CompositeAction

interface LogAction {
    action: 'log'
    level: LogLevel
    message: string
}

interface EmailAction {
    action: 'email'
    to: string[]
    subject: string
    body: string
    attachments?: Attachment[]
}

interface WebhookAction {
    action: 'webhook'
    url: string
    method: HttpMethod
    headers?: Header[]
    body?: string
}

interface ScriptAction {
    action: 'script'
    language: ScriptLanguage
    code: string
    timeout?: number
}

interface CompositeAction {
    action: 'composite'
    steps: Action[]                 // Nested union types
    parallel?: boolean
}

// Union type for conditions
type Condition = 
    | SimpleCondition 
    | CompoundCondition 
    | RuleCondition

interface SimpleCondition {
    type: 'simple'
    field: string
    operator: ComparisonOperator
    value: ConfigValue              // Nested union
}

interface CompoundCondition {
    type: 'compound'
    operator: LogicalOperator
    conditions: Condition[]         // Recursive union
}

interface RuleCondition {
    type: 'rule'
    ruleName: string
    parameters?: Parameter[]
}

// Complex nested union for deployment
type Deployment = 
    | SingleDeployment 
    | MultiDeployment 
    | BlueGreenDeployment 
    | CanaryDeployment

interface SingleDeployment {
    strategy: 'single'
    target: Target                  // Uses Target union
    config: ConfigValue             // Uses ConfigValue union
}

interface MultiDeployment {
    strategy: 'multi'
    targets: Target[]               // Array of union type
    distribution: Distribution
}

interface BlueGreenDeployment {
    strategy: 'blue-green'
    blue: Target
    green: Target
    switchTrigger: Trigger          // Uses Trigger union
}

interface CanaryDeployment {
    strategy: 'canary'
    stable: Target
    canary: Target
    percentage: number
    promoteCondition: Condition     // Uses Condition union
}

// Union with mixed types
type Distribution = 
    | 'round-robin' 
    | 'random' 
    | 'weighted' 
    | CustomDistribution

interface CustomDistribution {
    type: 'custom'
    algorithm: string
    parameters?: Record
}

// Generic record type
interface Record {
    entries: Entry[]
}

interface Entry {
    key: string
    value: ConfigValue              // Recursive union reference
}

// Expression types for conditions
type Expression = 
    | string                        // Simple expression
    | BinaryExpression 
    | UnaryExpression 
    | FunctionExpression

interface BinaryExpression {
    left: Expression                // Recursive
    operator: BinaryOperator
    right: Expression               // Recursive
}

interface UnaryExpression {
    operator: UnaryOperator
    operand: Expression             // Recursive
}

interface FunctionExpression {
    function: string
    arguments: Expression[]         // Recursive array
}

// Schedule types
type Schedule = 
    | CronSchedule 
    | IntervalSchedule 
    | DateSchedule

interface CronSchedule {
    type: 'cron'
    expression: string
}

interface IntervalSchedule {
    type: 'interval'
    interval: number
    unit: TimeUnit
}

interface DateSchedule {
    type: 'date'
    dates: string[]                 // ISO dates
}

// Event source union
type EventSource = 
    | SystemEvent 
    | UserEvent 
    | ExternalEvent

interface SystemEvent {
    source: 'system'
    component: string
}

interface UserEvent {
    source: 'user'
    userId?: string
}

interface ExternalEvent {
    source: 'external'
    system: string
    endpoint?: string
}

// Supporting types
interface Property {
    name: string
    value: ConfigValue              // Uses union
}

interface MemorySpec {
    ram: number
    flash: number
}

interface Attachment {
    filename: string
    content: string                 // Base64
}

interface Header {
    name: string
    value: string
}

interface Parameter {
    name: string
    value: ConfigValue              // Uses union
}

// Enumerations (also types)
type Protocol = 'http' | 'https' | 'tcp' | 'udp' | 'mqtt' | 'amqp'
type ClientPlatform = 'web' | 'desktop' | 'mobile' | 'cli'
type MobileOS = 'ios' | 'android' | 'harmony'
type DeviceType = 'phone' | 'tablet' | 'watch' | 'tv'
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type ScriptLanguage = 'javascript' | 'python' | 'bash' | 'powershell'
type ComparisonOperator = '==' | '!=' | '<' | '>' | '<=' | '>=' | 'contains' | 'matches'
type LogicalOperator = 'and' | 'or' | 'not'
type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '&&' | '||' | '==' | '!='
type UnaryOperator = '-' | '+' | '!' | '~'
type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month'
type EventType = 'create' | 'update' | 'delete' | 'error' | 'warning' | 'info'