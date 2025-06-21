grammar ValidationTest

// Example with naming convention issues
interface state {  // Should be PascalCase
    Name: string   // Should be camelCase
    name: string   // Duplicate property
}

// Example with undefined type reference
interface Transition {
    source: @State  // 'State' is not defined (only 'state' exists)
    target: @state
    guard?: Expression  // 'Expression' is not defined
}

// Example with circular reference
interface Container {
    parent?: @Container  // Circular reference warning
    children: Container[]
}

// Empty interface (warning)
interface Empty {
}

// Type with issues
type Status = 'active' | 'inactive' | 'pending';
type Priority = High | Medium | Low;  // Undefined types