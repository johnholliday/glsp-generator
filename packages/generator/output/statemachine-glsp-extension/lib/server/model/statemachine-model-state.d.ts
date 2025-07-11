import { GModelElement, GModelRoot, DefaultModelState } from '@eclipse-glsp/server';
/**
 * Model state management for statemachine diagrams
 */
export declare class StatemachineModelState extends DefaultModelState {
    protected _modelRoot?: GModelRoot;
    protected modelIndex: Map<string, GModelElement>;
    get root(): GModelRoot;
    updateRoot(newRoot: GModelRoot): void;
    private indexElement;
    /**
     * Get all StateMachine elements from the model
     */
    getAllStateMachines(): GModelElement[];
    /**
     * Find StateMachine by ID
     */
    findStateMachineById(id: string): GModelElement | undefined;
    /**
     * Get all State elements from the model
     */
    getAllStates(): GModelElement[];
    /**
     * Find State by ID
     */
    findStateById(id: string): GModelElement | undefined;
    /**
     * Get all Transition elements from the model
     */
    getAllTransitions(): GModelElement[];
    /**
     * Find Transition by ID
     */
    findTransitionById(id: string): GModelElement | undefined;
    /**
     * Get all edges in the model
     */
    getAllEdges(): GModelElement[];
    /**
     * Find edges connected to a specific node
     */
    findEdgesForNode(nodeId: string): GModelElement[];
}
//# sourceMappingURL=statemachine-model-state.d.ts.map