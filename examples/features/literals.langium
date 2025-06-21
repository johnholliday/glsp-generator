// Literals Feature Showcase
// Demonstrates various literal types and patterns in Langium
// This example shows:
// - String literals and enums
// - Number literals
// - Boolean literals
// - Date/time literals
// - Special literals (null, undefined)
// - Literal arrays and objects

grammar Literals

// Application configuration showcasing various literals
interface Application {
    // String literals
    name: string                    // Any string
    version: SemanticVersion        // Specific string pattern
    environment: Environment        // String literal union
    
    // Number literals
    port: number                    // Any number
    maxConnections: ConnectionLimit // Specific number union
    timeout: TimeoutValue          // Number with unit
    
    // Boolean literals
    debug: boolean
    secure: boolean
    autoStart?: boolean            // Optional boolean
    
    // Date/time literals
    created: DateTime
    expires?: Date
    schedule?: TimeSchedule
    
    // Special literals
    parent?: Application           // Can be null/undefined
    metadata?: Metadata            // Optional complex type
    
    // Literal arrays
    features: Feature[]
    allowedIPs?: IPAddress[]
    
    // Mixed literals
    settings: Setting[]
}

// String literal patterns
interface SemanticVersion {
    version: VersionString         // Constrained string
}

// String literal union (enum-like)
type Environment = 
    | 'development' 
    | 'staging' 
    | 'production' 
    | 'test'

// Number literal unions
type ConnectionLimit = 
    | 10                          // Specific numbers
    | 50 
    | 100 
    | 500 
    | 1000 
    | 'unlimited'                 // Mixed with string

// Number with unit
interface TimeoutValue {
    value: number
    unit: TimeUnit
}

// Date and time literals
interface DateTime {
    date: DateLiteral
    time: TimeLiteral
    timezone?: TimeZone
}

interface Date {
    year: number                  // 2024
    month: MonthNumber           // 1-12
    day: DayNumber               // 1-31
}

interface TimeSchedule {
    type: ScheduleType
    value: ScheduleValue         // Union based on type
}

// Feature flags with boolean combinations
interface Feature {
    name: FeatureName
    enabled: boolean
    experimental?: boolean
    deprecated?: boolean
    
    // Complex boolean expressions
    availableWhen?: AvailabilityCondition
}

// IP Address as structured literal
interface IPAddress {
    type: IPType
    value: string                // Validated string pattern
    port?: PortNumber           // Constrained number
}

// Settings with various literal types
interface Setting {
    key: SettingKey
    value: SettingValue         // Union of literal types
    locked?: boolean
}

// Complex literal unions
type SettingValue = 
    | string                    // String literal
    | number                    // Number literal
    | boolean                   // Boolean literal
    | StringArray              // Array of strings
    | NumberArray              // Array of numbers
    | ColorValue               // Specific string pattern
    | SizeValue                // Number with unit
    | PercentageValue          // Number 0-100
    | RegexPattern             // Special string
    | JsonValue                // Complex nested structure

interface StringArray {
    type: 'string-array'
    values: string[]
}

interface NumberArray {
    type: 'number-array'
    values: number[]
}

// Color as hex literal
interface ColorValue {
    type: 'color'
    value: HexColor            // #RRGGBB pattern
    alpha?: AlphaValue         // 0.0-1.0
}

// Size with unit
interface SizeValue {
    type: 'size'
    value: number
    unit: SizeUnit
}

// Percentage 0-100
interface PercentageValue {
    type: 'percentage'
    value: Percentage          // 0-100
}

// Regular expression pattern
interface RegexPattern {
    type: 'regex'
    pattern: string
    flags?: RegexFlags[]
}

// JSON-like nested structure
interface JsonValue {
    type: 'json'
    object: JsonObject
}

interface JsonObject {
    properties: JsonProperty[]
}

interface JsonProperty {
    key: string
    value: JsonPropertyValue
}

// Metadata with mixed literals
interface Metadata {
    // String literals
    author?: string
    license?: LicenseType
    
    // Number literals
    priority?: Priority         // 1-10
    weight?: number            // Any float
    
    // Boolean flags
    public?: boolean
    beta?: boolean
    internal?: boolean
    
    // Arrays of literals
    tags?: string[]
    categories?: Category[]
    
    // Object literals
    custom?: CustomData
}

interface CustomData {
    [key: string]: any         // Dynamic properties
}

// Availability conditions
type AvailabilityCondition = 
    | AlwaysAvailable
    | EnvironmentCondition
    | DateRangeCondition
    | FeatureFlagCondition
    | CompositeCondition

interface AlwaysAvailable {
    type: 'always'
    value: true                // Literal true
}

interface EnvironmentCondition {
    type: 'environment'
    environments: Environment[] // Array of literals
}

interface DateRangeCondition {
    type: 'date-range'
    start: DateLiteral
    end: DateLiteral
}

interface FeatureFlagCondition {
    type: 'feature-flag'
    flag: FeatureName
    value: boolean
}

interface CompositeCondition {
    type: 'composite'
    operator: 'and' | 'or'     // Literal strings
    conditions: AvailabilityCondition[]
}

// Type definitions with literal constraints
type VersionString = string    // Should match /^\d+\.\d+\.\d+$/

type TimeUnit = 
    | 'ms'                     // Milliseconds
    | 's'                      // Seconds  
    | 'm'                      // Minutes
    | 'h'                      // Hours
    | 'd'                      // Days

type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

type DayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31

type DateLiteral = string      // ISO 8601 date: YYYY-MM-DD
type TimeLiteral = string      // ISO 8601 time: HH:MM:SS
type TimeZone = string         // IANA timezone

type ScheduleType = 'cron' | 'interval' | 'daily' | 'weekly' | 'monthly'
type ScheduleValue = string | number | CronExpression | DailySchedule

interface CronExpression {
    expression: string         // Cron pattern
}

interface DailySchedule {
    hour: number              // 0-23
    minute: number            // 0-59
}

type FeatureName = string     // Specific feature identifiers

type IPType = 'ipv4' | 'ipv6'
type PortNumber = number      // 1-65535

type SettingKey = string      // Dotted notation like "app.feature.enabled"

type HexColor = string        // #RRGGBB or #RRGGBBAA
type AlphaValue = number      // 0.0 to 1.0

type SizeUnit = 'px' | 'em' | 'rem' | '%' | 'vw' | 'vh'

type Percentage = number      // 0 to 100

type RegexFlags = 'g' | 'i' | 'm' | 's' | 'u' | 'y'

type JsonPropertyValue = 
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonArray

interface JsonArray {
    items: JsonPropertyValue[]
}

type LicenseType = 
    | 'MIT'
    | 'Apache-2.0'
    | 'GPL-3.0'
    | 'BSD-3-Clause'
    | 'ISC'
    | 'Proprietary'

type Priority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

type Category = 
    | 'utility'
    | 'security'
    | 'performance'
    | 'ui'
    | 'backend'
    | 'frontend'
    | 'database'
    | 'api'