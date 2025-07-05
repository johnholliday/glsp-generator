/**
 * Grammar test fixtures
 * @module test/fixtures
 */

/**
 * Simple valid grammar
 */
export const SIMPLE_GRAMMAR = `
grammar SimpleGrammar

entry Model:
    elements+=Element*;

Element:
    'element' name=ID;

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
`;

/**
 * Complex grammar with interfaces
 */
export const COMPLEX_GRAMMAR = `
grammar ComplexGrammar

import './types'

entry Model:
    imports+=Import*
    declarations+=Declaration*;

Import:
    'import' path=STRING;

interface Declaration {
    name: string
}

interface NamedElement extends Declaration {
    description?: string
}

type Entity = ClassDeclaration | InterfaceDeclaration;

ClassDeclaration returns NamedElement:
    'class' name=ID ('extends' superClass=[ClassDeclaration:ID])?
    '{'
        members+=Member*
    '}';

InterfaceDeclaration returns NamedElement:
    'interface' name=ID ('extends' superTypes+=[InterfaceDeclaration:ID] (',' superTypes+=[InterfaceDeclaration:ID])*)?
    '{'
        members+=Member*
    '}';

Member:
    Property | Method;

Property:
    name=ID ':' type=TypeReference optional?='?'? ';';

Method:
    name=ID '(' parameters+=Parameter (',' parameters+=Parameter)* ')' ':' returnType=TypeReference ';';

Parameter:
    name=ID ':' type=TypeReference;

TypeReference:
    primitive=PrimitiveType | reference=[Declaration:ID] | array=ArrayType;

ArrayType:
    elementType=TypeReference '[]';

PrimitiveType returns string:
    'string' | 'number' | 'boolean';

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
`;

/**
 * Grammar with validation errors
 */
export const INVALID_GRAMMAR = `
grammar InvalidGrammar

// Syntax error - missing colon
Rule1
    name=ID;

// Invalid syntax
Rule2: {
    invalid syntax here
}
`;

/**
 * State machine grammar example
 */
export const STATE_MACHINE_GRAMMAR = `
grammar StateMachine

entry StateMachine:
    'statemachine' name=ID '{'
        states+=State*
        transitions+=Transition*
    '}';

State:
    'state' name=ID ('{'
        'entry' ':' entryAction=Action
        'exit' ':' exitAction=Action
    '}')?;

Transition:
    'transition' name=ID ':' 
    source=[State:ID] '->' target=[State:ID]
    ('[' trigger=Event ']')?
    ('/' action=Action)?;

Event:
    name=ID;

Action:
    name=ID '(' (args+=STRING (',' args+=STRING)*)? ')';

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
`;

/**
 * Grammar with all features
 */
export const FULL_FEATURED_GRAMMAR = `
grammar FullFeatured

import './base-types'

entry Model:
    (elements+=Element)*;

// Interfaces
interface Element {
    name: string
    $container: Model
}

interface TypedElement extends Element {
    type: Type
}

// Type unions
type Type = PrimitiveType | ComplexType | Reference;

// Abstract rules
abstract NamedElement:
    Entity | Value;

// Parser rules with actions
Entity implements TypedElement:
    {infer Entity} 
    annotations+=Annotation*
    'entity' name=ID ('extends' superType=[Entity:QualifiedName])?
    '{'
        features+=Feature*
    '}';

// Fragments
fragment Feature:
    Property | Operation;

Property:
    (isReadonly?='readonly')? name=ID ':' type=TypeReference
    (isOptional?='?')? ('=' defaultValue=Expression)?;

Operation returns Operation:
    'operation' name=ID 
    '(' (parameters+=Parameter (',' parameters+=Parameter)*)? ')'
    (':' returnType=TypeReference)?
    body=Block?;

Parameter:
    name=ID ':' type=TypeReference (isOptional?='?')?;

// Data type rules
QualifiedName returns string:
    ID ('.' ID)*;

// Expressions with precedence
Expression:
    Assignment;

Assignment infers Expression:
    Addition ({infer Assignment.left=current} '=' right=Addition)*;

Addition infers Expression:
    Multiplication ({infer Addition.left=current} operator=('+' | '-') right=Multiplication)*;

Multiplication infers Expression:
    Primary ({infer Multiplication.left=current} operator=('*' | '/') right=Primary)*;

Primary infers Expression:
    NumberLiteral | StringLiteral | Reference | '(' Expression ')';

NumberLiteral:
    value=NUMBER;

StringLiteral:
    value=STRING;

Reference:
    target=[NamedElement:QualifiedName];

// Hidden terminals
hidden terminal WS: /\\s+/;
hidden terminal ML_COMMENT: /\\/\\*[\\s\\S]*?\\*\\//;
hidden terminal SL_COMMENT: /\\/\\/[^\\n\\r]*/;

// Regular terminals
terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
terminal NUMBER returns number: /[0-9]+(\\.[0-9]+)?/;
terminal STRING: /"[^"]*"|'[^']*'/;

// Keywords
terminal fragment KEYWORDS: 'entity' | 'interface' | 'type' | 'readonly' | 'operation';
`;

