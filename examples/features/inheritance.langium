// Inheritance Feature Showcase
// Demonstrates various inheritance patterns in Langium
// This example shows:
// - Single inheritance with extends
// - Multiple levels of inheritance
// - Abstract interfaces
// - Property overriding
// - Method inheritance

grammar Inheritance

entry Model:
    'model' name=ID
    elements+=Element*;

Element:
    Shape | Widget | Container;

Shape:
    Rectangle | Circle | Polygon | TextShape;

Rectangle:
    'rectangle' id=ID
    ('name' name=STRING)?
    position=Position
    width=NUMBER height=NUMBER
    (visible?='visible')?
    ('style' style=Style)?
    ('metadata' metadata=Metadata)?;

Circle:
    'circle' id=ID
    ('name' name=STRING)?
    position=Position
    radius=NUMBER
    (visible?='visible')?
    ('style' style=Style)?
    ('metadata' metadata=Metadata)?;

Polygon:
    'polygon' id=ID
    ('name' name=STRING)?
    position=Position
    'points' '{' points+=Point (',' points+=Point)* '}'
    (visible?='visible')?
    ('style' style=Style)?
    ('metadata' metadata=Metadata)?;

TextShape:
    'text' id=ID
    ('name' name=STRING)?
    position=Position
    content=STRING
    ('font' font=Font)?
    (visible?='visible')?
    ('style' style=Style)?
    ('metadata' metadata=Metadata)?;

Widget:
    Button | TextField | Label;

Button:
    'button' id=ID
    ('name' name=STRING)?
    position=Position
    label=STRING
    (enabled?='enabled')?
    ('onClick' onClick=STRING)?
    ('metadata' metadata=Metadata)?;

TextField:
    'textfield' id=ID
    ('name' name=STRING)?
    position=Position
    ('placeholder' placeholder=STRING)?
    ('value' value=STRING)?
    (enabled?='enabled')?
    (readOnly?='readonly')?
    ('metadata' metadata=Metadata)?;

Label:
    'label' id=ID
    ('name' name=STRING)?
    position=Position
    text=STRING
    ('metadata' metadata=Metadata)?;

Container:
    Panel | Window;

Panel:
    'panel' id=ID
    ('name' name=STRING)?
    position=Position
    size=Size
    'layout' layout=LayoutType
    ('padding' padding=NUMBER)?
    ('gap' gap=NUMBER)?
    '{' children+=Element* '}'
    ('metadata' metadata=Metadata)?;

Window:
    'window' id=ID
    ('name' name=STRING)?
    position=Position
    size=Size
    title=STRING
    (resizable?='resizable')?
    (modal?='modal')?
    '{' children+=Element* '}'
    ('metadata' metadata=Metadata)?;

Position:
    'at' x=NUMBER ',' y=NUMBER;

Size:
    'size' width=NUMBER 'x' height=NUMBER;

Point:
    x=NUMBER ',' y=NUMBER;

Style:
    '{' 
        ('fill' fillColor=Color)?
        ('stroke' strokeColor=Color)?
        ('strokeWidth' strokeWidth=NUMBER)?
        ('opacity' opacity=NUMBER)?
    '}';

Color:
    value=STRING;  // Hex color or named color

Font:
    family=STRING size=NUMBER (bold?='bold')? (italic?='italic')?;

Metadata:
    '{' 
        'created' created=STRING
        ('modified' modified=STRING)?
        ('author' author=STRING)?
        ('version' version=STRING)?
        ('tags' '[' tags+=STRING (',' tags+=STRING)* ']')?
    '}';

LayoutType returns string:
    'horizontal' | 'vertical' | 'grid' | 'absolute';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;