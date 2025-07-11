#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsDir = path.join(__dirname, '..', 'packages', 'vscode-extension', 'src', 'commands');

async function fixCommand(file) {
    const filePath = path.join(commandsDir, file);
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Remove skipVSIX option
    content = content.replace(
        /skipVSIX: true/g,
        '// Generate project without VSIX'
    );
    
    // Fix error property access
    content = content.replace(
        /\${result\.error}/g,
        'Generation failed'
    );
    
    content = content.replace(
        /: \${result\.error}`/g,
        '`'
    );
    
    // Fix standalone error references
    content = content.replace(
        /result\.error \|\|/g,
        ''
    );
    
    await fs.writeFile(filePath, content);
    console.log(`Fixed ${file}`);
}

async function main() {
    const files = ['generateProject.ts', 'generateVSIX.ts', 'testVSIX.ts'];
    for (const file of files) {
        await fixCommand(file);
    }
    console.log('All VSCode command files fixed!');
}

main().catch(console.error);