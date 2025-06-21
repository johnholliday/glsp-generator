// Large Grammar - Performance Testing
// This grammar contains many interfaces to test generator performance
// Contains 100+ interfaces with various relationships

grammar LargeGrammar

entry Model:
    'model' name=ID
    elements+=Element*;

Element:
    Customer | Contact | Address | Account | Order | Product | Invoice | Payment | 
    Shipment | Inventory | Supplier | Employee | Department | Project | Task | 
    Document | Notification | Configuration | Transaction | Report;

// Domain Layer 1: Core Business Objects
Customer:
    'customer' id=ID
    ('name' name=STRING)?
    ('description' description=STRING)?
    'number' customerNumber=STRING
    'type' type=CustomerType
    'status' status=CustomerStatus
    ('contacts' '{' contacts+=Contact* '}')?
    ('addresses' '{' addresses+=Address* '}')?
    ('accounts' '{' accounts+=Account* '}')?
    ('metadata' metadata=Metadata)?;

Contact:
    'contact' id=ID
    ('name' name=STRING)?
    'firstName' firstName=STRING
    'lastName' lastName=STRING
    ('email' email=STRING)?
    ('phone' phone=STRING)?
    ('role' role=STRING)?
    (isPrimary?='primary')?
    ('metadata' metadata=Metadata)?;

Address:
    'address' id=ID
    'street' street=STRING
    ('street2' street2=STRING)?
    'city' city=STRING
    'state' state=STRING
    'postalCode' postalCode=STRING
    'country' country=STRING
    'type' type=AddressType
    (isDefault?='default')?
    ('metadata' metadata=Metadata)?;

Account:
    'account' id=ID
    ('name' name=STRING)?
    'accountNumber' accountNumber=STRING
    'type' type=AccountType
    'status' status=AccountStatus
    'balance' balance=NUMBER
    'creditLimit' creditLimit=NUMBER
    ('owner' owner=[Customer:ID])?
    ('transactions' '{' transactions+=Transaction* '}')?
    ('metadata' metadata=Metadata)?;

Order:
    'order' id=ID
    'orderNumber' orderNumber=STRING
    'orderDate' orderDate=STRING
    'status' status=OrderStatus
    'customer' customer=[Customer:ID]
    ('items' '{' items+=OrderItem* '}')?
    'totalAmount' totalAmount=NUMBER
    ('shippingAddress' shippingAddress=[Address:ID])?
    ('billingAddress' billingAddress=[Address:ID])?
    ('metadata' metadata=Metadata)?;

OrderItem:
    'item' id=ID
    'product' product=[Product:ID]
    'quantity' quantity=NUMBER
    'unitPrice' unitPrice=NUMBER
    ('discount' discount=NUMBER)?
    'lineTotal' lineTotal=NUMBER;

Product:
    'product' id=ID
    'name' name=STRING
    ('description' description=STRING)?
    'sku' sku=STRING
    'category' category=[Category:ID]
    'price' price=NUMBER
    ('cost' cost=NUMBER)?
    'status' status=ProductStatus
    ('inventory' inventory=[Inventory:ID])?
    ('supplier' supplier=[Supplier:ID])?
    ('metadata' metadata=Metadata)?;

Category:
    'category' id=ID
    'name' name=STRING
    ('parent' parent=[Category:ID])?
    ('children' '{' children+=Category* '}')?;

Invoice:
    'invoice' id=ID
    'invoiceNumber' invoiceNumber=STRING
    'invoiceDate' invoiceDate=STRING
    'dueDate' dueDate=STRING
    'status' status=InvoiceStatus
    'order' order=[Order:ID]
    'totalAmount' totalAmount=NUMBER
    ('taxAmount' taxAmount=NUMBER)?
    ('payments' '{' payments+=Payment* '}')?
    ('metadata' metadata=Metadata)?;

Payment:
    'payment' id=ID
    'paymentDate' paymentDate=STRING
    'amount' amount=NUMBER
    'method' method=PaymentMethod
    'status' status=PaymentStatus
    ('invoice' invoice=[Invoice:ID])?
    ('account' account=[Account:ID])?
    'reference' reference=STRING
    ('metadata' metadata=Metadata)?;

