import { StatemachineModel } from '../../common/statemachine-model.js';
export class StatemachineServerModel {
    static initialize() {
        return {
            type: 'graph',
            id: 'root',
            children: [],
            bounds: { x: 0, y: 0, width: 0, height: 0 }
        };
    }
    static createDefaultElement(elementTypeId) {
        const baseElement = {
            type: elementTypeId,
            id: `${elementTypeId}_${Date.now()}`,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 }
        };
        switch (elementTypeId) {
            case StatemachineModel.TypeHierarchy.statemachine:
                return {
                    ...baseElement,
                    name: 'default',
                    states: [],
                    transitions: [],
                };
            case StatemachineModel.TypeHierarchy.state:
                return {
                    ...baseElement,
                    name: 'default',
                    entryAction: 'default',
                    exitAction: 'default',
                    doAction: 'default',
                };
            case StatemachineModel.TypeHierarchy.transition:
                return {
                    ...baseElement,
                    name: undefined,
                    source: null, // Reference - must be set later
                    target: null, // Reference - must be set later
                    event: 'default',
                    guard: 'default',
                    effect: 'default',
                };
            default:
                return baseElement;
        }
    }
}
//# sourceMappingURL=statemachine-server-model.js.map