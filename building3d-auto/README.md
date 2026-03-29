# Building → 3D

Drop a building image → choose ChatGPT, Gemini, or Claude for structured planning → the app builds a toon-shaded Three.js scene and an exportable `.obj` locally.

## Why this version is cheaper

- No model writes long JavaScript scene files.
- Default models are small / fast:
  - `OPENAI_ANALYSIS_MODEL=gpt-4.1-mini`
  - `OPENAI_PLANNING_MODEL=gpt-4.1-mini`
  - `GEMINI_ANALYSIS_MODEL=gemini-2.5-flash`
  - `GEMINI_PLANNING_MODEL=gemini-2.5-flash`
  - `ANTHROPIC_ANALYSIS_MODEL=claude-3-5-haiku-latest`
  - `ANTHROPIC_PLANNING_MODEL=claude-3-5-haiku-latest`
- The selected provider returns compact JSON only:
  1. Visual analysis JSON
  2. Component-plan JSON
- Three.js code and OBJ export are generated locally by Node.

## Setup

```bash
npm install
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
# or
export ANTHROPIC_API_KEY=sk-ant-...
```

Optional model overrides:

```bash
export SCENEBUILD_PROVIDER=gpt
export OPENAI_ANALYSIS_MODEL=gpt-4.1-mini
export OPENAI_PLANNING_MODEL=gpt-4.1-mini
export GEMINI_ANALYSIS_MODEL=gemini-2.5-flash
export GEMINI_PLANNING_MODEL=gemini-2.5-flash
export ANTHROPIC_ANALYSIS_MODEL=claude-3-5-haiku-latest
export ANTHROPIC_PLANNING_MODEL=claude-3-5-haiku-latest
```

## Run

```bash
npm start
```

Open `http://localhost:7433`

## Pipeline

1. Pick an image from `src/`
2. The selected provider analyzes the picture into compact building JSON
3. The selected provider turns that analysis into a primitive-component JSON plan
4. The server converts that plan into:
   - `models/<name>__<provider>.js` for Three.js rendering
   - `components/<name>__<provider>.json` for the reusable plan
   - `analyses/<name>__<provider>.json` for the visual analysis
   - `objects/<name>__<provider>.obj` for export to other 3D tools
5. The browser renders the scene and exposes the OBJ download button

## Manual mode

If you do not have an API key, choose `Manual Paste` in the header.

Flow:
1. Select an image
2. Click `Paste JSON`
3. Ask ChatGPT or another AI agent for:
   - analysis JSON
   - component-plan JSON
4. Paste both JSON blocks into the panel
5. Click `Build Scene`

The app will build the Three.js scene and OBJ locally without calling any vendor API.

## Prompt template: analysis JSON

Use this with your AI agent and attach or paste the building image:

```text
You are a visual building analyst.

Look at this building image and return ONLY a JSON object.
Do not include markdown, code fences, comments, or explanation.

Return this exact shape:
{
  "style": "short style label",
  "floors": 2,
  "palette": {
    "wallFront": "#c8a070",
    "wallSide": "#a97b54",
    "roof": "#b14c2e",
    "trim": "#efe2cf",
    "ground": "#b99b6d"
  },
  "roofType": "gable|flat|hip|shed",
  "roofColor": "#b14c2e",
  "massing": { "footprintWidth": 8, "footprintDepth": 7, "height": 8 },
  "features": {
    "hasBalcony": false,
    "hasAwning": false,
    "windowStyle": "arched|rectangular|mixed",
    "doorColor": "#5b412d"
  },
  "props": ["plant"],
  "atmosphere": "warm afternoon",
  "notes": ["simple detail 1", "simple detail 2"]
}
```

## Prompt template: component-plan JSON

After you get the analysis JSON, use this second prompt:

```text
You convert a building analysis into drawable 3D components.

Return ONLY JSON. No markdown. No explanation.
Use only these primitive types:
- box
- prism
- cylinder
- sphere

Keep the plan efficient: 10 to 32 components total.
Use world units similar to meters.
Use prism for pitched roofs.
Use spheres or cylinders for plants and chimneys.
Put doors and windows slightly in front of the front wall.
Make the result easy to export as OBJ.

Return this exact shape:
{
  "units": "meters-ish",
  "style": "short label",
  "atmosphere": "short phrase",
  "palette": {
    "wallFront": "#...",
    "wallSide": "#...",
    "roof": "#...",
    "trim": "#...",
    "ground": "#...",
    "accent": "#..."
  },
  "camera": {
    "size": 12,
    "position": { "x": 22, "y": 17, "z": 22 },
    "lookAt": { "x": 0, "y": 4, "z": 0 }
  },
  "lighting": {
    "ambientColor": "#ffecc0",
    "ambientIntensity": 1.0,
    "sunColor": "#ffe090",
    "sunIntensity": 2.0,
    "sunPosition": { "x": 16, "y": 28, "z": 10 }
  },
  "components": [
    {
      "type": "box",
      "label": "main-mass",
      "color": "#c8a070",
      "position": { "x": 0, "y": 3.2, "z": 0 },
      "size": { "w": 8, "h": 6, "d": 7 },
      "rotation": { "x": 0, "y": 0, "z": 0 }
    }
  ]
}

Here is the analysis JSON:
PASTE_ANALYSIS_JSON_HERE
```

## Supported primitive types

- `box`
- `prism`
- `cylinder`
- `sphere`

These are the only shapes the planner is allowed to request, which keeps exports simple and predictable.

## Project structure

```text
building3d-auto/
├── server.js
├── src/                ← source images
├── models/             ← generated Three.js scene files, provider-scoped
├── analyses/           ← visual analysis JSON, provider-scoped
├── components/         ← structured component-plan JSON, provider-scoped
├── objects/            ← exported OBJ files, provider-scoped
└── public/
    └── index.html
```

## Requirements

- Node.js 18+
- One provider API key for uncached generations
