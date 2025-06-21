import { WorkflowModel } from '../../common/workflow-model.js';

export class WorkflowServerModel {
    static initialize(): WorkflowModel.WorkflowElement {
        return {
            type: 'graph',
            id: 'root',
            children: [],
            bounds: { x: 0, y: 0, width: 0, height: 0 }
        };
    }

    static createDefaultElement(elementTypeId: string): WorkflowModel.WorkflowElement {
        const baseElement: WorkflowModel.WorkflowElement = {
            type: elementTypeId,
            id: `${elementTypeId}_${Date.now()}`,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 }
        };

        switch (elementTypeId) {
            case WorkflowModel.TypeHierarchy.workflow:
                return {
                    ...baseElement,
                    name: 'default',
                    version: 'default',
                    description: 'default',
                    tasks: [],
                    flows: [],
                    startTask: undefined,
                    endTasks: [],
                } as WorkflowModel.Workflow;
            case WorkflowModel.TypeHierarchy.task:
                return {
                    ...baseElement,
                    id: 'default',
                    name: 'default',
                    type: undefined,
                    assignee: 'default',
                    description: 'default',
                    inputs: [],
                    outputs: [],
                    timeout: 0,
                } as WorkflowModel.Task;
            case WorkflowModel.TypeHierarchy.flow:
                return {
                    ...baseElement,
                    from: undefined,
                    to: undefined,
                    condition: 'default',
                    priority: 0,
                } as WorkflowModel.Flow;
            case WorkflowModel.TypeHierarchy.parameter:
                return {
                    ...baseElement,
                    name: 'default',
                    type: undefined,
                    required: undefined,
                    defaultValue: 'default',
                } as WorkflowModel.Parameter;
            default:
                return baseElement;
        }
    }
}
