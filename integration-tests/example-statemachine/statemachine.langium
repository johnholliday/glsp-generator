grammar StateMachine

// Entry rule
entry StateMachine:
    'statemachine' name=ID '{'
        (states+=State | transitions+=Transition)*
    '}';

// State definition with optional properties
State:
    'state' name=ID '{'
        ('entry' ':' entryAction=STRING)?
        ('exit' ':' exitAction=STRING)?
        ('do' ':' doAction=STRING)?
    '}';

// Transition between states
Transition:
    'transition' name=ID? '{'
        'from' ':' source=[State:ID]
        'to' ':' target=[State:ID]
        ('on' ':' event=STRING)?
        ('guard' ':' guard=STRING)?
        ('effect' ':' effect=STRING)?
    '}';

// Hidden terminals for whitespace and comments
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

// Basic terminals
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;