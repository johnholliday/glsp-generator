# Grammar Annotations Reference

This document describes the JSDoc-style annotations that can be used in Langium grammar files to configure GLSP diagram generation.

## Table of Contents

1. [Overview](#overview)
2. [Grammar-Level Annotations](#grammar-level-annotations)
3. [Rule-Level Annotations](#rule-level-annotations)
4. [Attribute Groups](#attribute-groups)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

## Overview

The GLSP Generator supports JSDoc-style comments with `@glsp-*` annotations to configure visual rendering and behavior of diagram elements. These annotations are placed in block comments (`/** */`) before grammar or rule definitions.

### Basic Syntax

```langium
/**
 * @glsp-<annotation> <value>
 */
```

## Grammar-Level Annotations

These annotations are placed before the `grammar` keyword and apply to the entire diagram.

### @glsp-group

Applies a predefined attribute group with sensible defaults.

```langium
/**
 * @glsp-group workflow|dataflow|architecture|hierarchy|mathematical|minimal
 */
grammar MyLanguage
```

### @glsp-layout

Configures the automatic layout algorithm and direction.

```langium
/**
 * @glsp-layout <algorithm> [direction]
 * 
 * Algorithms: layered, force, stress, circular, radial, tree, random
 * Directions: TB, BT, LR, RL, RADIAL_OUT, RADIAL_IN
 */
```

Example:
```langium
/**
 * @glsp-layout layered TB
 */
```

### @glsp-theme

Sets the color theme for the diagram.

```langium
/**
 * @glsp-theme primary=#2563eb secondary=#64748b background=#f8fafc surface=#ffffff
 */
```

### @glsp-features

Configures diagram features.

```langium
/**
 * @glsp-features autoLayout=true autoConnect=true bendpoints=true routing=manhattan
 */
```

## Rule-Level Annotations

These annotations are placed before parser rule definitions and configure individual element types.

### @glsp-node

Defines the node type identifier.

```langium
/**
 * @glsp-node <node-type>
 */
ProcessStep:
    'process' name=ID;
```

### @glsp-shape

Sets the shape for the node.

```langium
/**
 * @glsp-shape rectangle|circle|diamond|hexagon|ellipse|roundedRectangle|parallelogram|trapezoid|custom
 */
```

### @glsp-connectable

Enables/disables connection capability.

```langium
/**
 * @glsp-connectable true|false
 */
```

### @glsp-resizable

Enables/disables resize capability.

```langium
/**
 * @glsp-resizable true|false
 */
```

### @glsp-deletable

Enables/disables delete capability.

```langium
/**
 * @glsp-deletable true|false
 */
```

### @glsp-style

Configures visual styling.

```langium
/**
 * @glsp-style fill=#color stroke=#color strokeWidth=number opacity=number borderRadius=number
 */
```

Example:
```langium
/**
 * @glsp-style fill=#2563eb stroke=#1e40af strokeWidth=2 opacity=0.9 borderRadius=8
 */
```

### @glsp-port

Defines connection ports.

```langium
/**
 * @glsp-port <position> <type> [multiple]
 * 
 * Positions: north, south, east, west, north-east, north-west, south-east, south-west
 * Types: input, output, bidirectional
 */
```

Examples:
```langium
/**
 * @glsp-port north input
 * @glsp-port south output multiple
 * @glsp-port east bidirectional
 */
```

### @glsp-label

Configures label display.

```langium
/**
 * @glsp-label position=center editable=true maxWidth=200
 * 
 * Positions: center, top, bottom, left, right, top-left, top-right, bottom-left, bottom-right
 */
```

### @glsp-icon

Adds an icon to the node.

```langium
/**
 * @glsp-icon path=/icons/process.svg
 */
```

### @glsp-layout-options

Sets element-specific layout constraints.

```langium
/**
 * @glsp-layout-options minWidth=100 minHeight=50 priority=1
 */
```

## Attribute Groups

Attribute groups provide predefined configurations for common diagram types.

### workflow

Best for process and state diagrams.

- **Theme**: Blue primary (#2563eb)
- **Layout**: Layered top-to-bottom
- **Shapes**: Rounded rectangles
- **Features**: Auto-layout, auto-connect, bendpoints
- **Routing**: Manhattan

### dataflow

Best for data processing pipelines.

- **Theme**: Green primary (#16a34a)
- **Layout**: Layered left-to-right
- **Shapes**: Rectangles
- **Features**: Auto-layout, bendpoints
- **Routing**: Polyline

### architecture

Best for system architecture diagrams.

- **Theme**: Purple primary (#7c3aed)
- **Layout**: Layered top-to-bottom
- **Shapes**: Rectangles with shadows
- **Features**: Auto-layout, containment
- **Routing**: Direct

### hierarchy

Best for tree and organizational charts.

- **Theme**: Teal primary (#0f766e)
- **Layout**: Tree top-to-bottom
- **Shapes**: Ellipses
- **Features**: Auto-layout, containment
- **Routing**: Direct

### mathematical

Best for graph and network diagrams.

- **Theme**: Dark primary (#1e293b)
- **Layout**: Force-directed
- **Shapes**: Circles
- **Features**: Free movement
- **Routing**: Direct

### minimal

Basic diagram support with minimal styling.

- **Theme**: Black and white
- **Layout**: Layered
- **Shapes**: Rectangles
- **Features**: Basic
- **Routing**: Direct

## Examples

### Complete Workflow Example

```langium
/**
 * @glsp-group workflow
 * @glsp-layout layered TB
 * @glsp-theme primary=#2563eb secondary=#64748b
 */
grammar WorkflowLanguage

/**
 * @glsp-node process
 * @glsp-shape roundedRectangle
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-deletable true
 * @glsp-style fill=#2563eb stroke=#1e40af strokeWidth=2
 * @glsp-port north input
 * @glsp-port south output multiple
 */
ProcessStep:
    'process' name=ID '{'
        tasks+=Task*
    '}';

/**
 * @glsp-node task
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-style fill=#93c5fd stroke=#60a5fa
 * @glsp-label position=center editable=true
 */
Task:
    'task' name=ID description=STRING?;

/**
 * @glsp-node gateway
 * @glsp-shape diamond
 * @glsp-connectable true
 * @glsp-style fill=#fbbf24 stroke=#f59e0b
 * @glsp-port north input
 * @glsp-port east output
 * @glsp-port south output
 */
Gateway:
    'gateway' condition=STRING;
```

### Dataflow Pipeline Example

```langium
/**
 * @glsp-group dataflow
 */
grammar DataflowLanguage

/**
 * @glsp-node source
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-style fill=#22c55e stroke=#16a34a
 * @glsp-port east output multiple
 * @glsp-icon path=/icons/database.svg
 */
DataSource:
    'source' name=ID type=SourceType;

/**
 * @glsp-node processor
 * @glsp-shape hexagon
 * @glsp-connectable true
 * @glsp-style fill=#3b82f6 stroke=#2563eb
 * @glsp-port west input
 * @glsp-port east output
 */
Processor:
    'processor' name=ID operation=STRING;

/**
 * @glsp-node sink
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-style fill=#ef4444 stroke=#dc2626
 * @glsp-port west input multiple
 */
DataSink:
    'sink' name=ID format=OutputFormat;
```

### Architecture Diagram Example

```langium
/**
 * @glsp-group architecture
 * @glsp-layout layered TB
 */
grammar ArchitectureLanguage

/**
 * @glsp-node component
 * @glsp-shape rectangle
 * @glsp-connectable true
 * @glsp-resizable true
 * @glsp-style fill=#f3f4f6 stroke=#6b7280 strokeWidth=2 borderRadius=0
 * @glsp-layout-options minWidth=200 minHeight=100
 */
Component:
    'component' name=ID '{'
        provides+=Interface*
        requires+=Interface*
    '}';

/**
 * @glsp-node service
 * @glsp-shape roundedRectangle
 * @glsp-connectable true
 * @glsp-style fill=#ddd6fe stroke=#9333ea strokeWidth=2
 * @glsp-port north input
 * @glsp-port south output
 */
Service:
    'service' name=ID endpoint=STRING;
```

### Custom Styling Example

```langium
grammar CustomDiagram

/**
 * @glsp-node custom
 * @glsp-shape circle
 * @glsp-style fill=#ffffff stroke=#000000 strokeWidth=3 strokeDasharray=5,5
 * @glsp-connectable true
 * @glsp-port north input
 * @glsp-port east output
 * @glsp-port south output
 * @glsp-port west input
 */
CustomNode:
    'node' name=ID;
```

## Best Practices

### 1. Use Attribute Groups

Start with an attribute group that matches your diagram type:

```langium
/**
 * @glsp-group workflow
 */
grammar MyWorkflow
```

### 2. Override Only What You Need

Attribute groups provide good defaults. Only override specific properties:

```langium
/**
 * @glsp-group dataflow
 */
grammar MyDataflow

/**
 * @glsp-node special
 * @glsp-shape diamond  // Override just the shape
 */
SpecialNode: 'special' name=ID;
```

### 3. Consistent Color Scheme

Use the theme annotation to maintain consistency:

```langium
/**
 * @glsp-theme primary=#0066cc secondary=#666666
 */
```

### 4. Meaningful Node Types

Use descriptive node type identifiers:

```langium
/**
 * @glsp-node decision-gateway  // Better than "node1"
 */
```

### 5. Port Naming Convention

Be consistent with port positions and types:

```langium
/**
 * @glsp-port north input      // Inputs from top
 * @glsp-port south output     // Outputs from bottom
 */
```

### 6. Validation

The generator validates annotations. Common errors:
- Invalid color formats (use hex colors like #123456)
- Unknown shapes or layout algorithms
- Invalid port positions or types

### 7. Incremental Enhancement

Start simple and add annotations as needed:

1. Begin with just `@glsp-node` annotations
2. Add `@glsp-shape` for visual distinction
3. Configure `@glsp-connectable` for connection rules
4. Fine-tune with `@glsp-style` for branding

## Migration from Legacy Options

If you were using CLI flags like `--workflow`, migrate to annotations:

**Before:**
```bash
glsp generate grammar.langium --workflow
```

**After:**
```langium
/**
 * @glsp-group workflow
 */
grammar MyGrammar
```

## Troubleshooting

### Annotations Not Working

1. Ensure comments use `/** */` format (not `//` or `/* */`)
2. Place comments immediately before the grammar or rule
3. Check for typos in annotation names (must start with `@glsp-`)
4. Validate color formats (hex colors need # prefix)

### Validation Errors

Run with `--validate-metadata` to see detailed error messages:

```bash
glsp generate grammar.langium --validate-metadata
```

### Override Not Working

Annotations follow this precedence:
1. Rule-level annotations (highest priority)
2. Grammar-level annotations
3. Attribute group defaults
4. System defaults (lowest priority)