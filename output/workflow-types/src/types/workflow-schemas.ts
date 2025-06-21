/**
 * Zod schemas for workflow
 * @generated
 */

import { z } from 'zod';

// Branded type schemas
export const NodeIdSchema = z.string().min(1).brand('NodeId');

// Base schemas
const BaseObjectSchema = z.object({
    id: NodeIdSchema
});

// Interface schemas
export const WorkflowSchema = z.object({

    name: z.string(),

    version: z.string(),

    description: z.string(),

    tasks: z.array(TaskSchema),

    flows: z.array(FlowSchema),

    startTask: TaskSchema,

    endTasks: z.array(TaskSchema)
}).refine(
    (data) => {
        // Add custom validation logic here
        return true;
    },
    {
        message: "Workflow validation failed"
    }
);

export const TaskSchema = z.object({

    id: z.string(),

    name: z.string(),

    type: TaskTypeSchema,

    assignee: z.string(),

    description: z.string(),

    inputs: z.array(ParameterSchema),

    outputs: z.array(ParameterSchema),

    timeout: z.number()
}).refine(
    (data) => {
        // Add custom validation logic here
        return true;
    },
    {
        message: "Task validation failed"
    }
);

export const FlowSchema = z.object({

    from: TaskSchema,

    to: TaskSchema,

    condition: z.string(),

    priority: z.number()
}).refine(
    (data) => {
        // Add custom validation logic here
        return true;
    },
    {
        message: "Flow validation failed"
    }
);

export const ParameterSchema = z.object({

    name: z.string(),

    type: DataTypeSchema,

    required: z.string().optional(),

    defaultValue: z.string()
}).refine(
    (data) => {
        // Add custom validation logic here
        return true;
    },
    {
        message: "Parameter validation failed"
    }
);

// Union schemas
export const WorkflowNodeSchema = z.discriminatedUnion('type', [
    WorkflowSchema,
    TaskSchema,
    FlowSchema,
    ParameterSchema
]);

// Type inference
export type Workflow = z.infer<typeof WorkflowSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Flow = z.infer<typeof FlowSchema>;
export type Parameter = z.infer<typeof ParameterSchema>;
export type WorkflowNode = z.infer<typeof WorkflowNodeSchema>;

// Parse functions
export function parseWorkflow(data: unknown): Workflow {
    return WorkflowSchema.parse(data);
}

export function safeParseWorkflow(data: unknown) {
    return WorkflowSchema.safeParse(data);
}

export function parseTask(data: unknown): Task {
    return TaskSchema.parse(data);
}

export function safeParseTask(data: unknown) {
    return TaskSchema.safeParse(data);
}

export function parseFlow(data: unknown): Flow {
    return FlowSchema.parse(data);
}

export function safeParseFlow(data: unknown) {
    return FlowSchema.safeParse(data);
}

export function parseParameter(data: unknown): Parameter {
    return ParameterSchema.parse(data);
}

export function safeParseParameter(data: unknown) {
    return ParameterSchema.safeParse(data);
}

// Union parse functions
export function parseWorkflowNode(data: unknown): WorkflowNode {
    return WorkflowNodeSchema.parse(data);
}

export function safeParseWorkflowNode(data: unknown) {
    return WorkflowNodeSchema.safeParse(data);
}

// Transform functions
export const WorkflowTransformSchema = WorkflowSchema.transform((data) => {
    // Add transformation logic here
    return {
        ...data,
        _type: 'Workflow' as const
    };
});

export const TaskTransformSchema = TaskSchema.transform((data) => {
    // Add transformation logic here
    return {
        ...data,
        _type: 'Task' as const
    };
});

export const FlowTransformSchema = FlowSchema.transform((data) => {
    // Add transformation logic here
    return {
        ...data,
        _type: 'Flow' as const
    };
});

export const ParameterTransformSchema = ParameterSchema.transform((data) => {
    // Add transformation logic here
    return {
        ...data,
        _type: 'Parameter' as const
    };
});

// Array schemas
export const WorkflowArraySchema = z.array(WorkflowSchema);
export const TaskArraySchema = z.array(TaskSchema);
export const FlowArraySchema = z.array(FlowSchema);
export const ParameterArraySchema = z.array(ParameterSchema);

// Partial schemas
export const PartialWorkflowSchema = WorkflowSchema.partial();
export const PartialTaskSchema = TaskSchema.partial();
export const PartialFlowSchema = FlowSchema.partial();
export const PartialParameterSchema = ParameterSchema.partial();

// Deep partial schemas
export const DeepPartialWorkflowSchema = WorkflowSchema.deepPartial();
export const DeepPartialTaskSchema = TaskSchema.deepPartial();
export const DeepPartialFlowSchema = FlowSchema.deepPartial();
export const DeepPartialParameterSchema = ParameterSchema.deepPartial();

// Strict schemas (no extra properties)
export const StrictWorkflowSchema = WorkflowSchema.strict();
export const StrictTaskSchema = TaskSchema.strict();
export const StrictFlowSchema = FlowSchema.strict();
export const StrictParameterSchema = ParameterSchema.strict();

// Schema composition helpers
export function createUnionSchema<T extends z.ZodTypeAny>(...schemas: T[]): z.ZodUnion<T[]> {
    return z.union(schemas as any);
}

export function createIntersectionSchema<T extends z.ZodTypeAny>(...schemas: T[]): z.ZodIntersection<T, T> {
    return schemas.reduce((acc, schema) => acc.and(schema)) as any;
}

// Validation helpers
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    return result.success ? result.data : null;
}

export function getValidationErrors(schema: z.ZodSchema, data: unknown): string[] {
    const result = schema.safeParse(data);
    if (!result.success) {
        return result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    }
    return [];
}



