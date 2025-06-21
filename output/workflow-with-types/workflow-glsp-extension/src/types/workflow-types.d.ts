/**
 * Type definitions for workflow
 * @generated
 * @module workflow-types
 */

// Branded type definitions
export type NodeId = string & { readonly __brand: unique symbol };

// Interface definitions
/**
 * Workflow interface
 */
export interface Workflow {
    /**
     * name property
     */
    name: string[];
    /**
     * version property
     */
    version: string[];
    /**
     * description property
     */
    description: string[];
    /**
     * tasks property
     */
    tasks: Task[] | undefined;
    /**
     * flows property
     */
    flows: Flow[] | undefined;
    /**
     * startTask property
     */
    startTask: Task[];
    /**
     * endTasks property
     */
    endTasks: Task[] | undefined;
}

export namespace Workflow {
    export type Create = Omit<Workflow, 'id'> & { id?: NodeId };
    export type Update = DeepPartial<Omit<Workflow, 'id'>>;
    export type Patch = Partial<Update>;
}

/**
 * Task interface
 */
export interface Task {
    /**
     * id property
     */
    readonly id: string[];
    /**
     * name property
     */
    name: string[];
    /**
     * type property
     */
    type: TaskType[];
    /**
     * assignee property
     */
    assignee: string[];
    /**
     * description property
     */
    description: string[];
    /**
     * inputs property
     */
    inputs: Parameter[] | undefined;
    /**
     * outputs property
     */
    outputs: Parameter[] | undefined;
    /**
     * timeout property
     */
    timeout: number[];
}

export namespace Task {
    export type Create = Omit<Task, 'id'> & { id?: NodeId };
    export type Update = DeepPartial<Omit<Task, 'id'>>;
    export type Patch = Partial<Update>;
}

/**
 * Flow interface
 */
export interface Flow {
    /**
     * from property
     */
    from: Task[];
    /**
     * to property
     */
    to: Task[];
    /**
     * condition property
     */
    condition: string[];
    /**
     * priority property
     */
    priority: number[];
}

export namespace Flow {
    export type Create = Omit<Flow, 'id'> & { id?: NodeId };
    export type Update = DeepPartial<Omit<Flow, 'id'>>;
    export type Patch = Partial<Update>;
}

/**
 * Parameter interface
 */
export interface Parameter {
    /**
     * name property
     */
    name: string[];
    /**
     * type property
     */
    type: DataType[];
    /**
     * required property
     */
    required?: string[];
    /**
     * defaultValue property
     */
    defaultValue: string[];
}

export namespace Parameter {
    export type Create = Omit<Parameter, 'id'> & { id?: NodeId };
    export type Update = DeepPartial<Omit<Parameter, 'id'>>;
    export type Patch = Partial<Update>;
}

// Type definitions
// Utility types
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

export type Diff<T, U> = T extends U ? never : T;
export type Filter<T, U> = T extends U ? T : never;

// Branded type constructors
export const NodeId = {
    create(id: string): NodeId {
        return id as NodeId;
    },
    validate(id: unknown): id is NodeId {
        return typeof id === 'string' && id.length > 0;
    }
};

// Type predicates
export function isWorkflow(obj: unknown): obj is Workflow {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        '' in obj &&
        (obj as any). === 'workflow'
    );
}

export function isTask(obj: unknown): obj is Task {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        '' in obj &&
        (obj as any). === 'task'
    );
}

export function isFlow(obj: unknown): obj is Flow {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        '' in obj &&
        (obj as any). === 'flow'
    );
}

export function isParameter(obj: unknown): obj is Parameter {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        '' in obj &&
        (obj as any). === 'parameter'
    );
}

