import { injectable } from 'inversify';
import { GModelElement, GModelRoot, DefaultModelState } from '@eclipse-glsp/server';

/**
 * Model state management for statemachine diagrams
 */
@injectable()
export class StatemachineModelState extends DefaultModelState {
    protected _modelRoot?: GModelRoot;
    protected modelIndex = new Map<string, GModelElement>();

    get root(): GModelRoot {
        if (!this._modelRoot) {
            throw new Error('Model root not initialized');
        }
        return this._modelRoot;
    }

    updateRoot(newRoot: GModelRoot): void {
        this._modelRoot = newRoot;
        this.modelIndex.clear();
        this.indexElement(newRoot);
    }
    
    private indexElement(element: GModelElement): void {
        this.modelIndex.set(element.id, element);
        if ('children' in element && Array.isArray((element as any).children)) {
            for (const child of (element as any).children) {
                this.indexElement(child);
            }
        }
    }


    /**
     * Get all StateMachine elements from the model
     */
    getAllStateMachines(): GModelElement[] {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'statemachine');
    }

    /**
     * Find StateMachine by ID
     */
    findStateMachineById(id: string): GModelElement | undefined {
        const element = this.modelIndex.get(id);
        return element && element.type === 'statemachine' ? element : undefined;
    }
    /**
     * Get all State elements from the model
     */
    getAllStates(): GModelElement[] {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'state');
    }

    /**
     * Find State by ID
     */
    findStateById(id: string): GModelElement | undefined {
        const element = this.modelIndex.get(id);
        return element && element.type === 'state' ? element : undefined;
    }
    /**
     * Get all Transition elements from the model
     */
    getAllTransitions(): GModelElement[] {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'transition');
    }

    /**
     * Find Transition by ID
     */
    findTransitionById(id: string): GModelElement | undefined {
        const element = this.modelIndex.get(id);
        return element && element.type === 'transition' ? element : undefined;
    }

    /**
     * Get all edges in the model
     */
    getAllEdges(): GModelElement[] {
        return Array.from(this.modelIndex.values()).filter(element => element.type === 'edge');
    }

    /**
     * Find edges connected to a specific node
     */
    findEdgesForNode(nodeId: string): GModelElement[] {
        return this.getAllEdges().filter(edge => {
            const e = edge as any;
            return e.sourceId === nodeId || e.targetId === nodeId;
        });
    }
}