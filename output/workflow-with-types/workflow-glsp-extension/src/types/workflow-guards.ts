/**
 * Type guard functions for workflow
 * @generated
 */

import type { Workflow, Task, Flow, Parameter } from './workflow-types.js';
import { validators } from './workflow-validators.js';

// Basic type guards
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

export function isArray<T>(value: unknown, guard: (item: unknown) => item is T): value is T[] {
    return Array.isArray(value) && value.every(guard);
}

// Interface type guards
export function isWorkflow(obj: unknown): obj is Workflow {
    return validators.isWorkflow(obj).valid;
}

export function isTask(obj: unknown): obj is Task {
    return validators.isTask(obj).valid;
}

export function isFlow(obj: unknown): obj is Flow {
    return validators.isFlow(obj).valid;
}

export function isParameter(obj: unknown): obj is Parameter {
    return validators.isParameter(obj).valid;
}

// Discriminated union type guards
export type WorkflowNode = Workflow | Task | Flow | Parameter;

export function isWorkflowNode(obj: unknown): obj is WorkflowNode {
    return isWorkflow(obj) || isTask(obj) || isFlow(obj) || isParameter(obj);
}

// Discriminated union narrowing
export function isWorkflowNodeType<T extends WorkflowNode['type']>(
    obj: WorkflowNode,
    type: T
): obj is Extract<WorkflowNode, { type: T }> {
    return obj.type === type;
}

// Array type guards
export function isWorkflowArray(value: unknown): value is Workflow[] {
    return isArray(value, isWorkflow);
}

export function isTaskArray(value: unknown): value is Task[] {
    return isArray(value, isTask);
}

export function isFlowArray(value: unknown): value is Flow[] {
    return isArray(value, isFlow);
}

export function isParameterArray(value: unknown): value is Parameter[] {
    return isArray(value, isParameter);
}

// Nested type guards
export function isWorkflow_tasks(value: unknown): value is Task {
    return isTask(value);
}

export function isWorkflow_flows(value: unknown): value is Flow {
    return isFlow(value);
}

export function isWorkflow_startTask(value: unknown): value is Task {
    return isTask(value);
}

export function isWorkflow_endTasks(value: unknown): value is Task {
    return isTask(value);
}

export function isTask_type(value: unknown): value is TaskType {
    return isTaskType(value);
}

export function isTask_inputs(value: unknown): value is Parameter {
    return isParameter(value);
}

export function isTask_outputs(value: unknown): value is Parameter {
    return isParameter(value);
}

export function isFlow_from(value: unknown): value is Task {
    return isTask(value);
}

export function isFlow_to(value: unknown): value is Task {
    return isTask(value);
}

export function isParameter_type(value: unknown): value is DataType {
    return isDataType(value);
}

// Type narrowing helpers
export function hasProperty<K extends PropertyKey>(
    obj: unknown,
    key: K
): obj is Record<K, unknown> {
    return isObject(obj) && key in obj;
}

export function hasProperties<K extends PropertyKey>(
    obj: unknown,
    ...keys: K[]
): obj is Record<K, unknown> {
    return isObject(obj) && keys.every(key => key in obj);
}

// Type assertion helpers
export function assertWorkflowNode(obj: unknown): asserts obj is WorkflowNode {
    if (!isWorkflowNode(obj)) {
        throw new Error(`Expected WorkflowNode, got ${typeof obj}`);
    }
}

export function assertWorkflow(obj: unknown): asserts obj is Workflow {
    if (!isWorkflow(obj)) {
        throw new Error(`Expected Workflow, got ${typeof obj}`);
    }
}

export function assertTask(obj: unknown): asserts obj is Task {
    if (!isTask(obj)) {
        throw new Error(`Expected Task, got ${typeof obj}`);
    }
}

export function assertFlow(obj: unknown): asserts obj is Flow {
    if (!isFlow(obj)) {
        throw new Error(`Expected Flow, got ${typeof obj}`);
    }
}

export function assertParameter(obj: unknown): asserts obj is Parameter {
    if (!isParameter(obj)) {
        throw new Error(`Expected Parameter, got ${typeof obj}`);
    }
}

// Exhaustiveness checking
export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

export function exhaustiveCheck<T extends { type: string }>(
    obj: T,
    handlers: { [K in T['type']]: (value: Extract<T, { type: K }>) => void }
): void {
    const type = obj.type as T['type'];
    const handler = handlers[type];
    if (handler) {
        handler(obj as any);
    } else {
        assertNever(obj);
    }
}

// Utility type guards
export function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}

export function isNotNull<T>(value: T | null): value is T {
    return value !== null;
}

export function isNotUndefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

// Type filtering
export function filterByType<T extends { type: string }, K extends T['type']>(
    items: T[],
    type: K
): Extract<T, { type: K }>[] {
    return items.filter((item): item is Extract<T, { type: K }> => item.type === type);
}

export function partitionByType<T extends { type: string }, K extends T['type']>(
    items: T[],
    type: K
): [Extract<T, { type: K }>[], Exclude<T, { type: K }>[]] {
    const matching: Extract<T, { type: K }>[] = [];
    const notMatching: Exclude<T, { type: K }>[] = [];
    
    items.forEach(item => {
        if (item.type === type) {
            matching.push(item as Extract<T, { type: K }>);
        } else {
            notMatching.push(item as Exclude<T, { type: K }>);
        }
    });
    
    return [matching, notMatching];
}