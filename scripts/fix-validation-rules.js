#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesDir = path.join(__dirname, '..', 'packages', 'generator', 'src', 'validation', 'rules');

const rules = [
    { file: 'naming-conventions.ts', severity: 'error' },
    { file: 'no-circular-refs.ts', severity: 'warning' },
    { file: 'no-duplicate-properties.ts', severity: 'error' },
    { file: 'no-undefined-types.ts', severity: 'error' }
];

async function fixRule(ruleFile, defaultSeverity) {
    const filePath = path.join(rulesDir, ruleFile);
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Add DiagnosticSeverity to imports if not present
    if (!content.includes('DiagnosticSeverity')) {
        content = content.replace(
            /import \{ (.+) \} from '\.\.\/types\.js';/,
            "import { $1, DiagnosticSeverity } from '../types.js';"
        );
    }
    
    // Add defaultSeverity property
    if (!content.includes('defaultSeverity')) {
        content = content.replace(
            /description = '.+';/,
            `$&\n    defaultSeverity: DiagnosticSeverity = '${defaultSeverity}';`
        );
    }
    
    // Fix suggestions to use Fix type
    content = content.replace(
        /suggestions: \[`(.+)`\]/g,
        `suggestions: [{
                                description: \`$1\`,
                                changes: []
                            }]`
    );
    
    await fs.writeFile(filePath, content);
    console.log(`Fixed ${ruleFile}`);
}

async function main() {
    for (const rule of rules) {
        await fixRule(rule.file, rule.severity);
    }
    console.log('All validation rules fixed!');
}

main().catch(console.error);