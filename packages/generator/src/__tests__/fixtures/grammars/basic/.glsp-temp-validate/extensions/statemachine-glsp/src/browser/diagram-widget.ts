import { GLSPDiagramWidget } from '@eclipse-glsp/theia-integration';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class StateMachineDiagramWidget extends GLSPDiagramWidget {
  static readonly ID = 'statemachine-diagram';
  static readonly LABEL = 'StateMachine Diagram';

  constructor() {
    super();
    this.id = StateMachineDiagramWidget.ID;
    this.title.label = StateMachineDiagramWidget.LABEL;
  }
}