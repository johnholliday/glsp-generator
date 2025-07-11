import { BaseWidget, Message, DockPanel } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class StateMachineTabbedEditorWidget extends BaseWidget {
    static readonly ID = 'statemachine.tabbed.editor';
    static readonly LABEL = 'StateMachine Tabbed Editor';

    private dockPanel!: DockPanel;

    constructor() {
        super();
        this.id = StateMachineTabbedEditorWidget.ID;
        this.title.label = StateMachineTabbedEditorWidget.LABEL;
        this.title.closable = true;
        this.addClass('statemachine-tabbed-widget');
        
        this.createDockPanel();
    }

    private createDockPanel(): void {
        this.dockPanel = new DockPanel();
        
        // Add text editor tab
        const textTab = new BaseWidget();
        textTab.title.label = 'Text';
        textTab.title.closable = false;
        this.dockPanel.addWidget(textTab);
        
        // Add diagram editor tab
        const diagramTab = new BaseWidget();
        diagramTab.title.label = 'Diagram';
        diagramTab.title.closable = false;
        this.dockPanel.addWidget(diagramTab);
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        if (this.dockPanel && !this.dockPanel.isAttached) {
            this.node.appendChild(this.dockPanel.node);
        }
    }
}