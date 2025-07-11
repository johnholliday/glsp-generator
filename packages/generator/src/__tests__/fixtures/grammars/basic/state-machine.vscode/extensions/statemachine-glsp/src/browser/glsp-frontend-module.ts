import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { StateMachineGLSPClientContribution } from './glsp-client-contribution.js';
import { WidgetFactory } from '@theia/core/lib/browser';
import { StateMachineDiagramWidget } from './diagram-widget.js';

export default new ContainerModule((bind: interfaces.Bind) => {
    bind(StateMachineGLSPClientContribution).toSelf().inSingletonScope();
    
    bind(WidgetFactory).toDynamicValue((ctx: interfaces.Context) => ({
        id: StateMachineDiagramWidget.ID,
        createWidget: () => ctx.container.get(StateMachineDiagramWidget)
    })).inSingletonScope();
});