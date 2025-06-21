# workflow Model Tutorial

## Introduction

This tutorial will guide you through creating workflow models step by step.

## Prerequisites

- Basic understanding of modeling languages
- Text editor with syntax highlighting (recommended)

## Lesson 1: Creating Your First Element

Let's start with the simplest possible model element.

### Step 1: Basic Structure

Every element in workflow follows this pattern:

```
InterfaceName elementName {
    property1: value1
    property2: value2
}
```

### Step 2: Your First Workflow

```
Workflow myFirst {
    name: "value1"
    version: "value1"
}
```

## Lesson 2: Understanding Properties

### Required vs Optional Properties

- **Required properties** must always be specified
- **Optional properties** (marked with ?) can be omitted

```
Workflow example {
    // Required properties
    name: "value1"
    version: "value1"
    description: "value1"
    tasks: [@task1]
    flows: [@flow1]
    startTask: @task1
    endTasks: [@task1]
    
    // Optional properties (can be omitted)

}
```

## Lesson 3: Working with Types

### Built-in Types

The language supports standard types like string, number, and boolean.

## Lesson 4: References and Relationships

Elements can reference each other using the @ symbol:

```
Workflow element1 {
    name: "elem1"
}

Task element2 {
    id: "elem2"
    type: @element1
}
```

## Lesson 5: Arrays

Properties can hold multiple values using array notation:

```
Workflow container {
    tasks: [@task1, @task2]
}
```

## Best Practices

1. **Use meaningful names** for your elements
2. **Keep models organized** with comments
3. **Validate your models** regularly
4. **Start simple** and add complexity gradually

## Next Steps

- Explore the [advanced examples](./advanced.model)
- Read the [API documentation](../api/)
- Try creating your own models!
