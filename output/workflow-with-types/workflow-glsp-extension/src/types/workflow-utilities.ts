/**
 * Type utility functions for workflow
 * @generated
 */

import type { Workflow, Task, Flow, Parameter } from './workflow-types.js';
import { WorkflowSchema, TaskSchema, FlowSchema, ParameterSchema } from './workflow-schemas.js';
import { z } from 'zod';

// Utility type definitions
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? DeepPartial<U>[]
        : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends (infer U)[]
        ? ReadonlyArray<DeepReadonly<U>>
        : T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};

export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};

export type DeepMutable<T> = {
    -readonly [P in keyof T]: T[P] extends (infer U)[]
        ? DeepMutable<U>[]
        : T[P] extends object
        ? DeepMutable<T[P]>
        : T[P];
};

export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

export type PickRequired<T> = Pick<T, RequiredKeys<T>>;
export type PickOptional<T> = Pick<T, OptionalKeys<T>>;

export type Diff<T, U> = T extends U ? never : T;
export type Filter<T, U> = T extends U ? T : never;

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Factory functions
export interface WorkflowFactory {
    create(partial?: Partial<Workflow>): Workflow;
    createMany(count: number, partial?: Partial<Workflow>): Workflow[];
    createWithDefaults(): Workflow;
    validate(obj: unknown): obj is Workflow;
    parse(obj: unknown): Workflow;
}

export const workflowFactory: WorkflowFactory = {
    create(partial?: Partial<Workflow>): Workflow {
        const defaults = {
            id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'workflow',
            name: 'default',
            version: 'default',
            description: 'default',
            tasks: [],
            flows: [],
            startTask: undefined,
            endTasks: [],
        };
        
        const merged = { ...defaults, ...partial };
        return WorkflowSchema.parse(merged);
    },
    
    createMany(count: number, partial?: Partial<Workflow>): Workflow[] {
        return Array.from({ length: count }, (_, i) => 
            this.create({ ...partial, id: `workflow_${i}` })
        );
    },
    
    createWithDefaults(): Workflow {
        return this.create();
    },
    
    validate(obj: unknown): obj is Workflow {
        return WorkflowSchema.safeParse(obj).success;
    },
    
    parse(obj: unknown): Workflow {
        return WorkflowSchema.parse(obj);
    }
};

export interface TaskFactory {
    create(partial?: Partial<Task>): Task;
    createMany(count: number, partial?: Partial<Task>): Task[];
    createWithDefaults(): Task;
    validate(obj: unknown): obj is Task;
    parse(obj: unknown): Task;
}

export const taskFactory: TaskFactory = {
    create(partial?: Partial<Task>): Task {
        const defaults = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'task',
            id: 'default',
            name: 'default',
            type: undefined,
            assignee: 'default',
            description: 'default',
            inputs: [],
            outputs: [],
            timeout: 0,
        };
        
        const merged = { ...defaults, ...partial };
        return TaskSchema.parse(merged);
    },
    
    createMany(count: number, partial?: Partial<Task>): Task[] {
        return Array.from({ length: count }, (_, i) => 
            this.create({ ...partial, id: `task_${i}` })
        );
    },
    
    createWithDefaults(): Task {
        return this.create();
    },
    
    validate(obj: unknown): obj is Task {
        return TaskSchema.safeParse(obj).success;
    },
    
    parse(obj: unknown): Task {
        return TaskSchema.parse(obj);
    }
};

export interface FlowFactory {
    create(partial?: Partial<Flow>): Flow;
    createMany(count: number, partial?: Partial<Flow>): Flow[];
    createWithDefaults(): Flow;
    validate(obj: unknown): obj is Flow;
    parse(obj: unknown): Flow;
}

export const flowFactory: FlowFactory = {
    create(partial?: Partial<Flow>): Flow {
        const defaults = {
            id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'flow',
            from: undefined,
            to: undefined,
            condition: 'default',
            priority: 0,
        };
        
        const merged = { ...defaults, ...partial };
        return FlowSchema.parse(merged);
    },
    
    createMany(count: number, partial?: Partial<Flow>): Flow[] {
        return Array.from({ length: count }, (_, i) => 
            this.create({ ...partial, id: `flow_${i}` })
        );
    },
    
    createWithDefaults(): Flow {
        return this.create();
    },
    
    validate(obj: unknown): obj is Flow {
        return FlowSchema.safeParse(obj).success;
    },
    
    parse(obj: unknown): Flow {
        return FlowSchema.parse(obj);
    }
};

