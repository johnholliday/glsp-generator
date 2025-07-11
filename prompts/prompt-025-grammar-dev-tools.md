# Prompt 025: Grammar Development Tools

## Goal
Create specialized tools for grammar development including real-time validation, visualization, example generation, and VS Code language support enhancements.

## Why
- Grammar syntax errors discovered late
- No visual representation of grammar structure
- Missing example generation from grammar
- Limited IntelliSense for .langium files
- No grammar complexity analysis
- Difficult to test grammar rules

## What
A comprehensive grammar development toolkit with real-time validation, visualization tools, example generators, and enhanced IDE support.

### Success Criteria
- [ ] Real-time grammar validation as you type
- [ ] Grammar structure visualization
- [ ] Example code generation from rules
- [ ] Enhanced VS Code support for .langium
- [ ] Grammar complexity metrics
- [ ] Rule testing framework
- [ ] Grammar refactoring tools
- [ ] Import/export to other formats

## Implementation Blueprint

### Phase 1: Real-time Validator

CREATE packages/generator/src/grammar-tools/validator.ts:
```typescript
export class RealtimeGrammarValidator {
  private validationWorker: Worker;
  
  constructor() {
    this.validationWorker = new Worker('./validation-worker.js');
  }
  
  async validateAsYouType(content: string, cursorPosition: number) {
    return new Promise((resolve) => {
      this.validationWorker.postMessage({ content, cursorPosition });
      this.validationWorker.onmessage = (e) => {
        resolve(e.data);
      };
    });
  }
}
```

### Phase 2: Grammar Visualizer

CREATE packages/generator/src/grammar-tools/visualizer.ts:
```typescript
export class GrammarVisualizer {
  generateRailroadDiagram(grammar: Grammar): string {
    // Generate SVG railroad diagram
    return `
      <svg>
        <!-- Railroad diagram visualization -->
      </svg>
    `;
  }
  
  generateDependencyGraph(grammar: Grammar): string {
    // Generate Mermaid diagram
    return `
      graph TD
        ${this.generateMermaidNodes(grammar)}
    `;
  }
}
```

### Phase 3: Example Generator

CREATE packages/generator/src/grammar-tools/example-generator.ts:
```typescript
export class ExampleGenerator {
  generateExamples(grammar: Grammar, rule: string) {
    // Generate valid examples for a rule
    const examples = [];
    
    // Simple example
    examples.push(this.generateMinimal(rule));
    
    // Complex example
    examples.push(this.generateComplex(rule));
    
    // Edge cases
    examples.push(...this.generateEdgeCases(rule));
    
    return examples;
  }
}
```

### Phase 4: VS Code Language Enhancement

CREATE packages/vscode-extension/src/grammar-features.ts:
```typescript
export class GrammarLanguageFeatures {
  registerProviders() {
    // Enhanced completion provider
    vscode.languages.registerCompletionItemProvider('langium', {
      provideCompletionItems: this.provideCompletions.bind(this)
    });
    
    // Code lens for complexity
    vscode.languages.registerCodeLensProvider('langium', {
      provideCodeLenses: this.provideComplexityLens.bind(this)
    });
    
    // Quick fixes
    vscode.languages.registerCodeActionProvider('langium', {
      provideCodeActions: this.provideQuickFixes.bind(this)
    });
  }
}
```

### Integration

UPDATE VS Code extension package.json:
```json
{
  "contributes": {
    "languages": [{
      "id": "langium",
      "extensions": [".langium"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "langium",
      "scopeName": "source.langium",
      "path": "./syntaxes/langium.tmLanguage.json"
    }],
    "commands": [
      {
        "command": "glsp.visualizeGrammar",
        "title": "Visualize Grammar Structure"
      },
      {
        "command": "glsp.generateExamples",
        "title": "Generate Grammar Examples"
      }
    ]
  }
}
```

## Final Validation Checklist
- [ ] Real-time validation catches errors immediately
- [ ] Visualizations accurately represent grammar
- [ ] Generated examples are valid
- [ ] VS Code features enhance productivity
- [ ] Complexity metrics are meaningful
- [ ] Refactoring tools preserve semantics
- [ ] Import/export maintains fidelity
- [ ] Performance remains responsive