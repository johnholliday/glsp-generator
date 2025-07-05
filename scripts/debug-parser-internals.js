#!/usr/bin/env node

import { LangiumGrammarParser } from '../dist/utils/langium-grammar-parser.js';

const parser = new LangiumGrammarParser();

// Override extractPropertiesFromRule to log what's happening
const originalExtract = parser.extractPropertiesFromRule;
parser.extractPropertiesFromRule = function(rule) {
    const properties = originalExtract.call(this, rule);
    
    if (rule.name === 'Transition') {
        console.log('Properties extracted for Transition:');
        properties.forEach(p => {
            console.log(`  ${p.name}: reference=${p.reference} (type: ${typeof p.reference})`);
        });
    }
    
    return properties;
};

// Parse
const result = await parser.parseGrammarFile('./integration-tests/example-statemachine/statemachine.langium');

// Check final result
const transition = result.interfaces.find(i => i.name === 'Transition');
console.log('\nFinal Transition interface:');
transition.properties.forEach(p => {
    console.log(`  ${p.name}: reference=${p.reference} (type: ${typeof p.reference})`);
});