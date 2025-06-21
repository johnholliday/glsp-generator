// State Machine Grammar
// A simple state machine DSL for modeling finite state machines
// This example demonstrates basic Langium concepts:
// - Parser rules and interfaces
// - Cross-references
// - Optional properties
// - Arrays of elements
// - String literal types

grammar StateMachine

entry StateMachine:
    'statemachine' name=ID
    (description=STRING)?
    states+=State*
    transitions+=Transition*
    'initial' initialState=[State:ID];

State:
    'state' name=ID
    (isInitial?='initial')?
    (isFinal?='final')?
    ('entry' '{' onEntry+=Action* '}')?  
    ('exit' '{' onExit+=Action* '}')?;

Transition:
    'transition' name=ID?
    'from' source=[State:ID]
    'to' target=[State:ID]
    ('on' event=ID)?
    ('guard' guard=STRING)?
    ('do' '{' actions+=Action* '}')?;

Action:
    'action' name=ID '(' parameters=STRING? ')';


// Type definitions
type Expression = string
type ActionType = 'log' | 'invoke' | 'assign' | 'raise'

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;