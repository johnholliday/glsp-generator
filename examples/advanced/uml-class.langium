// UML Class Diagram Grammar
// A comprehensive UML-like class modeling language
// This example demonstrates:
// - Complex class structures with multiple inheritance
// - Interfaces and abstract classes
// - Visibility modifiers
// - Stereotypes and constraints
// - Advanced associations

grammar UMLClass

// Package container
interface Package {
    name: string
    namespace?: string
    packages?: Package[]        // Nested packages
    classifiers: Classifier[]
    associations?: Association[]
    dependencies?: Dependency[]
}

// Base classifier
interface Classifier {
    name: string
    visibility?: Visibility
    isAbstract?: boolean
    stereotypes?: string[]
    constraints?: Constraint[]
    comment?: string
}

// Class definition
interface Class extends Classifier {
    superClasses?: @Class[]     // Multiple inheritance
    interfaces?: @Interface[]   // Implemented interfaces
    attributes: Attribute[]
    operations: Operation[]
    nestedClassifiers?: Classifier[]
    isActive?: boolean          // Active class (has own thread)
}

// Interface definition
interface Interface extends Classifier {
    superInterfaces?: @Interface[]
    attributes: Attribute[]
    operations: Operation[]
}

// Enumeration
interface Enumeration extends Classifier {
    literals: EnumerationLiteral[]
}

// Data type
interface DataType extends Classifier {
    attributes: Attribute[]
}

// Class attributes
interface Attribute {
    name: string
    type: Type
    visibility?: Visibility
    multiplicity?: Multiplicity
    defaultValue?: string
    isStatic?: boolean
    isReadOnly?: boolean
    isDerived?: boolean         // Computed attribute
    constraints?: Constraint[]
    stereotypes?: string[]
}

// Class operations
interface Operation {
    name: string
    visibility?: Visibility
    parameters?: Parameter[]
    returnType?: Type
    isStatic?: boolean
    isAbstract?: boolean
    isSynchronized?: boolean
    preconditions?: Constraint[]
    postconditions?: Constraint[]
    stereotypes?: string[]
}

// Operation parameters
interface Parameter {
    name: string
    type: Type
    direction?: ParameterDirection
    defaultValue?: string
    multiplicity?: Multiplicity
}

// Associations between classifiers
interface Association {
    name?: string
    ends: AssociationEnd[]
    isDerived?: boolean
    stereotypes?: string[]
}

// Association end (role)
interface AssociationEnd {
    name?: string
    classifier: @Classifier
    multiplicity?: Multiplicity
    visibility?: Visibility
    isNavigable?: boolean
    isOrdered?: boolean
    isUnique?: boolean
    aggregation?: AggregationType
    qualifiers?: Attribute[]
}

// Dependencies
interface Dependency {
    name?: string
    supplier: @Classifier
    client: @Classifier
    type: DependencyType
    stereotypes?: string[]
}

// Constraints
interface Constraint {
    name?: string
    expression: string
    language?: string           // OCL, natural language, etc.
}

// Enumeration literals
interface EnumerationLiteral {
    name: string
    value?: string
}

// Type reference
interface Type {
    classifier: @Classifier
    isArray?: boolean
    dimensions?: number[]       // For multi-dimensional arrays
}

// Multiplicity specification
interface Multiplicity {
    lower: number              // 0 means optional
    upper?: number             // -1 means unlimited (*)
    isOrdered?: boolean
    isUnique?: boolean
}

// Visibility levels
type Visibility = 'public' | 'private' | 'protected' | 'package'

// Parameter directions
type ParameterDirection = 'in' | 'out' | 'inout' | 'return'

// Aggregation types
type AggregationType = 'none' | 'shared' | 'composite'

// Dependency types
type DependencyType = 
    | 'use'             // Usage dependency
    | 'import'          // Import dependency
    | 'access'          // Access dependency
    | 'realize'         // Realization
    | 'refine'          // Refinement
    | 'trace'           // Trace dependency