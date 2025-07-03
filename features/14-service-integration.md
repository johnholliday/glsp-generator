# Service Integration Layer Feature

## Overview
The Service Integration Layer provides an extensibility mechanism that enables GLSP Generator to create extensions with pre-integrated service connections, command mappings, and mock implementations. This feature bridges the gap between grammar-defined models and real-world application services, allowing developers to define service endpoints and commands alongside their grammar that are automatically integrated into the generated extension.

## Purpose
- Enable seamless integration between generated extensions and external services
- Provide immediate usability through comprehensive mock implementations
- Support iterative development with automatic regeneration
- Generate type-safe service interfaces and IoC bindings
- Create complete test suites that work out-of-the-box
- Support multiple service types (REST, Supabase Edge Functions, internal Theia services)

## Current Implementation

### Components

#### 1. **Service Map Parser** (`src/services/service-map-parser.ts`)
- Parses JSON service map definitions
- Validates against JSON schema
- Transforms service definitions into internal model
- Resolves environment variables and tokens

#### 2. **Service Generator** (`src/services/service-generator.ts`)
- Generates service interfaces from definitions
- Creates mock implementations with realistic data
- Produces IoC container bindings
- Generates command contributions
- Creates comprehensive test suites

#### 3. **Command Integration** (`src/services/command-integration.ts`)
- Maps commands to service endpoints
- Generates command handlers
- Creates UI contributions (menus, toolbars)
- Handles enablement conditions
- Manages parameter extraction

#### 4. **Mock Data System** (`src/services/mock-data-system.ts`)
- Loads and manages mock data
- Provides realistic responses
- Simulates network delays
- Handles error scenarios
- Supports data relationships

### Service Map Schema

```json
{
  "$schema": "https://glsp-generator.io/schemas/service-map.json",
  "version": "1.0.0",
  "services": {
    "userService": {
      "type": "rest",
      "baseUrl": "${API_BASE_URL}/users",
      "authentication": {
        "type": "bearer",
        "tokenSource": "theia:auth-service"
      },
      "endpoints": {
        "getUser": {
          "method": "GET",
          "path": "/{userId}",
          "description": "Fetch user details by ID",
          "parameters": {
            "userId": {
              "type": "string",
              "source": "path",
              "required": true
            }
          },
          "response": {
            "type": "UserProfile",
            "mock": "profiles.json#/users"
          }
        },
        "updateUser": {
          "method": "PUT",
          "path": "/{userId}",
          "description": "Update user information",
          "body": {
            "type": "Partial<UserProfile>"
          }
        }
      }
    },
    "workflowService": {
      "type": "supabase-edge",
      "projectUrl": "${SUPABASE_URL}",
      "authentication": {
        "type": "supabase-auth",
        "anonKey": "${SUPABASE_ANON_KEY}"
      },
      "functions": {
        "executeWorkflow": {
          "function": "workflow-executor",
          "description": "Execute a workflow instance",
          "parameters": {
            "workflowId": "string",
            "context": "WorkflowContext"
          }
        },
        "validateWorkflow": {
          "function": "workflow-validator",
          "description": "Validate workflow before execution"
        }
      }
    },
    "modelService": {
      "type": "internal",
      "implementation": "@extension:model-service",
      "methods": {
        "validateModel": {
          "description": "Validate model against business rules",
          "parameters": {
            "model": "DiagramModel"
          },
          "returns": "ValidationResult[]"
        },
        "transformModel": {
          "description": "Transform model to different format",
          "parameters": {
            "model": "DiagramModel",
            "format": "string"
          }
        }
      }
    }
  },
  "commands": {
    "user.profile.view": {
      "label": "View User Profile",
      "icon": "$(account)",
      "category": "User",
      "keybinding": "ctrl+shift+u",
      "enablement": "activeEditor && selection.type == 'UserNode'",
      "handler": {
        "service": "userService",
        "endpoint": "getUser",
        "parameters": {
          "userId": "${selection.properties.userId}"
        },
        "resultHandler": "showUserProfile",
        "errorHandler": "showError"
      }
    },
    "workflow.execute": {
      "label": "Execute Workflow",
      "icon": "$(play)",
      "category": "Workflow",
      "enablement": "activeEditor && selection.type == 'WorkflowNode'",
      "menu": [
        {
          "id": "editor/context",
          "group": "workflow",
          "when": "resourceExtname == .workflow"
        }
      ],
      "handler": {
        "service": "workflowService",
        "function": "executeWorkflow",
        "parameters": {
          "workflowId": "${selection.id}",
          "context": "${diagram.context}"
        },
        "progressMessage": "Executing workflow...",
        "successMessage": "Workflow executed successfully"
      }
    }
  },
  "types": {
    "UserProfile": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "UserRole",
      "lastActive": "Date"
    },
    "UserRole": "admin | user | guest",
    "WorkflowContext": {
      "variables": "Record<string, any>",
      "user": "UserProfile",
      "timestamp": "Date"
    }
  },
  "mockData": {
    "profiles": "./mock-data/user-profiles.json",
    "workflows": "./mock-data/workflows.json",
    "config": {
      "delay": {
        "min": 100,
        "max": 400
      },
      "errorRate": 0.05
    }
  }
}
```

