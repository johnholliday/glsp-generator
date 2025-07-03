import { ParsedGrammar, GrammarAST, GrammarInterface, GrammarType, ParsedRule } from '../types/grammar.js';
import { PerformanceMonitor } from './monitor.js';

/**
 * Convert parsed grammar to optimized AST format
 */
export function parseGrammarToAST(grammar: ParsedGrammar, monitor?: PerformanceMonitor): GrammarAST {
    const perfMonitor = monitor || new PerformanceMonitor();
    const endTimer = perfMonitor.startOperation('grammar-to-ast-conversion');

    try {
        // Generate rules from interfaces and types
        const rules = generateRulesFromGrammar(grammar);

        const ast: GrammarAST = {
            projectName: grammar.projectName,
            grammarName: grammar.projectName,
            rules,
            interfaces: grammar.interfaces,
            types: grammar.types,
            imports: extractImports(grammar),
            metadata: {
                ruleCount: rules.length,
                interfaceCount: grammar.interfaces.length,
                parseTime: Date.now(),
                typeCount: grammar.types.length,
                hasComplexTypes: hasComplexTypes(grammar),
                hasCircularReferences: detectCircularReferences(grammar)
            }
        };

        return ast;
    } finally {
        endTimer();
    }
}

/**
 * Generate grammar rules from interfaces and types
 */
function generateRulesFromGrammar(grammar: ParsedGrammar): ParsedRule[] {
    const rules: ParsedRule[] = [];

    // Generate rules from interfaces
    for (const iface of grammar.interfaces) {
        const rule: ParsedRule = {
            name: iface.name,
            definition: generateRuleDefinition(iface),
            type: 'interface',
            properties: iface.properties,
            references: extractReferences(iface)
        };
        rules.push(rule);
    }

    // Generate rules from types
    for (const type of grammar.types) {
        const rule: ParsedRule = {
            name: type.name,
            definition: type.definition,
            type: 'type',
            properties: [],
            references: extractTypeReferences(type)
        };
        rules.push(rule);
    }

    return rules;
}

/**
 * Generate rule definition from interface
 */
function generateRuleDefinition(iface: GrammarInterface): string {
    const properties = iface.properties.map(prop => {
        let def = `${prop.name}`;
        if (prop.optional) def += '?';
        def += `=${prop.type}`;
        if (prop.array) def += '*';
        return def;
    }).join(' ');

    let definition = `${iface.name}: ${properties}`;

    if (iface.superTypes.length > 0) {
        definition += ` extends ${iface.superTypes.join(', ')}`;
    }

    return definition;
}

/**
 * Extract references from interface
 */
function extractReferences(iface: GrammarInterface): string[] {
    const references = new Set<string>();

    // Add super types
    iface.superTypes.forEach(type => references.add(type));

    // Add property type references
    iface.properties.forEach(prop => {
        const baseType = prop.type.replace(/\[\]$/, ''); // Remove array notation
        if (isCustomType(baseType)) {
            references.add(baseType);
        }
    });

    return Array.from(references);
}

/**
 * Extract references from type definition
 */
function extractTypeReferences(type: GrammarType): string[] {
    const references = new Set<string>();

    if (type.unionTypes) {
        type.unionTypes.forEach(unionType => {
            if (isCustomType(unionType)) {
                references.add(unionType);
            }
        });
    } else {
        // Parse definition for type references
        const typeRefs = type.definition.match(/\b[A-Z][a-zA-Z0-9]*\b/g) || [];
        typeRefs.forEach(ref => {
            if (isCustomType(ref)) {
                references.add(ref);
            }
        });
    }

    return Array.from(references);
}

/**
 * Extract imports from grammar
 */
function extractImports(grammar: ParsedGrammar): string[] {
    const imports = new Set<string>();

    // Look for common imports based on types used
    const allTypes = new Set<string>();

    grammar.interfaces.forEach(iface => {
        iface.properties.forEach(prop => {
            allTypes.add(prop.type.replace(/\[\]$/, ''));
        });
        iface.superTypes.forEach(type => allTypes.add(type));
    });

    grammar.types.forEach(type => {
        if (type.unionTypes) {
            type.unionTypes.forEach(unionType => allTypes.add(unionType));
        }
    });

    // Add standard imports based on detected types
    if (hasType(allTypes, 'ID')) {
        imports.add('terminal ID: /[_a-zA-Z][\\w_]*/;');
    }

    if (hasType(allTypes, 'STRING')) {
        imports.add('terminal STRING: /"[^"]*"|\'[^\']*\'/;');
    }

    if (hasType(allTypes, 'NUMBER')) {
        imports.add('terminal NUMBER: /[0-9]+(\\.[0-9]+)?/;');
    }

    return Array.from(imports);
}

/**
 * Check if grammar has complex types
 */
