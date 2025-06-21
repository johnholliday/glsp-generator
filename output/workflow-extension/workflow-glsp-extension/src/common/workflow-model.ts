export namespace WorkflowModel {
    export const TypeHierarchy = {
        workflow: 'workflow:Workflow',
        task: 'task:Task',
        flow: 'flow:Flow',
        parameter: 'parameter:Parameter',
    };

    export interface WorkflowElement {
        type: string;
        id?: string;
        [key: string]: any;
    }

    export interface Workflow extends WorkflowElement {
        name: string;
        version: string;
        description: string;
        tasks: Task[];
        flows: Flow[];
        startTask: Task;
        endTasks: Task[];
    }

    export interface Task extends WorkflowElement {
        id: string;
        name: string;
        type: TaskType;
        assignee: string;
        description: string;
        inputs: Parameter[];
        outputs: Parameter[];
        timeout: number;
    }

    export interface Flow extends WorkflowElement {
        from: Task;
        to: Task;
        condition: string;
        priority: number;
    }

    export interface Parameter extends WorkflowElement {
        name: string;
        type: DataType;
        required?: string;
        defaultValue: string;
    }

}
