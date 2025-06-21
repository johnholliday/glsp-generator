import { CreateNodeOperationHandler, CreateNodeOperation } from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { StateMachineModel } from '../../common/state-machine-model.js';
import { StateMachineServerModel } from '../model/state-machine-server-model.js';

@injectable()
export class CreateStateMachineNodeHandler extends CreateNodeOperationHandler {
    elementTypeIds = [
        StateMachineModel.TypeHierarchy.statemachine,
        StateMachineModel.TypeHierarchy.state,
        StateMachineModel.TypeHierarchy.transition,
        StateMachineModel.TypeHierarchy.action,
    ];

    getLabel(): string {
        return 'Create StateMachine Node';
    }

    protected createNode(operation: CreateNodeOperation): StateMachineModel.StateMachineElement | undefined {
        return StateMachineServerModel.createDefaultElement(operation.elementTypeId);
    }
}
