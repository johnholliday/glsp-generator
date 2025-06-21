// Hierarchical Finite State Machine Grammar
// An advanced state machine DSL supporting nested states and regions
// This example demonstrates:
// - Composite states with nested states
// - Orthogonal regions for parallel behavior
// - History states (shallow and deep)
// - Advanced transition features

grammar HierarchicalFSM

entry StateMachine:
    'statemachine' name=ID
    ('description' description=STRING)?
    states+=State*
    transitions+=Transition*
    'initial' initialState=[State:ID]
    ('regions' '{' regions+=Region* '}')?;

State:
    'state' name=ID
    ('type' type=StateType)?
    ('parent' parent=[State:ID])?
    ('substates' '{' substates+=State* '}')?  
    ('regions' '{' regions+=Region* '}')?  
    ('entry' '{' entry+=Behavior* '}')?  
    ('exit' '{' exit+=Behavior* '}')?  
    ('do' '{' doActivity+=Activity* '}')?  
    (isInitial?='initial')?
    (isFinal?='final')?
    (isHistory?='history')?
    ('historyType' historyType=HistoryType)?;

Region:
    'region' name=ID '{' 
        states+=State*
        transitions+=Transition*
        'initial' initialState=[State:ID]
    '}';

Transition:
    'transition' name=ID?
    'from' source=[State:ID]
    'to' target=[State:ID]
    ('on' trigger=Trigger)?
    ('guard' guard=Guard)?
    ('effect' '{' effect+=Behavior* '}')?
    ('priority' priority=NUMBER)?
    ('type' type=TransitionType)?;

Trigger:
    event=Event
    ('(' parameters+=Parameter (',' parameters+=Parameter)* ')')?;

Event:
    name=ID
    ('type' type=EventType)?;

Guard:
    expression=STRING
    ('type' type=GuardType)?;

Behavior:
    type=BehaviorType action=Action
    ('duration' duration=NUMBER)?;

Action:
    name=ID
    'type' type=ActionType
    ('(' parameters+=Parameter (',' parameters+=Parameter)* ')')?
    ('target' target=STRING)?;

Activity:
    name=ID
    'type' type=ActivityType
    (interruptible?='interruptible')?;

Parameter:
    name=ID ':' type=ID
    ('=' value=STRING)?;

StateType returns string:
    'simple' | 'composite' | 'orthogonal' | 'submachine';

HistoryType returns string:
    'shallow' | 'deep';

TransitionType returns string:
    'external' | 'internal' | 'local';

EventType returns string:
    'signal' | 'call' | 'time' | 'change';

GuardType returns string:
    'condition' | 'constraint' | 'script';

BehaviorType returns string:
    'entry' | 'exit' | 'effect';

ActionType returns string:
    'send' | 'call' | 'assign' | 'create' | 'destroy' | 'log';

ActivityType returns string:
    'do' | 'while' | 'repeat';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+/;