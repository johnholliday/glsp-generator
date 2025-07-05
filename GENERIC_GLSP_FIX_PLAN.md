# Plan to Make GLSP Generator Truly Generic

## Problem Summary
The GLSP generator has templates for generating generic code from any Langium grammar, but the interactive editing features added to the statemachine example are hardcoded and not generic.

## Root Cause
When implementing the interactive editing features (commands, WebSocket server, tool palette), new files were created with hardcoded statemachine-specific code instead of:
1. Updating the existing templates to include these features
2. Making the new code generic by using the parsed grammar data

## Files That Need Template Updates

### 1. **webview-index.hbs**
Current: Basic viewer without editing capabilities
Needs: 
- WebSocket connection logic
- Tool palette integration
- Generic node/edge creation based on grammar interfaces

### 2. **glsp-tool-palette.hbs** 
Current: Already generic, iterates over interfaces
Issue: Not being used in webview, hardcoded tool palette was created instead

### 3. **New Template Needed: glsp-websocket-server.hbs**
Should generate:
- Generic WebSocket server
- Model types from grammar interfaces
- Generic path based on project name

### 4. **New Template Needed: command-implementations.hbs**
Should generate:
- CreateNodeCommand (generic)
- CreateEdgeCommand (generic)
- DeleteElementsCommand (generic)
- ChangeBoundsCommand (generic)
- EditLabelCommand (generic)

### 5. **Update: create-node-handler.hbs**
Current: Basic implementation
Needs: Return command objects instead of undefined

## Implementation Steps

### Step 1: Update Templates
1. Update `webview-index.hbs` to include:
   ```handlebars
   // Generate tool groups from grammar
   const toolGroups: ToolGroup[] = [
   {{#each interfaces}}
     {
       id: '{{toLowerCase name}}-tools',
       label: '{{name}} Tools',
       items: [{
         id: 'create-{{toLowerCase name}}',
         label: '{{name}}',
         icon: 'codicon-circle-outline',
         action: {
           kind: 'createNode',
           type: '{{toLowerCase name}}'
         }
       }]
     }{{#unless @last}},{{/unless}}
   {{/each}}
   ];
   ```

2. Create `glsp-websocket-server.hbs`:
   ```handlebars
   // WebSocket path based on project name
   path: '/{{toLowerCase projectName}}'
   
   // Model types from grammar
   modelTypes: [{{#each interfaces}}'{{toLowerCase name}}'{{#unless @last}}, {{/unless}}{{/each}}]
   ```

### Step 2: Update Generator Logic
1. Add WebSocket server to generation items
2. Add command implementations to generation items
3. Ensure tool palette is integrated into webview

### Step 3: Remove Hardcoded Files
Remove these hardcoded files from the example:
- `src/webview/tool-palette.ts` (hardcoded states/transitions)
- Parts of `src/server/glsp-websocket-server.ts` that are statemachine-specific

### Step 4: Test with Different Grammars
Test the generator with various Langium grammars to ensure it produces working GLSP extensions for any grammar.

## Expected Outcome
After these changes, running the generator on ANY Langium grammar should produce a fully functional GLSP extension with:
- Interactive editing capabilities
- Tool palette with items for each interface in the grammar
- WebSocket server for real-time updates
- Command pattern implementation
- No hardcoded references to specific domain concepts

## Benefits
1. True reusability - works with any Langium grammar
2. Maintainability - changes to features update all generated extensions
3. Consistency - all generated extensions have the same capabilities
4. Extensibility - new features can be added to templates