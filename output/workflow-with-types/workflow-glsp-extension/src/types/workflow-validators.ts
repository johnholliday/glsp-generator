/**
 * Runtime validation functions for workflow
 * @generated
 */

// Validation helpers
function isObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function isString(value: unknown): value is string {
    return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

export interface ValidationError {
    path: string;
    message: string;
    value?: unknown;
}

export interface ValidationResult<T> {
    valid: boolean;
    value?: T;
    errors?: ValidationError[];
}

// Validation functions
export const validators = {
    isWorkflow(obj: unknown): ValidationResult<Workflow> {
        const errors: ValidationError[] = [];
        
        if (!isObject(obj)) {
            return { 
                valid: false, 
                errors: [{ 
                    path: '', 
                    message: 'Expected object, got ' + typeof obj,
                    value: obj
                }] 
            };
        }
        
        // Validate name
        if (!('name' in obj)) {
            errors.push({ 
                path: 'name', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const nameValue = obj.name;
            if (!isString(nameValue)) {
                errors.push({ 
                    path: 'name', 
                    message: 'Expected string, got ' + typeof nameValue
                });
            }
        }
        }
        
        // Validate version
        if (!('version' in obj)) {
            errors.push({ 
                path: 'version', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const versionValue = obj.version;
            if (!isString(versionValue)) {
                errors.push({ 
                    path: 'version', 
                    message: 'Expected string, got ' + typeof versionValue
                });
            }
        }
        }
        
        // Validate description
        if (!('description' in obj)) {
            errors.push({ 
                path: 'description', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const descriptionValue = obj.description;
            if (!isString(descriptionValue)) {
                errors.push({ 
                    path: 'description', 
                    message: 'Expected string, got ' + typeof descriptionValue
                });
            }
        }
        }
        
        // Validate tasks
        if (!('tasks' in obj)) {
            errors.push({ 
                path: 'tasks', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const tasksValue = obj.tasks;
            if (!isArray(tasksValue)) {
                errors.push({ 
                    path: 'tasks', 
                    message: 'Expected array, got ' + typeof tasksValue,
                    value: tasksValue
                });
            } else {
                tasksValue.forEach((item, index) => {
                    // Custom type validation for Task
                    const TaskResult = validators.isTask(item);
                    if (!TaskResult.valid && TaskResult.errors) {
                        errors.push(...TaskResult.errors.map(e => ({
                            ...e,
                            path: 'tasks[]' + (e.path ? '.' + e.path : '')
                        })));
                    }
                });
            }
        }
        }
        
        // Validate flows
        if (!('flows' in obj)) {
            errors.push({ 
                path: 'flows', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const flowsValue = obj.flows;
            if (!isArray(flowsValue)) {
                errors.push({ 
                    path: 'flows', 
                    message: 'Expected array, got ' + typeof flowsValue,
                    value: flowsValue
                });
            } else {
                flowsValue.forEach((item, index) => {
                    // Custom type validation for Flow
                    const FlowResult = validators.isFlow(item);
                    if (!FlowResult.valid && FlowResult.errors) {
                        errors.push(...FlowResult.errors.map(e => ({
                            ...e,
                            path: 'flows[]' + (e.path ? '.' + e.path : '')
                        })));
                    }
                });
            }
        }
        }
        
        // Validate startTask
        if (!('startTask' in obj)) {
            errors.push({ 
                path: 'startTask', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const startTaskValue = obj.startTask;
            // Custom type validation for Task
            const TaskResult = validators.isTask(startTaskValue);
            if (!TaskResult.valid && TaskResult.errors) {
                errors.push(...TaskResult.errors.map(e => ({
                    ...e,
                    path: 'startTask' + (e.path ? '.' + e.path : '')
                })));
            }
        }
        }
        
        // Validate endTasks
        if (!('endTasks' in obj)) {
            errors.push({ 
                path: 'endTasks', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const endTasksValue = obj.endTasks;
            if (!isArray(endTasksValue)) {
                errors.push({ 
                    path: 'endTasks', 
                    message: 'Expected array, got ' + typeof endTasksValue,
                    value: endTasksValue
                });
            } else {
                endTasksValue.forEach((item, index) => {
                    // Custom type validation for Task
                    const TaskResult = validators.isTask(item);
                    if (!TaskResult.valid && TaskResult.errors) {
                        errors.push(...TaskResult.errors.map(e => ({
                            ...e,
                            path: 'endTasks[]' + (e.path ? '.' + e.path : '')
                        })));
                    }
                });
            }
        }
        }
        
        // Validate references
        // Reference validation for Workflow
        
        return errors.length === 0 
            ? { valid: true, value: obj as Workflow }
            : { valid: false, errors };
    },
    
    isTask(obj: unknown): ValidationResult<Task> {
        const errors: ValidationError[] = [];
        
        if (!isObject(obj)) {
            return { 
                valid: false, 
                errors: [{ 
                    path: '', 
                    message: 'Expected object, got ' + typeof obj,
                    value: obj
                }] 
            };
        }
        
        // Validate id
        if (!('id' in obj)) {
            errors.push({ 
                path: 'id', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const idValue = obj.id;
            if (!isString(idValue)) {
                errors.push({ 
                    path: 'id', 
                    message: 'Expected string, got ' + typeof idValue
                });
            }
        }
        }
        
        // Validate name
        if (!('name' in obj)) {
            errors.push({ 
                path: 'name', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const nameValue = obj.name;
            if (!isString(nameValue)) {
                errors.push({ 
                    path: 'name', 
                    message: 'Expected string, got ' + typeof nameValue
                });
            }
        }
        }
        
        // Validate type
        if (!('type' in obj)) {
            errors.push({ 
                path: 'type', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const typeValue = obj.type;
            // Custom type validation for TaskType
            const TaskTypeResult = validators.isTaskType(typeValue);
            if (!TaskTypeResult.valid && TaskTypeResult.errors) {
                errors.push(...TaskTypeResult.errors.map(e => ({
                    ...e,
                    path: 'type' + (e.path ? '.' + e.path : '')
                })));
            }
        }
        }
        
        // Validate assignee
        if (!('assignee' in obj)) {
            errors.push({ 
                path: 'assignee', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const assigneeValue = obj.assignee;
            if (!isString(assigneeValue)) {
                errors.push({ 
                    path: 'assignee', 
                    message: 'Expected string, got ' + typeof assigneeValue
                });
            }
        }
        }
        
        // Validate description
        if (!('description' in obj)) {
            errors.push({ 
                path: 'description', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const descriptionValue = obj.description;
            if (!isString(descriptionValue)) {
                errors.push({ 
                    path: 'description', 
                    message: 'Expected string, got ' + typeof descriptionValue
                });
            }
        }
        }
        
        // Validate inputs
        if (!('inputs' in obj)) {
            errors.push({ 
                path: 'inputs', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const inputsValue = obj.inputs;
            if (!isArray(inputsValue)) {
                errors.push({ 
                    path: 'inputs', 
                    message: 'Expected array, got ' + typeof inputsValue,
                    value: inputsValue
                });
            } else {
                inputsValue.forEach((item, index) => {
                    // Custom type validation for Parameter
                    const ParameterResult = validators.isParameter(item);
                    if (!ParameterResult.valid && ParameterResult.errors) {
                        errors.push(...ParameterResult.errors.map(e => ({
                            ...e,
                            path: 'inputs[]' + (e.path ? '.' + e.path : '')
                        })));
                    }
                });
            }
        }
        }
        
        // Validate outputs
        if (!('outputs' in obj)) {
            errors.push({ 
                path: 'outputs', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const outputsValue = obj.outputs;
            if (!isArray(outputsValue)) {
                errors.push({ 
                    path: 'outputs', 
                    message: 'Expected array, got ' + typeof outputsValue,
                    value: outputsValue
                });
            } else {
                outputsValue.forEach((item, index) => {
                    // Custom type validation for Parameter
                    const ParameterResult = validators.isParameter(item);
                    if (!ParameterResult.valid && ParameterResult.errors) {
                        errors.push(...ParameterResult.errors.map(e => ({
                            ...e,
                            path: 'outputs[]' + (e.path ? '.' + e.path : '')
                        })));
                    }
                });
            }
        }
        }
        
        // Validate timeout
        if (!('timeout' in obj)) {
            errors.push({ 
                path: 'timeout', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const timeoutValue = obj.timeout;
            if (!isNumber(timeoutValue)) {
                errors.push({ 
                    path: 'timeout', 
                    message: 'Expected number, got ' + typeof timeoutValue
                });
            }
        }
        }
        
        // Validate references
        // Reference validation for Task
        
        return errors.length === 0 
            ? { valid: true, value: obj as Task }
            : { valid: false, errors };
    },
    
    isFlow(obj: unknown): ValidationResult<Flow> {
        const errors: ValidationError[] = [];
        
        if (!isObject(obj)) {
            return { 
                valid: false, 
                errors: [{ 
                    path: '', 
                    message: 'Expected object, got ' + typeof obj,
                    value: obj
                }] 
            };
        }
        
        // Validate from
        if (!('from' in obj)) {
            errors.push({ 
                path: 'from', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const fromValue = obj.from;
            // Custom type validation for Task
            const TaskResult = validators.isTask(fromValue);
            if (!TaskResult.valid && TaskResult.errors) {
                errors.push(...TaskResult.errors.map(e => ({
                    ...e,
                    path: 'from' + (e.path ? '.' + e.path : '')
                })));
            }
        }
        }
        
        // Validate to
        if (!('to' in obj)) {
            errors.push({ 
                path: 'to', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const toValue = obj.to;
            // Custom type validation for Task
            const TaskResult = validators.isTask(toValue);
            if (!TaskResult.valid && TaskResult.errors) {
                errors.push(...TaskResult.errors.map(e => ({
                    ...e,
                    path: 'to' + (e.path ? '.' + e.path : '')
                })));
            }
        }
        }
        
        // Validate condition
        if (!('condition' in obj)) {
            errors.push({ 
                path: 'condition', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const conditionValue = obj.condition;
            if (!isString(conditionValue)) {
                errors.push({ 
                    path: 'condition', 
                    message: 'Expected string, got ' + typeof conditionValue
                });
            }
        }
        }
        
        // Validate priority
        if (!('priority' in obj)) {
            errors.push({ 
                path: 'priority', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const priorityValue = obj.priority;
            if (!isNumber(priorityValue)) {
                errors.push({ 
                    path: 'priority', 
                    message: 'Expected number, got ' + typeof priorityValue
                });
            }
        }
        }
        
        // Validate references
        // Reference validation for Flow
        
        return errors.length === 0 
            ? { valid: true, value: obj as Flow }
            : { valid: false, errors };
    },
    
    isParameter(obj: unknown): ValidationResult<Parameter> {
        const errors: ValidationError[] = [];
        
        if (!isObject(obj)) {
            return { 
                valid: false, 
                errors: [{ 
                    path: '', 
                    message: 'Expected object, got ' + typeof obj,
                    value: obj
                }] 
            };
        }
        
        // Validate name
        if (!('name' in obj)) {
            errors.push({ 
                path: 'name', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const nameValue = obj.name;
            if (!isString(nameValue)) {
                errors.push({ 
                    path: 'name', 
                    message: 'Expected string, got ' + typeof nameValue
                });
            }
        }
        }
        
        // Validate type
        if (!('type' in obj)) {
            errors.push({ 
                path: 'type', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const typeValue = obj.type;
            // Custom type validation for DataType
            const DataTypeResult = validators.isDataType(typeValue);
            if (!DataTypeResult.valid && DataTypeResult.errors) {
                errors.push(...DataTypeResult.errors.map(e => ({
                    ...e,
                    path: 'type' + (e.path ? '.' + e.path : '')
                })));
            }
        }
        }
        
        // Validate required
        if ('required' in obj) {
            const requiredValue = obj.required;
            if (!isString(requiredValue)) {
                errors.push({ 
                    path: 'required', 
                    message: 'Expected string, got ' + typeof requiredValue
                });
            }
        }

        
        // Validate defaultValue
        if (!('defaultValue' in obj)) {
            errors.push({ 
                path: 'defaultValue', 
                message: 'Required property missing',
                value: undefined
            });
        } else {
            const defaultValueValue = obj.defaultValue;
            if (!isString(defaultValueValue)) {
                errors.push({ 
                    path: 'defaultValue', 
                    message: 'Expected string, got ' + typeof defaultValueValue
                });
            }
        }
        }
        
        // Validate references
        // Reference validation for Parameter
        
        return errors.length === 0 
            ? { valid: true, value: obj as Parameter }
            : { valid: false, errors };
    },
    
};

// Batch validation
export function validateMany<T>(
    items: unknown[],
    validator: (item: unknown) => ValidationResult<T>
): ValidationResult<T[]> {
    const results: T[] = [];
    const errors: ValidationError[] = [];
    
    items.forEach((item, index) => {
        const result = validator(item);
        if (result.valid && result.value) {
            results.push(result.value);
        } else if (result.errors) {
            errors.push(...result.errors.map(e => ({
                ...e,
                path: `[${index}]${e.path ? '.' + e.path : ''}`
            })));
        }
    });
    
    return errors.length === 0
        ? { valid: true, value: results }
        : { valid: false, errors };
}

// Deep validation
export function validateDeep<T>(
    obj: unknown,
    validator: (item: unknown) => ValidationResult<T>
): ValidationResult<T> {
    const result = validator(obj);
    if (!result.valid) {
        return result;
    }
    
    // Additional deep validation logic here
    return result;
}