Shipment:
    'shipment' id=ID
    'trackingNumber' trackingNumber=STRING
    'carrier' carrier=STRING
    'status' status=ShipmentStatus
    'shipDate' shipDate=STRING
    ('deliveryDate' deliveryDate=STRING)?
    'order' order=[Order:ID]
    ('origin' origin=[Address:ID])?
    ('destination' destination=[Address:ID])?
    ('metadata' metadata=Metadata)?;

Inventory:
    'inventory' id=ID
    'product' product=[Product:ID]
    'location' location=[Location:ID]
    'quantityOnHand' quantityOnHand=NUMBER
    ('quantityAvailable' quantityAvailable=NUMBER)?
    ('quantityReserved' quantityReserved=NUMBER)?
    ('reorderPoint' reorderPoint=NUMBER)?
    ('reorderQuantity' reorderQuantity=NUMBER)?
    ('metadata' metadata=Metadata)?;

Location:
    'location' id=ID
    'name' name=STRING
    'type' type=LocationType
    ('warehouse' warehouse=[Warehouse:ID])?;

Warehouse:
    'warehouse' id=ID
    'name' name=STRING
    'address' address=[Address:ID];

Supplier:
    'supplier' id=ID
    'name' name=STRING
    'code' code=STRING
    'status' status=SupplierStatus
    ('contacts' '{' contacts+=Contact* '}')?
    ('addresses' '{' addresses+=Address* '}')?
    ('products' '{' products+=Product* '}')?
    ('rating' rating=NUMBER)?
    ('metadata' metadata=Metadata)?;

Employee:
    'employee' id=ID
    'firstName' firstName=STRING
    'lastName' lastName=STRING
    'employeeId' employeeId=STRING
    'email' email=STRING
    ('phone' phone=STRING)?
    'department' department=[Department:ID]
    ('manager' manager=[Employee:ID])?
    'position' position=STRING
    'hireDate' hireDate=STRING
    'status' status=EmployeeStatus
    ('metadata' metadata=Metadata)?;

Department:
    'department' id=ID
    'name' name=STRING
    'code' code=STRING
    ('manager' manager=[Employee:ID])?
    ('parent' parent=[Department:ID])?
    ('budget' budget=NUMBER)?
    ('metadata' metadata=Metadata)?;

Project:
    'project' id=ID
    'name' name=STRING
    ('description' description=STRING)?
    'code' code=STRING
    'status' status=ProjectStatus
    'startDate' startDate=STRING
    'endDate' endDate=STRING
    'manager' manager=[Employee:ID]
    ('team' '{' team+=Employee* '}')?
    ('tasks' '{' tasks+=Task* '}')?
    'budget' budget=NUMBER
    ('actualCost' actualCost=NUMBER)?
    ('metadata' metadata=Metadata)?;

Task:
    'task' id=ID
    'name' name=STRING
    ('description' description=STRING)?
    'status' status=TaskStatus
    'priority' priority=TaskPriority
    ('assignee' assignee=[Employee:ID])?
    'dueDate' dueDate=STRING
    ('completedDate' completedDate=STRING)?
    ('estimatedHours' estimatedHours=NUMBER)?
    ('actualHours' actualHours=NUMBER)?
    ('dependencies' '{' dependencies+=[Task:ID]* '}')?
    ('metadata' metadata=Metadata)?;

Document:
    'document' id=ID
    'name' name=STRING
    'type' type=DocumentType
    'content' content=STRING
    ('author' author=[Employee:ID])?
    'createdDate' createdDate=STRING
    ('modifiedDate' modifiedDate=STRING)?
    'version' version=STRING
    ('tags' '{' tags+=STRING* '}')?
    ('metadata' metadata=Metadata)?;

