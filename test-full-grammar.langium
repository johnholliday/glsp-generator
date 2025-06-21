grammar StateMachine

entry Model:
    elements+=Element*;

Element:
    State  < /dev/null |  Transition;

State:
    'state' name=ID;

Transition:
    'transition' from=[State] '->' to=[State];

// These are the interface definitions from the original file
interface StateMachine {
    name: string
    description?: string
    states: State[]
    transitions: Transition[]
    initialState: @State
}

interface State {
    name: string
    isInitial?: boolean
    isFinal?: boolean
    onEntry?: Action[]
    onExit?: Action[]
}
