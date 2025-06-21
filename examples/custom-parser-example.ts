import { GLSPGenerator, IGrammarParser, ParsedGrammar } from '../src/index.js';
import fs from 'fs-extra';

/**
 * Example of a custom parser implementation
 * This could parse a different grammar format or add custom preprocessing
 */
class CustomGrammarParser implements IGrammarParser {
    async parseGrammarFile(grammarPath: string): Promise<ParsedGrammar> {
        // Read the grammar file
        const content = await fs.readFile(grammarPath, 'utf-8');
        
        // Custom parsing logic here
        // For this example, we'll just parse a simple JSON format
        const grammarData = JSON.parse(content);
        
        return {
            interfaces: grammarData.interfaces || [],
            types: grammarData.types || [],
            projectName: grammarData.projectName || 'custom-project'
        };
    }

    async parseGrammar(grammarContent: string): Promise<any> {
        // Parse for validation purposes
        const data = JSON.parse(grammarContent);
        return {
            $type: 'Grammar',
            rules: data.rules || []
        };
    }

    async validateGrammarFile(grammarPath: string): Promise<boolean> {
        try {
            const content = await fs.readFile(grammarPath, 'utf-8');
            JSON.parse(content); // Just check if it's valid JSON
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Usage example
async function generateWithCustomParser() {
    // Create a custom parser instance
    const customParser = new CustomGrammarParser();
    
    // Create generator with custom parser
    const generator = new GLSPGenerator(undefined, customParser);
    
    // Generate extension using the custom parser
    await generator.generateExtension('my-grammar.json', './output');
}

// Example grammar file format (my-grammar.json):
/*
{
    "projectName": "my-dsl",
    "interfaces": [
        {
            "name": "Node",
            "properties": [
                { "name": "id", "type": "string", "optional": false, "array": false },
                { "name": "label", "type": "string", "optional": true, "array": false }
            ],
            "superTypes": ["Element"]
        }
    ],
    "types": [
        {
            "name": "NodeType",
            "definition": "task | decision | end",
            "unionTypes": ["task", "decision", "end"]
        }
    ]
}
*/