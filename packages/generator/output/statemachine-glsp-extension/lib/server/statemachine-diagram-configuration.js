var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { ServerLayoutKind } from '@eclipse-glsp/server';
/**
 * Diagram configuration for statemachine
 */
let StatemachineDiagramConfiguration = class StatemachineDiagramConfiguration {
    get diagramType() {
        return 'statemachine-diagram';
    }
    get layoutKind() {
        return ServerLayoutKind.MANUAL;
    }
    get needsClientLayout() {
        return true;
    }
    get animatedUpdate() {
        return true;
    }
    get typeMapping() {
        // Return empty map - actual type mapping is handled by the model factory
        return new Map();
    }
    get shapeTypeHints() {
        return [
            {
                elementTypeId: 'statemachine',
                deletable: true,
                reparentable: false,
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
        return [
            {
                elementTypeId: 'edge',
                deletable: true,
                repositionable: false,
                routable: true,
                sourceElementTypeIds: ['state'],
                targetElementTypeIds: ['state']
            }
        ];
    }
};
StatemachineDiagramConfiguration = __decorate([
    injectable()
], StatemachineDiagramConfiguration);
export { StatemachineDiagramConfiguration };
//# sourceMappingURL=statemachine-diagram-configuration.js.map