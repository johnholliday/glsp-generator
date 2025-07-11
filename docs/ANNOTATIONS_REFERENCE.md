# GLSP Annotations Reference

This document provides a complete reference for all GLSP annotations, including their parameters, syntax, and usage examples.

## Table of Contents

- [Grammar-Level Annotations](#grammar-level-annotations)
  - [@glsp-group](#glsp-group)
  - [@glsp-layout](#glsp-layout)
  - [@glsp-theme](#glsp-theme)
  - [@glsp-features](#glsp-features)
- [Node Annotations](#node-annotations)
  - [@glsp-node](#glsp-node)
  - [@glsp-shape](#glsp-shape)
  - [@glsp-connectable](#glsp-connectable)
  - [@glsp-resizable](#glsp-resizable)
  - [@glsp-deletable](#glsp-deletable)
  - [@glsp-moveable](#glsp-moveable)
  - [@glsp-style](#glsp-style)
  - [@glsp-port](#glsp-port)
  - [@glsp-label](#glsp-label)
  - [@glsp-icon](#glsp-icon)
  - [@glsp-layout-options](#glsp-layout-options)
  - [@glsp-abstract](#glsp-abstract)
- [Edge Annotations](#edge-annotations)
  - [@glsp-edge](#glsp-edge)
  - [@glsp-style (edges)](#glsp-style-edges)
  - [@glsp-label (edges)](#glsp-label-edges)
  - [@glsp-routing](#glsp-routing)
  - [@glsp-marker](#glsp-marker)

## Grammar-Level Annotations

### @glsp-group

Applies a predefined set of visual and behavioral defaults for specific diagram types.

**Syntax:** `@glsp-group <group-name>`

**Parameters:**
- `group-name` (required): One of the predefined group names

**Valid Values:**
- `workflow` - Process and state diagrams with blue theme
- `dataflow` - Data pipeline visualizations with green theme
- `architecture` - System diagrams with purple theme
- `hierarchy` - Tree structures with teal theme
- `mathematical` - Graph visualizations with dark theme
- `minimal` - Clean diagrams with monochrome theme

**Example:**
```langium
/**
 * @glsp-group workflow
 */
grammar ProcessDiagram
```

### @glsp-layout

Specifies the automatic layout algorithm and direction for arranging nodes.

**Syntax:** `@glsp-layout <algorithm> [direction]`

**Parameters:**
- `algorithm` (required): The layout algorithm to use
- `direction` (optional): The flow direction for applicable algorithms

**Valid Algorithms:**
- `elk-layered` - Hierarchical layout (supports direction)
- `elk-stress` - Force-directed layout
- `elk-tree` - Tree layout (supports direction)
- `elk-radial` - Radial/circular layout
- `elk-box` - Box packing layout
- `elk-rectpacking` - Rectangle packing
- `dagre` - Directed graph layout (supports direction)
- `random` - Random placement
- `manual` - No automatic layout

**Valid Directions:**
- `horizontal`, `LR` (left-to-right)
- `vertical`, `TB` (top-to-bottom)
- `RL` (right-to-left)
- `BT` (bottom-to-top)

**Examples:**
```langium
/**
 * @glsp-layout elk-layered horizontal
 * @glsp-layout dagre TB
 * @glsp-layout elk-stress
 */
```

### @glsp-theme

Defines the color scheme for the diagram.

**Syntax:** `@glsp-theme primary=<color> secondary=<color> background=<color> [accent=<color>] [error=<color>] [warning=<color>] [success=<color>]`

**Parameters:**
- `primary` (required): Main color for primary elements
- `secondary` (required): Color for secondary elements
- `background` (required): Canvas background color
- `accent` (optional): Accent color for highlights
- `error` (optional): Color for error states
- `warning` (optional): Color for warning states
- `success` (optional): Color for success states

**Color Formats:**
- Hex colors: `#rgb`, `#rrggbb`, `#rrggbbaa`
- Named colors: `red`, `blue`, `green`, etc.
- RGB/RGBA: `rgb(255,0,0)`, `rgba(255,0,0,0.5)`

**Example:**
```langium
/**
 * @glsp-theme primary=#2563eb secondary=#64748b background=#f8fafc accent=#8b5cf6
 */
```

### @glsp-features

Enables or configures diagram-wide interactive features.

**Syntax:** `@glsp-features <feature>=<value> [feature2=value2 ...]`

**Available Features:**
- `autoLayout` (boolean): Automatically layout on changes
- `autoConnect` (boolean): Enable automatic connection creation
- `bendpoints` (boolean): Allow edge bendpoint editing
- `routing` (string): Default edge routing strategy
- `snapToGrid` (boolean): Snap elements to grid
- `gridSize` (number): Grid size in pixels (default: 10)
- `showGrid` (boolean): Display grid lines
- `animation` (boolean): Enable animations
- `zoom` (boolean): Enable zoom controls
- `pan` (boolean): Enable panning
- `minimap` (boolean): Show minimap
- `toolbar` (boolean): Show toolbar
- `contextMenu` (boolean): Enable context menus
- `clipboard` (boolean): Enable copy/paste
- `undo` (boolean): Enable undo/redo

**Example:**
```langium
/**
 * @glsp-features autoLayout=true routing=manhattan snapToGrid=true gridSize=20
 */
```

## Node Annotations

### @glsp-node

Marks an interface/rule as a visual node with a unique type identifier.

**Syntax:** `@glsp-node <node-type-id>`

**Parameters:**
- `node-type-id` (required): Unique identifier for the node type (kebab-case recommended)

**Constraints:**
- Must be unique within the grammar
- Should use kebab-case naming convention
- Used for CSS styling and behavior targeting

**Example:**
```langium
/**
 * @glsp-node process-task
 */
interface ProcessTask {
    name: string
}
```

### @glsp-shape

Determines the geometric shape used to render the node.

**Syntax:** `@glsp-shape <shape-type> [width=<number>] [height=<number>]`

**Parameters:**
- `shape-type` (required): The shape to use
- `width` (optional): Default width in pixels
- `height` (optional): Default height in pixels

**Valid Shapes:**
- `rectangle` - Basic rectangle
- `roundedRectangle` - Rectangle with rounded corners
- `circle` - Perfect circle
- `ellipse` - Oval shape
- `diamond` - Diamond/rhombus shape
- `hexagon` - Six-sided polygon
- `octagon` - Eight-sided polygon
- `parallelogram` - Slanted rectangle
- `trapezoid` - Trapezoid shape
- `triangle` - Triangle pointing up
- `pentagon` - Five-sided polygon
- `star` - Star shape
- `cylinder` - Database cylinder shape
- `cloud` - Cloud shape
- `custom` - Custom SVG path

**Examples:**
```langium
/**
 * @glsp-shape diamond
 * @glsp-shape rectangle width=150 height=80
 * @glsp-shape custom path="M 0,0 L 100,0 L 100,50 L 50,100 L 0,50 Z"
 */
```

### @glsp-connectable

Controls whether edges can connect to/from this node.

**Syntax:** `@glsp-connectable <source> [target]`

**Parameters:**
- `source` (required): Can edges originate from this node? (true/false)
- `target` (optional): Can edges terminate at this node? (true/false, defaults to source value)

**Examples:**
```langium
/**
 * @glsp-connectable true        // Can be both source and target
 * @glsp-connectable true false  // Can only be source
 * @glsp-connectable false true  // Can only be target
 * @glsp-connectable false       // Cannot be connected
 */
```

### @glsp-resizable

Enables manual resizing of nodes by users.

**Syntax:** `@glsp-resizable <enabled> [handles=<positions>]`

**Parameters:**
- `enabled` (required): true/false
- `handles` (optional): Comma-separated list of resize handle positions

**Valid Handle Positions:**
- `n`, `north` - Top center
- `ne`, `north-east` - Top right
- `e`, `east` - Right center
- `se`, `south-east` - Bottom right
- `s`, `south` - Bottom center
- `sw`, `south-west` - Bottom left
- `w`, `west` - Left center
- `nw`, `north-west` - Top left
- `all` - All handles (default)

**Example:**
```langium
/**
 * @glsp-resizable true handles=se,sw,ne,nw  // Only corner handles
 */
```

### @glsp-deletable

Controls whether users can delete this node type.

**Syntax:** `@glsp-deletable <enabled>`

**Parameters:**
- `enabled` (required): true/false

**Example:**
```langium
/**
 * @glsp-deletable false  // Prevent deletion of critical nodes
 */
```

### @glsp-moveable

Determines if users can reposition nodes.

**Syntax:** `@glsp-moveable <enabled> [constraint=<type>]`

**Parameters:**
- `enabled` (required): true/false
- `constraint` (optional): Movement constraint type

**Valid Constraints:**
- `none` - Free movement (default)
- `horizontal` - Only horizontal movement
- `vertical` - Only vertical movement
- `grid` - Snap to grid increments
- `parent` - Confined within parent bounds

**Example:**
```langium
/**
 * @glsp-moveable true constraint=grid
 */
```

### @glsp-style

Provides fine-grained control over visual appearance.

**Syntax:** `@glsp-style <property>=<value> [property2=value2 ...]`

**Available Properties:**
- `fill` - Fill color
- `stroke` - Border color
- `strokeWidth` - Border width in pixels
- `strokeDasharray` - Dash pattern (e.g., "5,5")
- `opacity` - Overall opacity (0-1)
- `fillOpacity` - Fill opacity (0-1)
- `strokeOpacity` - Stroke opacity (0-1)
- `borderRadius` - Corner radius for rounded rectangles
- `shadow` - Drop shadow (e.g., "2px 2px 4px rgba(0,0,0,0.2)")
- `gradient` - Gradient type (linear/radial)
- `gradientStart` - Gradient start color
- `gradientEnd` - Gradient end color
- `pattern` - Fill pattern (dots/lines/cross)
- `fontSize` - Text size in pixels
- `fontFamily` - Font family
- `fontWeight` - Font weight (normal/bold/100-900)
- `textAlign` - Text alignment (left/center/right)

**Example:**
```langium
/**
 * @glsp-style fill=#e0f2fe stroke=#0284c7 strokeWidth=2 borderRadius=8 shadow="2px 2px 4px rgba(0,0,0,0.1)"
 */
```

### @glsp-port

Defines connection points on nodes.

**Syntax:** `@glsp-port <position> <type> [id=<name>] [multiple] [hidden]`

**Parameters:**
- `position` (required): Port location on the node
- `type` (required): Port connection type
- `id` (optional): Unique identifier for the port
- `multiple` (optional): Allow multiple connections
- `hidden` (optional): Hide port visualization

**Valid Positions:**
- Cardinal: `north`, `south`, `east`, `west`
- Corners: `north-east`, `north-west`, `south-east`, `south-west`
- Relative: `top`, `bottom`, `left`, `right`
- Numeric: `0.25,0` (relative x,y coordinates)

**Valid Types:**
- `input` - Can only receive connections
- `output` - Can only send connections
- `inout` - Can both send and receive

**Examples:**
```langium
/**
 * @glsp-port north input id=in1
 * @glsp-port south output multiple
 * @glsp-port 0.75,0.5 inout hidden
 */
```

### @glsp-label

Configures text labels for nodes.

**Syntax:** `@glsp-label position=<position> [editable=<boolean>] [property=<name>] [maxWidth=<number>] [truncate=<boolean>] [wrap=<boolean>]`

**Parameters:**
- `position` (required): Label position relative to node
- `editable` (optional): Allow inline editing (default: false)
- `property` (optional): Property to display (default: "name")
- `maxWidth` (optional): Maximum width before wrapping/truncation
- `truncate` (optional): Truncate with ellipsis (default: false)
- `wrap` (optional): Word wrap long text (default: true)

**Valid Positions:**
- `center` - Inside node center
- `top` - Above node
- `bottom` - Below node
- `left` - Left of node
- `right` - Right of node
- `top-left`, `top-right` - Corner positions
- `bottom-left`, `bottom-right` - Corner positions

**Example:**
```langium
/**
 * @glsp-label position=center editable=true maxWidth=150 wrap=true
 */
```

### @glsp-icon

Adds icons to nodes for better visual communication.

**Syntax:** `@glsp-icon <icon-ref> [position=<position>] [size=<number>]`

**Parameters:**
- `icon-ref` (required): Icon reference (name or path)
- `position` (optional): Icon position within node
- `size` (optional): Icon size in pixels

**Icon References:**
- Built-in icons: `database`, `server`, `cloud`, `user`, `folder`, `file`, `gear`, `warning`, `error`, `info`, `check`, `lock`, `unlock`, `link`, `unlink`
- File path: `path=/icons/custom.svg`
- URL: `url=https://example.com/icon.svg`
- Data URI: `data:image/svg+xml;base64,...`

**Valid Positions:**
- `center` - Center of node
- `top-left`, `top-right` - Corners
- `bottom-left`, `bottom-right` - Corners
- `before-label` - Before the label
- `after-label` - After the label

**Example:**
```langium
/**
 * @glsp-icon database position=top-left size=24
 * @glsp-icon path=/assets/process.svg
 */
```

### @glsp-layout-options

Provides hints to layout algorithms about node sizing and importance.

**Syntax:** `@glsp-layout-options <option>=<value> [option2=value2 ...]`

**Available Options:**
- `minWidth` - Minimum width in pixels
- `minHeight` - Minimum height in pixels
- `maxWidth` - Maximum width in pixels
- `maxHeight` - Maximum height in pixels
- `preferredWidth` - Preferred width if flexible
- `preferredHeight` - Preferred height if flexible
- `priority` - Layout priority (higher = more important)
- `margin` - Margin around node (single value or "top,right,bottom,left")
- `padding` - Internal padding (single value or "top,right,bottom,left")
- `aspectRatio` - Maintain aspect ratio (e.g., "16:9")
- `alignment` - Alignment within container (top/middle/bottom, left/center/right)
- `expandable` - Can expand to fill space (true/false)

**Example:**
```langium
/**
 * @glsp-layout-options minWidth=100 minHeight=60 priority=10 margin=10 aspectRatio=16:9
 */
```

### @glsp-abstract

Marks interfaces that shouldn't be instantiated directly.

**Syntax:** `@glsp-abstract <boolean>`

**Parameters:**
- `boolean` (required): true to mark as abstract

**Example:**
```langium
/**
 * @glsp-abstract true
 */
interface BaseElement {
    id: string
    name: string
}
```

## Edge Annotations

### @glsp-edge

Identifies an interface/rule as a connection between nodes.

**Syntax:** `@glsp-edge <edge-type-id>`

**Parameters:**
- `edge-type-id` (required): Unique identifier for the edge type

**Example:**
```langium
/**
 * @glsp-edge data-flow
 */
interface DataFlow {
    source: @Node
    target: @Node
}
```

### @glsp-style (edges)

Controls the visual appearance of edges.

**Syntax:** `@glsp-style <property>=<value> [property2=value2 ...]`

**Edge-Specific Properties:**
- `stroke` - Line color
- `strokeWidth` - Line width in pixels
- `strokeDasharray` - Dash pattern (e.g., "5,5" for dashed, "2,8" for dotted)
- `strokeLinecap` - Line end style (butt/round/square)
- `strokeLinejoin` - Line join style (miter/round/bevel)
- `opacity` - Overall opacity (0-1)
- `animated` - Animated dashes (true/false)
- `animationSpeed` - Animation speed (slow/normal/fast)
- `gradient` - Apply gradient along edge (true/false)
- `shadow` - Drop shadow
- `glow` - Glow effect (true/false)
- `curvature` - Curve amount for bezier edges (0-1)

**Example:**
```langium
/**
 * @glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray="5,5" animated=true
 */
```

### @glsp-label (edges)

Configures text labels on edges.

**Syntax:** `@glsp-label position=<position> [editable=<boolean>] [property=<name>] [offset=<number>] [rotate=<boolean>]`

**Parameters:**
- `position` (required): Label position on edge
- `editable` (optional): Allow inline editing
- `property` (optional): Property to display
- `offset` (optional): Distance from edge line
- `rotate` (optional): Rotate to follow edge angle

**Valid Positions:**
- `center` - Middle of edge
- `source` - Near source node
- `target` - Near target node
- `0.25`, `0.5`, `0.75` - Relative position along edge

**Example:**
```langium
/**
 * @glsp-label position=center editable=true offset=10 rotate=true
 */
```

### @glsp-routing

Specifies how edges are routed between nodes.

**Syntax:** `@glsp-routing <algorithm> [options...]`

**Routing Algorithms:**
- `direct` - Straight line
- `manhattan` - Orthogonal routing (horizontal/vertical only)
- `bezier` - Smooth curved edges
- `polyline` - Multi-segment straight lines
- `rounded` - Manhattan with rounded corners
- `smooth` - Spline interpolation
- `avoid-nodes` - Route around nodes

**Algorithm-Specific Options:**
- Manhattan: `padding=<number>` - Space from nodes
- Bezier: `controlPointDistance=<number>` - Curve control
- Rounded: `cornerRadius=<number>` - Corner rounding
- Avoid-nodes: `margin=<number>` - Avoidance margin

**Example:**
```langium
/**
 * @glsp-routing manhattan padding=20
 * @glsp-routing bezier controlPointDistance=50
 */
```

### @glsp-marker

Adds arrow heads or other markers to edge endpoints.

**Syntax:** `@glsp-marker <end>=<marker-type> [size=<number>] [color=<color>]`

**Parameters:**
- `end` (required): Which end to apply marker (source/target/both)
- `marker-type` (required): Type of marker
- `size` (optional): Marker size scaling factor
- `color` (optional): Override marker color

**Marker Types:**
- `arrow` - Standard arrow head
- `triangle` - Filled triangle
- `chevron` - Open arrow
- `diamond` - Diamond shape
- `circle` - Circle marker
- `square` - Square marker
- `bar` - Perpendicular line
- `dot` - Small filled circle
- `none` - No marker
- `custom` - Custom SVG path

**Examples:**
```langium
/**
 * @glsp-marker target=arrow size=1.5
 * @glsp-marker source=circle target=arrow
 * @glsp-marker both=diamond color=#ff0000
 */
```

## Composite Examples

### Complete Node Definition
```langium
/**
 * @glsp-node process-step
 * @glsp-shape roundedRectangle width=180 height=80
 * @glsp-style fill=#dbeafe stroke=#3b82f6 strokeWidth=2 borderRadius=12 shadow="2px 2px 8px rgba(0,0,0,0.1)"
 * @glsp-connectable true
 * @glsp-resizable true handles=se,sw
 * @glsp-moveable true constraint=grid
 * @glsp-port north input id=in
 * @glsp-port south output id=out multiple
 * @glsp-label position=center editable=true maxWidth=160
 * @glsp-icon gear position=top-right size=20
 * @glsp-layout-options minWidth=120 minHeight=60 priority=5
 */
interface ProcessStep {
    name: string
    description?: string
    duration: number
}
```

### Complete Edge Definition
```langium
/**
 * @glsp-edge control-flow
 * @glsp-style stroke=#6b7280 strokeWidth=2 strokeDasharray="8,4" animated=true
 * @glsp-routing manhattan padding=15
 * @glsp-marker target=arrow size=1.2
 * @glsp-label position=center editable=true property=condition offset=12
 */
interface ControlFlow {
    source: @ProcessStep
    target: @ProcessStep
    condition?: string
    priority: number
}
```

### Complete Grammar Header
```langium
/**
 * Business Process Modeling Language
 * @glsp-group workflow
 * @glsp-layout elk-layered horizontal
 * @glsp-theme primary=#3b82f6 secondary=#64748b background=#f8fafc accent=#8b5cf6 error=#ef4444
 * @glsp-features autoLayout=true autoConnect=true routing=manhattan snapToGrid=true gridSize=10 minimap=true
 */
grammar BusinessProcess
```