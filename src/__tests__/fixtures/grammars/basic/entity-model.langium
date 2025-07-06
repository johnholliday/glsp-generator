// Entity Model Grammar
// A simple data modeling language for defining entities and relationships
// This example demonstrates:
// - Entity definitions with properties
// - Relationships between entities
// - Property types and constraints
// - Inheritance basics

grammar EntityModel

entry Model:
    'model' name=ID
    ('namespace' namespace=ID ('.' ID)*)?  
    entities+=Entity*
    enums+=Enum*
    relationships+=Relationship*;

Entity:
    (abstract?='abstract')?
    'entity' name=ID
    ('extends' extends=[Entity:ID])?
    (isNode?='node')?
    '{'
        properties+=Property*
    '}';

Property:
    name=ID ':' type=PropertyTypeRef
    ('[]' {infer Property.multiplicity = 'array'})?
    (required?='required')?
    (unique?='unique')?
    ('=' defaultValue=STRING)?;

PropertyTypeRef:
    PrimitiveType | EntityRef | EnumRef;

PrimitiveType:
    type=('string' | 'number' | 'boolean' | 'date' | 'time' | 'datetime');

EntityRef:
    '@' entity=[Entity:ID];

EnumRef:
    '#' enum=[Enum:ID];

Relationship:
    'relationship' name=ID
    'from' source=[Entity:ID] sourceMultiplicity=Multiplicity?
    'to' target=[Entity:ID] targetMultiplicity=Multiplicity?
    'type' type=RelationType;

Multiplicity:
    value=('0..1' | '1' | '0..*' | '1..*' | '*' | INT '..' (INT | '*'));

RelationType returns string:
    'association' | 'aggregation' | 'composition' | 'generalization';

Enum:
    'enum' name=ID '{'
        values+=EnumValue (',' values+=EnumValue)*
    '}';

EnumValue:
    name=ID ('=' value=STRING)?


// Property types including primitives and references
type PropertyType = 
    | PrimitiveType 
    | @Entity         // Reference to another entity
    | @Enum           // Reference to an enum

// Primitive data types
type PrimitiveType = 
    | 'string' 
    | 'number' 
    | 'boolean' 
    | 'date' 
    | 'time' 
    | 'datetime'

// Relationship types
type RelationType = 
    | 'association' 
    | 'aggregation' 
    | 'composition' 
    | 'generalization'

// Property multiplicity
type Multiplicity = 'single' | 'array'

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal INT: /[0-9]+/;