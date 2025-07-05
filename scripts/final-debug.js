#!/usr/bin/env node

// Direct test of parser to template flow
import { LangiumGrammarParser } from '../dist/utils/langium-grammar-parser.js';
import Handlebars from 'handlebars';
import fs from 'fs-extra';

// 1. Parse the grammar
const parser = new LangiumGrammarParser();
const grammarPath = './integration-tests/example-statemachine/statemachine.langium';
const parsed = await parser.parseGrammarFile(grammarPath);

// 2. Check parsed result
const transition = parsed.interfaces.find(i => i.name === 'Transition');
console.log('Parsed Transition interface:');
transition.properties.forEach(p => {
    console.log(`  ${p.name}: reference=${p.reference}, type=${p.type}`);
});

// 3. Load and compile template
const templateContent = await fs.readFile('./dist/templates/server-model.hbs', 'utf-8');

// Register helpers
Handlebars.registerHelper('toPascalCase', str => {
    if (!str) return '';
    return str.split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
});

Handlebars.registerHelper('toCamelCase', str => {
    if (!str) return '';
    const pascal = str.split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

Handlebars.registerHelper('eq', (a, b) => a === b);

// 4. Create context matching what generator would pass
const context = {
    projectName: parsed.projectName,
    interfaces: parsed.interfaces,
    types: parsed.types
};

// 5. Render template
const template = Handlebars.compile(templateContent);
const result = template(context);

// 6. Extract transition part
const transitionPart = result.split('case StatemachineModel.TypeHierarchy.transition:')[1]?.split('default:')[0];
console.log('\nRendered transition case:');
console.log(transitionPart?.trim());