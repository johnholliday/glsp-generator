import { Command, CommandContribution, CommandRegistry } from '@theia/core';
import { injectable } from 'inversify';
import { StateMachineModel } from '../common/state-machine-model.js';

@injectable()
export class StateMachineCommandContribution implements CommandContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({
            id: 'create.statemachine',
            label: 'Create StateMachine'
        });
        registry.registerCommand({
            id: 'create.state',
            label: 'Create State'
        });
        registry.registerCommand({
            id: 'create.transition',
            label: 'Create Transition'
        });
        registry.registerCommand({
            id: 'create.action',
            label: 'Create Action'
        });
    }
}
