# Prompt 011: Migration Tools

**STATUS: This feature was implemented but later removed from the project.**

## Objective
Create tools to help users migrate from other grammar formats (ANTLR, Xtext) and existing GLSP projects to the Langium-based generator, including automated converters and upgrade assistants.

## Background
Many users have existing grammars in other formats or hand-written GLSP implementations. Migration tools would lower the barrier to adoption by automating conversion.

## Requirements

### 1. ANTLR to Langium Converter
Convert ANTLR4 grammars:
- Parse .g4 files
- Map ANTLR concepts to Langium
- Handle lexer/parser split
- Convert actions and predicates
- Generate equivalent Langium grammar

### 2. Xtext to Langium Converter
Convert Xtext grammars:
- Parse .xtext files
- Map Xtext features
- Handle cross-references
- Convert validation rules
- Preserve formatting

### 3. GLSP Project Analyzer
Analyze existing GLSP projects:
- Detect hand-written models
- Extract type definitions
- Identify patterns
- Generate grammar from code
- Create migration report

### 4. Upgrade Assistant
Help upgrade between versions:
- Detect breaking changes
- Automated fixes
- Migration guides
- Deprecation warnings
- Version compatibility check

### 5. Migration Validation
Ensure successful migration:
- Compare generated vs original
- Semantic equivalence tests
- Performance comparison
- Feature parity check
- Rollback capability

### 6. Interactive Mode
Provide guided migration:
- Step-by-step wizard
- Preview changes
- Manual intervention points
- Conflict resolution
- Progress tracking

## Implementation Details

### ANTLR Converter
```typescript
class AntlrToLangiumConverter {
  async convert(antlrGrammar: string): Promise<string> {
    const ast = this.parseAntlr(antlrGrammar);
    const langiumAst = this.transformAst(ast);
    return this.generateLangium(langiumAst);
  }

  private transformAst(antlrAst: AntlrAST): LangiumAST {
    return {
      name: antlrAst.grammarName,
      imports: this.convertImports(antlrAst.imports),
      rules: this.convertRules(antlrAst.rules),
      interfaces: this.inferInterfaces(antlrAst.rules)
    };
  }

  private convertRule(rule: AntlrRule): LangiumRule {
    // Map ANTLR rule to Langium
    if (rule.type === 'parser') {
      return {
        name: rule.name,
        type: 'interface',
        properties: this.extractProperties(rule.alternatives)
      };
    }
    // Handle lexer rules, fragments, etc.
  }
}
```

### GLSP Project Analyzer
```typescript
class GLSPProjectAnalyzer {
  async analyze(projectPath: string): Promise<AnalysisReport> {
    const report: AnalysisReport = {
      modelTypes: [],
      patterns: [],
      recommendations: []
    };

    // Scan TypeScript files
    const tsFiles = await this.findTypeScriptFiles(projectPath);
    
    for (const file of tsFiles) {
      const ast = ts.createSourceFile(
        file,
        await fs.readFile(file, 'utf8'),
        ts.ScriptTarget.Latest
      );
      
      // Extract interfaces and classes
      const types = this.extractTypes(ast);
      report.modelTypes.push(...types);
      
      // Detect GLSP patterns
      const patterns = this.detectPatterns(ast);
      report.patterns.push(...patterns);
    }

    // Generate grammar from analysis
    report.suggestedGrammar = this.generateGrammar(report);
    
    return report;
  }
}
```

### Migration Wizard
```typescript
class MigrationWizard {
  async start(): Promise<void> {
    console.log('GLSP Generator Migration Wizard');
    console.log('==============================\n');

    const source = await this.selectSource();
    const options = await this.configureMigration(source);
    
    console.log('\nAnalyzing project...');
    const analysis = await this.analyze(source, options);
    
    console.log('\nMigration Plan:');
    this.displayPlan(analysis);
    
    const confirm = await this.confirmMigration();
    if (!confirm) return;
    
    console.log('\nMigrating...');
    await this.executeMigration(analysis, options);
    
    console.log('\n✅ Migration complete!');
    this.displayNextSteps();
  }

  private async selectSource(): Promise<MigrationSource> {
    const { source } = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'What would you like to migrate?',
        choices: [
          'ANTLR4 Grammar (.g4)',
          'Xtext Grammar (.xtext)',
          'Existing GLSP Project',
          'Other'
        ]
      }
    ]);
    return source;
  }
}
```

### Version Upgrade
```typescript
interface UpgradeRule {
  fromVersion: string;
  toVersion: string;
  changes: Change[];
}

interface Change {
  type: 'breaking' | 'deprecation' | 'feature';
  description: string;
  automated: boolean;
  transform?: (code: string) => string;
}

class UpgradeAssistant {
  async upgrade(fromVersion: string, toVersion: string): Promise<void> {
    const rules = this.getUpgradeRules(fromVersion, toVersion);
    
    for (const rule of rules) {
      console.log(`\nApplying: ${rule.description}`);
      
      if (rule.automated) {
        await this.applyAutomatedFix(rule);
      } else {
        await this.showManualInstructions(rule);
      }
    }
  }
}
```

## Acceptance Criteria

1. ✅ Convert ANTLR4 grammars successfully
2. ✅ Convert Xtext grammars successfully
3. ✅ Analyze existing GLSP projects
4. ✅ Interactive migration wizard
5. ✅ Version upgrade automation
6. ✅ Comprehensive migration reports
7. ✅ Rollback capability

## Testing Requirements

Create migration tests:
- Test with real ANTLR grammars
- Test with real Xtext grammars
- Test GLSP project analysis
- Test upgrade scenarios
- Validate converted grammars
- Performance tests for large migrations

## Files to Create/Modify

1. `src/migration/antlr-converter.ts`
2. `src/migration/xtext-converter.ts`
3. `src/migration/glsp-analyzer.ts`
4. `src/migration/upgrade-assistant.ts`
5. `src/migration/wizard.ts`
6. `scripts/migrate.js` - CLI entry point
7. Migration documentation

## Dependencies
- None

## Notes
- Consider supporting TextMate grammars
- Preserve comments and formatting
- Handle custom actions carefully
- Consider partial migration support
- Create migration case studies
