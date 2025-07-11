/**
 * Basic Example of GLSP Annotations in Langium Grammar
 * This example shows the minimal usage of JSDoc-style annotations
 * 
 * @glsp-group minimal
 * @glsp-layout layered TB
 */
grammar BasicAnnotatedGrammar

/**
 * The main model container
 * @glsp-node model
 * @glsp-shape rectangle
 * @glsp-style fill=#f3f4f6 stroke=#d1d5db strokeWidth=2
 */
entry Model:
    'model' name=ID '{'
        elements+=Element*
        connections+=Connection*
    '}';

/**
 * A basic element that can be connected
 * @glsp-node element
 * @glsp-shape roundedRectangle
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-style fill=#3b82f6 stroke=#2563eb strokeWidth=2
 * @glsp-port north input
 * @glsp-port south output
 * @glsp-label position=center editable=true
 */
Element:
    'element' name=ID
    ('type' type=ElementType)?
    ('description' description=STRING)?;

/**
 * Connection between elements
 * @glsp-edge connection
 * @glsp-style stroke=#6b7280 strokeWidth=2
 * @glsp-label position=center editable=true
 */
Connection:
    from=[Element:ID] '->' to=[Element:ID]
    ('label' label=STRING)?;

// Element types
ElementType returns string:
    'node' | 'component' | 'service';

// Terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;