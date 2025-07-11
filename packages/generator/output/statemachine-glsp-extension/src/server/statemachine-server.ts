import { injectable } from 'inversify';
import { DiagramConfiguration, ServerModule, GModelElementConstructor, ShapeTypeHint, EdgeTypeHint, GNode, GEdge, GGraph } from '@eclipse-glsp/server';

/**
 * Simple diagram configuration for statemachine
 */
@injectable()
export class StatemachineDiagramConfiguration implements DiagramConfiguration {
    readonly diagramType = 'statemachine-diagram';
    readonly layoutKind: any = undefined;
    readonly needsClientLayout = true;
    readonly animatedUpdate = true;
    
    get typeMapping(): Map<string, GModelElementConstructor> {
        const mapping = new Map<string, GModelElementConstructor>();
        mapping.set('graph', GGraph);
        mapping.set('statemachine', GNode);
        mapping.set('state', GNode);
        mapping.set('transition', GNode);
        mapping.set('edge', GEdge);
        return mapping;
    }
    
    get shapeTypeHints(): ShapeTypeHint[] {
        return [
            {
                elementTypeId: 'statemachine',
                deletable: true,
                reparentable: true,
                repositionable: true,
                resizable: true
            },
            {
                elementTypeId: 'state',
                deletable: true,
                reparentable: true,
                repositionable: true,
                resizable: true
            },
            {
                elementTypeId: 'transition',
                deletable: true,
                reparentable: true,
                repositionable: true,
                resizable: true
            }
        ];
    }
    
    get edgeTypeHints(): EdgeTypeHint[] {
        return [{
            elementTypeId: 'edge',
            deletable: true,
            repositionable: false,
            routable: true,
            sourceElementTypeIds: ['statemachine', 'state', 'transition'],
            targetElementTypeIds: ['statemachine', 'state', 'transition']
        }];
    }
}

/**
 * Server module for statemachine diagrams
 */
export const createStatemachineServerModule = () => {
    const module = new ServerModule();
    module.configure = (bind, unbind, isBound, rebind) => {
        bind(DiagramConfiguration).to(StatemachineDiagramConfiguration).inSingletonScope();
    };
    return module;
};