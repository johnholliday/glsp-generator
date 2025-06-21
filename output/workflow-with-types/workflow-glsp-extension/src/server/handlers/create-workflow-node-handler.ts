import { CreateNodeOperationHandler, CreateNodeOperation } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { WorkflowModel } from '../../common/workflow-model.js';
import { WorkflowServerModel } from '../model/workflow-server-model.js';

@injectable()
export class CreateWorkflowNodeHandler extends CreateNodeOperationHandler {
    elementTypeIds = [
        WorkflowModel.TypeHierarchy.workflow,
        WorkflowModel.TypeHierarchy.task,
        WorkflowModel.TypeHierarchy.flow,
        WorkflowModel.TypeHierarchy.parameter,
    ];

    getLabel(): string {
        return 'Create Workflow Node';
    }

    protected createNode(operation: CreateNodeOperation): WorkflowModel.WorkflowElement | undefined {
        return WorkflowServerModel.createDefaultElement(operation.elementTypeId);
    }
}
