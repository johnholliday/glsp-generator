import { ContainerModule } from '@theia/core/shared/inversify';
import { injectable } from '@theia/core/shared/inversify';
import { createStateMachineDiagramContainer } from './diagram-configuration.js';

@injectable()
export class StateMachineGLSPClientContribution {
  readonly id = 'statemachine';
  readonly fileExtensions = ['.statemachine'];

  createContainer(): ContainerModule {
    return createStateMachineDiagramContainer();
  }
}