#!/usr/bin/env node

import { createLangiumGrammarServices } from 'langium/grammar';
import { EmptyFileSystem, URI } from 'langium';
import fs from 'fs-extra';

async function debug() {
    const grammarContent = await fs.readFile('./integration-tests/example-statemachine/statemachine.langium', 'utf-8');
    
    const services = createLangiumGrammarServices(EmptyFileSystem).grammar;
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(
        grammarContent,
        URI.file('statemachine.langium')
    );
    
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    
    const grammar = document.parseResult?.value;
    if (!grammar) {
        console.error('Failed to parse grammar');
        return;
    }
    
    console.log('Grammar structure:');
    console.log(`  Has interfaces: ${!!grammar.interfaces && grammar.interfaces.length > 0}`);
    console.log(`  Has types: ${!!grammar.types && grammar.types.length > 0}`);
    console.log(`  Has rules: ${!!grammar.rules && grammar.rules.length > 0}`);
    
    if (grammar.rules) {
        console.log('\nRules:');
        grammar.rules.forEach(rule => {
            console.log(`  - ${rule.name} (${rule.$type})`);
        });
    }
    
    if (grammar.interfaces) {
        console.log('\nInterfaces:');
        grammar.interfaces.forEach(iface => {
            console.log(`  - ${iface.name}`);
        });
    }
}

debug().catch(console.error);