## Technical Details

### Service Type Handlers

#### REST Service Handler
```typescript
interface RestServiceConfig {
  baseUrl: string
  authentication?: AuthConfig
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}

class RestServiceHandler {
  async generateInterface(service: RestService): Promise<string> {
    const methods = service.endpoints.map(endpoint => 
      this.generateMethod(endpoint)
    )
    return this.templateEngine.render('rest-service-interface', {
      serviceName: service.name,
      methods
    })
  }
  
  async generateMock(service: RestService): Promise<string> {
    return this.templateEngine.render('rest-service-mock', {
      serviceName: service.name,
      endpoints: service.endpoints,
      mockData: await this.loadMockData(service)
    })
  }
}
```

#### Supabase Edge Function Handler
```typescript
interface SupabaseServiceConfig {
  projectUrl: string
  authentication: SupabaseAuthConfig
  region?: string
}

class SupabaseServiceHandler {
  async generateInterface(service: SupabaseService): Promise<string> {
    const functions = service.functions.map(func =>
      this.generateFunction(func)
    )
    return this.templateEngine.render('supabase-service-interface', {
      serviceName: service.name,
      functions
    })
  }
}
```

### Command Generation

#### Command Registry Integration
```typescript
class CommandGenerator {
  generateCommandContribution(commands: CommandMap): string {
    return this.templateEngine.render('command-contribution', {
      commands: Object.entries(commands).map(([id, config]) => ({
        id,
        ...config,
        handlerCode: this.generateHandler(id, config)
      }))
    })
  }
  
  private generateHandler(id: string, config: CommandConfig): string {
    const { service, endpoint, parameters } = config.handler
    
    return `
      async execute() {
        const params = ${this.generateParameterExtraction(parameters)}
        
        try {
          ${config.handler.progressMessage ? 
            `this.messageService.showProgress('${config.handler.progressMessage}')` : ''}
          
          const result = await this.${service}.${endpoint}(params)
          
          ${config.handler.resultHandler ? 
            `await this.handlers.${config.handler.resultHandler}(result)` :
            'return result'}
            
          ${config.handler.successMessage ?
            `this.messageService.info('${config.handler.successMessage}')` : ''}
        } catch (error) {
          ${config.handler.errorHandler ?
            `this.handlers.${config.handler.errorHandler}(error)` :
            'this.messageService.error(error.message)'}
        }
      }
    `
  }
}
```

### Mock Implementation Strategy

#### Realistic Data Generation
```typescript
class MockDataGenerator {
  private faker = new Faker()
  
  generateMockResponse(responseType: TypeDefinition): any {
    if (this.mockData.has(responseType.name)) {
      return this.selectFromMockData(responseType.name)
    }
    
    return this.generateFromType(responseType)
  }
  
  private generateFromType(type: TypeDefinition): any {
    switch (type.kind) {
      case 'primitive':
        return this.generatePrimitive(type)
      case 'object':
        return this.generateObject(type)
      case 'array':
        return this.generateArray(type)
      case 'union':
        return this.generateUnion(type)
    }
  }
}
```

### Test Generation

