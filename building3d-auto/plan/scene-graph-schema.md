# Scene Graph Schema Draft

## Purpose

This document defines the editable source-of-truth model for the future Tiny Glade-like builder.

The scene graph must support:

- image-derived initial reconstruction
- local editing
- procedural rebuild
- AI patching
- export

It must replace the current flat component-plan format as the main internal model.

---

## Design Principles

- semantic first, not mesh first
- deterministic local reconstruction
- stable node IDs
- explicit parent-child structure
- safe to diff and patch
- versioned and migratable

---

## Top-Level Scene Shape

```json
{
  "sceneId": "scene_001",
  "version": 1,
  "meta": {
    "title": "storybook townhouse",
    "sourceImage": "test_1.jpg",
    "createdFrom": "manual|gpt|gemini|claude",
    "createdAt": "ISO timestamp"
  },
  "style": {
    "preset": "storybook-townhouse",
    "mood": "warm afternoon",
    "palette": {
      "wallFront": "#c8a070",
      "wallSide": "#a97b54",
      "roof": "#b14c2e",
      "trim": "#efe2cf",
      "ground": "#b99b6d",
      "accent": "#5b412d"
    }
  },
  "terrain": {},
  "camera": {},
  "lighting": {},
  "buildings": [],
  "props": [],
  "detailSettings": {},
  "history": []
}
```

---

## Node Model

Each node should follow a common shape:

```json
{
  "id": "node_001",
  "type": "mass",
  "name": "main-mass",
  "parentId": "building_001",
  "transform": {
    "position": { "x": 0, "y": 0, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "scale": { "x": 1, "y": 1, "z": 1 }
  },
  "params": {},
  "style": {},
  "constraints": {},
  "ai": {
    "confidence": 0.8,
    "source": "analysis|manual|user-edit"
  },
  "children": []
}
```

---

## Core Node Types

## 1. Building Node

Represents a building root.

### Params

- `footprint`
- `levels`
- `stylePreset`

### Children

- masses
- roofs
- facade groups
- attachments

---

## 2. Mass Node

Represents a major building volume.

### Params

- `width`
- `height`
- `depth`
- `shape`
- `levels`
- `wallMaterial`

### Example

```json
{
  "id": "mass_main",
  "type": "mass",
  "name": "main mass",
  "params": {
    "width": 7.2,
    "height": 6.2,
    "depth": 6.2,
    "shape": "rect",
    "levels": 2
  }
}
```

---

## 3. Roof Node

Represents roof geometry attached to a mass.

### Params

- `roofType`
- `pitch`
- `overhang`
- `ridgeOffset`
- `orientation`
- `material`

### Supported roof types

- `gable`
- `hip`
- `shed`
- `flat`

---

## 4. Facade Node

Represents a facade plane or semantic facade region.

### Params

- `side`
- `width`
- `height`
- `floorBands`
- `openingGrid`

### Purpose

Facade nodes are where openings, balconies, trims, and ivy attach.

---

## 5. Opening Node

Represents a door or window.

### Params

- `openingType`
- `width`
- `height`
- `sillHeight`
- `archStyle`
- `frameStyle`
- `depth`

### Supported opening types

- `window`
- `door`
- `arch-door`
- `arch-window`

---

## 6. Attachment Node

Represents objects physically attached to masses/facades.

### Types

- balcony
- awning
- stair
- chimney
- trim-band
- sign

---

## 7. Prop Node

Represents free-standing props or decor.

### Types

- plant
- barrel
- crate
- lantern
- fence
- shrub

---

## 8. Terrain Node

Represents ground and terrain features.

### Params

- `groundPlaneSize`
- `heightField`
- `pathSplines`
- `edgeStyle`

---

## Transform Rules

- child transforms are local to parent
- building root is world-anchored
- masses are local to building
- roofs are local to mass
- openings are local to facade
- props may be local to building or terrain

---

## Style Model

Style should be layered:

1. global scene style
2. building style override
3. node style override

Each node may override:

- material palette
- trim style
- roughness/detail intensity
- handcrafted variation amount

---

## Constraint Model

Each node may declare constraints such as:

- snap to floor band
- attach to facade surface
- align to roof ridge
- maintain symmetric spacing
- avoid overlap with sibling nodes

Constraint evaluation should happen after any edit.

---

## AI Metadata

Each node should preserve provenance:

- whether inferred by AI
- whether added by user
- whether regenerated
- confidence score

This allows:

- selective regeneration
- ambiguity visualization
- “lock this node” workflows

---

## History Model

The scene graph should support undo/redo via operation records:

```json
{
  "op": "update-node",
  "nodeId": "roof_001",
  "before": {},
  "after": {},
  "timestamp": "ISO timestamp"
}
```

---

## Migration Path From Current Format

Current `components/*.json` can be mapped into the new system:

- one building root
- one main mass inferred from dominant box/prism cluster
- roof nodes inferred from prism components
- openings inferred from small front-aligned boxes
- props inferred from cylinders/spheres/small boxes

This migration will be imperfect, but enough to bootstrap the new editor.

---

## Minimum Viable Schema

For the first editor milestone, only implement:

- scene
- building
- mass
- roof
- facade
- opening
- prop

Do not block the first milestone on:

- terrain sculpting
- advanced attachment rules
- multi-building compositions
- full constraint engine

---

## Immediate Implementation Tasks

1. Define JSON validator for scene graph
2. Define node constructors/helpers
3. Write migration adapter from current component plans
4. Refactor renderer to consume scene graph
5. Add simple inspector for mass/roof/opening params
