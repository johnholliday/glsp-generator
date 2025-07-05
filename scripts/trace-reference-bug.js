#!/usr/bin/env node

import { LangiumGrammarParser } from '../dist/utils/langium-grammar-parser.js';

async function test() {
    const parser = new LangiumGrammarParser();
    
    // Override extractPropertiesFromRule to see what happens
    const originalExtract = parser.extractPropertiesFromRule;
    parser.extractPropertiesFromRule = function(rule) {
        if (rule.name === 'Transition') {
            console.log('\n[TRACE] Extracting properties for Transition rule');
            
            // Manually walk to debug
            const properties = [];
            
            this.walkDefinition(rule.definition, (node) => {
                if (node.$type === 'Assignment') {
                    const isRef = node.terminal && node.terminal.$type === 'CrossReference';
                    console.log(`  Assignment ${node.feature}: terminal=${node.terminal?.$type}, isReference=${isRef}`);
                    
                    const property = {
                        name: node.feature,
                        type: this.inferTypeFromAssignment(node),
                        optional: node.operator === '?=' || node.cardinality === '?',
                        array: node.operator === '+=' || node.cardinality === '+' || node.cardinality === '*',
                        reference: isRef || false
                    };
                    
                    if (!properties.find(p => p.name === property.name)) {
                        properties.push(property);
                        console.log(`    -> Added property:`, JSON.stringify(property));
                    }
                }
            });
            
            console.log('\n[TRACE] Final properties:', properties);
            return properties;
        }
        
        return originalExtract.call(this, rule);
    };
    
    const result = await parser.parseGrammarFile('./integration-tests/example-statemachine/statemachine.langium');
    
    // Show result
    const transition = result.interfaces.find(i => i.name === 'Transition');
    if (transition) {
        console.log('\n[RESULT] Transition interface in final result:');
        transition.properties.forEach(p => {
            console.log(`  ${p.name}: reference=${p.reference} (type ${typeof p.reference})`);
        });
    }
}

test().catch(console.error);