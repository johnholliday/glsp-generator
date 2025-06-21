/**
 * Mock for Langium Parser Facade
 * This mock provides the same interface as the real langium-parser.ts
 * but avoids importing the real Langium parser that causes ES module issues.
 */

const fs = require('fs-extra');
const path = require('path');

class LangiumGrammarParser {
    constructor() {
        // Mock constructor
    }

    async parseGrammarFile(grammarPath) {
        const grammarContent = await fs.readFile(grammarPath, 'utf-8');
        const projectName = this.sanitizeProjectName(path.basename(grammarPath, path.extname(grammarPath)));
        
        // Mock parsing based on known test fixtures
        // Check if the file contains test grammar content
        if (grammarPath.includes('test-grammar') || grammarContent.includes('grammar TestDomain')) {
            const result = this.getMockTestGrammarResult(projectName);
            return result;
        }
        
        // For other test cases, return a minimal valid structure
        return {
            projectName,
            interfaces: [],
            types: []
        };
    }

    async parseGrammar(grammarContent) {
        // Simple mock validation - just check if it's not empty
        if (!grammarContent || grammarContent.trim().length === 0) {
            throw new Error('Empty grammar content');
        }
        
        // Return a mock AST structure
        return {
            $type: 'Grammar',
            name: 'MockGrammar',
            rules: [],
            interfaces: [],
            types: []
        };
    }

    async validateGrammarFile(grammarPath) {
        try {
            const content = await fs.readFile(grammarPath, 'utf-8');
            return content && content.trim().length > 0;
        } catch {
            return false;
        }
    }
    
    sanitizeProjectName(name) {
        // Remove non-alphanumeric characters and convert to lowercase
        return name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }
    
    getMockTestGrammarResult(projectName) {
        return {
            projectName,
            interfaces: [
                {
                    name: 'Element',
                    properties: [
                        { name: 'name', type: 'string', optional: false, array: false }
                    ],
                    superTypes: []
                },
                {
                    name: 'Node',
                    properties: [
                        { name: 'position', type: 'Position', optional: false, array: false },
                        { name: 'size', type: 'Size', optional: true, array: false },
                        { name: 'label', type: 'string', optional: true, array: false }
                    ],
                    superTypes: ['Element']
                },
                {
                    name: 'Edge',
                    properties: [
                        { name: 'source', type: 'Node', optional: false, array: false },
                        { name: 'target', type: 'Node', optional: false, array: false },
                        { name: 'type', type: 'EdgeType', optional: false, array: false }
                    ],
                    superTypes: ['Element']
                },
                {
                    name: 'Position',
                    properties: [
                        { name: 'x', type: 'number', optional: false, array: false },
                        { name: 'y', type: 'number', optional: false, array: false }
                    ],
                    superTypes: []
                },
                {
                    name: 'Size',
                    properties: [
                        { name: 'width', type: 'number', optional: false, array: false },
                        { name: 'height', type: 'number', optional: false, array: false }
                    ],
                    superTypes: []
                }
            ],
            types: [
                {
                    name: 'EdgeType',
                    definition: "'association' | 'dependency' | 'inheritance'",
                    unionTypes: ['association', 'dependency', 'inheritance']
                }
            ]
        };
    }
}

// Export both as ES module and CommonJS to handle all Jest scenarios
module.exports = { LangiumGrammarParser };
module.exports.LangiumGrammarParser = LangiumGrammarParser;