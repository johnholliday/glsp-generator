// Empty Grammar - Minimal Valid Grammar
// This example demonstrates the absolute minimum valid Langium grammar
// Used to test edge case handling in the generator

grammar Empty

entry MinimalElement:
    'element' name=ID;

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;