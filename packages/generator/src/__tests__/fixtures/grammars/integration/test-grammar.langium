grammar TestGrammar

entry Model:
    elements+=Element*;

interface Node {
    name: string
    x: number
    y: number
}

interface Edge {
    source: @Node
    target: @Node
}

type Element = Node | Edge