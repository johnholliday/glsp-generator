import { injectable } from 'inversify';
import { StatemachineModel } from '../../common/statemachine-model.js';

/**
 * Handler for creating statemachine nodes.
 * 
 * Note: This is a simplified template that provides the basic structure.
 * You'll need to integrate this with your GLSP server implementation
 * according to your specific version and requirements.
 */
@injectable()
export class CreateStatemachineNodeHandler {
    readonly elementTypeIds = [
        StatemachineModel.TypeHierarchy.statemachine,
        StatemachineModel.TypeHierarchy.state,
        StatemachineModel.TypeHierarchy.transition,
    ];

    /**
     * Creates a new element based on the given type ID.
     * This is a simplified implementation - adapt as needed for your GLSP version.
     */
    createNode(typeId: string, x?: number, y?: number): any {
        // Use the model factory to create elements
        const element = this.createDefaultElement(typeId);
        
        if (element && x !== undefined && y !== undefined) {
            element.position = { x, y };
        }
        
        return element;
    }

    private createDefaultElement(typeId: string): any {
        switch (typeId) {
            case StatemachineModel.TypeHierarchy.statemachine:
                return {
                    type: typeId,
                    id: `${typeId}_${Date.now()}`,
                    name: 'default',
                    states: [],
                    transitions: [],
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 50 }
                };
            case StatemachineModel.TypeHierarchy.state:
                return {
                    type: typeId,
                    id: `${typeId}_${Date.now()}`,
                    name: 'default',
                    entryAction: 'default',
                    exitAction: 'default',
                    doAction: 'default',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 50 }
                };
            case StatemachineModel.TypeHierarchy.transition:
                return {
                    type: typeId,
                    id: `${typeId}_${Date.now()}`,
                    name: undefined,
                    source: null, // Reference - must be set after creation
                    target: null, // Reference - must be set after creation
                    event: 'default',
                    guard: 'default',
                    effect: 'default',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 50 }
                };
            default:
                return undefined;
        }
    }
}