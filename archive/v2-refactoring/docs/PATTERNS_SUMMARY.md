# Factory and Builder Patterns Implementation Summary

## Overview

Factory and Builder patterns have been implemented to simplify the creation of complex objects in the GLSP Generator. These patterns provide:
- Fluent APIs for object construction
- Validation during building
- Preset configurations
- Extensibility for custom implementations

## Important Note on Grammar Objects

We exclusively use the Langium API to create and parse Grammar objects. We do NOT manually construct Grammar AST objects. Grammar objects should only come from:
- `parser.parse(grammarPath)` - Parse from file
- `parser.parseContent(grammarContent)` - Parse from string
- Mock parser responses in tests

## Implemented Patterns

### 1. Builders

#### ConfigurationBuilder
Creates generation configuration objects with validation and presets.

```typescript
const config = new ConfigurationBuilder()
  .withGrammarPath('./grammar.langium')
  .withOutputDir('./output')
  .enableValidation()
  .withStrictValidation()
  .withTemplates('browser', 'server')
  .enablePlugins('documentation', 'type-safety')
  .forProduction()
  .build();
```

**Features:**
- Validation options
- Template selection
- Plugin configuration
- Environment presets (production, development, testing)
- Metadata support
- Timeout configuration

**Presets:**
- `ConfigurationPresets.minimal()` - Quick generation
- `ConfigurationPresets.full()` - All features enabled
- `ConfigurationPresets.ci()` - CI/CD optimized

#### TemplateContextBuilder
Creates template rendering contexts with helpers and partials.

```typescript
const context = new TemplateContextBuilder()
  .withProjectName('MyProject')
  .withGrammar(grammar)
  .withPackageInfo('com.example', '1.0.0')
  .withExtensionConfig('my-extension', '0.1.0', {
    displayName: 'My GLSP Extension',
    categories: ['Programming Languages']
  })
  .addHelper('formatDate', (date) => new Date(date).toLocaleDateString())
  .forBrowser()
  .build();
```

**Features:**
- Grammar data extraction
- Package and extension configuration
- Custom helpers and partials
- Feature flags
- Environment-specific configuration (browser, server, common)
- Built-in helpers (case conversion, array operations)

### 2. Factories

#### ValidationRuleFactory
Creates various validation rules for grammar checking.

```typescript
const factory = new ValidationRuleFactory();

// Create individual rules
const entryRule = factory.createEntryRuleValidator();
const circularDeps = factory.createCircularDependencyValidator();
const naming = factory.createNamingConventionValidator({
  rulePattern: /^[A-Z][a-zA-Z0-9]*$/,
  interfacePattern: /^I[A-Z][a-zA-Z0-9]*$/
});

// Create composite rule
const strict = factory.createCompositeRule(entryRule, circularDeps, naming);

// Use presets
const presets = new ValidationRulePresets(factory);
const productionRules = presets.getProductionRules();
```

**Available Rules:**
- Entry rule validation
- Circular dependency detection
- Naming convention enforcement
- Unused rule detection
- Property type validation
- Custom rule creation

#### PluginFactory
Creates generator plugins with hooks and configuration.

```typescript
const factory = new PluginFactory(logger);

// Create documentation plugin
const docPlugin = factory.createDocumentationPlugin({
  format: 'markdown',
  includeExamples: true,
  generateDiagrams: true
});

// Create type safety plugin
const typePlugin = factory.createTypeSafetyPlugin({
  generateGuards: true,
  generateValidators: true,
  strict: true
});

// Create composite plugin
const composite = factory.createCompositePlugin('full-featured', [
  docPlugin,
  typePlugin,
  factory.createMetricsPlugin()
]);

// Use presets
const presets = new PluginPresets(factory);
const prodPlugins = presets.getProductionPlugins();
```

**Available Plugins:**
- Documentation generation
- Type safety enforcement
- Metrics collection
- Validation enhancement
- Caching for performance
- Custom plugin creation

## Usage Examples

### Complete Generation Setup