#### Service Test Template
```typescript
// Template for service tests
const serviceTestTemplate = `
describe('{{serviceName}}', () => {
  let container: Container
  let {{serviceInstance}}: I{{ServiceName}}
  
  beforeEach(() => {
    container = new Container()
    container.load(createServiceModule(true))
    {{serviceInstance}} = container.get<I{{ServiceName}}>(I{{ServiceName}})
  })
  
  {{#each endpoints}}
  describe('{{name}}', () => {
    it('should {{description}}', async () => {
      const result = await {{../serviceInstance}}.{{name}}({{mockParams}})
      
      expect(result).toBeDefined()
      {{#each assertions}}
      expect(result{{property}}){{matcher}}({{expected}})
      {{/each}}
    })
    
    {{#if errorCases}}
    it('should handle errors', async () => {
      await expect({{../serviceInstance}}.{{name}}({{invalidParams}}))
        .rejects.toThrow({{errorMessage}})
    })
    {{/if}}
  })
  {{/each}}
})
`
```

## Usage Examples

### Basic Service Integration
```bash
# Generate extension with services
glsp-generator generate my-dsl.langium \
  --services ./service-map.json \
  --mock-data ./mocks

# Output structure
my-dsl-extension/
├── src/
│   ├── services/
│   │   ├── interfaces/
│   │   ├── implementations/
│   │   └── mocks/
│   ├── commands/
│   └── tests/
```

### Iterative Development Workflow
```bash
# Initial generation
glsp-generator generate workflow.langium --services services.json

# Modify grammar
echo "interface TaskNode extends Node { assignee: string }" >> workflow.langium

# Regenerate (preserves custom implementations)
glsp-generator generate workflow.langium --services services.json --preserve-custom

# Run tests
cd workflow-extension && yarn test
```

### Service Map Configuration
```typescript
// Advanced service configuration
{
  "services": {
    "analyticsService": {
      "type": "rest",
      "baseUrl": "${ANALYTICS_API}",
      "authentication": {
        "type": "oauth2",
        "flow": "client_credentials",
        "tokenEndpoint": "${AUTH_SERVER}/token",
        "clientId": "${CLIENT_ID}",
        "clientSecret": "${CLIENT_SECRET}",
        "scopes": ["read:analytics", "write:metrics"]
      },
      "interceptors": [
        {
          "type": "retry",
          "maxAttempts": 3,
          "backoff": "exponential"
        },
        {
          "type": "cache",
          "ttl": 300,
          "methods": ["GET"]
        }
      ]
    }
  }
}
```

## Implementation Patterns

### Dependency Injection Setup
```typescript
// Generated IoC configuration
export class ServiceModule extends ContainerModule {
  constructor(private config: ServiceConfig) {
    super((bind, unbind, isBound, rebind) => {
      // Service bindings
      this.bindServices(bind)
      
      // Command bindings
      this.bindCommands(bind)
      
      // Handler bindings
      this.bindHandlers(bind)
      
      // Configuration
      bind(ServiceConfig).toConstantValue(this.config)
    })
  }
  
  private bindServices(bind: interfaces.Bind) {
    if (this.config.useMocks) {
      bind(IUserService).to(MockUserService).inSingletonScope()
    } else {
      bind(IUserService).to(UserService).inSingletonScope()
    }
  }
}
```

### Error Handling
```typescript
// Centralized error handling
@injectable()
export class ServiceErrorHandler {
  handle(error: ServiceError, context: CommandContext): void {
    switch (error.type) {
      case 'network':
        this.showNetworkError(error)
        break
      case 'authentication':
        this.promptAuthentication(error)
        break
      case 'validation':
        this.showValidationErrors(error)
        break
      default:
        this.showGenericError(error)
    }
  }
}
```

## Best Practices
1. **Service Granularity**: Keep services focused on single responsibility
2. **Mock Realism**: Use production-like data in mocks
3. **Error Scenarios**: Include error cases in mock implementations
4. **Type Safety**: Leverage TypeScript for all service interfaces
5. **Documentation**: Generate comprehensive API documentation
6. **Testing**: Ensure 100% test coverage for generated code
7. **Security**: Never expose sensitive data in mocks

## Configuration Options
```json
{
  "serviceIntegration": {
    "enabled": true,
    "serviceMapPath": "./services/service-map.json",
    "mockDataPath": "./services/mock-data",
    "generateTests": true,
    "testFramework": "vitest",
    "preserveCustomCode": true,
    "authentication": {
      "storage": "keytar",
      "encryption": true
    },
    "generation": {
      "interfaces": true,
      "mocks": true,
      "tests": true,
      "documentation": true
    }
  }
}
```

## Future Enhancements
1. **GraphQL Support**: Add GraphQL service type with schema introspection
2. **WebSocket Services**: Real-time bidirectional communication
3. **Service Discovery**: Dynamic service registration and discovery
4. **Circuit Breakers**: Resilience patterns for fault tolerance
5. **API Versioning**: Support multiple API versions simultaneously
6. **Offline Support**: Local-first architecture with sync
7. **Service Mesh**: Kubernetes/Istio service mesh integration
8. **OpenAPI Import**: Generate from OpenAPI/Swagger specs

## Dependencies
- `inversify`: IoC container
- `axios`: HTTP client for REST services
- `@supabase/supabase-js`: Supabase client
- `@faker-js/faker`: Mock data generation
- `ajv`: JSON schema validation
- `vitest`: Testing framework

## Testing
- Service interface generation tests
- Mock implementation behavior tests
- Command integration tests
- IoC binding tests
- End-to-end workflow tests

## Related Features
- [Code Generation](./02-code-generation.md)
- [Type Safety](./07-type-safety.md)
- [Test Generation](./08-test-generation.md)
- [Template Management](./13-template-management.md)
- [Configuration System](./04-configuration.md)