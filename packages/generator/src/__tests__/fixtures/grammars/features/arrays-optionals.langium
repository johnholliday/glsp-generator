// Arrays and Optional Properties Feature Showcase
// Demonstrates array and optional property patterns in Langium
// This example shows:
// - Optional properties with ?
// - Array properties with []
// - Nested arrays
// - Optional arrays
// - Mixed patterns

grammar ArraysOptionals

// Database schema example showing various property patterns
interface Schema {
    name: string                    // Required single value
    version?: string                // Optional single value
    description?: string            // Optional
    
    tables: Table[]                 // Required array (can be empty)
    views?: View[]                  // Optional array
    indexes?: Index[]               // Optional array
    
    triggers?: Trigger[]            // Optional array
    procedures?: StoredProcedure[]  // Optional array
    
    metadata?: Metadata             // Optional object
}

// Table with mixed required/optional properties
interface Table {
    name: string                    // Required
    schema?: string                 // Optional schema qualifier
    
    columns: Column[]               // Required array (at least one)
    primaryKey?: PrimaryKey         // Optional
    foreignKeys?: ForeignKey[]      // Optional array
    uniqueConstraints?: UniqueConstraint[]  // Optional array
    checkConstraints?: CheckConstraint[]    // Optional array
    
    indexes?: Index[]               // Optional indexes
    triggers?: Trigger[]            // Optional triggers
    
    options?: TableOption[]         // Optional array of options
    partitions?: Partition[]        // Optional partitioning
}

// Column showing all combinations
interface Column {
    name: string                    // Required
    type: DataType                  // Required
    
    // Optional single values
    length?: number
    precision?: number
    scale?: number
    defaultValue?: string
    comment?: string
    
    // Optional booleans
    nullable?: boolean              // Defaults to true if not specified
    unique?: boolean
    autoIncrement?: boolean
    
    // Optional references
    referencedColumn?: @Column      // For computed columns
    
    // Arrays
    constraints?: Constraint[]      // Optional array
    validValues?: string[]          // Optional array for enums
}

// Complex nested structure with arrays
interface View {
    name: string
    definition: QueryDefinition
    
    columns?: ViewColumn[]          // Explicitly defined columns (optional)
    dependencies?: @Table[]         // Tables this view depends on
    indexes?: Index[]               // Materialized view indexes
    
    options?: ViewOption[]
}

// Query definition with nested arrays
interface QueryDefinition {
    select: SelectClause
    from: FromClause
    where?: WhereClause             // Optional
    groupBy?: GroupByClause         // Optional
    having?: HavingClause           // Optional
    orderBy?: OrderByClause         // Optional
}

// Select clause with array of expressions
interface SelectClause {
    distinct?: boolean
    expressions: SelectExpression[]  // Array of selected items
}

// From clause with joins
interface FromClause {
    tables: TableReference[]        // Array of tables
    joins?: Join[]                  // Optional array of joins
}

// Nested optional arrays in where clause
interface WhereClause {
    conditions: Condition[]         // Array of conditions
    subqueries?: Subquery[]        // Optional array
}

// Index with array properties
interface Index {
    name: string
    table: @Table
    columns: IndexColumn[]          // Required array
    
    type?: IndexType                // Optional
    unique?: boolean
    clustered?: boolean
    
    includeColumns?: @Column[]      // Optional covering index columns
    whereClause?: string            // Optional partial index
    
    options?: IndexOption[]         // Optional array
}

// Array of arrays example
interface MatrixTable {
    name: string
    rows: Row[]                     // Array of rows
}

interface Row {
    cells: Cell[]                   // Array of cells
    metadata?: RowMetadata[]        // Optional array
}

interface Cell {
    value: string
    formulas?: Formula[]            // Optional array
    validations?: Validation[]      // Optional array
}

// Deeply nested optional arrays
interface StoredProcedure {
    name: string
    parameters?: Parameter[]        // Optional parameters
    
    body: Statement[]               // Required statements
    
    localVariables?: Variable[]     // Optional local variables
    cursors?: Cursor[]              // Optional cursors
    
    exceptionHandlers?: ExceptionHandler[]  // Optional
}

interface Statement {
    type: StatementType
    
    // Different statement types have different optional arrays
    expressions?: Expression[]
    subStatements?: Statement[]     // For blocks
    cases?: CaseClause[]           // For case statements
}

// Mixed patterns example
interface Report {
    name: string
    
    // Required arrays
    sections: Section[]
    
    // Optional single values
    title?: string
    author?: string
    date?: string
    
    // Optional arrays
    parameters?: ReportParameter[]
    filters?: Filter[]
    
    // Nested optional arrays
    charts?: Chart[]
    tables?: DataTable[]
}

interface Section {
    title: string
    content?: Content[]             // Optional array of content
    subsections?: Section[]         // Optional recursive array
}

interface Content {
    type: ContentType
    
    // Different content types have different arrays
    paragraphs?: string[]          // For text content
    dataPoints?: DataPoint[]       // For data content
    images?: Image[]               // For media content
}

// Configuration with all optional arrays
interface Configuration {
    name: string
    
    // All arrays are optional
    features?: Feature[]
    settings?: Setting[]
    profiles?: Profile[]
    rules?: Rule[]
    
    // Nested optional structure
    environments?: Environment[]
}

interface Environment {
    name: string
    
    // Mix of required and optional
    variables: Variable[]          // Required (but can be empty)
    secrets?: Secret[]             // Optional
    services?: Service[]           // Optional
    
    // Optional array of arrays
    serviceGroups?: ServiceGroup[]
}

interface ServiceGroup {
    name: string
    services: Service[]            // Required array in optional parent
}

// Supporting type definitions
interface DataType {
    name: string
    category?: string
}

interface Constraint {
    type: string
    expression?: string
}

interface PrimaryKey {
    columns: @Column[]
}

interface ForeignKey {
    columns: @Column[]
    referencedTable: @Table
    referencedColumns: @Column[]
}

// Enumerations
type StatementType = 'select' | 'insert' | 'update' | 'delete' | 'if' | 'while' | 'case'
type ContentType = 'text' | 'data' | 'media' | 'mixed'
type IndexType = 'btree' | 'hash' | 'gin' | 'gist'

// Placeholder interfaces for completeness
interface ViewColumn { name: string }
interface TableOption { key: string; value?: string }
interface ViewOption { key: string; value?: string }
interface IndexOption { key: string; value?: string }
interface Partition { name: string }
interface UniqueConstraint { columns: @Column[] }
interface CheckConstraint { expression: string }
interface Trigger { name: string }
interface SelectExpression { expression: string }
interface TableReference { table: @Table }
interface Join { type: string }
interface Condition { expression: string }
interface Subquery { query: string }
interface IndexColumn { column: @Column }
interface Metadata { [key: string]: any }
interface RowMetadata { key: string }
interface Formula { expression: string }
interface Validation { rule: string }
interface Parameter { name: string }
interface Variable { name: string }
interface Cursor { name: string }
interface ExceptionHandler { exception: string }
interface Expression { value: string }
interface CaseClause { when: string }
interface ReportParameter { name: string }
interface Filter { field: string }
interface Chart { type: string }
interface DataTable { name: string }
interface DataPoint { x: number; y: number }
interface Image { url: string }
interface Feature { name: string }
interface Setting { key: string }
interface Profile { name: string }
interface Rule { name: string }
interface Secret { name: string }
interface Service { name: string }
interface GroupByClause { columns: string[] }
interface HavingClause { condition: string }
interface OrderByClause { expressions: string[] }