/**
 * Minimal valid grammar
 */
export const MINIMAL_GRAMMAR = `
grammar MinimalGrammar

entry Model:
    name=ID;

terminal ID: /[a-zA-Z]+/;
`;

/**
 * Grammar with cross-references
 */
export const CROSS_REFERENCE_GRAMMAR = `
grammar CrossReference

entry Model:
    types+=Type*
    instances+=Instance*;

Type:
    'type' name=ID ('extends' superType=[Type:ID])?;

Instance:
    'instance' name=ID ':' type=[Type:ID];

terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;
`;

/**
 * Get test grammar by name
 */
export function getTestGrammar(name: string): string {
  const grammars: Record<string, string> = {
    simple: SIMPLE_GRAMMAR,
    complex: COMPLEX_GRAMMAR,
    invalid: INVALID_GRAMMAR,
    stateMachine: STATE_MACHINE_GRAMMAR,
    fullFeatured: FULL_FEATURED_GRAMMAR,
    minimal: MINIMAL_GRAMMAR,
    crossReference: CROSS_REFERENCE_GRAMMAR,
  };

  if (!(name in grammars)) {
    throw new Error(`Unknown test grammar: ${name}`);
  }

  return grammars[name];
}

/**
 * Grammar test cases with expected results
 */
export const GRAMMAR_TEST_CASES = [
  {
    name: 'simple',
    grammar: SIMPLE_GRAMMAR,
    expected: {
      valid: true,
      ruleCount: 2,
      hasEntry: true,
      hasInterfaces: false,
      hasTypes: false,
    },
  },
  {
    name: 'complex',
    grammar: COMPLEX_GRAMMAR,
    expected: {
      valid: true,
      ruleCount: 12,
      hasEntry: true,
      hasInterfaces: true,
      hasTypes: true,
    },
  },
  {
    name: 'invalid',
    grammar: INVALID_GRAMMAR,
    expected: {
      valid: false,
      errors: [
        'No entry rule defined',
        'Circular inheritance detected',
        'Undefined reference: UndefinedRule',
        'Duplicate rule: Rule2',
      ],
    },
  },
  {
    name: 'stateMachine',
    grammar: STATE_MACHINE_GRAMMAR,
    expected: {
      valid: true,
      ruleCount: 5,
      hasEntry: true,
      hasInterfaces: false,
      hasTypes: false,
    },
  },
  {
    name: 'minimal',
    grammar: MINIMAL_GRAMMAR,
    expected: {
      valid: true,
      ruleCount: 1,
      hasEntry: true,
      hasInterfaces: false,
      hasTypes: false,
    },
  },
];

/**
 * Get test grammar content by complexity
 */
export function getTestGrammarContent(complexity: 'minimal' | 'simple' | 'medium' | 'complex' = 'simple'): string {
  switch (complexity) {
    case 'minimal':
      return MINIMAL_GRAMMAR;
    case 'simple':
      return SIMPLE_GRAMMAR;
    case 'medium':
      return STATE_MACHINE_GRAMMAR;
    case 'complex':
      return COMPLEX_GRAMMAR;
    default:
      return SIMPLE_GRAMMAR;
  }
}

/**
 * Create grammar content with specific features
 */
export function createGrammarContent(features: {
  name: string;
  interfaces?: Array<{ name: string; properties: Array<{ name: string; type: string; optional?: boolean }> }>;
  types?: Array<{ name: string; values: string[] }>;
  rules?: Array<{ name: string; entry?: boolean; definition: string }>;
  imports?: string[];
}): string {
  let content = `grammar ${features.name}\n\n`;
  
  // Add imports
  if (features.imports) {
    features.imports.forEach(imp => {
      content += `import '${imp}'\n`;
    });
    content += '\n';
  }
  
  // Add interfaces
  if (features.interfaces) {
    features.interfaces.forEach(intf => {
      content += `interface ${intf.name} {\n`;
      intf.properties.forEach(prop => {
        content += `    ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}\n`;
      });
      content += '}\n\n';
    });
  }
  
  // Add types
  if (features.types) {
    features.types.forEach(type => {
      content += `type ${type.name} = ${type.values.map(v => `'${v}'`).join(' | ')};\n`;
    });
    content += '\n';
  }
  
  // Add rules
  if (features.rules && features.rules.length > 0) {
    features.rules.forEach(rule => {
      if (rule.entry) {
        content += 'entry ';
      }
      content += `${rule.name}:\n    ${rule.definition};\n\n`;
    });
  } else {
    // Default entry rule
    content += `entry Model:\n    name=ID;\n\n`;
  }
  
  // Add default terminal
  content += `terminal ID: /[a-zA-Z_][a-zA-Z0-9_]*/;\n`;
  
  return content;
}