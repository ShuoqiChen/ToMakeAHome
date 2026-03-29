# Tiny Glade-Like Roadmap

## Goal

Turn `building3d-auto` from a one-shot image-to-scene demo into an interactive building composer:

1. User provides an image
2. AI extracts a semantic building model
3. App reconstructs an editable 3D scene
4. User edits the result with direct manipulation and guided regeneration
5. Local procedural systems keep the scene coherent and charming

This is not just “better image to 3D.” It is a shift from:

- image -> rough scene

to:

- image -> semantic scene graph -> parametric rebuild -> constrained editing -> procedural detailing

---

## Product Vision

The target experience should feel like:

- fast enough for iteration
- editable at every stage
- stylized rather than photoreal
- forgiving to user input
- constrained so edits preserve beauty
- AI-assisted, but not AI-dependent for every small change

The app should eventually support:

- import an inspiration image
- infer structure and style
- rebuild as editable primitives and generators
- click parts to modify them
- drag massing and openings
- regenerate only a roof, facade, or props layer
- export to standard 3D formats

---

## Comment Responses

The following comments were raised and are answered here so the roadmap reflects them explicitly.

### Comment

`We are missing some artistic style guides`

### Answer

Correct. The roadmap was too focused on structure and not explicit enough about the visual language system.

We need a dedicated **Style System** that sits alongside the scene graph and parametric generators.

That style system should define:

- shape language
- silhouette exaggeration rules
- material response rules
- color harmonies
- lighting style
- detail density
- ornament motifs
- edge treatment
- texture treatment

Without this, reconstruction may be structurally correct but artistically generic.

### Comment

`For example, I want painterly style`

### Answer

Painterly style should be treated as a first-class preset, not a post-process afterthought.

A `painterly` preset should influence:

- AI interpretation of the image
- scene graph defaults
- geometry generation choices
- material generation
- rendering style
- decoration density

Painterly style should include rules for:

- softened regularity
- slight asymmetry
- simplified values
- grouped colors
- reduced realism
- hand-made variation
- brush/noise treatment
- softer shadow and highlight transitions

### Comment

`how to incorporate to this? should we just generate lambertian and then later on add UV mapping?`

### Answer

Not as the main long-term strategy.

Lambertian shading is acceptable as a temporary prototyping fallback, but it is too weak to serve as the main painterly rendering plan.

The better approach is:

1. define a **style-aware material abstraction**
2. keep geometry generation separate from material generation
3. support multiple render modes
4. add UV-capable geometry only where the style actually needs texture-driven surfaces

Recommended render/material progression:

1. current toon / flat stylized baseline
2. style-aware material descriptors
3. selective UV or triplanar mapping support
4. painterly texture layers / brush overlays
5. hybrid shader + texture style rendering

So the answer is:

- `Lambertian first` is fine only as a temporary internal step
- `UV later` is fine only after deciding which generators truly need UVs
- the real solution is a hybrid non-photoreal style system, not Lambert alone

### Comment

`We need to brainstorm and iterate on this, also, this should be facilitated by AI`

### Answer

Correct.

AI should help with:

- extracting style traits from references
- translating inspiration images into style descriptors
- proposing style presets
- generating material / brush-map directions
- suggesting scene graph patches scoped to style changes

But AI should not be the runtime style system itself.

The runtime style system should remain:

- local
- deterministic
- editable
- parameterized

So AI should facilitate:

- style authoring
- style exploration
- style patching

not full uncontrolled scene generation for every small change.

---

## Current State

Current system already has:

- image selection
- AI-assisted image analysis
- AI-assisted component-plan generation
- local Three.js scene generation
- local OBJ export
- manual paste workflow

Current limitations:

- scene is not truly editable as a persistent model
- output is a flat component list, not a semantic scene graph
- building understanding is shallow
- geometry is coarse
- no constraint system
- no direct manipulation tools
- no procedural “beautification” layer
- no partial regeneration workflow

---

## Target Architecture

The app should evolve into 6 major layers:

1. Image Understanding Layer
2. Semantic Scene Graph Layer
3. Parametric Reconstruction Layer
4. Style System Layer
5. Procedural Detail Layer
6. Interactive Editor Layer
7. AI Assist Layer

These layers should be decoupled so the app still works when AI is unavailable.

---

## Core Data Model

