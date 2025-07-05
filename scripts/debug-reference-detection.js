#!/usr/bin/env node

import { LangiumGrammarParser } from '../dist/utils/langium-grammar-parser.js';

const parser = new LangiumGrammarParser();
const result = await parser.parseGrammarFile('./integration-tests/example-statemachine/statemachine.langium');

console.log('=== Parsed Grammar Results ===\n');

for (const iface of result.interfaces) {
  console.log(`Interface: ${iface.name}`);
  for (const prop of iface.properties) {
    console.log(`  ${prop.name}:`);
    console.log(`    - type: ${prop.type}`);
    console.log(`    - optional: ${prop.optional}`);
    console.log(`    - array: ${prop.array}`);
    console.log(`    - reference: ${prop.reference}`);
  }
  console.log('');
}