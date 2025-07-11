# GLSP Annotation Examples for Langium Grammars

This directory contains examples of how to use JSDoc-style annotations in Langium grammar files to configure GLSP diagram generation.

## Overview

The GLSP Generator supports JSDoc-style comments with `@glsp-*` annotations to configure visual rendering and behavior of diagram elements. These annotations are placed in block comments (`/** */`) before grammar or rule definitions.

## Example Files

### 1. `example-basic-annotations.langium`
A minimal example showing the basic usage of GLSP annotations:
- Grammar-level `@glsp-group` and `@glsp-layout`
- Basic node annotations with `@glsp-node`, `@glsp-shape`, and `@glsp-style`
- Simple edge annotations

### 2. `example-workflow-with-annotations.langium`
A complete workflow language example demonstrating:
- Workflow-specific attribute group (`@glsp-group workflow`)
- Process nodes with ports (`@glsp-port`)
- Gateways with diamond shapes
- Start/End events with custom icons
- Transitions with labels

### 3. `example-dataflow-with-annotations.langium`
A dataflow pipeline language showing:
- Dataflow-specific styling (`@glsp-group dataflow`)
- Different node shapes (hexagon, parallelogram, trapezoid)
- Multiple port configurations
- Custom icons and labels

### 4. `example-all-annotations.langium`
A comprehensive example demonstrating all available annotations:
- All shape types (rectangle, circle, diamond, hexagon, ellipse, etc.)
- All port positions (north, south, east, west, and diagonal positions)
- Complete style options (fill, stroke, opacity, borderRadius, etc.)
- Layout options and constraints
- Abstract types with `@glsp-abstract`

## Available Annotations

### Grammar-Level Annotations

```langium
/**
 * @glsp-group workflow|dataflow|architecture|hierarchy|mathematical|minimal
 * @glsp-layout <algorithm> [direction]
 * @glsp-theme primary=#color secondary=#color background=#color
 * @glsp-features autoLayout=true autoConnect=true bendpoints=true routing=manhattan
 */
grammar MyLanguage
```

### Rule-Level Annotations

```langium
/**
 * @glsp-node <node-type-id>
 * @glsp-shape rectangle|circle|diamond|hexagon|ellipse|roundedRectangle|parallelogram|trapezoid|custom
 * @glsp-connectable true|false
 * @glsp-resizable true|false
 * @glsp-deletable true|false
 * @glsp-moveable true|false
 * @glsp-style fill=#color stroke=#color strokeWidth=number opacity=number borderRadius=number
 * @glsp-port <position> <type> [multiple]
 * @glsp-label position=center|top|bottom|left|right editable=true|false maxWidth=number
 * @glsp-icon path=/path/to/icon.svg
 * @glsp-layout-options minWidth=number minHeight=number priority=number
 * @glsp-abstract true
 */
MyRule: ...
```

### Edge Annotations

```langium
/**
 * @glsp-edge <edge-type-id>
 * @glsp-style stroke=#color strokeWidth=number strokeDasharray=pattern opacity=number
 * @glsp-label position=center|source|target editable=true|false
 */
Connection: ...
```

## Attribute Groups

Predefined attribute groups provide sensible defaults for common diagram types:

- **workflow**: Process and state diagrams (blue theme, layered layout)
- **dataflow**: Data pipelines (green theme, left-to-right layout)
- **architecture**: System diagrams (purple theme, hierarchical layout)
- **hierarchy**: Tree structures (teal theme, tree layout)
- **mathematical**: Graph diagrams (dark theme, force-directed layout)
- **minimal**: Basic diagrams (black/white theme, simple layout)

## Usage

1. Add JSDoc-style comments before your grammar and rules
2. Use `@glsp-*` annotations to configure visual properties
3. Generate the GLSP extension:

```bash
glsp generate <grammar-file> --output ./my-extension
```

## Best Practices

1. Start with an attribute group (`@glsp-group`) for good defaults
2. Only override specific properties as needed
3. Use meaningful node type identifiers
4. Keep port configurations consistent
5. Test visual results iteratively

## Notes

- All annotations are optional - the generator provides sensible defaults
- Colors should be in hex format (#RRGGBB)
- Multiple annotations of the same type (e.g., multiple `@glsp-port`) are supported
- Abstract types (with `@glsp-abstract true`) are not rendered but can be referenced

For more details, see the [Grammar Annotations Reference](docs/GRAMMAR_ANNOTATIONS.md).