The most important missing piece is the editable source of truth.

### Required source of truth

Introduce a persistent `scene graph` JSON model.

It should represent:

- scene metadata
- global style
- style preset settings
- terrain
- building groups
- masses
- roofs
- facades
- openings
- attachments
- props
- materials
- procedural detail settings

### Proposed top-level scene graph shape

```json
{
  "sceneId": "uuid",
  "version": 1,
  "style": {
    "preset": "storybook-townhouse",
    "palette": {},
    "mood": "warm afternoon"
  },
  "terrain": {},
  "buildings": [],
  "props": [],
  "lighting": {},
  "camera": {},
  "detailSettings": {},
  "history": []
}
```

### Why this matters

Without a scene graph:

- edits are destructive
- AI output is not composable
- regeneration is all-or-nothing
- procedural systems cannot target semantic regions

This is the first major architecture milestone.

---

## Phase Roadmap

## Phase 0: Stabilize The Current Prototype

### Goal

Make the current app reliable enough to serve as the base platform.

### Work

- clean up UI flows
- fix cache bugs
- improve manual paste reliability
- improve parsing and validation
- separate generated artifacts cleanly by provider and mode
- add persistent scene metadata alongside models

### Deliverables

- stable local demo
- stable manual workflow
- stable cached load and clear-cache behavior

---

## Phase 1: Scene Graph Foundation

### Goal

Replace “component plan as loose JSON” with a real scene graph.

### Design pieces

- node types
- parent-child relationships
- stable node IDs
- serialization format
- validation rules
- migration strategy from current `components/*.json`

### Node categories

- `terrain`
- `building`
- `mass`
- `roof`
- `facade`
- `opening`
- `balcony`
- `stairs`
- `chimney`
- `trim`
- `prop`
- `vegetation`
<question: is this all there is to the node categories?>
<in the current mode, we are only looking at single buildings and or compounds. No street blocks or city, no nature, no character, no inside or interial>
<but even with the narrowed view, I think there would be a lot more different catefies. Brainstorm this>

### Implementation pieces

- `scene-schema.ts/js`
- scene validator
- scene loader/saver
- node traversal helpers
- node selection/indexing helpers
- node diff and patch utilities

### Deliverables

- editable scene graph saved as JSON
- current renderer rebuilt from scene graph instead of flat plan only

---

## Phase 2: Style System Foundation

### Goal

Create a first-class style layer so reconstruction is not only structurally correct, but visually directed.

### Why this must come early

If style is delayed too long, the geometry and material systems will hard-code generic assumptions that are expensive to unwind later.

### Design pieces

- style preset schema
- material descriptor schema
- render mode abstraction
- shape language rules
- detail-density rules
- lighting style rules
- texture strategy

### First style presets

- `storybook`
- `painterly`
- `toy-block`
- `clean-toon`

### Painterly preset should define

- grouped palette behavior
- softened contrast
- subtle asymmetry
- brush/noise surface treatment
- reduced realism in specular response
- softer shadow character
- ornamental density

### Texture / shading strategy

Do not commit to pure Lambertian as the end-state.

Use a hybrid style material approach:

- base non-photoreal shading
- style-aware material descriptors
- selective UV support where needed
- optional triplanar / procedural mapping where possible
- painterly overlays and surface variation later

### Deliverables

- style preset schema
- material descriptor schema
- painterly preset v1
- rendering strategy for non-photoreal styles

---

## Phase 3: Parametric Geometry System

### Goal

Generate geometry deterministically from semantic nodes.

### Design pieces

- parameter sets for each generator
- coordinate conventions
- facade coordinate space
- snapping and alignment rules
- geometry composition rules

### Generators to implement first

- wall mass generator
- roof generator
- window generator
- door generator
- ground plane generator
- simple stair generator
- chimney generator

### Generator rules

- deterministic
- local
- fast enough for interactive rebuild
- produce both Three.js meshes and exportable geometry

### Required abstractions

- `generateMass(node, context)`
- `generateRoof(node, context)`
- `generateFacade(node, context)`
- `generateOpening(node, context)`
- `generateProp(node, context)`

### Deliverables

- local render no longer depends on AI-written structure
- consistent rebuild after edits

---

## Phase 4: Better Image Understanding

### Goal

Make image analysis produce structured building understanding, not just descriptive tags.

### Current problem

