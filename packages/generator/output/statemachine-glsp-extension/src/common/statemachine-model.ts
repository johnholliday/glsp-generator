export namespace StatemachineModel {
    export const TypeHierarchy = {
        statemachine: 'statemachine:StateMachine',
        state: 'state:State',
        transition: 'transition:Transition',
    };

    export interface StatemachineElement {
        type: string;
        id?: string;
        [key: string]: any;
    }

    export interface StateMachine extends StatemachineElement {
        name: string;
        states: State[];
        transitions: Transition[];
    }

    export interface State extends StatemachineElement {
        name: string;
        entryAction: string;
        exitAction: string;
        doAction: string;
    }

    export interface Transition extends StatemachineElement {
        name?: string;
        source: State;
        target: State;
        event: string;
        guard: string;
        effect: string;
    }

}
