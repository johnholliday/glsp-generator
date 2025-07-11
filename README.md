# GLSP Generator Monorepo

Generate Eclipse GLSP extensions from Langium grammar files with an integrated VSCode workflow.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Yarn 3+ (will auto-install correct version)
- VSCode (for extension features)
- Windows PowerShell or compatible shell

### Installation

```powershell
# Clone the repository
git clone https://github.com/your-org/glsp-generator.git
cd glsp-generator

# Install dependencies
yarn install

# Set up global access
.\scripts\setup-global-access.ps1

# Install VSCode extension
.\scripts\install-vscode-extension.ps1
```

## 📦 Packages

This monorepo contains:
- **@glsp/generator** - Core GLSP generator library
- **@glsp/vscode-extension** - VSCode extension for convenient workflow

## 🎯 Usage

### Docker (Easiest - No Installation Required)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/johnholliday/glsp-generator:latest

# Generate VSIX from grammar
docker run --rm -v $(pwd):/workspace \
  ghcr.io/johnholliday/glsp-generator \
  generate /workspace/my-language.langium

# Run API server
docker run -d -p 51620:51620 --name glspgen \
  ghcr.io/johnholliday/glsp-generator \
  node dist/api-server.js
```

#### Docker Development Commands

```bash
# Authenticate with GitHub Container Registry (for pushing)
yarn docker:auth

# Build and run locally
yarn docker:dev

# Quick rebuild (skips dependency installation)
yarn docker:dev:quick

# View logs
yarn docker:logs

# Stop container
yarn docker:stop
```

See [Docker Documentation](packages/generator/DOCKER.md) and [GitHub Container Registry Guide](docs/GITHUB_CONTAINER_REGISTRY.md) for more details.

### VSCode Workflow (Recommended for Development)

1. Open any folder containing `.langium` files in VSCode
2. Right-click on a `.langium` file
3. Select from context menu:
   - **GLSP: Generate VSIX** - Create installable extension
   - **GLSP: Test VSIX** - Test in Extension Development Host
   - **GLSP: Generate Project Only** - Generate without packaging
   - **GLSP: Validate Grammar** - Check grammar syntax

### Command Line

```powershell
# Generate VSIX from grammar
glsp generate my-language.langium -o ./output

# Validate grammar
glsp validate my-language.langium

# Generate project only (no VSIX)
glsp generate my-language.langium --no-vsix

# Generate VS Code extension only (no Theia)
glsp generate my-language.langium --vsix-only
```

## 🛠️ Development

### Building

```powershell
# Build all packages
yarn build

# Build specific package
yarn workspace @glsp/generator build
yarn workspace @glsp/vscode-extension compile

# Watch mode
yarn dev
```

### Testing

```powershell
# Run all tests
yarn test

# Run with coverage
yarn test:coverage

# Watch mode
yarn test:watch
```

## 🐳 Docker Support

The GLSP Generator is available as a Docker container for easy deployment:

```bash
# Using docker-compose (recommended)
curl -O https://raw.githubusercontent.com/johnholliday/glsp-generator/main/docker-compose.publish.yml
docker-compose -f docker-compose.publish.yml up -d

# Access the API
curl http://localhost:3000/health
```

Available Docker tags:
- `latest` - Latest stable release  
- `2.1.171` - Specific version
- `2.1`, `2` - Auto-updating tags

See [Docker Publishing Guide](packages/generator/DOCKER-PUBLISHING.md) for maintainers.

## 📝 Grammar Annotations

The GLSP Generator leverages JSDoc-style annotations in Langium grammar files to provide fine-grained control over the visual representation and interactive behavior of your diagram elements. These annotations bridge the gap between your domain model (defined in Langium) and its graphical representation (rendered by GLSP/Sprotty).

### Why Grammar Annotations?

Traditional diagram generators require separate configuration files or complex programmatic setups to define how model elements should be visualized. The GLSP Generator's annotation system allows you to:

- **Co-locate visualization with structure**: Define how elements look right where you define what they are
- **Maintain single source of truth**: Your grammar file contains both the domain model and its visual representation
- **Enable rapid prototyping**: Quickly iterate on both model structure and visualization without switching contexts
- **Provide sensible defaults**: Use predefined attribute groups for common diagram types
- **Support incremental refinement**: Start with basic shapes and progressively add advanced features

> 📚 **For detailed parameter documentation and syntax examples, see the [Annotations Reference Guide](docs/ANNOTATIONS_REFERENCE.md)**

### Grammar-Level Annotations

These annotations apply to your entire diagram and establish the overall visual language and behavior patterns. They're placed as JSDoc comments before your grammar declaration and set the foundation for all diagram elements.

| Annotation | Description | Example |
|------------|-------------|---------|
| **@glsp-group** | Applies a predefined set of visual and behavioral defaults tailored for specific diagram types. Groups include comprehensive theming, layout algorithms, and interaction patterns optimized for different visualization needs. | `@glsp-group workflow` |
| **@glsp-layout** | Specifies the automatic layout algorithm used to arrange nodes. Supports various algorithms like hierarchical (elk-layered), force-directed (elk-stress), tree layouts, and more. Optional direction parameter controls flow. | `@glsp-layout elk-layered horizontal` |
| **@glsp-theme** | Defines the color scheme for your diagram. Accepts primary color for main elements, secondary for supporting elements, and background for the canvas. Colors propagate to nodes and edges unless overridden. | `@glsp-theme primary=#2563eb secondary=#64748b background=#f8fafc` |
| **@glsp-features** | Enables or configures diagram-wide interactive features. Controls auto-layout on changes, automatic connection creation, bendpoint editing for edges, routing strategies, grid snapping, and more. | `@glsp-features autoLayout=true routing=manhattan snapToGrid=true` |