Current analysis knows:

- style
- floors
- palette
- roof type

But it does not know:

- exact facade layout
- window rhythm
- silhouette asymmetry
- visible side depth
- attachment relationships
- roof orientation
- staircase placement

### Needed analysis outputs

- estimated massing blocks
- facade count
- facade depth hints
- opening layout by facade and floor
- roof profile and orientation
- notable attachments
- prop zones
- terrain cues
<the image understanding should be handled by AI>
<the app should not do any heavy lifting>
<Additional input for the AI are depth, and image segmentation for different components>

### New analysis schema should include

- `masses`
- `facades`
- `openings`
- `attachments`
- `compositionHints`
- `styleHints`

### Deliverables

- richer AI analysis JSON
- confidence fields for uncertain structures
- fallback inference heuristics when AI is vague

---

## Phase 5: Reconstruction Composer

### Goal

Transform analysis into a semantic scene graph with editable structure.

### Design pieces

- inference rules from image analysis -> scene graph
- ambiguity handling
- confidence-aware defaults
- style preset influence

### Implementation pieces

- scene graph builder from analysis
- mass estimation heuristics
- opening distribution rules
- roof inference rules
- automatic facade creation

### Deliverables

- scene graph generated from image analysis
- user sees editable structure immediately

---

## Phase 6: Interactive Editing

### Goal

Let the user directly manipulate the reconstructed scene.

### First editing tools

- select node
- highlight node
- property panel
- numeric edits
- add/remove component
- duplicate component

### Second editing tools

- drag building width/depth/height
- drag roof pitch
- drag window positions
- add facade openings
- paint material/style presets

### Required UI systems

- scene outliner
- property inspector
- selection state
- transform handles
- undo/redo

### Deliverables

- editable local builder, independent of AI for basic adjustments

---

## Phase 7: Constraint System

### Goal

Make edits feel coherent and “Tiny Glade-like.”

### Constraint examples

- windows snap to floor bands
- roof resizes when mass width changes
- doors stay attached to valid facades
- balconies attach only to facade surfaces
- stairs connect valid elevations
- props avoid collisions

### Required systems

- constraint evaluation pass
- layout snapping rules
- dependency graph between nodes
- local recompute after edit

### Deliverables

- edits preserve structure automatically
- user can freely reshape buildings without breaking them

---

## Phase 8: Procedural Beautification

### Goal

Add the charm layer that makes scenes feel authored rather than blocky.

### Detail systems

- trims and frames
- roof ridges and overhangs
- facade depth
- arch shaping
- stone/wood variation
- slight asymmetry
- prop clustering
- vegetation scattering
- edge softening

### Important rule

Procedural detail should sit on top of the semantic graph and be reproducible from settings, not hand-authored into the base scene.

This layer must also be style-aware. For example:

- painterly detail should not use the same trim language as clean-toon detail
- vegetation density and shape should depend on style preset
- edge breakup and ornament rhythm should vary by style

### Deliverables

- “coarse”, “balanced”, and “lush” detail modes
- much richer default output

---

## Phase 9: Partial AI Regeneration

### Goal

Use AI for targeted improvements, not whole-scene rewrites.

### Regeneration scopes

- roof only
- facade layout only
- props only
- style reinterpretation only
- decoration pass only

### Required architecture

- sub-tree selection
- prompt context built from selected node + neighbors
- patch application to scene graph
- diff preview

### Important AI rule

AI should facilitate style exploration and targeted patching, but the live renderer and edit system must remain deterministic and local.

### Deliverables

- AI-assisted local edits
- much cheaper and more controllable workflow

---

## Phase 10: Tiny Glade-Like Composition Features

### Goal

Move beyond single building reconstruction.

### Features

- terrain shaping
- paths
- fences
- courtyard tools
- multiple buildings
- scene composition presets
- environmental decoration

### Deliverables

- village-like scene assembly
- more playful builder experience

---

## Phase 11: Export and Persistence

### Goal

Make scenes portable and durable.

### Needed exports

- OBJ
- GLTF/GLB
- scene JSON
- thumbnail preview
- maybe standalone HTML scene export

### Persistence features

- autosave
- save/load projects
- recent scenes
- scene snapshots

### Deliverables

- reusable output pipeline
- long-term project workflow

---

## Detailed Design Workstreams

## 1. Scene Graph Design

