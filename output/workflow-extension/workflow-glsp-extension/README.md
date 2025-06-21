# workflow Extension

GLSP extension for workflow models

## Table of Contents

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Language Overview](#language-overview)
  - [Interfaces](#interfaces)
- [Examples](#examples)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Using npm

```bash
npm install workflow-glsp-extension
```

### Using yarn

```bash
yarn add workflow-glsp-extension
```

### Development Setup

1. Clone the repository
2. Install dependencies: `yarn install`
3. Build the extension: `yarn build`
4. Run tests: `yarn test`

## Getting Started

### Quick Example

```workflow
// Create a simple Workflow
Workflow myFirstWorkflow {
    name: "example"
    version: "example"
    description: "example"
}
```

### Features

- ✨ Full GLSP diagram editor support
- 🔧 Type-safe model definition
- 📝 Intelligent code completion
- ✅ Real-time validation
- 🎨 Customizable diagram rendering

## Language Overview

This language supports modeling workflow-glsp-extension with a rich set of interfaces and types.

## Interfaces

### Workflow

Defines the structure and properties of a Workflow element.


**Properties:**

- `name`: string - Human-readable name of the element
- `version`: string - The version property of type string
- `description`: string - The description property of type string
- `tasks`: Task[] - The tasks property of type Task
- `flows`: Flow[] - The flows property of type Flow
- `startTask`: Task - The startTask property of type Task
- `endTasks`: Task[] - The endTasks property of type Task

**Example:**

```workflow
Workflow {
    name: "example"
    version: "example"
    description: "example"
    tasks: [@element1, @element1]
    flows: [@element1, @element1]
    startTask: @element1
    endTasks: [@element1, @element1]
}
```

### Task

Defines the structure and properties of a Task element.


**Properties:**

- `id`: string - Unique identifier for the element
- `name`: string - Human-readable name of the element
- `type`: TaskType - The type property of type TaskType
- `assignee`: string - The assignee property of type string
- `description`: string - The description property of type string
- `inputs`: Parameter[] - The inputs property of type Parameter
- `outputs`: Parameter[] - The outputs property of type Parameter
- `timeout`: number - The timeout property of type number

**Example:**

```workflow
Task {
    id: "example"
    name: "example"
    type: @element1
    assignee: "example"
    description: "example"
    inputs: [@element1, @element1]
    outputs: [@element1, @element1]
    timeout: 42
}
```

### Flow

Defines the structure and properties of a Flow element.


**Properties:**

- `from`: Task - The from property of type Task
- `to`: Task - The to property of type Task
- `condition`: string - The condition property of type string
- `priority`: number - The priority property of type number

**Example:**

```workflow
Flow {
    from: @element1
    to: @element1
    condition: "example"
    priority: 42
}
```

### Parameter

Defines the structure and properties of a Parameter element.


**Properties:**

- `name`: string - Human-readable name of the element
- `type`: DataType - The type property of type DataType
- `required`: string (optional) - The required property of type string
- `defaultValue`: string - The defaultValue property of type string

**Example:**

```workflow
Parameter {
    name: "example"
    type: @element1
    defaultValue: "example"
}
```



## Examples

### Basic Model

```workflow
// Basic Workflow example
Workflow myElement {
    name: "example"
    version: "example"
    description: "example"
}
```

### Complex Model

```workflow
// Complex model with multiple elements
Workflow element1 {
    name: "example"
    version: "example"
    description: "example"
    tasks: [@element1, @element1]
    flows: [@element1, @element1]
    startTask: @element1
    endTasks: [@element1, @element1]
}

Task element2 {
    id: "example"
    name: "example"
    type: @element1
    assignee: "example"
    description: "example"
    inputs: [@element1, @element1]
    outputs: [@element1, @element1]
    timeout: 42
}

Flow element3 {
    from: @element1
    to: @element1
    condition: "example"
    priority: 42
}
```

For more examples, see the [examples directory](./docs/examples/).

## API Documentation

Full API documentation is available in the [docs/api](./docs/api/) directory.

### Key APIs

- [Model Interfaces](./docs/api/interfaces.md)
- [Type Definitions](./docs/api/types.md)
- [Server API](./docs/api/server.md)
- [Client API](./docs/api/client.md)

## Grammar Visualization

View the interactive grammar railroad diagrams at [docs/grammar/railroad.html](./docs/grammar/railroad.html).

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
