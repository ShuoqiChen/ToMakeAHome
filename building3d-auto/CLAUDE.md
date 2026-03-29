# Building → 3D — Project Briefing

## What this project does

This app turns a source building image into structured 3D scene data and then builds the renderable scene locally.

Current pipeline:
1. User selects an image from `src/`
2. Step 1: ChatGPT, Gemini, or Claude performs low-cost visual analysis and returns compact JSON
3. Step 2: The selected provider converts that analysis into a component-plan JSON
4. Step 3: Local Node code converts the plan into:
   - a Three.js scene file
   - an OBJ export
   - saved JSON artifacts
5. Browser receives the finished artifacts over WebSocket and renders the scene

## Cost rules

- Never use premium models here unless explicitly requested.
- Default models:
  - `OPENAI_ANALYSIS_MODEL=gpt-4.1-mini`
  - `OPENAI_PLANNING_MODEL=gpt-4.1-mini`
  - `GEMINI_ANALYSIS_MODEL=gemini-2.5-flash`
  - `GEMINI_PLANNING_MODEL=gemini-2.5-flash`
  - `ANTHROPIC_ANALYSIS_MODEL=claude-3-5-haiku-latest`
  - `ANTHROPIC_PLANNING_MODEL=claude-3-5-haiku-latest`
- Keep provider outputs compact and structured.
- Do not ask any provider to generate JavaScript scene code.

## Key files

```text
building3d-auto/
├── server.js
├── src/
├── analyses/
├── components/
├── models/
├── objects/
└── public/
    └── index.html
```

## Supported component primitives

The planner may only emit:
- `box`
- `prism`
- `cylinder`
- `sphere`

This constraint is important because both the local Three.js builder and the OBJ exporter depend on it.

## Server-side invariants

- `processImage()` is a 3-step flow: analyze → component plan → local build/export
- WebSocket broadcasts should stay in sync with those 3 steps
- Save artifacts for every completed scene with provider suffixes:
  - `analyses/<base>__<provider>.json`
  - `components/<base>__<provider>.json`
  - `models/<base>__<provider>.js`
  - `objects/<base>__<provider>.obj`
- Cached loads should work through `/api/model/:filename?provider=<id>`

## Browser behavior

- The browser never sends prompts directly to a model vendor
- The browser chooses the provider with the header toggle
- The browser renders only the locally generated `models/*.js`
- The toolbar should expose:
  - reset
  - code view
  - OBJ download when available

## Good future improvements

- Resize/compress images before sending them to providers
- Add GLTF export alongside OBJ
- Add component editing in the browser and re-export
- Add cost telemetry per generation