### Node Annotations

Node annotations define how individual model elements are rendered as shapes in your diagram. These annotations transform your domain concepts into visual elements with specific appearances, behaviors, and connection capabilities.

| Annotation | Description | Example |
|------------|-------------|---------|
| **@glsp-node** | Marks an interface/rule as a visual node and assigns a unique type identifier used for styling and behavior. This is required for any element you want to appear as a shape in the diagram. | `@glsp-node process-task` |
| **@glsp-shape** | Determines the geometric shape used to render the node. Shapes range from basic (rectangle, circle) to specialized (diamond for decisions, hexagon for data stores). Custom shapes can use SVG paths. | `@glsp-shape diamond` |
| **@glsp-connectable** | Controls whether edges can connect to/from this node. Can be asymmetric (e.g., true false for source-only nodes). Essential for defining valid connection patterns in your domain. | `@glsp-connectable true false` |
| **@glsp-resizable** | Enables manual resizing of nodes by users. Useful for containers, compartments, or nodes with variable content. Works with layout-options to enforce constraints. | `@glsp-resizable true` |
| **@glsp-deletable** | Controls whether users can delete this node type. Useful for protecting essential elements or enforcing model constraints at the UI level. | `@glsp-deletable false` |
| **@glsp-moveable** | Determines if users can reposition nodes. Some diagrams benefit from fixed positions while others need full flexibility. Combines with layout algorithms. | `@glsp-moveable true` |
| **@glsp-style** | Provides fine-grained control over visual appearance including colors, borders, opacity, and effects. Supports CSS-like properties for maximum flexibility. | `@glsp-style fill=#e0f2fe stroke=#0284c7 strokeWidth=2 borderRadius=8` |
| **@glsp-port** | Defines connection points on nodes. Ports can be positioned (north, south, east, west, and corners), typed (input, output, inout), and support multiple connections. Critical for complex routing. | `@glsp-port north input`<br/>`@glsp-port south output multiple` |
| **@glsp-label** | Configures text labels for nodes including position relative to shape, editability for direct manipulation, and constraints like maximum width for text wrapping. | `@glsp-label position=center editable=true maxWidth=150` |
| **@glsp-icon** | Adds icons to nodes for better visual communication. Supports built-in icon sets or custom SVG paths. Icons can be positioned and sized relative to the node. | `@glsp-icon database` |
| **@glsp-layout-options** | Provides hints to layout algorithms about node sizing and importance. Includes minimum dimensions to prevent squashing and priority for hierarchical arrangements. | `@glsp-layout-options minWidth=120 minHeight=60 priority=1` |
| **@glsp-abstract** | Marks interfaces that shouldn't be instantiated directly but serve as base types for other elements. Useful for shared properties and polymorphic handling. | `@glsp-abstract true` |

### Edge Annotations

Edge annotations control how relationships between nodes are visualized. They define the appearance of connections and can convey different types of relationships through visual styling.

