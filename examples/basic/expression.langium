// Expression Grammar
// A basic expression language for arithmetic and logical expressions
// This example demonstrates:
// - Expression hierarchy
// - Operator precedence
// - Literal values
// - Variable references

grammar Expression

entry ExpressionModel:
    'model' name=ID
    variables+=Variable*
    expressions+=ExpressionDef*;

Variable:
    'var' name=ID ':' type=ValueType ('=' value=Expression)?;

ExpressionDef:
    'expr' name=ID '=' expr=Expression;

Expression:
    OrExpression;

OrExpression infers Expression:
    AndExpression ({infer BinaryExpression.left=current} operator='||' right=AndExpression)*;

AndExpression infers Expression:
    EqualityExpression ({infer BinaryExpression.left=current} operator='&&' right=EqualityExpression)*;

EqualityExpression infers Expression:
    ComparisonExpression ({infer BinaryExpression.left=current} operator=('==' | '!=') right=ComparisonExpression)*;

ComparisonExpression infers Expression:
    AdditiveExpression ({infer BinaryExpression.left=current} operator=('<' | '<=' | '>' | '>=') right=AdditiveExpression)*;

AdditiveExpression infers Expression:
    MultiplicativeExpression ({infer BinaryExpression.left=current} operator=('+' | '-') right=MultiplicativeExpression)*;

MultiplicativeExpression infers Expression:
    UnaryExpression ({infer BinaryExpression.left=current} operator=('*' | '/' | '%') right=UnaryExpression)*;

UnaryExpression infers Expression:
    {infer UnaryExpression} operator=('!' | '-' | '+') operand=UnaryExpression
    | PrimaryExpression;

PrimaryExpression infers Expression:
    '(' Expression ')'
    | {infer Literal} value=LiteralValue
    | {infer VariableRef} variable=[Variable:ID]
    | {infer FunctionCall} function=ID '(' (args+=Expression (',' args+=Expression)*)? ')';

LiteralValue:
    NUMBER | STRING | BOOLEAN;

ValueType returns string:
    'number' | 'string' | 'boolean';


// Binary operators
type BinaryOperator = 
    // Arithmetic
    | '+' | '-' | '*' | '/' | '%' | '**'
    // Comparison
    | '==' | '!=' | '<' | '>' | '<=' | '>='
    // Logical
    | '&&' | '||'
    // Bitwise
    | '&' | '|' | '^' | '<<' | '>>'

// Unary operators
type UnaryOperator = '-' | '+' | '!' | '~'

// Value types
type ValueType = 'number' | 'string' | 'boolean'

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;
terminal BOOLEAN: /true|false/;