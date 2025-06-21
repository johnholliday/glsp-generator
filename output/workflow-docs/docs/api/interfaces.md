# Interface Documentation

## Workflow

Model interface for Workflow elements.

**Extends:** 


### Properties

#### name

- **Type:** `string`
- **Required:** true
- **Description:** Display name of the element

```typescript
/**
 * Display name of the element
 * @type {string}
 * @required
 */
name: string;
```


#### version

- **Type:** `string`
- **Required:** true
- **Description:** Property version of type string

```typescript
/**
 * Property version of type string
 * @type {string}
 * @required
 */
version: string;
```


#### description

- **Type:** `string`
- **Required:** true
- **Description:** Property description of type string

```typescript
/**
 * Property description of type string
 * @type {string}
 * @required
 */
description: string;
```


#### tasks

- **Type:** `Task[]`
- **Required:** true
- **Description:** Property tasks of type Task

```typescript
/**
 * Property tasks of type Task
 * @type {Task[]}
 * @required
 */
tasks: Task[];
```


#### flows

- **Type:** `Flow[]`
- **Required:** true
- **Description:** Property flows of type Flow

```typescript
/**
 * Property flows of type Flow
 * @type {Flow[]}
 * @required
 */
flows: Flow[];
```


#### startTask

- **Type:** `Task`
- **Required:** true
- **Description:** Property startTask of type Task

```typescript
/**
 * Property startTask of type Task
 * @type {Task}
 * @required
 */
startTask: Task;
```


#### endTasks

- **Type:** `Task[]`
- **Required:** true
- **Description:** Property endTasks of type Task

```typescript
/**
 * Property endTasks of type Task
 * @type {Task[]}
 * @required
 */
endTasks: Task[];
```





### Examples

**Creating a Workflow**

```typescript
const workflow: Workflow = {
    name: "value",
    version: "value",
    description: "value",
    tasks: [TaskValue],
    flows: [FlowValue],
    startTask: TaskValue,
    endTasks: [TaskValue]
};
```

**Validating a Workflow**

```typescript
function validateWorkflow(obj: Workflow): boolean {
    return obj.name !== undefined && obj.version !== undefined && obj.description !== undefined && obj.tasks !== undefined && obj.flows !== undefined && obj.startTask !== undefined && obj.endTasks !== undefined;
}
```


---

## Task

Model interface for Task elements.

**Extends:** 


### Properties

#### id

- **Type:** `string`
- **Required:** true
- **Description:** Unique identifier for the element

```typescript
/**
 * Unique identifier for the element
 * @type {string}
 * @required
 */
id: string;
```


#### name

- **Type:** `string`
- **Required:** true
- **Description:** Display name of the element

```typescript
/**
 * Display name of the element
 * @type {string}
 * @required
 */
name: string;
```


#### type

- **Type:** `TaskType`
- **Required:** true
- **Description:** Property type of type TaskType

```typescript
/**
 * Property type of type TaskType
 * @type {TaskType}
 * @required
 */
type: TaskType;
```


#### assignee

- **Type:** `string`
- **Required:** true
- **Description:** Property assignee of type string

```typescript
/**
 * Property assignee of type string
 * @type {string}
 * @required
 */
assignee: string;
```


#### description

- **Type:** `string`
- **Required:** true
- **Description:** Property description of type string

```typescript
/**
 * Property description of type string
 * @type {string}
 * @required
 */
description: string;
```


#### inputs

- **Type:** `Parameter[]`
- **Required:** true
- **Description:** Property inputs of type Parameter

```typescript
/**
 * Property inputs of type Parameter
 * @type {Parameter[]}
 * @required
 */
inputs: Parameter[];
```


#### outputs

- **Type:** `Parameter[]`
- **Required:** true
- **Description:** Property outputs of type Parameter

```typescript
/**
 * Property outputs of type Parameter
 * @type {Parameter[]}
 * @required
 */
outputs: Parameter[];
```


#### timeout

- **Type:** `number`
- **Required:** true
- **Description:** Property timeout of type number

```typescript
/**
 * Property timeout of type number
 * @type {number}
 * @required
 */
timeout: number;
```





### Examples

**Creating a Task**

```typescript
const task: Task = {
    id: "value",
    name: "value",
    type: TaskTypeValue,
    assignee: "value",
    description: "value",
    inputs: [ParameterValue],
    outputs: [ParameterValue],
    timeout: 42
};
```

**Validating a Task**

```typescript
function validateTask(obj: Task): boolean {
    return obj.id !== undefined && obj.name !== undefined && obj.type !== undefined && obj.assignee !== undefined && obj.description !== undefined && obj.inputs !== undefined && obj.outputs !== undefined && obj.timeout !== undefined;
}
```


---

## Flow

Model interface for Flow elements.

**Extends:** 


### Properties

#### from

- **Type:** `Task`
- **Required:** true
- **Description:** Property from of type Task

```typescript
/**
 * Property from of type Task
 * @type {Task}
 * @required
 */
from: Task;
```


#### to

- **Type:** `Task`
- **Required:** true
- **Description:** Property to of type Task

```typescript
/**
 * Property to of type Task
 * @type {Task}
 * @required
 */
to: Task;
```


#### condition

- **Type:** `string`
- **Required:** true
- **Description:** Property condition of type string

```typescript
/**
 * Property condition of type string
 * @type {string}
 * @required
 */
condition: string;
```


#### priority

- **Type:** `number`
- **Required:** true
- **Description:** Property priority of type number

```typescript
/**
 * Property priority of type number
 * @type {number}
 * @required
 */
priority: number;
```





### Examples

**Creating a Flow**

```typescript
const flow: Flow = {
    from: TaskValue,
    to: TaskValue,
    condition: "value",
    priority: 42
};
```

**Validating a Flow**

```typescript
function validateFlow(obj: Flow): boolean {
    return obj.from !== undefined && obj.to !== undefined && obj.condition !== undefined && obj.priority !== undefined;
}
```


---

## Parameter

Model interface for Parameter elements.

**Extends:** 


### Properties

#### name

- **Type:** `string`
- **Required:** true
- **Description:** Display name of the element

```typescript
/**
 * Display name of the element
 * @type {string}
 * @required
 */
name: string;
```


#### type

- **Type:** `DataType`
- **Required:** true
- **Description:** Property type of type DataType

```typescript
/**
 * Property type of type DataType
 * @type {DataType}
 * @required
 */
type: DataType;
```


#### required

- **Type:** `string`
- **Required:** false
- **Description:** Property required of type string

```typescript
/**
 * Property required of type string
 * @type {string}
 * @optional
 */
required?: string;
```


#### defaultValue

- **Type:** `string`
- **Required:** true
- **Description:** Property defaultValue of type string

```typescript
/**
 * Property defaultValue of type string
 * @type {string}
 * @required
 */
defaultValue: string;
```





### Examples

**Creating a Parameter**

```typescript
const parameter: Parameter = {
    name: "value",
    type: DataTypeValue,
    defaultValue: "value"
};
```

**Validating a Parameter**

```typescript
function validateParameter(obj: Parameter): boolean {
    return obj.name !== undefined && obj.type !== undefined && obj.defaultValue !== undefined;
}
```

