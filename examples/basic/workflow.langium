// Workflow Grammar
// A basic workflow language for defining business processes
// This example demonstrates:
// - Simple process modeling
// - Sequential and parallel flows
// - Task types and assignments
// - Basic control flow elements

grammar Workflow

entry Workflow:
    'workflow' name=ID
    ('version' version=STRING)?
    ('description' description=STRING)?
    tasks+=Task*
    flows+=Flow*
    'start' startTask=[Task:ID]
    'end' '{' endTasks+=[Task:ID] (',' endTasks+=[Task:ID])* '}';

Task:
    'task' id=ID name=STRING
    'type' type=TaskType
    ('assignee' assignee=STRING)?
    ('description' description=STRING)?
    ('inputs' '{' inputs+=Parameter* '}')?  
    ('outputs' '{' outputs+=Parameter* '}')?  
    ('timeout' timeout=NUMBER)?;

Flow:
    'flow' 'from' from=[Task:ID] 'to' to=[Task:ID]
    ('when' condition=STRING)?
    ('priority' priority=NUMBER)?;

Parameter:
    name=ID ':' type=DataType
    (required?='required')?
    ('default' defaultValue=STRING)?;

TaskType returns string:
    'manual' | 'automatic' | 'service' | 'decision' | 'parallel' | 'merge';

DataType returns string:
    'string' | 'number' | 'boolean' | 'date' | 'object';



// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+/;