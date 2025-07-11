import { BaseWidget, Message, SplitPanel } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class StateMachineSplitViewWidget extends BaseWidget {
    static readonly ID = 'statemachine.split.editor';
    static readonly LABEL = 'StateMachine Split Editor';

    private splitPanel!: SplitPanel;

    constructor() {
        super();
        this.id = StateMachineSplitViewWidget.ID;
        this.title.label = StateMachineSplitViewWidget.LABEL;
        this.title.closable = true;
        this.addClass('statemachine-split-widget');
        
        this.createSplitPanel();
    }

    private createSplitPanel(): void {
        this.splitPanel = new SplitPanel({
            orientation: 'horizontal',
            spacing: 5
        });
        
        // Add text editor
        const textEditor = new BaseWidget();
        textEditor.addClass('text-editor');
        this.splitPanel.addWidget(textEditor);
        
        // Add diagram editor
        const diagramEditor = new BaseWidget();
        diagramEditor.addClass('diagram-editor');
        this.splitPanel.addWidget(diagramEditor);
        
        // Set initial sizes
        this.splitPanel.setRelativeSizes([1, 1]);
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        if (this.splitPanel && !this.splitPanel.isAttached) {
            this.node.appendChild(this.splitPanel.node);
        }
    }
}