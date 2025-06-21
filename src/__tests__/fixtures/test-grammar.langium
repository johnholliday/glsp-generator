grammar TestDomain

entry Model:
    elements+=Element*;

interface Element {
    name: string
}

interface Node extends Element {
    position: Position
    size?: Size
    label?: string
}

interface Edge extends Element {
    source: @Node
    target: @Node
    type: EdgeType
}

interface Position {
    x: number
    y: number
}

interface Size {
    width: number
    height: number
}

type EdgeType = 'association' | 'dependency' | 'inheritance';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;