| Annotation | Description | Example |
|------------|-------------|---------|
| **@glsp-edge** | Identifies an interface/rule as a connection between nodes and assigns a type identifier. Required for any element that represents a relationship in your diagram. | `@glsp-edge data-flow` |
| **@glsp-style** | Controls the visual appearance of edges including color, thickness, dash patterns for different semantic meanings, and opacity for emphasis or de-emphasis. | `@glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray="5,5"` |
| **@glsp-label** | Configures text labels on edges. Position can be at the center of the edge, near the source, or near the target. Labels can be editable for properties like conditions or names. | `@glsp-label position=center editable=true` |
| **@glsp-routing** | Specifies how edges are routed between nodes. Options include straight lines (direct), orthogonal routing (manhattan), smooth curves (bezier), or multi-segment paths (polyline). | `@glsp-routing manhattan` |
| **@glsp-marker** | Adds arrow heads or other markers to edge endpoints. Supports various styles like arrows, diamonds, circles to indicate relationship direction and type. | `@glsp-marker target=arrow source=circle` |

### Predefined Attribute Groups

Attribute groups provide complete visual languages for common diagram types. When you specify a group, you get a coordinated set of colors, shapes, layouts, and behaviors designed for that diagram style.

| Group | Description | Best For | Included Settings |
|-------|-------------|----------|-------------------|
| **workflow** | Professional process and state diagrams with a blue theme. Emphasizes flow and sequence with clear visual hierarchy. | Business processes, state machines, approval flows | Blue color scheme, layered layout, rounded rectangles, directional ports |
| **dataflow** | Data pipeline visualizations with a green theme. Optimized for showing data transformation and movement. | ETL processes, data architectures, stream processing | Green theme, left-to-right layout, hexagonal sources, parallelogram processors |
| **architecture** | System and component diagrams with a purple theme. Focuses on structure and relationships. | Software architecture, system design, deployment diagrams | Purple theme, hierarchical layout, varied shapes for different component types |
| **hierarchy** | Tree and organizational structures with a teal theme. Emphasizes parent-child relationships. | Organization charts, taxonomies, file systems | Teal theme, tree layout, consistent shapes, top-down flow |
| **mathematical** | Graph and network visualizations with a dark theme. Designed for abstract relationships. | Network diagrams, dependency graphs, mathematical graphs | Dark theme, force-directed layout, simple shapes, emphasis on edges |
| **minimal** | Clean, minimalist diagrams with black and white theme. Focuses on content over decoration. | Prototypes, sketches, simple diagrams | Monochrome theme, basic shapes, simple layout, no decorations |

## 📖 Documentation

- [Annotations Reference Guide](docs/ANNOTATIONS_REFERENCE.md) - Detailed parameter documentation and syntax
- [Grammar Annotations Overview](docs/GRAMMAR_ANNOTATIONS.md) - Conceptual overview of the annotation system
- [Workflow Guide](docs/WORKFLOW_GUIDE.md) - Detailed usage instructions
- [VSCode Extension Design](docs/VSCODE_EXTENSION_DESIGN.md) - Extension architecture
- [Monorepo Migration Plan](docs/MONOREPO_MIGRATION_PLAN.md) - Technical details
- [Docker Setup](packages/generator/DOCKER.md) - Docker usage and deployment
- [Docker Publishing](packages/generator/DOCKER-PUBLISHING.md) - How to publish Docker images

## 💡 Example Grammars with Annotations

### Basic Example
A minimal example showing basic GLSP annotations:

```langium
/**
 * @glsp-group minimal
 * @glsp-layout elk-layered
 */
grammar BasicDiagram

interface Element {
    name: string
}

/**
 * @glsp-node basic-node
 * @glsp-shape rectangle
 * @glsp-style fill=#e3f2fd stroke=#1976d2
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-port north input
 * @glsp-port south output
 */
interface Node extends Element {
    x: number
    y: number
    width?: number
    height?: number
}

/**
 * @glsp-edge basic-edge
 * @glsp-style stroke=#666 strokeWidth=2
 */
interface Edge extends Element {
    source: @Node
    target: @Node
}

type DiagramElement = Node | Edge
```

### Workflow Example
A workflow language with process nodes, gateways, and events:

