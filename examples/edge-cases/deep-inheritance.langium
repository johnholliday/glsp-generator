// Deep Inheritance Grammar
// Tests handling of deep inheritance hierarchies
// This challenges type resolution and property inheritance

grammar DeepInheritance

entry Model:
    'model' name=ID
    entities+=EntityDeclaration*
    assets+=AssetDeclaration*
    biologicalEntities+=BiologicalEntity*
    devices+=Device*;

// Level 0: Root declarations
EntityDeclaration:
    Entity | NamedEntity | DescribedEntity | LifecycleEntity | 
    VersionedEntity | AuditableEntity | SecurableEntity | 
    PublishableEntity | ConfigurableEntity | ObservableEntity;

Entity:
    'entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?;

// Level 1: Basic categorization
NamedEntity:
    'named-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?;

// Level 2: Add description
DescribedEntity:
    'described-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?;

// Level 3: Add lifecycle
LifecycleEntity:
    'lifecycle-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?;

// Level 4: Add versioning details
VersionedEntity:
    'versioned-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?
    'majorVersion' majorVersion=NUMBER
    'minorVersion' minorVersion=NUMBER
    'patchVersion' patchVersion=NUMBER
    ('previousVersion' previousVersion=[VersionedEntity:ID])?
    ('changeLog' changeLog=STRING)?;

// Level 5: Add audit trail
AuditableEntity:
    'auditable-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?
    'majorVersion' majorVersion=NUMBER
    'minorVersion' minorVersion=NUMBER
    'patchVersion' patchVersion=NUMBER
    ('previousVersion' previousVersion=[VersionedEntity:ID])?
    ('changeLog' changeLog=STRING)?
    'createdBy' createdBy=STRING
    ('modifiedBy' modifiedBy=STRING)?
    ('history' '{' history+=AuditEntry* '}')?;

AuditEntry:
    'audit' timestamp=STRING
    'user' user=STRING
    'action' action=AuditAction
    ('details' details=STRING)?;

// Level 6: Add security
SecurableEntity:
    'securable-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?
    'majorVersion' majorVersion=NUMBER
    'minorVersion' minorVersion=NUMBER
    'patchVersion' patchVersion=NUMBER
    ('previousVersion' previousVersion=[VersionedEntity:ID])?
    ('changeLog' changeLog=STRING)?
    'createdBy' createdBy=STRING
    ('modifiedBy' modifiedBy=STRING)?
    ('history' '{' history+=AuditEntry* '}')?
    'owner' owner=STRING
    'permissions' '{' permissions+=Permission* '}'
    (isPublic?='public')?
    (isEncrypted?='encrypted')?;

Permission:
    'permission' subject=STRING
    'access' access=AccessLevel
    ('conditions' '{' conditions+=STRING* '}')?;

// Level 7: Add publishing
PublishableEntity:
    'publishable-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?
    'majorVersion' majorVersion=NUMBER
    'minorVersion' minorVersion=NUMBER
    'patchVersion' patchVersion=NUMBER
    ('previousVersion' previousVersion=[VersionedEntity:ID])?
    ('changeLog' changeLog=STRING)?
    'createdBy' createdBy=STRING
    ('modifiedBy' modifiedBy=STRING)?
    ('history' '{' history+=AuditEntry* '}')?
    'owner' owner=STRING
    'permissions' '{' permissions+=Permission* '}'
    (isPublic?='public')?
    (isEncrypted?='encrypted')?
    (isPublished?='published')?
    ('publishedDate' publishedDate=STRING)?
    ('publishedBy' publishedBy=STRING)?
    ('expirationDate' expirationDate=STRING)?
    ('channels' '{' channels+=PublishChannel* '}')?;

PublishChannel:
    'channel' name=ID
    'url' url=STRING
    ('metadata' metadata=STRING)?;

// Level 8: Add configuration
ConfigurableEntity:
    'configurable-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?
    'majorVersion' majorVersion=NUMBER
    'minorVersion' minorVersion=NUMBER
    'patchVersion' patchVersion=NUMBER
    ('previousVersion' previousVersion=[VersionedEntity:ID])?
    ('changeLog' changeLog=STRING)?
    'createdBy' createdBy=STRING
    ('modifiedBy' modifiedBy=STRING)?
    ('history' '{' history+=AuditEntry* '}')?
    'owner' owner=STRING
    'permissions' '{' permissions+=Permission* '}'
    (isPublic?='public')?
    (isEncrypted?='encrypted')?
    (isPublished?='published')?
    ('publishedDate' publishedDate=STRING)?
    ('publishedBy' publishedBy=STRING)?
    ('expirationDate' expirationDate=STRING)?
    ('channels' '{' channels+=PublishChannel* '}')?
    'configuration' '{' configuration+=ConfigItem* '}'
    ('profiles' '{' profiles+=ConfigProfile* '}')?
    ('validationRules' '{' validationRules+=ValidationRule* '}')?;

