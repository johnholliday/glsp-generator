import { StateMachineModel } from '../../common/state-machine-model.js';

export class StateMachineServerModel {
    static initialize(): StateMachineModel.StateMachineElement {
        return {
            type: 'graph',
            id: 'root',
            children: [],
            bounds: { x: 0, y: 0, width: 0, height: 0 }
        };
    }

    static createDefaultElement(elementTypeId: string): StateMachineModel.StateMachineElement {
        const baseElement: StateMachineModel.StateMachineElement = {
            type: elementTypeId,
            id: `${elementTypeId}_${Date.now()}`,
            position: { x: 0, y: 0 },
            size: { width: 100, height: 50 }
        };

        switch (elementTypeId) {
            case StateMachineModel.TypeHierarchy.statemachine:
                return {
                    ...baseElement,
                    name: 'default',
                    description: undefined,
                    states: [],
                    transitions: [],
                    initialState: undefined,
                } as StateMachineModel.StateMachine;
            case StateMachineModel.TypeHierarchy.state:
                return {
                    ...baseElement,
                    name: 'default',
                    isInitial: undefined,
                    isFinal: undefined,
                    onEntry: [],
                    onExit: [],
                } as StateMachineModel.State;
            case StateMachineModel.TypeHierarchy.transition:
                return {
                    ...baseElement,
                    name: undefined,
                    source: undefined,
                    target: undefined,
                    event: 'default',
                    guard: 'default',
                    actions: [],
                } as StateMachineModel.Transition;
            case StateMachineModel.TypeHierarchy.action:
                return {
                    ...baseElement,
                    name: 'default',
                    parameters: undefined,
                } as StateMachineModel.Action;
            default:
                return baseElement;
        }
    }
}
