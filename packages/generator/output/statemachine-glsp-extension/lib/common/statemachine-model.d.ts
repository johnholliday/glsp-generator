export declare namespace StatemachineModel {
    const TypeHierarchy: {
        statemachine: string;
        state: string;
        transition: string;
    };
    interface StatemachineElement {
        type: string;
        id?: string;
        [key: string]: any;
    }
    interface StateMachine extends StatemachineElement {
        name: string;
        states: State[];
        transitions: Transition[];
    }
    interface State extends StatemachineElement {
        name: string;
        entryAction: string;
        exitAction: string;
        doAction: string;
    }
    interface Transition extends StatemachineElement {
        name?: string;
        source: State;
        target: State;
        event: string;
        guard: string;
        effect: string;
    }
}
//# sourceMappingURL=statemachine-model.d.ts.map