export interface ParameterFactory {
    create(partial?: Partial<Parameter>): Parameter;
    createMany(count: number, partial?: Partial<Parameter>): Parameter[];
    createWithDefaults(): Parameter;
    validate(obj: unknown): obj is Parameter;
    parse(obj: unknown): Parameter;
}

export const parameterFactory: ParameterFactory = {
    create(partial?: Partial<Parameter>): Parameter {
        const defaults = {
            id: `parameter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'parameter',
            name: 'default',
            type: undefined,
            defaultValue: 'default',
        };
        
        const merged = { ...defaults, ...partial };
        return ParameterSchema.parse(merged);
    },
    
    createMany(count: number, partial?: Partial<Parameter>): Parameter[] {
        return Array.from({ length: count }, (_, i) => 
            this.create({ ...partial, id: `parameter_${i}` })
        );
    },
    
    createWithDefaults(): Parameter {
        return this.create();
    },
    
    validate(obj: unknown): obj is Parameter {
        return ParameterSchema.safeParse(obj).success;
    },
    
    parse(obj: unknown): Parameter {
        return ParameterSchema.parse(obj);
    }
};

// Builder pattern
export class WorkflowBuilder {
    private data: Partial<Workflow> = {};
    
    withId(id: string): this {
        this.data.id = id;
        return this;
    }
    
    withName(value: string[]): this {
        this.data.name = value;
        return this;
    }
    
    withVersion(value: string[]): this {
        this.data.version = value;
        return this;
    }
    
    withDescription(value: string[]): this {
        this.data.description = value;
        return this;
    }
    
    withTasks(value: Task[] | undefined): this {
        this.data.tasks = value as any;
        return this;
    }
    
    withFlows(value: Flow[] | undefined): this {
        this.data.flows = value as any;
        return this;
    }
    
    withStartTask(value: Task[]): this {
        this.data.startTask = value;
        return this;
    }
    
    withEndTasks(value: Task[] | undefined): this {
        this.data.endTasks = value as any;
        return this;
    }
    
    build(): Workflow {
        return workflowFactory.create(this.data);
    }
    
    buildMany(count: number): Workflow[] {
        return Array.from({ length: count }, () => this.build());
    }
}

export class TaskBuilder {
    private data: Partial<Task> = {};
    
    withId(id: string): this {
        this.data.id = id;
        return this;
    }
    
    withId(value: string[]): this {
        this.data.id = value;
        return this;
    }
    
    withName(value: string[]): this {
        this.data.name = value;
        return this;
    }
    
    withType(value: TaskType[]): this {
        this.data.type = value;
        return this;
    }
    
    withAssignee(value: string[]): this {
        this.data.assignee = value;
        return this;
    }
    
    withDescription(value: string[]): this {
        this.data.description = value;
        return this;
    }
    
    withInputs(value: Parameter[] | undefined): this {
        this.data.inputs = value as any;
        return this;
    }
    
    withOutputs(value: Parameter[] | undefined): this {
        this.data.outputs = value as any;
        return this;
    }
    
    withTimeout(value: number[]): this {
        this.data.timeout = value;
        return this;
    }
    
    build(): Task {
        return taskFactory.create(this.data);
    }
    
    buildMany(count: number): Task[] {
        return Array.from({ length: count }, () => this.build());
    }
}

export class FlowBuilder {
    private data: Partial<Flow> = {};
    
    withId(id: string): this {
        this.data.id = id;
        return this;
    }
    
    withFrom(value: Task[]): this {
        this.data.from = value;
        return this;
    }
    
    withTo(value: Task[]): this {
        this.data.to = value;
        return this;
    }
    
    withCondition(value: string[]): this {
        this.data.condition = value;
        return this;
    }
    
    withPriority(value: number[]): this {
        this.data.priority = value;
        return this;
    }
    
    build(): Flow {
        return flowFactory.create(this.data);
    }
    
    buildMany(count: number): Flow[] {
        return Array.from({ length: count }, () => this.build());
    }
}

export class ParameterBuilder {
    private data: Partial<Parameter> = {};
    
    withId(id: string): this {
        this.data.id = id;
        return this;
    }
    
    withName(value: string[]): this {
        this.data.name = value;
        return this;
    }
    
    withType(value: DataType[]): this {
        this.data.type = value;
        return this;
    }
    
    withRequired(value: string[] | undefined): this {
        this.data.required = value;
        return this;
    }
    
    withDefaultValue(value: string[]): this {
        this.data.defaultValue = value;
        return this;
    }
    
    build(): Parameter {
        return parameterFactory.create(this.data);
    }
    
    buildMany(count: number): Parameter[] {
        return Array.from({ length: count }, () => this.build());
    }
}

// Mapper functions
export const workflowMapper = {
    toJSON(obj: Workflow): string {
        return JSON.stringify(obj, null, 2);
    },
    
    fromJSON(json: string): Workflow {
        return WorkflowSchema.parse(JSON.parse(json));
    },
    
    toPlainObject(obj: Workflow): Record<string, any> {
        return { ...obj };
    },
    
    pick<K extends keyof Workflow>(obj: Workflow, keys: K[]): Pick<Workflow, K> {
        const result = {} as Pick<Workflow, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },
    
    omit<K extends keyof Workflow>(obj: Workflow, keys: K[]): Omit<Workflow, K> {
        const result = { ...obj } as any;
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },
    
    merge(target: Workflow, ...sources: Partial<Workflow>[]): Workflow {
        return Object.assign({}, target, ...sources) as Workflow;
    }
};

export const taskMapper = {
    toJSON(obj: Task): string {
        return JSON.stringify(obj, null, 2);
    },
    
    fromJSON(json: string): Task {
        return TaskSchema.parse(JSON.parse(json));
    },
    
    toPlainObject(obj: Task): Record<string, any> {
        return { ...obj };
    },
    
    pick<K extends keyof Task>(obj: Task, keys: K[]): Pick<Task, K> {
        const result = {} as Pick<Task, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },
    
    omit<K extends keyof Task>(obj: Task, keys: K[]): Omit<Task, K> {
        const result = { ...obj } as any;
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },
    
    merge(target: Task, ...sources: Partial<Task>[]): Task {
        return Object.assign({}, target, ...sources) as Task;
    }
};

export const flowMapper = {
    toJSON(obj: Flow): string {
        return JSON.stringify(obj, null, 2);
    },
    
    fromJSON(json: string): Flow {
        return FlowSchema.parse(JSON.parse(json));
    },
    
    toPlainObject(obj: Flow): Record<string, any> {
        return { ...obj };
    },
    
    pick<K extends keyof Flow>(obj: Flow, keys: K[]): Pick<Flow, K> {
        const result = {} as Pick<Flow, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },
    
    omit<K extends keyof Flow>(obj: Flow, keys: K[]): Omit<Flow, K> {
        const result = { ...obj } as any;
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },
    
    merge(target: Flow, ...sources: Partial<Flow>[]): Flow {
        return Object.assign({}, target, ...sources) as Flow;
    }
};

export const parameterMapper = {
    toJSON(obj: Parameter): string {
        return JSON.stringify(obj, null, 2);
    },
    
    fromJSON(json: string): Parameter {
        return ParameterSchema.parse(JSON.parse(json));
    },
    
    toPlainObject(obj: Parameter): Record<string, any> {
        return { ...obj };
    },
    
    pick<K extends keyof Parameter>(obj: Parameter, keys: K[]): Pick<Parameter, K> {
        const result = {} as Pick<Parameter, K>;
        keys.forEach(key => {
            if (key in obj) {
                result[key] = obj[key];
            }
        });
        return result;
    },
    
    omit<K extends keyof Parameter>(obj: Parameter, keys: K[]): Omit<Parameter, K> {
        const result = { ...obj } as any;
        keys.forEach(key => {
            delete result[key];
        });
        return result;
    },
    
    merge(target: Parameter, ...sources: Partial<Parameter>[]): Parameter {
        return Object.assign({}, target, ...sources) as Parameter;
    }
};

// Comparison functions
export const workflowComparer = {
    equals(a: Workflow, b: Workflow): boolean {
        return a.id === b.id && JSON.stringify(a) === JSON.stringify(b);
    },
    
    shallowEquals(a: Workflow, b: Workflow): boolean {
        const keys = Object.keys(a) as (keyof Workflow)[];
        return keys.every(key => a[key] === b[key]);
    },
    
    diff(a: Workflow, b: Workflow): Partial<Workflow> {
        const result: Partial<Workflow> = {};
        const keys = Object.keys(b) as (keyof Workflow)[];
        
        keys.forEach(key => {
            if (a[key] !== b[key]) {
                result[key] = b[key] as any;
            }
        });
        
        return result;
    },
    
    patch(target: Workflow, patch: Partial<Workflow>): Workflow {
        return { ...target, ...patch };
    }
};

export const taskComparer = {
    equals(a: Task, b: Task): boolean {
        return a.id === b.id && JSON.stringify(a) === JSON.stringify(b);
    },
    
    shallowEquals(a: Task, b: Task): boolean {
        const keys = Object.keys(a) as (keyof Task)[];
        return keys.every(key => a[key] === b[key]);
    },
    
    diff(a: Task, b: Task): Partial<Task> {
        const result: Partial<Task> = {};
        const keys = Object.keys(b) as (keyof Task)[];
        
        keys.forEach(key => {
            if (a[key] !== b[key]) {
                result[key] = b[key] as any;
            }
        });
        
        return result;
    },
    
    patch(target: Task, patch: Partial<Task>): Task {
        return { ...target, ...patch };
    }
};

export const flowComparer = {
    equals(a: Flow, b: Flow): boolean {
        return a.id === b.id && JSON.stringify(a) === JSON.stringify(b);
    },
    
    shallowEquals(a: Flow, b: Flow): boolean {
        const keys = Object.keys(a) as (keyof Flow)[];
        return keys.every(key => a[key] === b[key]);
    },
    
    diff(a: Flow, b: Flow): Partial<Flow> {
        const result: Partial<Flow> = {};
        const keys = Object.keys(b) as (keyof Flow)[];
        
        keys.forEach(key => {
            if (a[key] !== b[key]) {
                result[key] = b[key] as any;
            }
        });
        
        return result;
    },
    
    patch(target: Flow, patch: Partial<Flow>): Flow {
        return { ...target, ...patch };
    }
};

export const parameterComparer = {
    equals(a: Parameter, b: Parameter): boolean {
        return a.id === b.id && JSON.stringify(a) === JSON.stringify(b);
    },
    
    shallowEquals(a: Parameter, b: Parameter): boolean {
        const keys = Object.keys(a) as (keyof Parameter)[];
        return keys.every(key => a[key] === b[key]);
    },
    
    diff(a: Parameter, b: Parameter): Partial<Parameter> {
        const result: Partial<Parameter> = {};
        const keys = Object.keys(b) as (keyof Parameter)[];
        
        keys.forEach(key => {
            if (a[key] !== b[key]) {
                result[key] = b[key] as any;
            }
        });
        
        return result;
    },
    
    patch(target: Parameter, patch: Partial<Parameter>): Parameter {
        return { ...target, ...patch };
    }
};

// Clone utilities
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function shallowClone<T extends object>(obj: T): T {
    return { ...obj };
}

// Type assertion utilities
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
    if (value === undefined || value === null) {
        throw new Error(message || 'Value is not defined');
    }
}

export function assertType<T>(value: unknown, guard: (value: unknown) => value is T, message?: string): asserts value is T {
    if (!guard(value)) {
        throw new Error(message || 'Type assertion failed');
    }
}

// Transformation utilities
export function mapArray<T, U>(array: T[], mapper: (item: T, index: number) => U): U[] {
    return array.map(mapper);
}

export function filterMap<T, U>(array: T[], mapper: (item: T, index: number) => U | undefined): U[] {
    return array.reduce<U[]>((acc, item, index) => {
        const mapped = mapper(item, index);
        if (mapped !== undefined) {
            acc.push(mapped);
        }
        return acc;
    }, []);
}

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
    return array.reduce((acc, item) => {
        const groupKey = String(item[key]);
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(item);
        return acc;
    }, {} as Record<string, T[]>);
}



