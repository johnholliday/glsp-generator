// Complex Union Types Grammar
// Tests handling of nested and complex union type patterns
// This challenges type generation and union discrimination

grammar ComplexUnions

entry Model:
    'model' name=ID
    values+=ValueDeclaration*
    expressions+=Expression*
    results+=Result*;

// Value declarations with complex union types
ValueDeclaration:
    'value' name=ID '=' value=Value;

Value:
    PrimitiveValue | ComplexValue | CollectionValue | ReferenceValue | ComputedValue;

PrimitiveValue:
    StringValue | NumberValue | BooleanValue | NullValue | UndefinedValue;

StringValue:
    'string' value=STRING
    ('encoding' encoding=StringEncoding)?;

NumberValue:
    'number' value=NUMBER
    ('precision' precision=NumberPrecision)?
    ('unit' unit=STRING)?;

BooleanValue:
    value=('true' | 'false');

NullValue:
    {infer NullValue} 'null';

UndefinedValue:
    {infer UndefinedValue} 'undefined';

ComplexValue:
    ObjectValue | FunctionValue | ClassValue | EnumValue;

ObjectValue:
    'object' '{' 
        properties+=Property*
    '}';

Property:
    key=ID ':' value=Value
    (optional?='?')?
    (readonly?='readonly')?;

FunctionValue:
    'function' name=ID?
    '(' parameters+=Parameter (',' parameters+=Parameter)* ')'
    (':' returnType=TypeExpression)?
    ('{' body=Expression '}')?;

Parameter:
    name=ID ':' type=TypeExpression
    ('=' defaultValue=Value)?;

ClassValue:
    'class' name=ID
    ('extends' superClass=[ClassValue:ID])?
    ('implements' '{' interfaces+=[InterfaceDecl:ID]* '}')?
    '{' 
        members+=ClassMember*
    '}';

ClassMember:
    PropertyMember | MethodMember | ConstructorMember;

PropertyMember:
    (visibility=Visibility)?
    (static?='static')?
    (readonly?='readonly')?
    name=ID ':' type=TypeExpression
    ('=' initialValue=Value)?;

MethodMember:
    (visibility=Visibility)?
    (static?='static')?
    (async?='async')?
    name=ID
    '(' parameters+=Parameter (',' parameters+=Parameter)* ')'
    ':' returnType=TypeExpression
    ('{' body=Expression '}')?;

ConstructorMember:
    'constructor'
    '(' parameters+=Parameter (',' parameters+=Parameter)* ')'
    ('{' body=Expression '}')?;

EnumValue:
    'enum' name=ID '{' 
        members+=EnumMember (',' members+=EnumMember)*
    '}';

EnumMember:
    name=ID ('=' value=(STRING | NUMBER))?;

CollectionValue:
    ArrayValue | TupleValue | SetValue | MapValue;

ArrayValue:
    '[' elements+=Value (',' elements+=Value)* ']'
    ('as' elementType=TypeExpression)?;

TupleValue:
    'tuple' '[' elements+=Value (',' elements+=Value)* ']';

SetValue:
    'set' '{' elements+=Value (',' elements+=Value)* '}';

MapValue:
    'map' '{' 
        entries+=MapEntry (',' entries+=MapEntry)*
    '}';

MapEntry:
    key=Value '=>' value=Value;

ReferenceValue:
    'ref' target=[ValueDeclaration:ID]
    ('.' path+=ID)*;

ComputedValue:
    'computed' expression=Expression
    ('deps' '{' dependencies+=[ValueDeclaration:ID]* '}')?;

// Expressions for computed values
Expression:
    BinaryExpression | UnaryExpression | ConditionalExpression | 
    CallExpression | MemberExpression | LiteralExpression;

BinaryExpression:
    left=Expression operator=BinaryOperator right=Expression;

UnaryExpression:
    operator=UnaryOperator operand=Expression;

ConditionalExpression:
    'if' condition=Expression 'then' thenBranch=Expression 'else' elseBranch=Expression;

CallExpression:
    'call' function=Expression
    '(' arguments+=Expression (',' arguments+=Expression)* ')';

MemberExpression:
    object=Expression '.' member=ID;

LiteralExpression:
    value=Value;

// Type expressions for complex type annotations
TypeExpression:
    UnionType | IntersectionType | ArrayType | FunctionType | 
    ObjectType | GenericType | ConditionalType | LiteralType;

UnionType:
    types+=TypeExpression ('|' types+=TypeExpression)+;

IntersectionType:
    types+=TypeExpression ('&' types+=TypeExpression)+;

ArrayType:
    elementType=TypeExpression '[]';

FunctionType:
    '(' parameters+=TypeParameter (',' parameters+=TypeParameter)* ')' '=>' returnType=TypeExpression;

TypeParameter:
    name=ID ':' type=TypeExpression;

ObjectType:
    '{' 
        properties+=TypeProperty (',' properties+=TypeProperty)*
    '}';

TypeProperty:
    key=ID (optional?='?')? ':' type=TypeExpression;

GenericType:
    name=ID '<' typeArguments+=TypeExpression (',' typeArguments+=TypeExpression)* '>';

ConditionalType:
    'type' checkType=TypeExpression 'extends' extendsType=TypeExpression 
    '?' trueType=TypeExpression ':' falseType=TypeExpression;

LiteralType:
    value=(STRING | NUMBER | 'true' | 'false' | 'null' | 'undefined');

// Results with discriminated unions
Result:
    SuccessResult | ErrorResult | PendingResult | CancelledResult;

SuccessResult:
    'success' id=ID
    'value' value=Value
    ('metadata' metadata=Metadata)?;

ErrorResult:
    'error' id=ID
    'code' code=STRING
    'message' message=STRING
    ('details' details=Value)?
    ('stack' stack=STRING)?
    ('metadata' metadata=Metadata)?;

PendingResult:
    'pending' id=ID
    ('progress' progress=NUMBER)?
    ('message' message=STRING)?
    ('metadata' metadata=Metadata)?;

CancelledResult:
    'cancelled' id=ID
    ('reason' reason=STRING)?
    ('metadata' metadata=Metadata)?;

// Interface declarations
InterfaceDecl:
    'interface' id=ID
    ('extends' '{' extends+=[InterfaceDecl:ID]* '}')?
    '{' 
        members+=InterfaceMember*
    '}';

InterfaceMember:
    name=ID (optional?='?')? ':' type=TypeExpression
    (readonly?='readonly')?;

// Metadata
Metadata:
    '{' 
        ('timestamp' timestamp=STRING)?
        ('tags' '[' tags+=STRING (',' tags+=STRING)* ']')?
        ('custom' custom=ObjectValue)?
    '}';

// Type definitions
StringEncoding returns string:
    'utf8' | 'utf16' | 'ascii' | 'base64' | 'hex';

NumberPrecision returns string:
    'int8' | 'int16' | 'int32' | 'int64' | 'float32' | 'float64' | 'decimal';

Visibility returns string:
    'public' | 'private' | 'protected';

BinaryOperator returns string:
    '+' | '-' | '*' | '/' | '%' | '**' |
    '==' | '!=' | '<' | '>' | '<=' | '>=' |
    '&&' | '||' | '??' |
    '&' | '|' | '^' | '<<' | '>>' | '>>>';

UnaryOperator returns string:
    '+' | '-' | '!' | '~' | 'typeof' | 'void';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;