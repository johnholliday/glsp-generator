#!/usr/bin/env node

import Handlebars from 'handlebars';
import fs from 'fs-extra';

// Load and compile the server-model template
const templateContent = await fs.readFile('./src/templates/server-model.hbs', 'utf-8');

// Test context mimicking what the generator passes
const testContext = {
    projectName: 'statemachine',
    interfaces: [
        {
            name: 'Transition',
            properties: [
                { name: 'name', type: 'string', optional: true, array: false, reference: false },
                { name: 'source', type: 'State', optional: false, array: false, reference: true },
                { name: 'target', type: 'State', optional: false, array: false, reference: true },
                { name: 'event', type: 'string', optional: false, array: false, reference: false }
            ]
        }
    ]
};

// Register helpers
Handlebars.registerHelper('toPascalCase', str => {
    if (!str) return '';
    return str.split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
});

Handlebars.registerHelper('eq', (a, b) => a === b);

Handlebars.registerHelper('toCamelCase', str => {
    if (!str) return '';
    const pascal = str.split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
});

// Compile and render
const template = Handlebars.compile(templateContent);
const result = template(testContext);

console.log('Generated server model:');
console.log(result);

// Check specific part
const transitionPart = result.split('case StatemachineModel.TypeHierarchy.transition:')[1]?.split('default:')[0];
console.log('\nTransition case:');
console.log(transitionPart);