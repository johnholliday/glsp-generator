import { Action, IActionHandler, IActionDispatcher, TYPES } from '@eclipse-glsp/client';
import { inject, injectable } from 'inversify';

@injectable()
export class StateMachineCreateNodeActionHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher!: IActionDispatcher;

    handle(action: Action): void | Action {
        // Handle node creation
        console.log('Creating node:', action);
    }
}

@injectable()
export class StateMachineCreateEdgeActionHandler implements IActionHandler {
    @inject(TYPES.IActionDispatcher) protected actionDispatcher!: IActionDispatcher;

    handle(action: Action): void | Action {
        // Handle edge creation
        console.log('Creating edge:', action);
    }
}