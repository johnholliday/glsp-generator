import { Command, CommandContribution, CommandRegistry } from '@theia/core';
import { injectable } from 'inversify';
import { WorkflowModel } from '../common/workflow-model.js';

@injectable()
export class WorkflowCommandContribution implements CommandContribution {

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand({
            id: 'create.workflow',
            label: 'Create Workflow'
        });
        registry.registerCommand({
            id: 'create.task',
            label: 'Create Task'
        });
        registry.registerCommand({
            id: 'create.flow',
            label: 'Create Flow'
        });
        registry.registerCommand({
            id: 'create.parameter',
            label: 'Create Parameter'
        });
    }
}