ConfigItem:
    'config' key=ID
    'value' value=STRING
    ('type' type=ConfigType)?
    (required?='required')?;

ConfigProfile:
    'profile' name=ID
    ('extends' extends=[ConfigProfile:ID])?
    '{' items+=ConfigItem* '}';

ValidationRule:
    'rule' name=ID
    'expression' expression=STRING
    ('message' message=STRING)?;

// Level 9: Add observability
ObservableEntity:
    'observable-entity' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('displayName' displayName=STRING)?
    ('description' description=STRING)?
    ('tags' '{' tags+=STRING* '}')?
    'status' status=Status
    'version' version=NUMBER
    (deprecated?='deprecated')?
    'majorVersion' majorVersion=NUMBER
    'minorVersion' minorVersion=NUMBER
    'patchVersion' patchVersion=NUMBER
    ('previousVersion' previousVersion=[VersionedEntity:ID])?
    ('changeLog' changeLog=STRING)?
    'createdBy' createdBy=STRING
    ('modifiedBy' modifiedBy=STRING)?
    ('history' '{' history+=AuditEntry* '}')?
    'owner' owner=STRING
    'permissions' '{' permissions+=Permission* '}'
    (isPublic?='public')?
    (isEncrypted?='encrypted')?
    (isPublished?='published')?
    ('publishedDate' publishedDate=STRING)?
    ('publishedBy' publishedBy=STRING)?
    ('expirationDate' expirationDate=STRING)?
    ('channels' '{' channels+=PublishChannel* '}')?
    'configuration' '{' configuration+=ConfigItem* '}'
    ('profiles' '{' profiles+=ConfigProfile* '}')?
    ('validationRules' '{' validationRules+=ValidationRule* '}')?
    ('metrics' '{' metrics+=Metric* '}')?
    ('events' '{' events+=Event* '}')?
    ('alerts' '{' alerts+=Alert* '}')?
    (monitoringEnabled?='monitoring-enabled')?;

Metric:
    'metric' name=ID
    'type' type=MetricType
    'unit' unit=STRING
    ('threshold' threshold=NUMBER)?;

Event:
    'event' name=ID
    'severity' severity=EventSeverity
    ('payload' payload=STRING)?;

Alert:
    'alert' name=ID
    'condition' condition=STRING
    'action' action=AlertAction
    ('recipients' '{' recipients+=STRING* '}')?;

// Domain-specific deep hierarchies
AssetDeclaration:
    PhysicalAsset | DigitalAsset | FinancialAsset | IntellectualAsset;

PhysicalAsset:
    'physical-asset' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('description' description=STRING)?
    'status' status=Status
    'location' location=STRING
    'serialNumber' serialNumber=STRING
    ('manufacturer' manufacturer=STRING)?
    ('model' model=STRING)?
    ('purchaseDate' purchaseDate=STRING)?
    ('warrantyExpiry' warrantyExpiry=STRING)?
    ('maintenanceSchedule' '{' maintenanceSchedule+=MaintenanceItem* '}')?;

MaintenanceItem:
    'maintenance' type=ID
    'interval' interval=NUMBER
    'unit' unit=TimeUnit
    ('lastPerformed' lastPerformed=STRING)?;

DigitalAsset:
    'digital-asset' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('description' description=STRING)?
    'status' status=Status
    'format' format=STRING
    'size' size=NUMBER
    'checksum' checksum=STRING
    ('license' license=STRING)?
    ('rights' rights=STRING)?
    ('metadata' metadata=STRING)?;

FinancialAsset:
    'financial-asset' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('description' description=STRING)?
    'status' status=Status
    'type' type=FinancialAssetType
    'value' value=NUMBER
    'currency' currency=STRING
    ('acquisitionDate' acquisitionDate=STRING)?
    ('maturityDate' maturityDate=STRING)?
    ('interestRate' interestRate=NUMBER)?;

IntellectualAsset:
    'intellectual-asset' id=ID
    'created' created=STRING
    ('modified' modified=STRING)?
    'name' name=STRING
    ('description' description=STRING)?
    'status' status=Status
    'type' type=IntellectualAssetType
    ('registrationNumber' registrationNumber=STRING)?
    ('registrationDate' registrationDate=STRING)?
    ('expiryDate' expiryDate=STRING)?
    ('jurisdiction' jurisdiction=STRING)?;

// Biological hierarchy
BiologicalEntity:
    Organism | Animal | Mammal | Primate | Human;

Organism:
    'organism' id=ID
    'scientificName' scientificName=STRING
    'kingdom' kingdom=STRING
    ('phylum' phylum=STRING)?
    ('class' class=STRING)?;

