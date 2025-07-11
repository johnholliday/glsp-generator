import { BaseWidget, Message } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class StateMachineStandaloneDiagramWidget extends BaseWidget {
    static readonly ID = 'statemachine.standalone.diagram';
    static readonly LABEL = 'StateMachine Diagram';

    constructor() {
        super();
        this.id = StateMachineStandaloneDiagramWidget.ID;
        this.title.label = StateMachineStandaloneDiagramWidget.LABEL;
        this.title.closable = true;
        this.addClass('statemachine-diagram-widget');
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.update();
    }

    protected render(): void {
        // Render diagram editor
        this.node.innerHTML = '<div class="diagram-container">Standalone Diagram Editor</div>';
    }
}