```typescript
import { 
  ConfigurationBuilder,
  TemplateContextBuilder,
  ValidationRuleFactory,
  PluginFactory
} from '@/core/patterns';

// 1. Parse grammar using Langium API
const parser = container.get<IParser>(TYPES.IParser);
const grammar = await parser.parse('./statemachine.langium');

// 2. Build configuration
const config = new ConfigurationBuilder()
  .withGrammarPath('./statemachine.langium')
  .withOutputDir('./generated')
  .enableValidation()
  .withTemplates('browser', 'server', 'common')
  .enablePlugins('documentation', 'type-safety')
  .forProduction()
  .build();

// 3. Build template context
const context = new TemplateContextBuilder()
  .withProjectName('StateMachine')
  .withGrammar(grammar)
  .withPackageInfo('@example/statemachine', '1.0.0')
  .withTypeSafety({ strict: true })
  .forBrowser()
  .build();

// 4. Create validation rules
const ruleFactory = new ValidationRuleFactory();
const rules = [
  ruleFactory.createEntryRuleValidator(),
  ruleFactory.createNamingConventionValidator(),
  ruleFactory.createPropertyTypeValidator()
];

// 5. Create plugins
const pluginFactory = new PluginFactory(logger);
const plugins = [
  pluginFactory.createDocumentationPlugin(),
  pluginFactory.createTypeSafetyPlugin(),
  pluginFactory.createMetricsPlugin()
];
```

### Testing with Builders

```typescript
// Parse test grammar from content
const testGrammarContent = `
grammar TestGrammar

interface TestNode {
  name: string
}

entry Model:
  nodes+=TestNode*;

terminal ID: /[a-zA-Z]+/;
`;

const testGrammar = await parser.parseContent(testGrammarContent);

const testConfig = new ConfigurationBuilder()
  .withGrammarPath('/test/grammar.langium')
  .withOutputDir('/test/output')
  .forTesting()
  .build();

const testContext = new TemplateContextBuilder()
  .withProjectName('Test')
  .withGrammar(testGrammar)
  .addProperty('testMode', true)
  .build();
```

## Benefits

### 1. **Simplified Object Creation**
- No need to manually construct complex objects
- Fluent API makes code readable
- Validation ensures correctness

### 2. **Consistency**
- Standard way to create objects
- Enforced validation rules
- Default values handled automatically

### 3. **Extensibility**
- Easy to add new builders/factories
- Custom rules and plugins
- Preset configurations

### 4. **Testability**
- Builders make test data creation simple
- Factories allow easy mocking
- Consistent object structure

### 5. **Documentation**
- Self-documenting API
- IntelliSense support
- Clear intent in code

## Best Practices

1. **Use Builders for Complex Objects**
   ```typescript
   // Good
   const config = new ConfigurationBuilder()
     .withGrammarPath(path)
     .enableValidation()
     .build();
   
   // Avoid
   const config = {
     grammarPath: path,
     options: { validate: true }
   };
   ```

2. **Use Factories for Variations**
   ```typescript
   // Good - different validation rules
   const strict = factory.createStrictValidator();
   const lenient = factory.createLenientValidator();
   ```

3. **Use Presets for Common Scenarios**
   ```typescript
   // Good - standard configurations
   const config = ConfigurationPresets.ci(grammar, output);
   ```

4. **Chain Methods for Readability**
   ```typescript
   const context = new TemplateContextBuilder()
     .withProjectName(name)
     .withGrammar(grammar)
     .forBrowser()
     .build();
   ```

5. **Validate in Build Method**
   ```typescript
   build(): Config {
     if (!this.requiredField) {
       throw new Error('Required field missing');
     }
     return { ...this.config };
   }
   ```

## Files Created

- `/src/core/patterns/builders/ConfigurationBuilder.ts`
- `/src/core/patterns/builders/TemplateContextBuilder.ts`
- `/src/core/patterns/factories/ValidationRuleFactory.ts`
- `/src/core/patterns/factories/PluginFactory.ts`
- `/src/core/patterns/index.ts`

The factory and builder patterns provide a clean, consistent way to create complex objects throughout the GLSP Generator, making the codebase more maintainable and testable.