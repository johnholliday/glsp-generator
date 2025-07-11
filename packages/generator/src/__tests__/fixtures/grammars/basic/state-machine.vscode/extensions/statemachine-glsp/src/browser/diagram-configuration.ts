import { FeatureModule, configureDefaultModelElements } from '@eclipse-glsp/client';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { StateMachineNode, StateMachineEdge } from './model-elements.js';

export function createStateMachineDiagramContainer(...featureModules: FeatureModule[]): ContainerModule {
    return new ContainerModule((bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
        configureDefaultModelElements({ bind, isBound });
        
        // Register custom model elements  
        bind(StateMachineNode).toSelf();
        bind(StateMachineEdge).toSelf();
    });
}