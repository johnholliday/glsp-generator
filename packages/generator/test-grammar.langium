grammar TestGrammar

entry Model:
    elements+=Element*;

Element:
    Node | Edge;

Node:
    'node' name=ID '{' 
        ('label' ':' label=STRING)?
    '}';

Edge:
    'edge' 'from' source=[Node:ID] 'to' target=[Node:ID];

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
hidden terminal WS: /\s+/;