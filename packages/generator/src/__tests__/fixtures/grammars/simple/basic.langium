grammar Basic

entry Model:
    elements+=Element*;

Element:
    Node | Edge;

Node:
    'node' name=ID (label=STRING)?;

Edge:
    'edge' 'from' source=[Node:ID] 'to' target=[Node:ID];

Container:
    'container' name=ID '{'
        children+=Node*
    '}';

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;

hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;