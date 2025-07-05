#!/usr/bin/env node

import { LangiumGrammarParser } from '../dist/utils/langium-grammar-parser.js';

async function test() {
    const parser = new LangiumGrammarParser();
    
    // Override the walkDefinition to add logging
    const originalWalk = parser.walkDefinition;
    let assignmentCount = 0;
    parser.walkDefinition = function(node, callback) {
        const wrappedCallback = (n) => {
            if (n.$type === 'Assignment') {
                assignmentCount++;
                console.log(`[DEBUG ${assignmentCount}] Found assignment: feature=${n.feature}, terminal=${n.terminal?.$type}`);
            }
            callback(n);
        };
        originalWalk.call(this, node, wrappedCallback);
    };
    
    const result = await parser.parseGrammarFile('./integration-tests/example-statemachine/statemachine.langium');
    
    // Show Transition interface details
    const transition = result.interfaces.find(i => i.name === 'Transition');
    if (transition) {
        console.log('\nTransition interface properties:');
        transition.properties.forEach(p => {
            console.log(`  ${p.name}: type=${p.type}, optional=${p.optional}, array=${p.array}, reference=${p.reference}`);
        });
    }
}

test().catch(console.error);