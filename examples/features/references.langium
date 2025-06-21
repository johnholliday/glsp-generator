// References and Cross-References Feature Showcase
// Demonstrates various reference patterns in Langium
// This example shows:
// - Simple references with @
// - Bidirectional references
// - Circular references
// - Reference collections
// - Qualified references

grammar References

// Model root containing all elements
interface Model {
    name: string
    packages: Package[]
    imports?: Import[]
}

// Import statements for cross-model references
interface Import {
    path: string
    alias?: string
}

// Package container
interface Package {
    name: string
    parent?: @Package           // Self-reference for nested packages
    elements: PackageElement[]
}

// Base for package elements
interface PackageElement {
    name: string
    package: @Package          // Back-reference to containing package
}

// Class with various reference types
interface Class extends PackageElement {
    // Single references
    superClass?: @Class        // Optional reference
    defaultInterface?: @Interface
    
    // Collection references
    interfaces: @Interface[]   // Multiple interface implementation
    usedClasses: @Class[]     // Dependencies
    
    // Members that can reference other elements
    attributes: Attribute[]
    methods: Method[]
    
    // Circular reference example
    companion?: @Class         // Companion object pattern
}

// Interface definition
interface Interface extends PackageElement {
    superInterfaces: @Interface[]  // Multiple inheritance
    implementedBy?: @Class[]       // Reverse reference tracking
}

// Attribute with type reference
interface Attribute {
    name: string
    type: @Type                    // Reference to type
    visibility?: Visibility
    
    // References with constraints
    referencedClass?: @Class       // When type is a class reference
    inverseAttribute?: @Attribute  // For bidirectional associations
}

// Method with various references
interface Method {
    name: string
    returnType?: @Type
    parameters: Parameter[]
    
    // Method references
    overrides?: @Method           // Method overriding
    calls?: @Method[]            // Methods this method calls
    calledBy?: @Method[]         // Methods that call this method
    
    // Exception references
    throws?: @Exception[]
}

// Parameter with type reference
interface Parameter {
    name: string
    type: @Type
    defaultValue?: string
}

// Type definitions
interface Type extends PackageElement {
    kind: TypeKind
}

// Primitive types
interface PrimitiveType extends Type {
    // Inherited: name, package, kind
}

// Array type with element type reference
interface ArrayType extends Type {
    elementType: @Type           // Reference to element type
    dimensions: number
}

// Generic type with type parameters
interface GenericType extends Type {
    baseType: @Type
    typeArguments: @Type[]       // Type parameter references
}

// Exception type
interface Exception extends Type {
    superException?: @Exception   // Exception hierarchy
}

// Association between classes
interface Association extends PackageElement {
    // Bidirectional references
    source: AssociationEnd
    target: AssociationEnd
    
    // Reference to association class if any
    associationClass?: @Class
}

// Association end with class reference
interface AssociationEnd {
    class: @Class
    role?: string
    multiplicity?: string
    navigable?: boolean
    
    // Reference to the attribute representing this end
    attribute?: @Attribute
}

// Dependency with source and target
interface Dependency extends PackageElement {
    source: @PackageElement      // What depends
    target: @PackageElement      // What is depended upon
    type: DependencyType
}

// State machine with state references
interface StateMachine extends PackageElement {
    states: State[]
    transitions: Transition[]
    initialState: @State         // Reference to initial state
    finalStates: @State[]       // References to final states
}

// State definition
interface State {
    name: string
    parent?: @State             // For nested states
    
    // Entry/exit actions can reference methods
    entryAction?: @Method
    exitAction?: @Method
}

// Transition with state references
interface Transition {
    name?: string
    source: @State
    target: @State
    
    // Trigger can reference a method/event
    trigger?: @Method
    guard?: @Method             // Guard condition method
    action?: @Method           // Transition action
}

// Configuration that references multiple elements
interface Configuration extends PackageElement {
    // References to configured elements
    configuredClasses: @Class[]
    configuredInterfaces: @Interface[]
    
    // Property overrides reference attributes
    propertyOverrides: PropertyOverride[]
}

// Property override with attribute reference
interface PropertyOverride {
    attribute: @Attribute
    value: string
}

// Validation rule that can reference any element
interface ValidationRule extends PackageElement {
    // The element type this rule applies to
    targetType: @Type
    
    // Elements this rule validates
    validates: @PackageElement[]
    
    // Rule implementation might reference a method
    implementation?: @Method
}

// Test case with references to tested elements
interface TestCase extends PackageElement {
    // What is being tested
    testedClass?: @Class
    testedMethod?: @Method
    testedInterface?: @Interface
    
    // Test setup/teardown methods
    setup?: @Method
    teardown?: @Method
    
    // Related test cases
    dependsOn?: @TestCase[]
}

// Enumerations
type TypeKind = 'primitive' | 'class' | 'interface' | 'array' | 'generic' | 'exception'
type Visibility = 'public' | 'private' | 'protected' | 'package'
type DependencyType = 'uses' | 'creates' | 'calls' | 'implements' | 'extends'