function hasComplexTypes(grammar: ParsedGrammar): boolean {
    // Check for arrays
    const hasArrays = grammar.interfaces.some(iface =>
        iface.properties.some(prop => prop.array)
    );

    // Check for optional properties
    const hasOptionals = grammar.interfaces.some(iface =>
        iface.properties.some(prop => prop.optional)
    );

    // Check for inheritance
    const hasInheritance = grammar.interfaces.some(iface =>
        iface.superTypes.length > 0
    );

    // Check for union types
    const hasUnions = grammar.types.some(type =>
        type.unionTypes && type.unionTypes.length > 1
    );

    return hasArrays || hasOptionals || hasInheritance || hasUnions;
}

/**
 * Detect circular references in grammar
 */
function detectCircularReferences(grammar: ParsedGrammar): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    // Build dependency graph
    const dependencies = new Map<string, string[]>();

    grammar.interfaces.forEach(iface => {
        const deps = extractReferences(iface);
        dependencies.set(iface.name, deps);
    });

    grammar.types.forEach(type => {
        const deps = extractTypeReferences(type);
        dependencies.set(type.name, deps);
    });

    // DFS to detect cycles
    function hasCycle(node: string): boolean {
        if (recursionStack.has(node)) {
            return true; // Back edge found - cycle detected
        }

        if (visited.has(node)) {
            return false; // Already processed
        }

        visited.add(node);
        recursionStack.add(node);

        const deps = dependencies.get(node) || [];
        for (const dep of deps) {
            if (dependencies.has(dep) && hasCycle(dep)) {
                return true;
            }
        }

        recursionStack.delete(node);
        return false;
    }

    // Check all nodes
    for (const [name] of dependencies) {
        if (!visited.has(name) && hasCycle(name)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a type is a custom type (not primitive)
 */
function isCustomType(type: string): boolean {
    const primitiveTypes = new Set([
        'string', 'number', 'boolean', 'any', 'void', 'null', 'undefined',
        'String', 'Number', 'Boolean', 'ID', 'STRING', 'NUMBER', 'BOOLEAN'
    ]);

    return !primitiveTypes.has(type) && /^[A-Z]/.test(type);
}

/**
 * Check if a set contains a specific type
 */
function hasType(types: Set<string>, targetType: string): boolean {
    return types.has(targetType);
}

/**
 * Optimize AST for performance
 */
export function optimizeAST(ast: GrammarAST): GrammarAST {
    const optimized = { ...ast };

    // Sort rules by dependency order
    optimized.rules = sortRulesByDependency(ast.rules);

    // Optimize interfaces by grouping related ones
    optimized.interfaces = optimizeInterfaces(ast.interfaces);

    // Optimize types by merging similar union types
    optimized.types = optimizeTypes(ast.types);

    // Update metadata
    optimized.metadata = {
        ...ast.metadata,
        ruleCount: ast.metadata?.ruleCount || 0,
        interfaceCount: ast.metadata?.interfaceCount || 0,
        parseTime: ast.metadata?.parseTime || Date.now(),
        typeCount: ast.metadata?.typeCount || 0,
        hasComplexTypes: ast.metadata?.hasComplexTypes || false,
        hasCircularReferences: ast.metadata?.hasCircularReferences || false,
        optimized: true,
        optimizationTime: Date.now()
    };

    return optimized;
}

/**
 * Sort rules by dependency order
 */
function sortRulesByDependency(rules: ParsedRule[]): ParsedRule[] {
    const sorted: ParsedRule[] = [];
    const visited = new Set<string>();
    const ruleMap = new Map(rules.map(rule => [rule.name, rule]));

    function visit(ruleName: string) {
        if (visited.has(ruleName)) return;

        const rule = ruleMap.get(ruleName);
        if (!rule) return;

        visited.add(ruleName);

        // Visit dependencies first
        rule.references.forEach(ref => {
            if (ruleMap.has(ref)) {
                visit(ref);
            }
        });

        sorted.push(rule);
    }

    // Visit all rules
    rules.forEach(rule => visit(rule.name));

    return sorted;
}

/**
 * Optimize interfaces by grouping related ones
 */
function optimizeInterfaces(interfaces: GrammarInterface[]): GrammarInterface[] {
    // For now, just return as-is
    // Future optimization: group by inheritance hierarchy
    return interfaces;
}

/**
 * Optimize types by merging similar union types
 */
function optimizeTypes(types: GrammarType[]): GrammarType[] {
    // For now, just return as-is
    // Future optimization: merge similar union types
    return types;
}

/**
 * Validate AST structure
 */
export function validateAST(ast: GrammarAST): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for missing references
    const definedTypes = new Set([
        ...ast.interfaces.map(i => i.name),
        ...ast.types.map(t => t.name)
    ]);

    ast.rules.forEach(rule => {
        rule.references.forEach(ref => {
            if (!definedTypes.has(ref) && isCustomType(ref)) {
                errors.push(`Rule '${rule.name}' references undefined type '${ref}'`);
            }
        });
    });

    // Check for duplicate names
    const allNames = [
        ...ast.interfaces.map(i => i.name),
        ...ast.types.map(t => t.name)
    ];

    const duplicates = allNames.filter((name, index) => allNames.indexOf(name) !== index);
    duplicates.forEach(name => {
        errors.push(`Duplicate definition found: '${name}'`);
    });

    return {
        valid: errors.length === 0,
        errors
    };
}