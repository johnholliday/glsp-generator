# workflow Syntax Guide

## Overview

This document describes the syntax of the workflow modeling language.

## Interfaces


### Workflow

<p class="description">Interface defining the structure of Workflow elements.</p>

**Syntax:**
```
Workflow <name> {
    name: string
    version: string
    description: string
    tasks: Task[]
    flows: Flow[]
    startTask: Task
    endTasks: Task[]
}
```

**Example:**
```
Workflow exampleWorkflow {
    name: "example"
    version: "example"
    description: "example"
    tasks: [@referenceId]
    flows: [@referenceId]
    startTask: @referenceId
    endTasks: [@referenceId]
}
```


### Task

<p class="description">Interface defining the structure of Task elements.</p>

**Syntax:**
```
Task <name> {
    id: string
    name: string
    type: TaskType
    assignee: string
    description: string
    inputs: Parameter[]
    outputs: Parameter[]
    timeout: number
}
```

**Example:**
```
Task exampleTask {
    id: "example"
    name: "example"
    type: @referenceId
    assignee: "example"
    description: "example"
    inputs: [@referenceId]
    outputs: [@referenceId]
    timeout: 42
}
```


### Flow

<p class="description">Interface defining the structure of Flow elements.</p>

**Syntax:**
```
Flow <name> {
    from: Task
    to: Task
    condition: string
    priority: number
}
```

**Example:**
```
Flow exampleFlow {
    from: @referenceId
    to: @referenceId
    condition: "example"
    priority: 42
}
```


### Parameter

<p class="description">Interface defining the structure of Parameter elements.</p>

**Syntax:**
```
Parameter <name> {
    name: string
    type: DataType
    required?: string
    defaultValue: string
}
```

**Example:**
```
Parameter exampleParameter {
    name: "example"
    type: @referenceId
    defaultValue: "example"
}
```


## Types



## Grammar Rules

### Identifiers
- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Case-sensitive

### References
- Use `@` prefix to reference other elements
- Example: `source: @node1`

### Arrays
- Denoted by `[]` after the type
- Example: `children: Node[]`

### Optional Properties
- Denoted by `?` after the property name
- Example: `description?: string`

### Comments
- Single-line: `// comment`
- Multi-line: `/* comment */`
