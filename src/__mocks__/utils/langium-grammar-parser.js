/**
 * Mock for Langium Grammar Parser
 * This mock simulates the behavior of the real Langium parser without importing the actual Langium modules
 * which cause Jest ES module issues due to Chevrotain dependencies.
 * 
 * Future Option B - Babel Transform:
 * If real Langium testing is needed in the future, implement Babel transformation:
 * 1. Install: @babel/core, @babel/preset-env, babel-jest
 * 2. Create babel.config.js with:
 *    module.exports = {
 *      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
 *      plugins: []
 *    };
 * 3. Update jest.config.js transform to include:
 *    "^.+\\.mjs$": "babel-jest"
 * 4. Add to transformIgnorePatterns:
 *    "node_modules/(?!(chevrotain|langium)/)"
 * Note: This approach may impact test performance due to transformation overhead.
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
            return this.getMockTestGrammarResult(projectName);
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

// Export for both CommonJS and ES modules
module.exports = { LangiumGrammarParser };
module.exports.LangiumGrammarParser = LangiumGrammarParser;