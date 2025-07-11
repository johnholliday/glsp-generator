/**
 * Mock for langium module
 * This avoids importing the real langium module which causes Jest ESM issues
 */

// Mock AstNode interface (used in types/grammar.ts)
export class AstNode {
  constructor() {}
}

// Mock other commonly used Langium exports
export class Grammar {
  constructor() {
    this.rules = [];
    this.interfaces = [];
    this.types = [];
  }
}

export class EmptyFileSystem {
  static instance = new EmptyFileSystem();
}

export class LangiumDocument {
  constructor() {
    this.diagnostics = [];
    this.parseResult = null;
  }
}

export class URI {
  static file(path) {
    return { path, scheme: 'file' };
  }
  
  static parse(uri) {
    // Simple mock parse implementation
    if (typeof uri === 'string') {
      if (uri.startsWith('file://')) {
        return { path: uri.slice(7), scheme: 'file' };
      }
      return { path: uri, scheme: 'file' };
    }
    return uri;
  }
}

// Default export
export default {
  AstNode,
  Grammar,
  EmptyFileSystem,
  LangiumDocument,
  URI
};