/**
 * Comprehensive Example of All GLSP Annotations
 * This example demonstrates all available JSDoc-style annotations for GLSP generation
 * 
 * Grammar-level annotations:
 * @glsp-group workflow
 * @glsp-layout layered TB
 * @glsp-theme primary=#2563eb secondary=#64748b background=#f8fafc surface=#ffffff
 * @glsp-features autoLayout=true autoConnect=true bendpoints=true routing=manhattan
 */
grammar ComprehensiveAnnotationExample

/**
 * Root container with all annotation options
 * @glsp-node container
 * @glsp-shape rectangle
 * @glsp-connectable false
 * @glsp-resizable true
 * @glsp-deletable false
 * @glsp-moveable true
 * @glsp-style fill=#f3f4f6 stroke=#e5e7eb strokeWidth=2 opacity=0.95 borderRadius=8
 * @glsp-label position=top editable=false maxWidth=300
 * @glsp-layout-options minWidth=400 minHeight=300 priority=1
 * @glsp-icon path=/icons/container.svg
 */
entry Container:
    'container' name=ID '{'
        nodes+=NodeElement*
        edges+=EdgeElement*
    '}';

/**
 * Node with all port configurations
 * @glsp-node multi-port-node
 * @glsp-shape hexagon
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-moveable true
 * @glsp-style fill=#3b82f6 stroke=#2563eb strokeWidth=3 strokeDasharray=0 opacity=1
 * @glsp-port north input
 * @glsp-port north-east input
 * @glsp-port east bidirectional
 * @glsp-port south-east output
 * @glsp-port south output multiple
 * @glsp-port south-west output
 * @glsp-port west bidirectional
 * @glsp-port north-west input
 * @glsp-label position=center editable=true maxWidth=200
 * @glsp-icon path=/icons/hexagon-node.svg
 * @glsp-layout-options minWidth=150 minHeight=150 priority=2
 */
NodeElement:
    'node' name=ID
    ('category' category=NodeCategory)?
    properties=NodeProperties?;

/**
 * Properties block for nodes
 */
NodeProperties:
    '{'
        ('color' color=STRING)?
        ('size' width=NUMBER 'x' height=NUMBER)?
        ('metadata' metadata=STRING)?
    '}';

/**
 * Edge with custom styling
 * @glsp-edge styled-edge
 * @glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray=5,5 opacity=0.8
 * @glsp-label position=center editable=true maxWidth=150
 */
EdgeElement:
    from=[NodeElement:ID] '-->' to=[NodeElement:ID]
    ('style' style=EdgeStyle)?
    ('label' label=STRING)?;

/**
 * Different shape examples
 */

/**
 * Rectangle shape
 * @glsp-node rect-node
 * @glsp-shape rectangle
 * @glsp-style fill=#10b981 stroke=#059669
 */
RectangleNode:
    'rect' name=ID;

/**
 * Circle shape
 * @glsp-node circle-node
 * @glsp-shape circle
 * @glsp-style fill=#f59e0b stroke=#d97706
 */
CircleNode:
    'circle' name=ID;

/**
 * Diamond shape
 * @glsp-node diamond-node
 * @glsp-shape diamond
 * @glsp-style fill=#ef4444 stroke=#dc2626
 */
DiamondNode:
    'diamond' name=ID;

/**
 * Ellipse shape
 * @glsp-node ellipse-node
 * @glsp-shape ellipse
 * @glsp-style fill=#8b5cf6 stroke=#7c3aed
 */
EllipseNode:
    'ellipse' name=ID;

/**
 * Rounded rectangle shape
 * @glsp-node rounded-rect-node
 * @glsp-shape roundedRectangle
 * @glsp-style fill=#ec4899 stroke=#db2777 borderRadius=16
 */
RoundedRectNode:
    'rounded' name=ID;

/**
 * Parallelogram shape
 * @glsp-node parallel-node
 * @glsp-shape parallelogram
 * @glsp-style fill=#14b8a6 stroke=#0d9488
 */
ParallelogramNode:
    'parallel' name=ID;

/**
 * Trapezoid shape
 * @glsp-node trapezoid-node
 * @glsp-shape trapezoid
 * @glsp-style fill=#f97316 stroke=#ea580c
 */
TrapezoidNode:
    'trapezoid' name=ID;

/**
 * Custom shape (requires custom implementation)
 * @glsp-node custom-node
 * @glsp-shape custom
 * @glsp-style fill=#64748b stroke=#475569
 */
CustomNode:
    'custom' name=ID;

/**
 * Abstract base type (not rendered)
 * @glsp-abstract true
 */
type AbstractElement = NodeElement | RectangleNode | CircleNode | DiamondNode | 
                      EllipseNode | RoundedRectNode | ParallelogramNode | 
                      TrapezoidNode | CustomNode;

// Enumerations
NodeCategory returns string:
    'basic' | 'advanced' | 'custom';

EdgeStyle returns string:
    'solid' | 'dashed' | 'dotted';

// Terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;