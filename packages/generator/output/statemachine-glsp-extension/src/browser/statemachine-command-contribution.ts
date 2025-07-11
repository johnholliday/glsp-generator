import { Command, CommandContribution, CommandRegistry } from '@theia/core';
import { injectable } from 'inversify';
import { StatemachineModel } from '../common/statemachine-model.js';

@injectable()
export class StatemachineCommandContribution implements CommandContribution {

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
    }
}