```langium
/**
 * @glsp-group workflow
 * @glsp-layout elk-layered horizontal
 * @glsp-theme primary=#2563eb secondary=#64748b background=#f8fafc
 * @glsp-features autoLayout=true autoConnect=true bendpoints=true routing=manhattan
 */
grammar WorkflowLanguage

/**
 * @glsp-node process-node
 * @glsp-shape rectangle
 * @glsp-style fill=#e0f2fe stroke=#0284c7 strokeWidth=2 borderRadius=4
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-port north input
 * @glsp-port south output
 * @glsp-port east output
 * @glsp-port west input
 * @glsp-label position=center editable=true
 * @glsp-icon process
 */
interface Process {
    name: string
    description?: string
    type: ProcessType
}

/**
 * @glsp-node gateway-node
 * @glsp-shape diamond
 * @glsp-style fill=#fef3c7 stroke=#f59e0b strokeWidth=2
 * @glsp-connectable true
 * @glsp-resizable false
 * @glsp-port north input
 * @glsp-port south output multiple
 * @glsp-port east output multiple
 * @glsp-port west input
 * @glsp-label position=bottom
 * @glsp-icon gateway
 */
interface Gateway {
    type: GatewayType
    condition?: string
}

/**
 * @glsp-edge transition-edge
 * @glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray=none
 * @glsp-label position=center editable=true
 */
interface Transition {
    source: @Process | @Gateway | @Event
    target: @Process | @Gateway | @Event
    condition?: string
}

type ProcessType = 'manual' | 'automated' | 'service' | 'script'
type GatewayType = 'exclusive' | 'parallel' | 'inclusive' | 'event-based'
type EventType = 'start' | 'end' | 'intermediate' | 'boundary'
```

### Dataflow Example
A dataflow pipeline language with different processing stages:

```langium
/**
 * @glsp-group dataflow
 * @glsp-layout elk-layered LR
 * @glsp-theme primary=#10b981 secondary=#6ee7b7 background=#f0fdf4
 * @glsp-features autoLayout=true autoConnect=true routing=orthogonal
 */
grammar DataflowPipeline

/**
 * @glsp-node source-node
 * @glsp-shape hexagon
 * @glsp-style fill=#d1fae5 stroke=#059669 strokeWidth=2
 * @glsp-connectable false true
 * @glsp-resizable true
 * @glsp-port east output multiple
 * @glsp-label position=center
 * @glsp-icon database
 */
interface DataSource {
    name: string
    type: SourceType
    format: DataFormat
}

/**
 * @glsp-node processor-node
 * @glsp-shape parallelogram
 * @glsp-style fill=#e0e7ff stroke=#6366f1 strokeWidth=2
 * @glsp-connectable true
 * @glsp-port west input
 * @glsp-port east output
 * @glsp-port south output
 * @glsp-label position=center
 * @glsp-icon processor
 * @glsp-layout-options minWidth=120 minHeight=60
 */
interface Processor {
    name: string
    operation: string
    parameters?: Parameter[]
}

/**
 * @glsp-edge dataflow-edge
 * @glsp-style stroke=#6b7280 strokeWidth=3 opacity=0.8
 * @glsp-label position=center
 */
interface DataFlow {
    source: @DataSource | @Processor | @Sink
    target: @Processor | @Sink
    schema?: string
}

type SourceType = 'database' | 'file' | 'stream' | 'api'
type DataFormat = 'json' | 'csv' | 'parquet' | 'avro' | 'xml'
```

### Comprehensive Example
Demonstrating all available shapes and annotations:

```langium
/**
 * @glsp-group architecture
 * @glsp-layout elk-stress
 * @glsp-theme primary=#8b5cf6 secondary=#c4b5fd background=#faf5ff
 * @glsp-features autoLayout=true autoConnect=true bendpoints=true routing=polyline snapToGrid=true
 */
grammar ComprehensiveDiagram

/**
 * @glsp-abstract true
 */
interface BaseElement {
    id: string
    metadata?: string
}

/**
 * @glsp-node rect-node
 * @glsp-shape rectangle
 * @glsp-style fill=#f3e8ff stroke=#7c3aed strokeWidth=2
 * @glsp-port north input
 * @glsp-port north-east input
 * @glsp-port east inout
 * @glsp-port south-east output
 * @glsp-port south output
 * @glsp-port south-west output
 * @glsp-port west inout
 * @glsp-port north-west input
 */
interface RectangleNode extends BaseElement {
    name: string
}

/**
 * @glsp-node custom-node
 * @glsp-shape custom
 * @glsp-style fill=#fbbf24 stroke=#f59e0b strokeWidth=3 opacity=0.9 borderRadius=8
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-moveable true
 * @glsp-label position=top editable=true maxWidth=200
 * @glsp-icon custom.svg
 * @glsp-layout-options minWidth=100 minHeight=100 priority=10
 */
interface CustomShapeNode extends BaseElement {
    customProperty: string
}

/**
 * @glsp-edge custom-edge
 * @glsp-style stroke=#dc2626 strokeWidth=2 strokeDasharray="5,5" opacity=0.7
 * @glsp-label position=source editable=false
 */
interface CustomEdge extends BaseElement {
    source: @BaseElement
    target: @BaseElement
    edgeType: EdgeStyle
}

type EdgeStyle = 'solid' | 'dashed' | 'dotted' | 'bold'
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

This project is proprietary software. See LICENSE for details.