import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createStateMachineServices } from './language/statemachine-module.js';
import { startLanguageServer } from 'langium';

const connection = createConnection(ProposedFeatures.all);
const { shared } = createStateMachineServices({ connection });

startLanguageServer(shared);