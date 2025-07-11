/**
 * Data Processing Pipeline Language
 * @glsp-group dataflow
 * @glsp-layout layered LR
 * @glsp-theme primary=#16a34a secondary=#15803d
 * @glsp-features autoLayout=true bendpoints=true routing=polyline
 */
grammar DataflowLanguage

/**
 * The root pipeline model
 * @glsp-node pipeline
 * @glsp-shape rectangle
 * @glsp-resizable true
 * @glsp-style fill=#f0fdf4 stroke=#86efac strokeWidth=2
 */
entry Pipeline:
    'pipeline' name=ID '{'
        elements+=DataflowElement*
        connections+=Connection*
    '}';

/**
 * Data source element
 * @glsp-node source
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-style fill=#22c55e stroke=#16a34a strokeWidth=2
 * @glsp-port east output multiple
 * @glsp-icon path=/icons/database.svg
 * @glsp-label position=bottom editable=true
 */
DataSource:
    'source' name=ID '{'
        'type' type=SourceType
        'schema' schema=STRING
        ('format' format=DataFormat)?
        ('connection' connection=STRING)?
    '}';

/**
 * Data processor element
 * @glsp-node processor
 * @glsp-shape hexagon
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-style fill=#3b82f6 stroke=#2563eb strokeWidth=2
 * @glsp-port west input
 * @glsp-port east output
 * @glsp-label position=center editable=true
 */
Processor:
    'processor' name=ID '{'
        'operation' operation=OperationType
        ('expression' expression=STRING)?
        ('window' window=WindowSpec)?
        properties+=Property*
    '}';

/**
 * Data transformation element
 * @glsp-node transformer
 * @glsp-shape parallelogram
 * @glsp-connectable true
 * @glsp-style fill=#8b5cf6 stroke=#7c3aed strokeWidth=2
 * @glsp-port west input
 * @glsp-port east output
 * @glsp-port south output
 */
Transformer:
    'transformer' name=ID '{'
        'mapping' '{'
            mappings+=FieldMapping*
        '}'
        ('validation' validation=STRING)?
    '}';

/**
 * Data filter element
 * @glsp-node filter
 * @glsp-shape trapezoid
 * @glsp-connectable true
 * @glsp-style fill=#f59e0b stroke=#d97706 strokeWidth=2
 * @glsp-port west input
 * @glsp-port east output
 * @glsp-port south output
 */
Filter:
    'filter' name=ID '{'
        'condition' condition=STRING
        ('errorOutput' errorOutput=[DataSink:ID])?
    '}';

/**
 * Data sink element
 * @glsp-node sink
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-style fill=#ef4444 stroke=#dc2626 strokeWidth=2
 * @glsp-port west input multiple
 * @glsp-icon path=/icons/storage.svg
 */
DataSink:
    'sink' name=ID '{'
        'type' type=SinkType
        'format' format=DataFormat
        ('destination' destination=STRING)?
        ('mode' mode=WriteMode)?
    '}';

/**
 * Data quality checkpoint
 * @glsp-node quality-check
 * @glsp-shape diamond
 * @glsp-connectable true
 * @glsp-style fill=#eab308 stroke=#ca8a04 strokeWidth=2
 * @glsp-port west input
 * @glsp-port east output
 * @glsp-port south output
 * @glsp-label position=top editable=false
 */
QualityCheck:
    'quality' name=ID '{'
        rules+=QualityRule*
        'onFailure' failureAction=FailureAction
    '}';

/**
 * Connections between dataflow elements
 * @glsp-edge data-flow
 * @glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray=0
 * @glsp-label position=center editable=true
 */
Connection:
    from=[DataflowElement:ID] '=>' to=[DataflowElement:ID]
    ('label' label=STRING)?
    ('condition' condition=STRING)?;

// Supporting elements
FieldMapping:
    source=STRING '->' target=STRING
    ('transform' transform=STRING)?;

Property:
    key=ID '=' value=STRING;

QualityRule:
    'rule' name=ID ':' expression=STRING
    ('severity' severity=Severity)?;

WindowSpec:
    'window' size=NUMBER unit=TimeUnit
    ('slide' slideSize=NUMBER)?;

// Abstract interface for connectable elements
interface DataflowElement {
    name: string
}

// Enumerations
type SourceType = 'database' | 'file' | 'stream' | 'api' | 'queue';
type SinkType = 'database' | 'file' | 'stream' | 'api' | 'queue' | 'console';
type DataFormat = 'json' | 'csv' | 'parquet' | 'avro' | 'xml' | 'binary';
type OperationType = 'map' | 'reduce' | 'aggregate' | 'join' | 'union' | 'distinct';
type WriteMode = 'append' | 'overwrite' | 'errorIfExists' | 'ignore';
type FailureAction = 'abort' | 'skip' | 'quarantine' | 'log';
type Severity = 'error' | 'warning' | 'info';
type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days';

// Terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;