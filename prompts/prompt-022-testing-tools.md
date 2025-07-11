# Prompt 022: Testing & Debugging Tools

## Goal
Create advanced testing and debugging tools including test data generators, visual debugging aids, and performance benchmarking capabilities.

## Why
- Manual test data creation is time-consuming
- Debugging complex grammars is difficult
- No performance benchmarking tools
- Missing visual test reports
- No regression test automation

## What
A comprehensive testing toolkit with grammar generators, visual debuggers, performance profilers, and automated regression testing.

### Success Criteria
- [ ] Test data generator for grammars
- [ ] Visual debugging tools
- [ ] Performance benchmarking suite
- [ ] Mutation testing support
- [ ] Test coverage visualization
- [ ] Automated regression tests
- [ ] Debug REPL for grammars
- [ ] Integration with CI/CD

## Implementation Blueprint

### Phase 1: Test Data Generator

CREATE packages/generator/src/testing/grammar-generator.ts:
```typescript
export class GrammarGenerator {
  generateTestGrammar(options: {
    complexity: 'simple' | 'medium' | 'complex';
    features: string[];
    size: number;
  }): string {
    // Generate random but valid grammar
  }
  
  generateFromSchema(schema: {
    rules: number;
    interfaces: number;
    properties: { min: number; max: number };
    depth: number;
  }): string {
    // Generate grammar matching schema
  }
}
```

### Phase 2: Visual Debugger

CREATE packages/generator/src/debug/visual-debugger.ts:
```typescript
export class VisualDebugger {
  async debug(grammarFile: string) {
    // Launch web-based debugger
    const app = express();
    
    app.get('/debug', (req, res) => {
      res.send(this.renderDebugUI());
    });
    
    app.ws('/debug-session', (ws) => {
      // Real-time debugging via WebSocket
    });
  }
  
  private renderDebugUI(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>GLSP Grammar Debugger</title>
          <script src="https://d3js.org/d3.v7.min.js"></script>
        </head>
        <body>
          <div id="ast-tree"></div>
          <div id="step-controls"></div>
          <script>
            // D3.js AST visualization
          </script>
        </body>
      </html>
    `;
  }
}
```

### Phase 3: Performance Benchmarking

CREATE packages/generator/src/testing/benchmark.ts:
```typescript
import { Bench } from 'tinybench';

export class PerformanceBenchmark {
  async runBenchmarks() {
    const bench = new Bench({ time: 100 });
    
    bench
      .add('Parse Small Grammar', async () => {
        await this.parseGrammar('small.langium');
      })
      .add('Parse Large Grammar', async () => {
        await this.parseGrammar('large.langium');
      })
      .add('Generate Templates', async () => {
        await this.generateTemplates();
      });
    
    await bench.run();
    
    console.table(bench.table());
    
    // Generate performance report
    this.generateReport(bench.results);
  }
}
```

### Integration

UPDATE package.json:
```json
{
  "scripts": {
    "test:generate": "node scripts/generate-test-data.js",
    "test:debug": "node scripts/debug-grammar.js",
    "test:bench": "node scripts/benchmark.js",
    "test:mutate": "stryker run",
    "test:visual": "vitest --ui --coverage"
  }
}
```

## Final Validation Checklist
- [ ] Test data generator creates valid grammars
- [ ] Visual debugger shows AST in real-time
- [ ] Benchmarks track performance over time
- [ ] Coverage reports are visual and actionable
- [ ] Debug REPL allows interactive testing
- [ ] All tools integrate with CI/CD
- [ ] Documentation explains all features