### Decisions needed

- JSON schema format
- node inheritance vs explicit typing
- transform inheritance rules
- material assignment model
- metadata for AI confidence
- versioning

### Files likely needed

- `plan/scene-graph-schema.md`
- `src/core/sceneGraph.js`
- `src/core/sceneValidation.js`
- `src/core/sceneTraversal.js`

---

## 2. Geometry Generator Design

### Decisions needed

- primitive vs custom mesh balance
- local coordinate systems
- extrusion conventions
- mesh merge strategy
- export mesh fidelity

### Files likely needed

- `src/generators/mass.js`
- `src/generators/roof.js`
- `src/generators/opening.js`
- `src/generators/stairs.js`
- `src/generators/chimney.js`
- `src/generators/detail.js`

---

## 3. Style System Design

### Decisions needed

- how style presets are represented
- which generators are style-sensitive
- which materials require UVs
- where triplanar/procedural mapping is enough
- shader-first vs texture-first painterly strategy
- how AI can propose style patches safely

### Files likely needed

- `plan/style-system-spec.md`
- `src/style/stylePresets.js`
- `src/style/materialDescriptors.js`
- `src/style/renderModes.js`
- `src/style/painterlyRules.js`

---

## 4. Editor UX Design

### Decisions needed

- panel layout
- scene tree vs direct-only editing
- selection affordances
- keyboard shortcuts
- mobile support expectations

### Files likely needed

- `public/editor-state.js`
- `public/editor-ui.js`
- `public/inspector.js`
- `public/scene-outliner.js`
- `public/gizmo.js`

---

## 5. AI Pipeline Design

### Decisions needed

- how much AI is used in default workflow
- manual mode vs provider mode parity
- structured output schemas
- retry and repair strategy
- confidence handling

### Files likely needed

- `src/ai/analysis-schema.json`
- `src/ai/reconstruction-schema.json`
- `src/ai/prompt-builders.js`
- `src/ai/patch-application.js`

---

## 6. Constraint System Design

### Decisions needed

- hard vs soft constraints
- per-node validation
- constraint ordering
- auto-fix rules

### Files likely needed

- `src/constraints/constraints.js`
- `src/constraints/facadeRules.js`
- `src/constraints/roofRules.js`
- `src/constraints/openingRules.js`

---

## 7. Export Pipeline Design

### Decisions needed

- how much procedural detail is baked into export
- GLTF material strategy
- collision cleanup before export
- metadata embedding

### Files likely needed

- `src/export/obj.js`
- `src/export/gltf.js`
- `src/export/scene-pack.js`

---

## Highest-Leverage Next Steps

If the goal is to move toward Tiny Glade-like behavior as fast as possible, the next three implementation steps should be:

1. Design and implement the scene graph schema
2. Design the style system, especially `painterly` preset v1
3. Refactor local rendering to build from scene graph nodes plus style descriptors
4. Add an inspector-based editor for core parametric nodes

Those three changes unlock nearly everything else.

---

## Recommended Milestone Order

### Milestone A

Stabilize prototype and define scene graph

### Milestone B

Define style system and painterly preset

### Milestone C

Render from semantic graph with parametric generators

### Milestone D

Editable local building tools

### Milestone E

Constraint system and procedural charm

### Milestone F

Partial AI regeneration and composition tools

---

## Success Criteria

You are “approaching Tiny Glade-like” when:

- a reconstructed scene is editable without re-running full AI
- width/height/roof edits preserve coherence
- facade details regenerate locally
- charm/detail feels procedural rather than manually faked
- user can iteratively refine a scene in minutes

You are “still in demo mode” if:

- every meaningful change requires full regeneration
- geometry is mostly unstructured boxes
- scene data cannot be edited semantically
- AI output remains the real source of truth

---

## Suggested Next Planning Documents

Create next:

1. `plan/scene-graph-schema.md`
2. `plan/style-system-spec.md`
3. `plan/parametric-generator-spec.md`
4. `plan/editor-ux-spec.md`
5. `plan/ai-analysis-schema-v2.md`
6. `plan/constraint-system-spec.md`

<We are missing some artistic style guides>
<For example, I want painterly style>
<how to incorporate to this? should we just generate lambertian and then later on add UV mapping?>
<We need to brainstrom and iterate on this, also, this shoudl be facilitated by AI>
