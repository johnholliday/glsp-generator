// Circular References Grammar
// Tests handling of circular and complex reference patterns
// This can challenge reference resolution and traversal algorithms

grammar CircularRefs

entry Model:
    'model' name=ID
    graphs+=Graph*
    components+=Component*
    teams+=Team*;

// Direct circular reference
Graph:
    'graph' name=ID '{' 
        nodes+=Node*
        edges+=Edge*
        ('rootNode' rootNode=[Node:ID])?
        ('metadata' metadata=Metadata)?
    '}';

Node:
    'node' id=ID
    'name' name=STRING
    ('parent' parent=[Node:ID])?
    ('children' '{' children+=[Node:ID]* '}')?
    ('sibling' sibling=[Node:ID])?
    'graph' graph=[Graph:ID]
    ('metadata' metadata=Metadata)?
    ('connectedTo' '{' connectedTo+=Connection* '}')?;

Edge:
    'edge' id=ID
    'from' source=[Node:ID]
    'to' target=[Node:ID]
    ('bidirectional' bidirectional?='true')?
    'graph' graph=[Graph:ID]
    ('weight' weight=NUMBER)?
    ('metadata' metadata=Metadata)?;

Connection:
    'connection' node=[Node:ID]
    ('via' edge=[Edge:ID])?
    ('type' type=ConnectionType)?;

// Mutual references between types
Component:
    'component' id=ID
    'name' name=STRING
    'version' version=STRING
    ('dependencies' '{' dependencies+=[Component:ID]* '}')?
    ('dependents' '{' dependents+=[Component:ID]* '}')?
    ('providedBy' providedBy=[Module:ID])?
    ('usedIn' '{' usedIn+=[System:ID]* '}')?
    ('interfaces' '{' interfaces+=Interface* '}')?
    ('metadata' metadata=Metadata)?;

Module:
    'module' id=ID
    'name' name=STRING
    ('components' '{' components+=[Component:ID]* '}')?
    ('requiredModules' '{' requiredModules+=[Module:ID]* '}')?
    ('system' system=[System:ID])?
    ('metadata' metadata=Metadata)?;

System:
    'system' id=ID
    'name' name=STRING
    ('modules' '{' modules+=[Module:ID]* '}')?
    ('subsystems' '{' subsystems+=[System:ID]* '}')?
    ('parentSystem' parentSystem=[System:ID])?
    ('interfaces' '{' interfaces+=[Interface:ID]* '}')?
    ('metadata' metadata=Metadata)?;

Interface:
    'interface' id=ID
    'name' name=STRING
    ('extends' '{' extends+=[Interface:ID]* '}')?
    ('implementedBy' '{' implementedBy+=[Component:ID]* '}')?
    ('requiredBy' '{' requiredBy+=[Interface:ID]* '}')?
    ('operations' '{' operations+=Operation* '}')?
    ('metadata' metadata=Metadata)?;

Operation:
    'operation' name=ID
    ('parameters' '{' parameters+=Parameter* '}')?
    ('returns' returns=[DataType:ID])?
    ('calls' '{' calls+=[Operation:ID]* '}')?;

Parameter:
    name=ID ':' type=[DataType:ID]
    ('default' defaultValue=STRING)?;

DataType:
    'datatype' id=ID
    'name' name=STRING
    ('baseType' baseType=[DataType:ID])?
    ('composedOf' '{' composedOf+=[DataType:ID]* '}')?
    ('usedBy' '{' usedBy+=[Interface:ID]* '}')?;

// Complex organizational circular refs
Team:
    'team' id=ID
    'name' name=STRING
    ('members' '{' members+=Person* '}')?
    ('leadBy' leadBy=[Person:ID])?
    ('parentTeam' parentTeam=[Team:ID])?
    ('subTeams' '{' subTeams+=[Team:ID]* '}')?
    ('collaboratesWith' '{' collaboratesWith+=[Team:ID]* '}')?
    ('projects' '{' projects+=[Project:ID]* '}')?
    ('metadata' metadata=Metadata)?;

Person:
    'person' id=ID
    'name' name=STRING
    ('email' email=STRING)?
    ('memberOf' '{' memberOf+=[Team:ID]* '}')?
    ('leads' '{' leads+=[Team:ID]* '}')?
    ('reportsTo' reportsTo=[Person:ID])?
    ('manages' '{' manages+=[Person:ID]* '}')?
    ('collaboratesWith' '{' collaboratesWith+=[Person:ID]* '}')?
    ('worksOn' '{' worksOn+=[Project:ID]* '}')?
    ('roles' '{' roles+=Role* '}')?
    ('metadata' metadata=Metadata)?;

Project:
    'project' id=ID
    'name' name=STRING
    ('team' team=[Team:ID])?
    ('lead' lead=[Person:ID])?
    ('members' '{' members+=[Person:ID]* '}')?
    ('dependsOn' '{' dependsOn+=[Project:ID]* '}')?
    ('blocks' '{' blocks+=[Project:ID]* '}')?
    ('deliverables' '{' deliverables+=Deliverable* '}')?
    ('metadata' metadata=Metadata)?;

Deliverable:
    'deliverable' id=ID
    'name' name=STRING
    ('producedBy' producedBy=[Person:ID])?
    ('requiredFor' '{' requiredFor+=[Deliverable:ID]* '}')?
    ('project' project=[Project:ID])?;

Role:
    'role' name=ID
    ('permissions' '{' permissions+=STRING* '}')?
    ('inherits' '{' inherits+=[Role:ID]* '}')?;

// Recursive type definitions
RecursiveType:
    TreeNode | LinkedList | GraphStructure;

TreeNode:
    'treenode' id=ID
    'value' value=STRING
    ('parent' parent=[TreeNode:ID])?
    ('children' '{' children+=[TreeNode:ID]* '}')?
    ('root' root=[TreeNode:ID])?;

LinkedList:
    'linkedlist' id=ID
    'value' value=STRING
    ('next' next=[LinkedList:ID])?
    ('previous' previous=[LinkedList:ID])?
    ('head' head=[LinkedList:ID])?
    ('tail' tail=[LinkedList:ID])?;

GraphStructure:
    'graphstructure' id=ID
    ('nodes' '{' nodes+=[GraphNode:ID]* '}')?
    ('contains' '{' contains+=[GraphStructure:ID]* '}')?
    ('partOf' partOf=[GraphStructure:ID])?;

GraphNode:
    'graphnode' id=ID
    'value' value=STRING
    ('adjacentNodes' '{' adjacentNodes+=[GraphNode:ID]* '}')?
    ('inGraph' inGraph=[GraphStructure:ID])?;

Metadata:
    '{' 
        ('created' created=STRING)?
        ('modified' modified=STRING)?
        ('tags' '[' tags+=STRING (',' tags+=STRING)* ']')?
    '}';

// Type definitions
ConnectionType returns string:
    'direct' | 'indirect' | 'bidirectional';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;