import { ValidationAcceptor, ValidationChecks } from 'langium';
import { StateMachineAstType } from './statemachine-ast.js';
import type { StateMachineServices } from './statemachine-module.js';

export class StateMachineValidator {
    checkValidation(node: any, accept: ValidationAcceptor): void {
        // Add custom validation rules here
    }
}

export function registerStateMachineValidationChecks(services: StateMachineServices): void {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.StateMachineValidator;
    const checks: ValidationChecks<StateMachineAstType> = {
        // Register validation checks for specific AST nodes
    };
    registry.register(checks, validator);
}