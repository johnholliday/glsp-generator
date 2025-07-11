import { createDefaultModule, createDefaultSharedModule, DefaultSharedModuleContext, LangiumServices, LangiumSharedServices, Module, PartialLangiumServices } from 'langium';
import { StateMachineGeneratedModule, StateMachineGeneratedSharedModule } from './statemachine-module.js';
import { StateMachineValidator } from './statemachine-validator.js';

export type StateMachineAddedServices = {
    validation: {
        StateMachineValidator: StateMachineValidator
    }
}

export type StateMachineServices = LangiumServices & StateMachineAddedServices;

export const StateMachineModule: Module<StateMachineServices, PartialLangiumServices & StateMachineAddedServices> = {
    validation: {
        StateMachineValidator: () => new StateMachineValidator()
    }
};

export function createStateMachineServices(context: DefaultSharedModuleContext): {
    shared: LangiumSharedServices,
    StateMachine: StateMachineServices
} {
    const shared = createDefaultSharedModule(context);
    const StateMachine = createDefaultModule({ shared });
    return {
        shared,
        StateMachine: {
            ...StateMachine,
            ...StateMachineModule
        }
    };
}