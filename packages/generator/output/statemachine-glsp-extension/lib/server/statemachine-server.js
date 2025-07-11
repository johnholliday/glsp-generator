var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { DiagramConfiguration, ServerModule, GNode, GEdge, GGraph } from '@eclipse-glsp/server';
/**
 * Simple diagram configuration for statemachine
 */
let StatemachineDiagramConfiguration = class StatemachineDiagramConfiguration {
    constructor() {
        this.diagramType = 'statemachine-diagram';
        this.layoutKind = undefined;
        this.needsClientLayout = true;
        this.animatedUpdate = true;
    }
    get typeMapping() {
        const mapping = new Map();
        mapping.set('graph', GGraph);
        mapping.set('statemachine', GNode);
        mapping.set('state', GNode);
        mapping.set('transition', GNode);
        mapping.set('edge', GEdge);
        return mapping;
    }
    get shapeTypeHints() {
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
    get edgeTypeHints() {
        return [{
                elementTypeId: 'edge',
                deletable: true,
                repositionable: false,
                routable: true,
                sourceElementTypeIds: ['statemachine', 'state', 'transition'],
                targetElementTypeIds: ['statemachine', 'state', 'transition']
            }];
    }
};
StatemachineDiagramConfiguration = __decorate([
    injectable()
], StatemachineDiagramConfiguration);
export { StatemachineDiagramConfiguration };
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
//# sourceMappingURL=statemachine-server.js.map