import { injectable } from 'inversify';
import { SModelFactory, SModelElementImpl, SGraphImpl, SNodeImpl, SEdgeImpl, SLabelImpl } from 'sprotty';
import { Action } from 'sprotty-protocol';

/**
 * Model factory for creating statemachine diagram elements
 */
@injectable()
export class StatemachineModelFactory extends SModelFactory {
    
    createElement(schema: any, parent?: any): any {
        const element = super.createElement(schema, parent);
        
        // Add custom initialization if needed
        switch (schema.type) {
            case 'statemachine':
                this.initializeStateMachine(element as SNodeImpl, schema);
                break;
            case 'state':
                this.initializeState(element as SNodeImpl, schema);
                break;
            case 'transition':
                this.initializeTransition(element as SNodeImpl, schema);
                break;
        }
        
        return element;
    }

    private initializeStateMachine(node: SNodeImpl, schema: any): void {
        // Set default bounds if not specified
        if (!node.bounds) {
            const defaultWidth = 120;
            const defaultHeight = 80;
            
            node.bounds = {
                x: schema.position?.x || 0,
                y: schema.position?.y || 0,
                width: schema.size?.width || defaultWidth,
                height: schema.size?.height || defaultHeight
            };
        }
        
        // Copy custom properties
        if (schema.name !== undefined) {
            (node as any).name = schema.name;
        }
        if (schema.states !== undefined) {
            (node as any).states = schema.states;
        }
        if (schema.transitions !== undefined) {
            (node as any).transitions = schema.transitions;
        }
        
    }
    private initializeState(node: SNodeImpl, schema: any): void {
        // Set default bounds if not specified
        if (!node.bounds) {
            const defaultWidth = 100;
            const defaultHeight = 60;
            
            node.bounds = {
                x: schema.position?.x || 0,
                y: schema.position?.y || 0,
                width: schema.size?.width || defaultWidth,
                height: schema.size?.height || defaultHeight
            };
        }
        
        // Copy custom properties
        if (schema.name !== undefined) {
            (node as any).name = schema.name;
        }
        if (schema.entryAction !== undefined) {
            (node as any).entryAction = schema.entryAction;
        }
        if (schema.exitAction !== undefined) {
            (node as any).exitAction = schema.exitAction;
        }
        if (schema.doAction !== undefined) {
            (node as any).doAction = schema.doAction;
        }
        
    }
    private initializeTransition(node: SNodeImpl, schema: any): void {
        // Set default bounds if not specified
        if (!node.bounds) {
            const defaultWidth = 150;
            const defaultHeight = 40;
            
            node.bounds = {
                x: schema.position?.x || 0,
                y: schema.position?.y || 0,
                width: schema.size?.width || defaultWidth,
                height: schema.size?.height || defaultHeight
            };
        }
        
        // Copy custom properties
        if (schema.name !== undefined) {
            (node as any).name = schema.name;
        }
        if (schema.source !== undefined) {
            (node as any).source = schema.source;
        }
        if (schema.target !== undefined) {
            (node as any).target = schema.target;
        }
        if (schema.event !== undefined) {
            (node as any).event = schema.event;
        }
        if (schema.guard !== undefined) {
            (node as any).guard = schema.guard;
        }
        if (schema.effect !== undefined) {
            (node as any).effect = schema.effect;
        }
        
    }
}