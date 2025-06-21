export namespace StateMachineModel {
    export const TypeHierarchy = {
        statemachine: 'statemachine:StateMachine',
        state: 'state:State',
        transition: 'transition:Transition',
        action: 'action:Action',
    };

    export interface StateMachineElement {
        type: string;
        id?: string;
        [key: string]: any;
    }

    export interface StateMachine extends StateMachineElement {
        name: string;
        description?: string;
        states: State[];
        transitions: Transition[];
        initialState: State;
    }

    export interface State extends StateMachineElement {
        name: string;
        isInitial?: string;
        isFinal?: string;
        onEntry: Action[];
        onExit: Action[];
    }

    export interface Transition extends StateMachineElement {
        name?: string;
        source: State;
        target: State;
        event: string;
        guard: string;
        actions: Action[];
    }

    export interface Action extends StateMachineElement {
        name: string;
        parameters?: string;
    }

    // Type definitions
    export type Expression = string;
    export type ActionType = &#x27;log&#x27; | &#x27;invoke&#x27; | &#x27;assign&#x27; | &#x27;raise&#x27;;
}
