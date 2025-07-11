import { ContainerModule } from '@theia/core/shared/inversify';
import { LanguageClientContribution } from '@theia/languages/lib/browser';
import { StateMachineLanguageClientContribution } from './language-client-contribution';

export default new ContainerModule(bind => {
    bind(LanguageClientContribution).to(StateMachineLanguageClientContribution).inSingletonScope();
});