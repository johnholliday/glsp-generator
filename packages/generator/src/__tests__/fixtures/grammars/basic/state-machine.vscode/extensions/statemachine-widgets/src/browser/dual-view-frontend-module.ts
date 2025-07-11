import { ContainerModule } from '@theia/core/shared/inversify';
import { WidgetFactory } from '@theia/core/lib/browser';
import { StateMachineStandaloneDiagramWidget } from './standalone-widget.js';
import { StateMachineTabbedEditorWidget } from './tabbed-widget.js';
import { StateMachineSplitViewWidget } from './split-view-widget.js';

export default new ContainerModule(bind => {
    // Standalone diagram widget
    bind(StateMachineStandaloneDiagramWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: StateMachineStandaloneDiagramWidget.ID,
        createWidget: () => ctx.container.get(StateMachineStandaloneDiagramWidget)
    })).inSingletonScope();
    
    // Tabbed editor widget
    bind(StateMachineTabbedEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: StateMachineTabbedEditorWidget.ID,
        createWidget: () => ctx.container.get(StateMachineTabbedEditorWidget)
    })).inSingletonScope();
    
    // Split view widget
    bind(StateMachineSplitViewWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: StateMachineSplitViewWidget.ID,
        createWidget: () => ctx.container.get(StateMachineSplitViewWidget)
    })).inSingletonScope();
});