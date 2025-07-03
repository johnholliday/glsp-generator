Review the following summary of my GLSPGen tool to develop a thorough understanding of its current capabilities, and then review the list of enhanced features to create a comprehensive and detailed architecture and implementation plan for extending and enhancing the tool to support the described features and extended capabilities.

---

### GLSPGen: Current Implementation

This is a **GLSP Generator** project with the following high-level structure:

#### **Core Architecture**

- **Entry Point**: [`src/cli.ts`](vscode-webview://0npu61pb8291shpl6dl1ublr2sqvl144hbp696jaj277c349lrvd/src/cli.ts:1) - Comprehensive CLI with 15+ commands
- **Main Generator**: [`src/generator.ts`](vscode-webview://0npu61pb8291shpl6dl1ublr2sqvl144hbp696jaj277c349lrvd/src/generator.ts:1) - Core GLSP extension generation logic
- **Configuration**: [`src/config/`](vscode-webview://0npu61pb8291shpl6dl1ublr2sqvl144hbp696jaj277c349lrvd/src/config/) - JSON schema-based configuration system

#### **Key Features**

1. **Grammar Processing**: Langium grammar parsing and validation
2. **Code Generation**: Template-based GLSP extension generation
3. **Migration Tools**: Convert from ANTLR4, Xtext, and existing GLSP projects
4. **Type Safety**: Generate TypeScript declarations, guards, and Zod schemas
5. **Testing**: Comprehensive test infrastructure generation
6. **CI/CD**: GitHub Actions workflow generation
7. **Documentation**: Automated docs with railroad diagrams
8. **Performance**: Caching, streaming, and parallel processing

#### **Technology Stack**

- **TypeScript** (strict mode) with 100% type coverage
- **Langium** for grammar processing
- **Handlebars** for templating
- **Vitest** for testing
- **Yarn 4.9.1** with modern package management
- **ESM modules** throughout

#### **Build System**

- **TypeScript compilation** with asset copying
- **Template validation** and generation verification
- **Comprehensive CLI** with interactive modes

---

### GLSPAppGen: Enhanced Features and Capabilities

- Grammar > AST
  - The Langium CLI is used to generate an AST for a given Domain Language (DSL)
- AST >> System Prompt
  - The generated Langium AST is used to generate a GPT System Prompt that defines the context within which to process GPT queries related to a given Domain Model Instance.  The context is driven by the elements defined within the grammar, allowing the user to submit queries that are automatically enhanced (and constrained) by the generated System Prompt.
  - The AST is also used to generate a Runtime API (and matching CLI) generates the following artifacts on demand for a given Domain Model Instance:
    - Workflow Schema (JSON)
    - Workshop Template Specifications (JSON)
    - Survey Form Specifications (JSON)
    - Document Template Specifications (JSON)
- Workflow Schema (state machine)
  - Defines the purpose and scope of a given workflow instance
  - Defines the states and transitions leading to completion of a given workflow instance
  - Manages the collection of Workshop Template Specifications for a given Domain Model Instance
  - Manages the collection of Survey Form Specifications for a given Domain Model Instance
  - Manages the collection of Document Template Specifications for a given Domain Model Instance
- Workflow Instance (JSON)
  - Represents an instance of a given Workflow Schema
  - Manages all aspects of the workflow processing lifecycle and pipeline for a given Domain Model Instance
  - Manages the creation and lifecycle of Workshop Instances (based on Workshop Templates) at runtime.
  - Manages the creation and lifecycle of Survey Forms and Document Templates at runtime.
- Workshop Template (JSON)
  - Defines the inputs, outputs and iterative flow of a given workshop
  - Used to ensure that all aspects of the workshop are covered so that all required data is captured for other parts of the workflow as defined by the Workflow Schema
- Survey Form Specification (JSON)
  - Used to generate a SurveyJS Survey Form Schema
  - Used to manage the storage, retrieval and lifecycle of related Survey Form Data
  - Used to retrieve the Survey Form Data to drive conversations with an AI Assistant and drive document assembly and reporting operations
- Document Template Specification
  - Used to generate Handlebars Document Templates that pull in data from the current Domain Model Instance
  - Used to manage the storage, retrieval and lifecycle of related Document Templates and Generated Documents

##### 