#!/usr/bin/env node

import { LangiumGrammarParser } from '../dist/utils/langium-grammar-parser.js';
import fs from 'fs-extra';

const grammarContent = `
grammar Test

Transition:
    'transition' name=ID? '{'
        'from' ':' source=[State:ID]
        'to' ':' target=[State:ID]
        ('on' ':' event=STRING)?
    '}';

State:
    'state' name=ID;

terminal ID: /[_a-zA-Z][\\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
`;

async function testParser() {
    const parser = new LangiumGrammarParser();
    
    // Test the internal parsing
    const document = parser.services.shared.workspace.LangiumDocumentFactory.fromString(
        grammarContent,
        'memory://test.langium'
    );
    
    await parser.services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    
    const grammar = document.parseResult?.value;
    if (!grammar) {
        console.error('Failed to parse grammar');
        return;
    }
    
    console.log('Grammar AST structure:');
    
    // Find the Transition rule
    const transitionRule = grammar.rules.find(r => r.name === 'Transition');
    if (transitionRule) {
        console.log('\nTransition rule definition type:', transitionRule.definition?.$type);
        
        // Walk through assignments
        const walkAssignments = (node, path = '') => {
            if (!node) return;
            
            if (node.$type === 'Assignment') {
                console.log(`\nAssignment at ${path}:`);
                console.log(`  feature: ${node.feature}`);
                console.log(`  operator: ${node.operator}`);
                console.log(`  terminal type: ${node.terminal?.$type}`);
                if (node.terminal?.$type === 'CrossReference') {
                    console.log(`  -> This is a REFERENCE to ${node.terminal.type?.ref?.name || 'unknown'}`);
                }
            }
            
            // Recursively walk
            if (node.elements) {
                node.elements.forEach((el, i) => walkAssignments(el, `${path}/elements[${i}]`));
            }
            if (node.alternatives) {
                node.alternatives.forEach((alt, i) => walkAssignments(alt, `${path}/alternatives[${i}]`));
            }
            if (node.element) {
                walkAssignments(node.element, `${path}/element`);
            }
        };
        
        walkAssignments(transitionRule.definition, 'definition');
    }
    
    // Test the full parser
    console.log('\n\nFull parser result:');
    const result = await parser.parseGrammar(grammarContent);
    console.log(JSON.stringify(result, null, 2));
}

testParser().catch(console.error);