/**
 * Mock for langium/grammar module
 */

export function createLangiumGrammarServices(fileSystem) {
  return {
    grammar: {
      shared: {
        workspace: {
          LangiumDocumentFactory: {
            fromString: (content, uri) => {
              return {
                diagnostics: [],
                parseResult: {
                  value: {
                    $type: 'Grammar',
                    name: 'MockGrammar',
                    rules: [],
                    interfaces: [],
                    types: []
                  }
                }
              };
            }
          },
          DocumentBuilder: {
            build: async (documents, options) => {
              // Mock build - just return
              return Promise.resolve();
            }
          }
        }
      }
    }
  };
}

export class LangiumGrammarServices {
  constructor() {}
}