Animal:
    'animal' id=ID
    'scientificName' scientificName=STRING
    'kingdom' kingdom='Animalia'
    'phylum' phylum=STRING
    'class' class=STRING
    ('order' order=STRING)?
    ('family' family=STRING)?
    (isVertebrate?='vertebrate')?
    ('habitat' habitat=STRING)?;

Mammal:
    'mammal' id=ID
    'scientificName' scientificName=STRING
    'kingdom' kingdom='Animalia'
    'phylum' phylum='Chordata'
    'class' class='Mammalia'
    'order' order=STRING
    'family' family=STRING
    ('genus' genus=STRING)?
    ('species' species=STRING)?
    'gestationPeriod' gestationPeriod=NUMBER
    (isEndangered?='endangered')?;

Primate:
    'primate' id=ID
    'scientificName' scientificName=STRING
    'kingdom' kingdom='Animalia'
    'phylum' phylum='Chordata'
    'class' class='Mammalia'
    'order' order='Primates'
    'family' family=STRING
    'genus' genus=STRING
    'species' species=STRING
    'gestationPeriod' gestationPeriod=NUMBER
    (isEndangered?='endangered')?
    (isBipedal?='bipedal')?
    'brainVolume' brainVolume=NUMBER;

Human:
    'human' id=ID
    'scientificName' scientificName='Homo sapiens'
    'kingdom' kingdom='Animalia'
    'phylum' phylum='Chordata'
    'class' class='Mammalia'
    'order' order='Primates'
    'family' family='Hominidae'
    'genus' genus='Homo'
    'species' species='sapiens'
    'gestationPeriod' gestationPeriod=NUMBER
    (isEndangered?='endangered')?
    bipedal?='bipedal' // Always true for humans
    'brainVolume' brainVolume=NUMBER
    'language' language=STRING
    ('culture' culture=STRING)?
    ('occupation' occupation=STRING)?;

// Device hierarchy
Device:
    BasicDevice | SmartDevice | ConnectedDevice | AutonomousDevice;

BasicDevice:
    'basic-device' id=ID
    'model' model=STRING
    'manufacturer' manufacturer=STRING
    'powerType' powerType=PowerType;

SmartDevice:
    'smart-device' id=ID
    'model' model=STRING
    'manufacturer' manufacturer=STRING
    'powerType' powerType=PowerType
    'os' operatingSystem=STRING
    'memory' memory=NUMBER
    ('storage' storage=NUMBER)?;

ConnectedDevice:
    'connected-device' id=ID
    'model' model=STRING
    'manufacturer' manufacturer=STRING
    'powerType' powerType=PowerType
    'os' operatingSystem=STRING
    'memory' memory=NUMBER
    ('storage' storage=NUMBER)?
    'networkType' networkType=NetworkType
    ('ipAddress' ipAddress=STRING)?
    ('macAddress' macAddress=STRING)?;

AutonomousDevice:
    'autonomous-device' id=ID
    'model' model=STRING
    'manufacturer' manufacturer=STRING
    'powerType' powerType=PowerType
    'os' operatingSystem=STRING
    'memory' memory=NUMBER
    ('storage' storage=NUMBER)?
    'networkType' networkType=NetworkType
    ('ipAddress' ipAddress=STRING)?
    ('macAddress' macAddress=STRING)?
    'aiModel' aiModel=STRING
    'sensors' '{' sensors+=Sensor* '}'
    (canLearn?='learning-enabled')?;

Sensor:
    'sensor' type=SensorType
    'precision' precision=NUMBER
    ('range' range=NUMBER)?;

// Type definitions
Status returns string:
    'active' | 'inactive' | 'pending' | 'archived';

AuditAction returns string:
    'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject';

AccessLevel returns string:
    'read' | 'write' | 'execute' | 'admin';

ConfigType returns string:
    'string' | 'number' | 'boolean' | 'object' | 'array';

MetricType returns string:
    'counter' | 'gauge' | 'histogram' | 'summary';

EventSeverity returns string:
    'debug' | 'info' | 'warning' | 'error' | 'critical';

AlertAction returns string:
    'email' | 'sms' | 'webhook' | 'log';

TimeUnit returns string:
    'days' | 'weeks' | 'months' | 'years';

FinancialAssetType returns string:
    'stock' | 'bond' | 'commodity' | 'currency' | 'derivative';

IntellectualAssetType returns string:
    'patent' | 'trademark' | 'copyright' | 'tradesecret';

PowerType returns string:
    'battery' | 'ac' | 'dc' | 'solar' | 'usb';

NetworkType returns string:
    'wifi' | 'ethernet' | 'bluetooth' | 'cellular' | 'satellite';

SensorType returns string:
    'temperature' | 'pressure' | 'light' | 'motion' | 'proximity' | 'gps';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;