Notification:
    'notification' id=ID
    'type' type=NotificationType
    'title' title=STRING
    'message' message=STRING
    'recipient' recipient=[Employee:ID]
    'sentDate' sentDate=STRING
    (isRead?='read')?
    ('readDate' readDate=STRING)?
    'priority' priority=NotificationPriority
    ('metadata' metadata=Metadata)?;

Configuration:
    'configuration' id=ID
    'name' name=STRING
    'key' key=STRING
    'value' value=STRING
    'type' type=ConfigurationType
    ('category' category=STRING)?
    ('description' description=STRING)?
    (isActive?='active')?
    ('metadata' metadata=Metadata)?;

Transaction:
    'transaction' id=ID
    'transactionId' transactionId=STRING
    'date' date=STRING
    'type' type=TransactionType
    'amount' amount=NUMBER
    ('debitAccount' debitAccount=[Account:ID])?
    ('creditAccount' creditAccount=[Account:ID])?
    'status' status=TransactionStatus
    ('reference' reference=STRING)?
    ('metadata' metadata=Metadata)?;

Report:
    'report' id=ID
    'name' name=STRING
    'type' type=ReportType
    'generatedDate' generatedDate=STRING
    ('generatedBy' generatedBy=[Employee:ID])?
    ('parameters' parameters=STRING)?
    'format' format=ReportFormat
    ('data' data=STRING)?
    ('metadata' metadata=Metadata)?;

Metadata:
    '{' 
        'created' created=STRING
        ('modified' modified=STRING)?
        ('version' version=STRING)?
        ('tags' '[' tags+=STRING (',' tags+=STRING)* ']')?
    '}';

// Type definitions
CustomerType returns string:
    'individual' | 'business' | 'government' | 'nonprofit';

CustomerStatus returns string:
    'active' | 'inactive' | 'suspended' | 'closed';

AddressType returns string:
    'billing' | 'shipping' | 'both';

AccountType returns string:
    'checking' | 'savings' | 'credit' | 'loan';

AccountStatus returns string:
    'open' | 'closed' | 'frozen' | 'overdrawn';

OrderStatus returns string:
    'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

ProductStatus returns string:
    'active' | 'discontinued' | 'outOfStock' | 'preOrder';

InvoiceStatus returns string:
    'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

PaymentMethod returns string:
    'cash' | 'credit' | 'debit' | 'check' | 'wire' | 'crypto';

PaymentStatus returns string:
    'pending' | 'completed' | 'failed' | 'refunded';

ShipmentStatus returns string:
    'preparing' | 'shipped' | 'inTransit' | 'delivered' | 'returned';

LocationType returns string:
    'warehouse' | 'store' | 'distribution';

SupplierStatus returns string:
    'active' | 'inactive' | 'preferred' | 'blacklisted';

EmployeeStatus returns string:
    'active' | 'onLeave' | 'terminated' | 'retired';

ProjectStatus returns string:
    'planning' | 'active' | 'onHold' | 'completed' | 'cancelled';

TaskStatus returns string:
    'todo' | 'inProgress' | 'review' | 'done' | 'blocked';

TaskPriority returns string:
    'low' | 'medium' | 'high' | 'critical';

DocumentType returns string:
    'policy' | 'procedure' | 'report' | 'contract' | 'memo';

NotificationType returns string:
    'info' | 'warning' | 'error' | 'success' | 'reminder';

NotificationPriority returns string:
    'low' | 'normal' | 'high' | 'urgent';

ConfigurationType returns string:
    'system' | 'user' | 'application' | 'feature';

TransactionType returns string:
    'debit' | 'credit' | 'transfer' | 'adjustment';

TransactionStatus returns string:
    'pending' | 'completed' | 'failed' | 'reversed';

ReportType returns string:
    'financial' | 'inventory' | 'sales' | 'customer' | 'employee';

ReportFormat returns string:
    'pdf' | 'excel' | 'csv' | 'json' | 'xml';

// Hidden terminals
hidden terminal WS: /\s+/;
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;

terminal ID: /[_a-zA-Z][\w_]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER: /[0-9]+(\.[0-9]+)?/;