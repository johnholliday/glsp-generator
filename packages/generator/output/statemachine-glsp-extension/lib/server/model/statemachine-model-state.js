var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { DefaultModelState } from '@eclipse-glsp/server';
/**
 * Model state management for statemachine diagrams
 */
let StatemachineModelState = class StatemachineModelState extends DefaultModelState {
    constructor() {
        super(...arguments);
        this.modelIndex = new Map();
    }
    get root() {
        if (!this._modelRoot) {
            throw new Error('Model root not initialized');
        }
        return this._modelRoot;
    }
    updateRoot(newRoot) {
        this._modelRoot = newRoot;
        this.modelIndex.clear();
        this.indexElement(newRoot);
    }
    indexElement(element) {
        this.modelIndex.set(element.id, element);
        if ('children' in element && Array.isArray(element.children)) {
            for (const child of element.children) {
                this.indexElement(child);
            }
        }
    }
    /**
     * Get all StateMachine elements from the model
     */
    getAllStateMachines() {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'statemachine');
    }
    /**
     * Find StateMachine by ID
     */
    findStateMachineById(id) {
        const element = this.modelIndex.get(id);
        return element && element.type === 'statemachine' ? element : undefined;
    }
    /**
     * Get all State elements from the model
     */
    getAllStates() {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'state');
    }
    /**
     * Find State by ID
     */
    findStateById(id) {
        const element = this.modelIndex.get(id);
        return element && element.type === 'state' ? element : undefined;
    }
    /**
     * Get all Transition elements from the model
     */
    getAllTransitions() {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'transition');
    }
    /**
     * Find Transition by ID
     */
    findTransitionById(id) {
        const element = this.modelIndex.get(id);
        return element && element.type === 'transition' ? element : undefined;
    }
    /**
     * Get all edges in the model
     */
    getAllEdges() {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'edge');
    }
    /**
     * Find edges connected to a specific node
     */
    findEdgesForNode(nodeId) {
        return this.getAllEdges().filter(edge => {
            const e = edge;
            return e.sourceId === nodeId || e.targetId === nodeId;
        });
    }
};
StatemachineModelState = __decorate([
    injectable()
], StatemachineModelState);
export { StatemachineModelState };
//# sourceMappingURL=statemachine-model-state.js.map