/**
 * @glsp-group workflow
 * @glsp-layout layered TB
 * @glsp-theme primary=#2563eb secondary=#64748b background=#f8fafc
 * @glsp-features autoLayout=true autoConnect=true bendpoints=true routing=manhattan
 */
grammar WorkflowLanguage

/**
 * The root workflow model
 * @glsp-node workflow-container
 * @glsp-shape rectangle
 * @glsp-resizable true
 * @glsp-style fill=#f3f4f6 stroke=#e5e7eb strokeWidth=2 borderRadius=8
 * @glsp-layout-options minWidth=400 minHeight=300
 */
entry Workflow:
    'workflow' name=ID '{'
        start=StartEvent?
        processes+=Process*
        gateways+=Gateway*
        end=EndEvent?
        transitions+=Transition*
    '}';

/**
 * A process step in the workflow
 * @glsp-node process
 * @glsp-shape roundedRectangle
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-style fill=#2563eb stroke=#1e40af strokeWidth=2 borderRadius=12
 * @glsp-port north input
 * @glsp-port south output multiple
 * @glsp-label position=center editable=true maxWidth=200
 * @glsp-icon path=/icons/process.svg
 */
Process:
    'process' name=ID '{'
        ('description' description=STRING)?
        ('responsible' responsible=STRING)?
        tasks+=Task*
    '}';

/**
 * A task within a process
 * @glsp-node task
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-style fill=#93c5fd stroke=#60a5fa strokeWidth=1
 * @glsp-label position=center editable=true
 */
Task:
    'task' name=ID 
    ('duration' duration=NUMBER unit=TimeUnit)?
    ('assigned' assignee=STRING)?;

/**
 * Decision gateway for branching logic
 * @glsp-node gateway
 * @glsp-shape diamond
 * @glsp-connectable true
 * @glsp-style fill=#fbbf24 stroke=#f59e0b strokeWidth=2
 * @glsp-port north input
 * @glsp-port east output
 * @glsp-port south output
 * @glsp-port west output
 * @glsp-label position=bottom editable=false
 */
Gateway:
    'gateway' name=ID 
    'condition' condition=STRING
    'then' thenBranch=[Process:ID]
    ('else' elseBranch=[Process:ID])?;

/**
 * Start event marking workflow entry points
 * @glsp-node start-event
 * @glsp-shape circle
 * @glsp-connectable true
 * @glsp-deletable false
 * @glsp-style fill=#10b981 stroke=#059669 strokeWidth=3
 * @glsp-port south output
 * @glsp-icon path=/icons/start.svg
 */
StartEvent:
    'start' name=ID
    ('trigger' trigger=TriggerType)?;

/**
 * End event marking workflow completion
 * @glsp-node end-event
 * @glsp-shape circle
 * @glsp-connectable true
 * @glsp-deletable false
 * @glsp-style fill=#ef4444 stroke=#dc2626 strokeWidth=3
 * @glsp-port north input
 * @glsp-icon path=/icons/end.svg
 */
EndEvent:
    'end' name=ID
    ('result' result=STRING)?;

/**
 * Transitions between workflow elements
 * @glsp-edge transition
 * @glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray=0
 * @glsp-label position=center editable=true
 */
Transition:
    from=[WorkflowElement:ID] '->' to=[WorkflowElement:ID]
    ('when' condition=STRING)?
    ('label' label=STRING)?;

/**
 * Abstract base for connectable workflow elements
 * @glsp-abstract true
 */
type WorkflowElement = Process | Gateway | StartEvent | EndEvent;

/**
 * Time units for task duration
 * @glsp-category enumeration
 */
TimeUnit returns string:
    'minutes' | 'hours' | 'days' | 'weeks';

/**
 * Trigger types for start events
 * @glsp-category enumeration
 */
TriggerType returns string:
    'manual' | 'scheduled' | 'message' | 'signal';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

// Basic terminals
terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;