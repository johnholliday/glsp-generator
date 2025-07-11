import { injectable, inject } from '@theia/core/shared/inversify';
import { BaseLanguageClientContribution, Workspace, Languages, LanguageClientFactory } from '@theia/languages/lib/browser';
import { LANGUAGE_ID, LANGUAGE_NAME } from '../common/language';
import * as path from 'path';

@injectable()
export class StateMachineLanguageClientContribution extends BaseLanguageClientContribution {

    readonly id = LANGUAGE_ID;
    readonly name = LANGUAGE_NAME;

    constructor(
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(Languages) protected readonly languages: Languages,
        @inject(LanguageClientFactory) protected readonly languageClientFactory: LanguageClientFactory
    ) {
        super(workspace, languages, languageClientFactory);
    }

    protected get globPatterns() {
        return [
            '**/*.statemachine'
        ];
    }

    protected get documentSelector() {
        return [
            { scheme: 'file', language: LANGUAGE_ID }
        ];
    }

    protected get configurationSection() {
        return [LANGUAGE_ID];
    }

    protected get workspaceContains() {
        return this.globPatterns;
    }

    // Use the language server from the VSCode extension
    protected get serverPath() {
        return path.join(__dirname, '../../../statemachine-vscode/out/language-server.js');
    }
}