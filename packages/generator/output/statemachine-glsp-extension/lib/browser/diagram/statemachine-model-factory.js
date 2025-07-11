var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable } from 'inversify';
import { SModelFactory } from 'sprotty';
/**
 * Model factory for creating statemachine diagram elements
 */
let StatemachineModelFactory = class StatemachineModelFactory extends SModelFactory {
    createElement(schema, parent) {
        const element = super.createElement(schema, parent);
        // Add custom initialization if needed
        switch (schema.type) {
            case 'statemachine':
                this.initializeStateMachine(element, schema);
                break;
            case 'state':
                this.initializeState(element, schema);
                break;
            case 'transition':
                this.initializeTransition(element, schema);
                break;
        }
        return element;
    }
    initializeStateMachine(node, schema) {
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
            node.name = schema.name;
        }
        if (schema.states !== undefined) {
            node.states = schema.states;
        }
        if (schema.transitions !== undefined) {
            node.transitions = schema.transitions;
        }
    }
    initializeState(node, schema) {
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
            node.name = schema.name;
        }
        if (schema.entryAction !== undefined) {
            node.entryAction = schema.entryAction;
        }
        if (schema.exitAction !== undefined) {
            node.exitAction = schema.exitAction;
        }
        if (schema.doAction !== undefined) {
            node.doAction = schema.doAction;
        }
    }
    initializeTransition(node, schema) {
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
            node.name = schema.name;
        }
        if (schema.source !== undefined) {
            node.source = schema.source;
        }
        if (schema.target !== undefined) {
            node.target = schema.target;
        }
        if (schema.event !== undefined) {
            node.event = schema.event;
        }
        if (schema.guard !== undefined) {
            node.guard = schema.guard;
        }
        if (schema.effect !== undefined) {
            node.effect = schema.effect;
        }
    }
};
StatemachineModelFactory = __decorate([
    injectable()
], StatemachineModelFactory);
export { StatemachineModelFactory };
//# sourceMappingURL=statemachine-model-factory.js.map