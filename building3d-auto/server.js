#!/usr/bin/env node
/**
 * building3d-auto / server.js
 *
 * Serves image picker UI. Cached scenes load instantly.
 * If a supported provider API key is set in .env, uncached images are processed on demand.
 *
 * Usage: npm start -> http://localhost:7433
 */

var fs = require('fs');
var path = require('path');
var http = require('http');
var express = require('express');
var ws = require('ws');

var PORT = 7433;
var SRC_DIR = path.join(__dirname, 'src');
var MODELS_DIR = path.join(__dirname, 'models');
var ANALYSES_DIR = path.join(__dirname, 'analyses');
var COMPONENTS_DIR = path.join(__dirname, 'components');
var OBJECTS_DIR = path.join(__dirname, 'objects');
var LOGS_DIR = path.join(__dirname, 'logs');
var GENERATION_LOG_PATH = path.join(LOGS_DIR, 'generation.log');
var IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
var PIPELINE_DIR = path.join(__dirname, '..', 'building3d-pipeline');
var PIPELINE_ANALYSIS_DIR = path.join(PIPELINE_DIR, 'analysis');
var PIPELINE_OUTPUT_DIR = path.join(PIPELINE_DIR, 'output');

[SRC_DIR, MODELS_DIR, ANALYSES_DIR, COMPONENTS_DIR, OBJECTS_DIR, LOGS_DIR].forEach(function(dir) {
  fs.mkdirSync(dir, { recursive: true });
});

function stamp() {
  return new Date().toISOString();
}

function oneLine(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function appendGenerationLog(scope, message, details) {
  var line = '[' + stamp() + '] [' + scope + '] ' + oneLine(message);
  if (details && Object.keys(details).length) {
    line += ' | ' + JSON.stringify(details);
  }
  fs.appendFileSync(GENERATION_LOG_PATH, line + '\n');
}

function readEnvVar(name) {
  if (process.env[name]) return process.env[name];
  var envFile = path.join(__dirname, '.env');
  if (!fs.existsSync(envFile)) return '';
  var line = fs.readFileSync(envFile, 'utf8').split('\n').find(function(entry) {
    return entry.startsWith(name + '=');
  });
  return line ? line.split('=').slice(1).join('=').trim().replace(/['"]/g, '') : '';
}

function getModel(name, fallback) {
  return readEnvVar(name) || fallback;
}

function pickDefaultProvider(providers) {
  var preferred = (readEnvVar('SCENEBUILD_PROVIDER') || '').toLowerCase();
  if (providers[preferred] && providers[preferred].enabled) return preferred;
  if (providers.manual && providers.manual.enabled) return 'manual';
  if (providers.gpt && providers.gpt.enabled) return 'gpt';
  if (providers.gemini && providers.gemini.enabled) return 'gemini';
  if (providers.claude && providers.claude.enabled) return 'claude';
  return 'manual';
}

var anthropicKey = readEnvVar('ANTHROPIC_API_KEY');
var openaiKey = readEnvVar('OPENAI_API_KEY');
var geminiKey = readEnvVar('GEMINI_API_KEY');
var geminiKeyBackup = readEnvVar('GEMINI_API_KEY_BACKUP');

var providers = {
  manual: {
    id: 'manual',
    label: 'Manual Paste',
    enabled: true,
    apiKey: '',
    analysisModel: 'paste-json',
    planningModel: 'paste-json'
  },
  gpt: {
    id: 'gpt',
    label: 'ChatGPT',
    enabled: !!openaiKey,
    apiKey: openaiKey,
    analysisModel: getModel('OPENAI_ANALYSIS_MODEL', 'gpt-4.1-mini'),
    planningModel: getModel('OPENAI_PLANNING_MODEL', 'gpt-4.1-mini')
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    enabled: !!geminiKey,
    apiKey: geminiKey,
    analysisModel: getModel('GEMINI_ANALYSIS_MODEL', 'gemini-2.5-flash'),
    planningModel: getModel('GEMINI_PLANNING_MODEL', 'gemini-2.5-flash')
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    enabled: !!anthropicKey,
    apiKey: anthropicKey,
    analysisModel: getModel('ANTHROPIC_ANALYSIS_MODEL', 'claude-3-5-haiku-latest'),
    planningModel: getModel('ANTHROPIC_PLANNING_MODEL', 'claude-3-5-haiku-latest')
  }
};

var defaultProvider = pickDefaultProvider(providers);
var anthropic = null;
if (providers.claude.enabled) {
  try {
    var Anthropic = require('@anthropic-ai/sdk');
    anthropic = new Anthropic({ apiKey: anthropicKey });
  } catch (e) {
    providers.claude.enabled = false;
    providers.claude.apiKey = '';
    console.log('  ⚠️   @anthropic-ai/sdk not installed — Claude disabled');
  }
}

console.log('  Provider availability');
console.log('  ─────────────────────────────');
Object.keys(providers).forEach(function(key) {
  var provider = providers[key];
  console.log('  ' + provider.label + ': ' + (provider.enabled ? 'enabled' : 'disabled'));
  if (provider.enabled) {
    console.log('      Analysis model: ' + provider.analysisModel);
    console.log('      Planning model: ' + provider.planningModel);
  }
});
console.log('  Default provider: ' + defaultProvider);

var app = express();
var server = http.createServer(app);
var wss = new ws.Server({ server: server });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(SRC_DIR));
app.use('/models', express.static(MODELS_DIR));
app.use('/analyses', express.static(ANALYSES_DIR));
app.use('/components', express.static(COMPONENTS_DIR));
app.use('/objects', express.static(OBJECTS_DIR));
app.use('/pipeline-analysis', express.static(PIPELINE_ANALYSIS_DIR));
app.use('/pipeline-output', express.static(PIPELINE_OUTPUT_DIR));

var isProcessing = false;
var isPipelineRunning = false;

function broadcast(data) {
  var msg = JSON.stringify(data);
  if (data && data.type) {
    if (data.type === 'pipeline_log') {
      appendGenerationLog('pipeline', data.text || '', { level: data.level || 'info' });
    } else if (data.type === 'pipeline_phase') {
      appendGenerationLog('pipeline', 'Phase ' + data.phase + ' — ' + pipelinePhaseLabel(data.phase), { phase: data.phase });
    } else if (data.type === 'pipeline_progress') {
      appendGenerationLog('pipeline', data.text || ('Phase ' + data.phase + ' progress'), { phase: data.phase, seconds: data.seconds || 0 });
    } else if (data.type === 'pipeline_start') {
      appendGenerationLog('pipeline', 'Pipeline started for ' + (data.filename || ''), { filename: data.filename || '' });
    } else if (data.type === 'pipeline_done') {
      appendGenerationLog('pipeline', 'Pipeline complete', {
        gateCount: data.gates ? data.gates.length : 0,
        artifactCount: data.artifacts ? data.artifacts.length : 0
      });
    } else if (data.type === 'pipeline_error') {
      appendGenerationLog('pipeline', data.message || 'Pipeline error');
    } else if (data.type === 'start') {
      appendGenerationLog('scene', 'Scene generation started for ' + (data.filename || ''), { provider: data.provider || '' });
    } else if (data.type === 'step') {
      appendGenerationLog('scene', data.message || 'Scene generation step', {
        provider: data.provider || '',
        step: data.step || 0,
        of: data.of || 0
      });
    } else if (data.type === 'error') {
      appendGenerationLog('scene', data.message || 'Scene generation error', { provider: data.provider || '' });
    } else if (data.type === 'scene_ready') {
      appendGenerationLog('scene', 'Scene generation complete for ' + (data.filename || ''), {
        provider: data.provider || '',
        componentCount: data.components && data.components.components ? data.components.components.length : 0
      });
    }
  }
  wss.clients.forEach(function(client) {
    if (client.readyState === ws.OPEN) client.send(msg);
  });
}

function normalizeJsonish(text) {
  var cleaned = String(text || '');
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/```json|```javascript|```js|```/gi, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/^\uFEFF/, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  var firstBrace = cleaned.indexOf('{');
  var lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_-]*)(\s*:)/g, '$1"$2"$3')
    .replace(/,\s*([}\]])/g, '$1');

  if (cleaned.indexOf('"') === -1 && cleaned.indexOf("'") !== -1) {
    cleaned = cleaned.replace(/'([^']*)'/g, function(_, inner) {
      return '"' + inner.replace(/"/g, '\\"') + '"';
    });
  }

  return cleaned;
}

function safeJsonParse(text) {
  var attempts = [];
  attempts.push(String(text || '').trim());
  attempts.push(normalizeJsonish(text));

  var i;
  for (i = 0; i < attempts.length; i += 1) {
    try {
      return JSON.parse(attempts[i]);
    } catch (e) {}
  }

  return JSON.parse(attempts[attempts.length - 1]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function n(value, fallback) {
  var num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function ensureHex(color, fallback) {
  var raw = typeof color === 'string' ? color.trim() : '';
  if (/^#([0-9a-f]{6})$/i.test(raw)) return raw.toLowerCase();
  return fallback;
}

function hexNumber(color, fallback) {
  return '0x' + ensureHex(color, fallback).slice(1);
}

function toRad(value) {
  return n(value, 0) * Math.PI / 180;
}

function rotateVertex(vertex, rotation) {
  var x = vertex[0];
  var y = vertex[1];
  var z = vertex[2];
  var rx = toRad(rotation.x);
  var ry = toRad(rotation.y);
  var rz = toRad(rotation.z);
  var cy = Math.cos(rx);
  var sy = Math.sin(rx);
  var y1 = y * cy - z * sy;
  var z1 = y * sy + z * cy;
  y = y1;
  z = z1;
  var cx = Math.cos(ry);
  var sx = Math.sin(ry);
  var x2 = x * cx + z * sx;
  var z2 = -x * sx + z * cx;
  x = x2;
  z = z2;
  var cz = Math.cos(rz);
  var sz = Math.sin(rz);
  var x3 = x * cz - y * sz;
  var y3 = x * sz + y * cz;
  return [x3, y3, z];
}

function transformVertices(vertices, component) {
  return vertices.map(function(vertex) {
    var rotated = rotateVertex(vertex, component.rotation);
    return [
      round3(rotated[0] + component.position.x),
      round3(rotated[1] + component.position.y),
      round3(rotated[2] + component.position.z)
    ];
  });
}

function buildBoxMesh(component) {
  var halfW = component.size.w / 2;
  var halfH = component.size.h / 2;
  var halfD = component.size.d / 2;
  var vertices = [
    [-halfW, -halfH, -halfD], [halfW, -halfH, -halfD], [halfW, halfH, -halfD], [-halfW, halfH, -halfD],
    [-halfW, -halfH, halfD], [halfW, -halfH, halfD], [halfW, halfH, halfD], [-halfW, halfH, halfD]
  ];
  var faces = [
    [1, 2, 3], [1, 3, 4], [5, 8, 7], [5, 7, 6], [1, 5, 6], [1, 6, 2],
    [2, 6, 7], [2, 7, 3], [3, 7, 8], [3, 8, 4], [4, 8, 5], [4, 5, 1]
  ];
  return { vertices: transformVertices(vertices, component), faces: faces };
}

function buildPrismMesh(component) {
  var halfW = component.size.w / 2;
  var halfH = component.size.h / 2;
  var halfD = component.size.d / 2;
  var vertices = [
    [-halfW, -halfH, -halfD], [halfW, -halfH, -halfD], [0, halfH, -halfD],
    [-halfW, -halfH, halfD], [halfW, -halfH, halfD], [0, halfH, halfD]
  ];
  var faces = [
    [1, 2, 3], [4, 6, 5], [1, 4, 5], [1, 5, 2],
    [2, 5, 6], [2, 6, 3], [3, 6, 4], [3, 4, 1]
  ];
  return { vertices: transformVertices(vertices, component), faces: faces };
}

function buildCylinderMesh(component) {
  var segments = clamp(Math.round(component.segments || 12), 6, 20);
  var radiusTop = component.radiusTop;
  var radiusBottom = component.radiusBottom;
  var halfH = component.height / 2;
  var vertices = [[0, halfH, 0], [0, -halfH, 0]];
  var faces = [];
  var i;

  for (i = 0; i < segments; i += 1) {
    var angle = (Math.PI * 2 * i) / segments;
    vertices.push([Math.cos(angle) * radiusTop, halfH, Math.sin(angle) * radiusTop]);
  }
  for (i = 0; i < segments; i += 1) {
    var angle2 = (Math.PI * 2 * i) / segments;
    vertices.push([Math.cos(angle2) * radiusBottom, -halfH, Math.sin(angle2) * radiusBottom]);
  }
  for (i = 0; i < segments; i += 1) {
    var next = (i + 1) % segments;
    var topA = 3 + i;
    var topB = 3 + next;
    var bottomA = 3 + segments + i;
    var bottomB = 3 + segments + next;
    faces.push([1, topB, topA]);
    faces.push([2, bottomA, bottomB]);
    faces.push([topA, topB, bottomB]);
    faces.push([topA, bottomB, bottomA]);
  }
  return { vertices: transformVertices(vertices, component), faces: faces };
}

function buildSphereMesh(component) {
  var latSteps = clamp(Math.round(component.latSteps || 6), 4, 10);
  var lonSteps = clamp(Math.round(component.lonSteps || 10), 6, 16);
  var radius = component.radius;
  var vertices = [];
  var faces = [];
  var lat;
  var lon;

  for (lat = 0; lat <= latSteps; lat += 1) {
    var theta = (Math.PI * lat) / latSteps;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    for (lon = 0; lon < lonSteps; lon += 1) {
      var phi = (Math.PI * 2 * lon) / lonSteps;
      vertices.push([
        radius * Math.cos(phi) * sinTheta,
        radius * cosTheta,
        radius * Math.sin(phi) * sinTheta
      ]);
    }
  }
  for (lat = 0; lat < latSteps; lat += 1) {
    for (lon = 0; lon < lonSteps; lon += 1) {
      var nextLon = (lon + 1) % lonSteps;
      var a = lat * lonSteps + lon + 1;
      var b = lat * lonSteps + nextLon + 1;
      var c = (lat + 1) * lonSteps + nextLon + 1;
      var d = (lat + 1) * lonSteps + lon + 1;
      faces.push([a, b, c]);
      faces.push([a, c, d]);
    }
  }
  return { vertices: transformVertices(vertices, component), faces: faces };
}

function buildMesh(component) {
  if (component.type === 'cylinder') return buildCylinderMesh(component);
  if (component.type === 'sphere') return buildSphereMesh(component);
  if (component.type === 'prism') return buildPrismMesh(component);
  return buildBoxMesh(component);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function defaultPlan(base, analysis) {
  var palette = analysis.palette || {};
  var wallFront = ensureHex(palette.wallFront, '#cda36f');
  var wallSide = ensureHex(palette.wallSide, wallFront);
  var roofColor = ensureHex(analysis.roofColor || palette.roof, '#b44d2b');
  var trim = ensureHex(palette.trim, '#f2e6d2');
  var ground = ensureHex(palette.ground, '#c7b086');
  var door = ensureHex((analysis.features || {}).doorColor, '#6d4b2f');
  return {
    units: 'meters-ish',
    style: analysis.style || base,
    atmosphere: analysis.atmosphere || 'warm daylight',
    palette: {
      wallFront: wallFront,
      wallSide: wallSide,
      roof: roofColor,
      trim: trim,
      ground: ground,
      accent: door
    },
    camera: { size: 12, position: { x: 22, y: 17, z: 22 }, lookAt: { x: 0, y: 4, z: 0 } },
    lighting: {
      ambientColor: '#ffecc0',
      ambientIntensity: 1.0,
      sunColor: '#ffe090',
      sunIntensity: 2.0,
      sunPosition: { x: 16, y: 28, z: 10 }
    },
    components: [
      { type: 'box', label: 'ground', color: ground, position: { x: 0, y: -0.15, z: 0 }, size: { w: 18, h: 0.3, d: 18 }, rotation: { x: 0, y: 0, z: 0 } },
      { type: 'box', label: 'main-mass', color: wallFront, position: { x: 0, y: 3.1, z: 0 }, size: { w: 7.2, h: 6.2, d: 6.2 }, rotation: { x: 0, y: 0, z: 0 } },
      { type: 'prism', label: 'roof', color: roofColor, position: { x: 0, y: 6.7, z: 0 }, size: { w: 8.2, h: 2.2, d: 7.2 }, rotation: { x: 0, y: 0, z: 0 } },
      { type: 'box', label: 'door', color: door, position: { x: 0, y: 1.5, z: 3.18 }, size: { w: 1.6, h: 3.0, d: 0.2 }, rotation: { x: 0, y: 0, z: 0 } },
      { type: 'box', label: 'window-left', color: trim, position: { x: -1.9, y: 3.8, z: 3.2 }, size: { w: 1.2, h: 1.2, d: 0.16 }, rotation: { x: 0, y: 0, z: 0 } },
      { type: 'box', label: 'window-right', color: trim, position: { x: 1.9, y: 3.8, z: 3.2 }, size: { w: 1.2, h: 1.2, d: 0.16 }, rotation: { x: 0, y: 0, z: 0 } }
    ]
  };
}

function normalizeComponent(raw, index, plan) {
  var type = ['box', 'prism', 'cylinder', 'sphere'].indexOf(raw.type) === -1 ? 'box' : raw.type;
  var palette = plan.palette || {};
  var component = {
    type: type,
    label: String(raw.label || ('component-' + (index + 1))).slice(0, 80),
    color: ensureHex(raw.color, palette.wallFront || '#b98f68'),
    position: { x: n(raw.position && raw.position.x, 0), y: n(raw.position && raw.position.y, 0), z: n(raw.position && raw.position.z, 0) },
    rotation: { x: n(raw.rotation && raw.rotation.x, 0), y: n(raw.rotation && raw.rotation.y, 0), z: n(raw.rotation && raw.rotation.z, 0) }
  };
  if (type === 'sphere') {
    component.radius = clamp(n(raw.radius, 0.8), 0.1, 20);
    component.latSteps = clamp(n(raw.latSteps, 6), 4, 10);
    component.lonSteps = clamp(n(raw.lonSteps, 10), 6, 16);
  } else if (type === 'cylinder') {
    component.radiusTop = clamp(n(raw.radiusTop, raw.radiusBottom || 0.5), 0.05, 12);
    component.radiusBottom = clamp(n(raw.radiusBottom, raw.radiusTop || 0.5), 0.05, 12);
    component.height = clamp(n(raw.height, 1.2), 0.1, 30);
    component.segments = clamp(n(raw.segments, 12), 6, 20);
  } else {
    component.size = {
      w: clamp(n(raw.size && raw.size.w, 1), 0.1, 40),
      h: clamp(n(raw.size && raw.size.h, 1), 0.1, 40),
      d: clamp(n(raw.size && raw.size.d, 1), 0.1, 40)
    };
  }
  return component;
}

function normalizePlan(base, analysis, rawPlan) {
  var fallback = defaultPlan(base, analysis);
  var palette = rawPlan && rawPlan.palette ? rawPlan.palette : fallback.palette;
  var plan = {
    units: rawPlan && rawPlan.units ? String(rawPlan.units) : fallback.units,
    style: rawPlan && rawPlan.style ? String(rawPlan.style) : fallback.style,
    atmosphere: rawPlan && rawPlan.atmosphere ? String(rawPlan.atmosphere) : fallback.atmosphere,
    palette: {
      wallFront: ensureHex(palette.wallFront, fallback.palette.wallFront),
      wallSide: ensureHex(palette.wallSide, fallback.palette.wallSide),
      roof: ensureHex(palette.roof, fallback.palette.roof),
      trim: ensureHex(palette.trim, fallback.palette.trim),
      ground: ensureHex(palette.ground, fallback.palette.ground),
      accent: ensureHex(palette.accent, fallback.palette.accent)
    },
    camera: {
      size: clamp(n(rawPlan && rawPlan.camera && rawPlan.camera.size, fallback.camera.size), 8, 22),
      position: {
        x: n(rawPlan && rawPlan.camera && rawPlan.camera.position && rawPlan.camera.position.x, fallback.camera.position.x),
        y: n(rawPlan && rawPlan.camera && rawPlan.camera.position && rawPlan.camera.position.y, fallback.camera.position.y),
        z: n(rawPlan && rawPlan.camera && rawPlan.camera.position && rawPlan.camera.position.z, fallback.camera.position.z)
      },
      lookAt: {
        x: n(rawPlan && rawPlan.camera && rawPlan.camera.lookAt && rawPlan.camera.lookAt.x, fallback.camera.lookAt.x),
        y: n(rawPlan && rawPlan.camera && rawPlan.camera.lookAt && rawPlan.camera.lookAt.y, fallback.camera.lookAt.y),
        z: n(rawPlan && rawPlan.camera && rawPlan.camera.lookAt && rawPlan.camera.lookAt.z, fallback.camera.lookAt.z)
      }
    },
    lighting: {
      ambientColor: ensureHex(rawPlan && rawPlan.lighting && rawPlan.lighting.ambientColor, fallback.lighting.ambientColor),
      ambientIntensity: clamp(n(rawPlan && rawPlan.lighting && rawPlan.lighting.ambientIntensity, fallback.lighting.ambientIntensity), 0.1, 3),
      sunColor: ensureHex(rawPlan && rawPlan.lighting && rawPlan.lighting.sunColor, fallback.lighting.sunColor),
      sunIntensity: clamp(n(rawPlan && rawPlan.lighting && rawPlan.lighting.sunIntensity, fallback.lighting.sunIntensity), 0.1, 4),
      sunPosition: {
        x: n(rawPlan && rawPlan.lighting && rawPlan.lighting.sunPosition && rawPlan.lighting.sunPosition.x, fallback.lighting.sunPosition.x),
        y: n(rawPlan && rawPlan.lighting && rawPlan.lighting.sunPosition && rawPlan.lighting.sunPosition.y, fallback.lighting.sunPosition.y),
        z: n(rawPlan && rawPlan.lighting && rawPlan.lighting.sunPosition && rawPlan.lighting.sunPosition.z, fallback.lighting.sunPosition.z)
      }
    },
    components: []
  };
  var inputComponents = rawPlan && Array.isArray(rawPlan.components) ? rawPlan.components.slice(0, 48) : fallback.components;
  if (!inputComponents.length) inputComponents = fallback.components;
  plan.components = inputComponents.map(function(component, index) {
    return normalizeComponent(component, index, plan);
  });
  return plan;
}

function generateObj(plan) {
  var lines = ['# To Make A Home OBJ export', '# style: ' + plan.style];
  var vertexOffset = 0;
  plan.components.forEach(function(component) {
    var mesh = buildMesh(component);
    lines.push('');
    lines.push('o ' + component.label.replace(/\s+/g, '_'));
    mesh.vertices.forEach(function(vertex) {
      lines.push('v ' + vertex[0] + ' ' + vertex[1] + ' ' + vertex[2]);
    });
    mesh.faces.forEach(function(face) {
      lines.push('f ' + (face[0] + vertexOffset) + ' ' + (face[1] + vertexOffset) + ' ' + (face[2] + vertexOffset));
    });
    vertexOffset += mesh.vertices.length;
  });
  lines.push('');
  return lines.join('\n');
}

function generateSceneCode(plan, analysis) {
  var planJson = JSON.stringify(plan);
  var analysisJson = JSON.stringify(analysis);
  return [
    'var plan = ' + planJson + ';',
    'var analysis = ' + analysisJson + ';',
    'var scene = new THREE.Scene();',
    'scene.background = new THREE.Color(' + hexNumber(plan.palette.ground, '#c7b086') + ');',
    'var asp = width / height;',
    'var camera = new THREE.OrthographicCamera(-plan.camera.size*asp, plan.camera.size*asp, plan.camera.size, -plan.camera.size, 0.1, 300);',
    'camera.position.set(plan.camera.position.x, plan.camera.position.y, plan.camera.position.z);',
    'camera.lookAt(plan.camera.lookAt.x, plan.camera.lookAt.y, plan.camera.lookAt.z);',
    'var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });',
    'renderer.setSize(width, height);',
    'renderer.shadowMap.enabled = true;',
    'var controls = new OrbitControls(camera, renderer.domElement);',
    'controls.target.set(plan.camera.lookAt.x, plan.camera.lookAt.y, plan.camera.lookAt.z);',
    'controls.update();',
    'function makeGradient() {',
    '  var c = new Uint8Array(16);',
    '  var stops = [45, 105, 180, 255];',
    '  for (var i = 0; i < 4; i += 1) {',
    '    c[i*4] = stops[i]; c[i*4+1] = stops[i]; c[i*4+2] = stops[i]; c[i*4+3] = 255;',
    '  }',
    '  var grad = new THREE.DataTexture(c, 4, 1, THREE.RGBAFormat);',
    '  grad.minFilter = THREE.NearestFilter;',
    '  grad.magFilter = THREE.NearestFilter;',
    '  grad.needsUpdate = true;',
    '  return grad;',
    '}',
    'var gradientMap = makeGradient();',
    'function makeToon(color) {',
    '  return new THREE.MeshToonMaterial({ color: color, gradientMap: gradientMap, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });',
    '}',
    'function makeGeometry(component) {',
    '  if (component.type === "sphere") return new THREE.SphereGeometry(component.radius, component.lonSteps || 10, component.latSteps || 6);',
    '  if (component.type === "cylinder") return new THREE.CylinderGeometry(component.radiusTop, component.radiusBottom, component.height, component.segments || 12);',
    '  if (component.type === "prism") {',
    '    var w = component.size.w / 2;',
    '    var h = component.size.h / 2;',
    '    var d = component.size.d / 2;',
    '    var verts = new Float32Array([-w,-h,-d,w,-h,-d,0,h,-d,-w,-h,d,w,-h,d,0,h,d]);',
    '    var idx = [0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0];',
    '    var g = new THREE.BufferGeometry();',
    '    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));',
    '    g.setIndex(idx);',
    '    g.computeVertexNormals();',
    '    return g;',
    '  }',
    '  return new THREE.BoxGeometry(component.size.w, component.size.h, component.size.d);',
    '}',
    'function addComponent(component) {',
    '  var geometry = makeGeometry(component);',
    '  var mesh = new THREE.Mesh(geometry, makeToon(Number("0x" + component.color.slice(1))));',
    '  mesh.position.set(component.position.x, component.position.y, component.position.z);',
    '  mesh.rotation.set(component.rotation.x * Math.PI / 180, component.rotation.y * Math.PI / 180, component.rotation.z * Math.PI / 180);',
    '  mesh.castShadow = true;',
    '  mesh.receiveShadow = true;',
    '  var outline = new THREE.Mesh(geometry.clone(), new THREE.MeshBasicMaterial({ color: 0x120c06, side: THREE.BackSide }));',
    '  outline.scale.setScalar(1.065);',
    '  mesh.add(outline);',
    '  scene.add(mesh);',
    '}',
    'var sun = new THREE.DirectionalLight(Number("0x" + plan.lighting.sunColor.slice(1)), plan.lighting.sunIntensity);',
    'sun.position.set(plan.lighting.sunPosition.x, plan.lighting.sunPosition.y, plan.lighting.sunPosition.z);',
    'sun.castShadow = true;',
    'scene.add(sun);',
    'scene.add(new THREE.AmbientLight(Number("0x" + plan.lighting.ambientColor.slice(1)), plan.lighting.ambientIntensity));',
    'plan.components.forEach(addComponent);',
    'function animate() {',
    '  requestAnimationFrame(animate);',
    '  controls.update();',
    '  renderer.render(scene, camera);',
    '}',
    'animate();'
  ].join('\n');
}

function getProvider(providerId) {
  var id = String(providerId || defaultProvider).toLowerCase();
  if (!providers[id]) return null;
  return providers[id];
}

function getArtifactBase(base, providerId) {
  return base + '__' + providerId;
}

function artifactPaths(base, providerId) {
  var artifactBase = getArtifactBase(base, providerId);
  return {
    modelPath: path.join(MODELS_DIR, artifactBase + '.js'),
    metaPath: path.join(MODELS_DIR, artifactBase + '.meta.json'),
    analysisPath: path.join(ANALYSES_DIR, artifactBase + '.json'),
    componentsPath: path.join(COMPONENTS_DIR, artifactBase + '.json'),
    objectPath: path.join(OBJECTS_DIR, artifactBase + '.obj')
  };
}

function artifactUrls(base, providerId) {
  var artifactBase = getArtifactBase(base, providerId);
  return {
    model: '/models/' + artifactBase + '.js',
    meta: '/models/' + artifactBase + '.meta.json',
    analysis: '/analyses/' + artifactBase + '.json',
    components: '/components/' + artifactBase + '.json',
    object: '/objects/' + artifactBase + '.obj'
  };
}

function collectTextParts(parts) {
  return (parts || []).map(function(part) {
    if (!part) return '';
    if (typeof part.text === 'string') return part.text;
    if (part.type === 'text' && typeof part.text === 'string') return part.text;
    return '';
  }).join('\n');
}

function parseOpenAIResponse(json) {
  if (json && typeof json.output_text === 'string' && json.output_text.trim()) return json.output_text;
  var output = json && Array.isArray(json.output) ? json.output : [];
  var texts = [];
  output.forEach(function(item) {
    if (item && Array.isArray(item.content)) {
      item.content.forEach(function(part) {
        if (part && typeof part.text === 'string') texts.push(part.text);
      });
    }
  });
  return texts.join('\n');
}

function parseGeminiResponse(json) {
  var candidates = json && Array.isArray(json.candidates) ? json.candidates : [];
  var parts = candidates[0] && candidates[0].content && Array.isArray(candidates[0].content.parts) ? candidates[0].content.parts : [];
  return collectTextParts(parts);
}

function parseAnthropicResponse(message) {
  return collectTextParts(message && message.content);
}

function fetchJson(url, options) {
  return fetch(url, options).then(function(response) {
    return response.text().then(function(text) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + text);
      }
      return text ? JSON.parse(text) : {};
    });
  });
}

function openAIInput(prompt, mediaType, imgB64) {
  var content = [{ type: 'input_text', text: prompt }];
  if (imgB64) {
    content.push({ type: 'input_image', image_url: 'data:' + mediaType + ';base64,' + imgB64 });
  }
  return [{ role: 'user', content: content }];
}

function callProvider(providerId, stage, prompt, mediaType, imgB64) {
  var provider = getProvider(providerId);
  if (!provider) return Promise.reject(new Error('Unknown provider: ' + providerId));
  if (!provider.enabled) return Promise.reject(new Error(provider.label + ' is not enabled. Add its API key to .env and restart.'));
  var model = stage === 'analysis' ? provider.analysisModel : provider.planningModel;

  if (provider.id === 'gpt') {
    return fetchJson('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + provider.apiKey
      },
      body: JSON.stringify({
        model: model,
        input: openAIInput(prompt, mediaType, imgB64),
        max_output_tokens: stage === 'analysis' ? 900 : 1800
      })
    }).then(parseOpenAIResponse);
  }

  if (provider.id === 'gemini') {
    var parts = [{ text: prompt }];
    if (imgB64) {
      parts.push({ inline_data: { mime_type: mediaType, data: imgB64 } });
    }
    var geminiBody = JSON.stringify({
      contents: [{ parts: parts }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    });
    var geminiUrl = function(key) {
      return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + key;
    };
    return fetchJson(geminiUrl(provider.apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: geminiBody
    }).catch(function(err) {
      if (geminiKeyBackup && /HTTP 429/.test(err.message)) {
        console.warn('Gemini primary key rate-limited, retrying with backup key…');
        return fetchJson(geminiUrl(geminiKeyBackup), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: geminiBody
        });
      }
      throw err;
    }).then(parseGeminiResponse);
  }

  return anthropic.messages.create({
    model: model,
    max_tokens: stage === 'analysis' ? 700 : 1800,
    messages: [{
      role: 'user',
      content: imgB64 ? [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imgB64 } },
        { type: 'text', text: prompt }
      ] : [
        { type: 'text', text: prompt }
      ]
    }]
  }).then(parseAnthropicResponse);
}

function analyzeVisuals(providerId, mediaType, imgB64) {
  var analysisPrompt = [
    'You are a visual building analyst.',
    'Look at the image and return ONLY a JSON object.',
    'Keep the JSON compact and literal. No markdown.',
    '{',
    '  "style": "short style label",',
    '  "floors": 2,',
    '  "palette": {',
    '    "wallFront": "#c8a070",',
    '    "wallSide": "#a97b54",',
    '    "roof": "#b14c2e",',
    '    "trim": "#efe2cf",',
    '    "ground": "#b99b6d"',
    '  },',
    '  "roofType": "gable|flat|hip|shed",',
    '  "roofColor": "#b14c2e",',
    '  "massing": { "footprintWidth": 8, "footprintDepth": 7, "height": 8 },',
    '  "features": {',
    '    "hasBalcony": false,',
    '    "hasAwning": false,',
    '    "windowStyle": "arched|rectangular|mixed",',
    '    "doorColor": "#5b412d"',
    '  },',
    '  "props": ["plant"],',
    '  "atmosphere": "warm afternoon",',
    '  "notes": ["simple detail 1", "simple detail 2"]',
    '}'
  ].join('\n');

  return callProvider(providerId, 'analysis', analysisPrompt, mediaType, imgB64).then(safeJsonParse);
}

function planComponents(providerId, base, analysis) {
  var plannerPrompt = [
    'You convert a building analysis into drawable 3D components.',
    'Return ONLY JSON, no markdown.',
    'Use only supported primitive types: box, prism, cylinder, sphere.',
    'Keep the plan efficient: 10 to 32 components total.',
    'Use world units similar to meters.',
    'Output schema:',
    '{',
    '  "units": "meters-ish",',
    '  "style": "short label",',
    '  "atmosphere": "short phrase",',
    '  "palette": {',
    '    "wallFront": "#...",',
    '    "wallSide": "#...",',
    '    "roof": "#...",',
    '    "trim": "#...",',
    '    "ground": "#...",',
    '    "accent": "#..."',
    '  },',
    '  "camera": {',
    '    "size": 12,',
    '    "position": { "x": 22, "y": 17, "z": 22 },',
    '    "lookAt": { "x": 0, "y": 4, "z": 0 }',
    '  },',
    '  "lighting": {',
    '    "ambientColor": "#ffecc0",',
    '    "ambientIntensity": 1.0,',
    '    "sunColor": "#ffe090",',
    '    "sunIntensity": 2.0,',
    '    "sunPosition": { "x": 16, "y": 28, "z": 10 }',
    '  },',
    '  "components": [',
    '    {',
    '      "type": "box",',
    '      "label": "main-mass",',
    '      "color": "#c8a070",',
    '      "position": { "x": 0, "y": 3.2, "z": 0 },',
    '      "size": { "w": 8, "h": 6, "d": 7 },',
    '      "rotation": { "x": 0, "y": 0, "z": 0 }',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- Use prism for pitched roofs.',
    '- Keep rotations near 0 unless clearly needed.',
    '- Use spheres or cylinders for plants and chimneys.',
    '- Put doors and windows slightly in front of the front wall.',
    '- Make components easy to export as OBJ.',
    '- Do not include explanations.',
    '',
    'ANALYSIS:',
    JSON.stringify(analysis, null, 2),
    '',
    'BASE NAME: ' + base
  ].join('\n');

  return callProvider(providerId, 'planning', plannerPrompt, null, null).then(safeJsonParse);
}

function persistArtifacts(base, providerId, analysis, plan, code, objText) {
  var artifactBase = getArtifactBase(base, providerId);
  writeJson(path.join(ANALYSES_DIR, artifactBase + '.json'), analysis);
  writeJson(path.join(COMPONENTS_DIR, artifactBase + '.json'), plan);
  fs.writeFileSync(path.join(MODELS_DIR, artifactBase + '.js'), code);
  fs.writeFileSync(path.join(OBJECTS_DIR, artifactBase + '.obj'), objText);
  var meta = {
    schemaVersion: 1,
    base: base,
    provider: providerId,
    createdAt: new Date().toISOString(),
    style: plan.style || '',
    atmosphere: plan.atmosphere || '',
    componentCount: plan.components ? plan.components.length : 0,
    analysisModel: providers[providerId] ? providers[providerId].analysisModel : '',
    planningModel: providers[providerId] ? providers[providerId].planningModel : ''
  };
  writeJson(path.join(MODELS_DIR, artifactBase + '.meta.json'), meta);
}

app.get('/api/images', function(req, res) {
  try {
    var files = fs.readdirSync(SRC_DIR)
      .filter(function(file) { return IMAGE_EXTS.has(path.extname(file).toLowerCase()); })
      .map(function(file) { return { filename: file, url: '/src/' + file }; });
    res.json({ images: files });
  } catch (e) {
    res.json({ images: [] });
  }
});

app.get('/api/model/:filename', function(req, res) {
  var base = path.basename(req.params.filename, path.extname(req.params.filename));
  var providerId = (req.query.provider || defaultProvider).toLowerCase();
  var artifactBase = getArtifactBase(base, providerId);
  var paths = artifactPaths(base, providerId);
  var modelPath = paths.modelPath;
  var analysisPath = paths.analysisPath;
  var componentsPath = paths.componentsPath;
  var objectPath = paths.objectPath;
  if (!fs.existsSync(modelPath)) return res.json({ cached: false, provider: providerId });
  res.json({
    cached: true,
    provider: providerId,
    code: fs.readFileSync(modelPath, 'utf8'),
    analysis: fs.existsSync(analysisPath) ? JSON.parse(fs.readFileSync(analysisPath, 'utf8')) : null,
    components: fs.existsSync(componentsPath) ? JSON.parse(fs.readFileSync(componentsPath, 'utf8')) : null,
    objectUrl: fs.existsSync(objectPath) ? '/objects/' + artifactBase + '.obj' : null,
    artifactUrls: artifactUrls(base, providerId)
  });
});

app.get('/api/models', function(req, res) {
  var providerId = (req.query.provider || defaultProvider).toLowerCase();
  var suffix = '__' + providerId + '.js';
  try {
    var files = fs.readdirSync(MODELS_DIR)
      .filter(function(file) { return file.endsWith(suffix); })
      .map(function(file) { return file.slice(0, -suffix.length); });
    res.json({ models: files, provider: providerId });
  } catch (e) {
    res.json({ models: [], provider: providerId });
  }
});

app.get('/api/status', function(req, res) {
  var enabledProviders = Object.keys(providers).map(function(key) {
    return {
      id: providers[key].id,
      label: providers[key].label,
      enabled: providers[key].enabled,
      analysisModel: providers[key].analysisModel,
      planningModel: providers[key].planningModel
    };
  });
  res.json({
    hasApi: enabledProviders.some(function(provider) { return provider.enabled; }),
    isProcessing: isProcessing,
    defaultProvider: defaultProvider,
    providers: enabledProviders
  });
});

app.post('/api/generate/:filename', function(req, res) {
  var providerId = (req.body && req.body.provider || defaultProvider).toLowerCase();
  var provider = getProvider(providerId);
  if (!provider) return res.json({ error: 'Unknown provider: ' + providerId });
  if (providerId === 'manual') return res.json({ error: 'Manual Paste mode uses /api/manual/:filename.' });
  if (!provider.enabled) return res.json({ error: provider.label + ' is not enabled. Add its API key to .env and restart.' });
  if (isProcessing) return res.json({ error: 'Already generating. Please wait.' });

  var filename = req.params.filename;
  var filePath = path.join(SRC_DIR, filename);
  if (!fs.existsSync(filePath)) return res.json({ error: 'Image not found in src/: ' + filename });

  res.json({ ok: true, provider: providerId });
  processImage(filePath, providerId);
});

app.delete('/api/cache/:filename', function(req, res) {
  var providerId = (req.query.provider || defaultProvider).toLowerCase();
  var provider = getProvider(providerId);
  if (!provider) return res.json({ error: 'Unknown provider: ' + providerId });
  if (isProcessing) return res.json({ error: 'Cannot clear cache while generation is running.' });

  var filename = req.params.filename;
  var base = path.basename(filename, path.extname(filename));
  var paths = artifactPaths(base, providerId);
  var removed = [];

  Object.keys(paths).forEach(function(key) {
    if (fs.existsSync(paths[key])) {
      fs.unlinkSync(paths[key]);
      removed.push(paths[key]);
    }
  });

  res.json({ ok: true, provider: providerId, removed: removed.length });
});

app.post('/api/manual/:filename', function(req, res) {
  if (isProcessing) return res.json({ error: 'Already generating. Please wait.' });

  var filename = req.params.filename;
  var filePath = path.join(SRC_DIR, filename);
  if (!fs.existsSync(filePath)) return res.json({ error: 'Image not found in src/: ' + filename });
  if (!req.body || !req.body.analysis || !req.body.components) {
    return res.json({ error: 'Manual mode requires both analysis and components JSON.' });
  }

  var ext = path.extname(filePath).toLowerCase();
  var base = path.basename(filename, ext);

  try {
    appendGenerationLog('manual', 'Manual build started for ' + filename);
    var analysis = typeof req.body.analysis === 'string' ? safeJsonParse(req.body.analysis) : req.body.analysis;
    var rawPlan = typeof req.body.components === 'string' ? safeJsonParse(req.body.components) : req.body.components;
    var plan = normalizePlan(base, analysis, rawPlan);
    var code = generateSceneCode(plan, analysis);
    var objText = generateObj(plan);
    persistArtifacts(base, 'manual', analysis, plan, code, objText);
    res.json({
      ok: true,
      provider: 'manual',
      code: code,
      analysis: analysis,
      components: plan,
      objectUrl: artifactUrls(base, 'manual').object,
      artifactUrls: artifactUrls(base, 'manual')
    });
    appendGenerationLog('manual', 'Manual build complete for ' + filename, {
      componentCount: plan.components ? plan.components.length : 0
    });
  } catch (error) {
    appendGenerationLog('manual', 'Manual build failed for ' + filename + ': ' + error.message);
    res.json({ error: 'Manual JSON parse/build failed: ' + error.message });
  }
});

var processingTimeout = null;
var PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function finishProcessing() {
  isProcessing = false;
  if (processingTimeout) {
    clearTimeout(processingTimeout);
    processingTimeout = null;
  }
}

function processImage(filePath, providerId) {
  isProcessing = true;
  processingTimeout = setTimeout(function() {
    if (isProcessing) {
      broadcast({ type: 'error', provider: providerId, message: 'Generation timed out after 5 minutes.' });
      isProcessing = false;
      processingTimeout = null;
    }
  }, PROCESSING_TIMEOUT_MS);

  var filename = path.basename(filePath);
  var ext = path.extname(filePath).toLowerCase();
  var base = path.basename(filename, ext);
  var mediaType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
  var imgB64 = fs.readFileSync(filePath).toString('base64');
  var provider = getProvider(providerId);

  broadcast({ type: 'start', filename: filename, provider: providerId });
  broadcast({ type: 'step', step: 1, of: 3, provider: providerId, message: 'Analyzing visual features with ' + provider.label + '...' });

  analyzeVisuals(providerId, mediaType, imgB64).then(function(analysis) {
    broadcast({ type: 'analysis', analysis: analysis, provider: providerId });
    broadcast({ type: 'step', step: 2, of: 3, provider: providerId, message: 'Planning reusable 3D components with ' + provider.label + '...' });
    return planComponents(providerId, base, analysis).then(function(rawPlan) {
      var plan = normalizePlan(base, analysis, rawPlan);
      broadcast({ type: 'components', components: plan, provider: providerId });
      broadcast({ type: 'step', step: 3, of: 3, provider: providerId, message: 'Building Three.js scene and OBJ export locally...' });
      var code = generateSceneCode(plan, analysis);
      var objText = generateObj(plan);
      persistArtifacts(base, providerId, analysis, plan, code, objText);
      broadcast({
        type: 'scene_ready',
        filename: filename,
        base: base,
        provider: providerId,
        code: code,
        analysis: analysis,
        components: plan,
        objectUrl: artifactUrls(base, providerId).object,
        artifactUrls: artifactUrls(base, providerId)
      });
      finishProcessing();
    });
  }).catch(function(error) {
    broadcast({ type: 'error', provider: providerId, message: 'Generation failed: ' + error.message });
    finishProcessing();
  });
}

// ── PIPELINE API ──────────────────────────────────────────────────────────

function findPipelineCommand() {
  var condaExe = process.env.CONDA_EXE || 'conda';
  return {
    cmd: condaExe,
    args: ['run', '--no-capture-output', '-n', 'makeHome', 'python']
  };
}

function pipelinePhaseLabel(phase) {
  return {
    0: 'Input Preparation',
    1: '2D Analysis',
    2: 'Depth Analysis',
    3: 'Validation Gates',
    4: 'Krea 3D Mesh',
    5: 'Structure Extraction',
    6: 'Blender Rebuild',
    7: 'Export'
  }[phase] || ('Phase ' + phase);
}

function pipelineHeartbeatMessage(phase, seconds) {
  if (phase === 1) return 'Phase 1 still running after ' + seconds + 's. SAM2 can be quiet for 30-60s on a 1024px image.';
  if (phase === 2) return 'Phase 2 still running after ' + seconds + 's. Depth Pro may be loading weights or running CPU inference.';
  if (phase === 6) return 'Phase 6 still running after ' + seconds + 's. Blender headless rebuild can take a while.';
  return pipelinePhaseLabel(phase) + ' still running after ' + seconds + 's.';
}

function listGateImages() {
  var gatesDir = path.join(PIPELINE_ANALYSIS_DIR, 'gates');
  if (!fs.existsSync(gatesDir)) return [];
  return fs.readdirSync(gatesDir)
    .filter(function(f) { return f.endsWith('.png') || f.endsWith('.html'); })
    .sort()
    .map(function(f) { return { name: f, url: '/pipeline-analysis/gates/' + f }; });
}

function listPipelineArtifacts() {
  var files = [];
  if (fs.existsSync(PIPELINE_ANALYSIS_DIR)) {
    files = files.concat(fs.readdirSync(PIPELINE_ANALYSIS_DIR)
      .filter(function(f) {
        return f.endsWith('.png') || f.endsWith('.json') || f.endsWith('.html');
      })
      .map(function(f) {
        return {
          name: f,
          url: '/pipeline-analysis/' + f,
          kind: f.endsWith('.json') ? 'json' : (f.endsWith('.html') ? 'html' : 'image')
        };
      }));
  }

  return files.concat(listGateImages().map(function(file) {
    return {
      name: file.name,
      url: file.url,
      kind: file.url.endsWith('.html') ? 'html' : 'image'
    };
  }));
}

app.get('/api/pipeline/status', function(req, res) {
  var analysisPath = path.join(PIPELINE_ANALYSIS_DIR, 'building_analysis.json');
  var analysis = null;
  if (fs.existsSync(analysisPath)) {
    try { analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8')); } catch(e) {}
  }
  res.json({
    running: isPipelineRunning,
    analysis: analysis,
    gates: listGateImages(),
    artifacts: listPipelineArtifacts()
  });
});

app.post('/api/pipeline/:filename', function(req, res) {
  if (isPipelineRunning) return res.json({ error: 'Pipeline already running.' });

  var filename = req.params.filename;
  var imgPath = path.join(SRC_DIR, filename);
  if (!fs.existsSync(imgPath)) return res.json({ error: 'Image not found: ' + filename });

  var opts = req.body || {};
  var skipDepth   = !!opts.skipDepth;
  var skipBlender = opts.skipBlender !== false;  // default: skip blender
  var useKrea     = !!opts.useKrea;
  var kreaKey     = opts.kreaKey || '';

  res.json({ ok: true });
  isPipelineRunning = true;
  broadcast({ type: 'pipeline_start', filename: filename });
  broadcast({
    type: 'pipeline_log',
    text: 'Launching pipeline in conda env `makeHome`' +
      (skipDepth ? ' · skip depth' : ' · depth enabled') +
      (skipBlender ? ' · skip blender' : ' · blender enabled') +
      (useKrea ? ' · Krea enabled' : ' · Krea disabled')
  });

  var pipeline = findPipelineCommand();
  var args = pipeline.args.concat([
    path.join(PIPELINE_DIR, 'pipeline.py'),
    '--image', imgPath,
    '--output', path.join(PIPELINE_DIR, 'output'),
    '--analysis-dir', PIPELINE_ANALYSIS_DIR
  ]);
  if (skipDepth)   args.push('--skip-depth');
  if (skipBlender) args.push('--skip-blender');
  if (useKrea) {
    args.push('--use-krea-3d');
    if (kreaKey) { args.push('--krea-key'); args.push(kreaKey); }
  }

  var proc = require('child_process').spawn(pipeline.cmd, args, {
    cwd: PIPELINE_DIR,
    env: Object.assign({}, process.env, {
      PYTHONUNBUFFERED: '1',
      NUMBA_CACHE_DIR: process.env.NUMBA_CACHE_DIR || '/tmp/numba-cache',
      MPLCONFIGDIR: process.env.MPLCONFIGDIR || '/tmp/matplotlib',
      XDG_CACHE_HOME: process.env.XDG_CACHE_HOME || '/tmp/xdg-cache',
      LOKY_MAX_CPU_COUNT: process.env.LOKY_MAX_CPU_COUNT || '8',
      BUILDING3D_DISABLE_SAM2: process.env.BUILDING3D_DISABLE_SAM2 || '1'
    })
  });
  var lineBuffer = '';
  var currentPhase = 0;
  var phaseStartedAt = Date.now();
  var heartbeat = setInterval(function() {
    if (!isPipelineRunning) return;
    var elapsed = Math.round((Date.now() - phaseStartedAt) / 1000);
    if (elapsed >= 10) {
      broadcast({ type: 'pipeline_progress', phase: currentPhase, seconds: elapsed, text: pipelineHeartbeatMessage(currentPhase, elapsed) });
    }
  }, 10000);

  function flushLines(chunk) {
    lineBuffer += chunk;
    var parts = lineBuffer.split('\n');
    lineBuffer = parts.pop();
    parts.forEach(function(line) {
      if (!line.trim()) return;
      broadcast({ type: 'pipeline_log', text: line });
      var m = line.match(/\[Phase (\d+)/);
      if (m) {
        currentPhase = parseInt(m[1], 10);
        phaseStartedAt = Date.now();
        broadcast({ type: 'pipeline_phase', phase: currentPhase });
      }
    });
  }

  proc.stdout.on('data', function(data) { flushLines(data.toString()); });
  proc.stderr.on('data', function(data) {
    var text = data.toString().trim();
    if (text) broadcast({ type: 'pipeline_log', text: text, level: 'warn' });
  });

  proc.on('close', function(code) {
    clearInterval(heartbeat);
    if (lineBuffer.trim()) broadcast({ type: 'pipeline_log', text: lineBuffer });
    isPipelineRunning = false;
    if (code === 0) {
      var analysisPath = path.join(PIPELINE_ANALYSIS_DIR, 'building_analysis.json');
      var analysis = null;
      if (fs.existsSync(analysisPath)) {
        try { analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8')); } catch(e) {}
      }
      broadcast({
        type: 'pipeline_done',
        analysis: analysis,
        gates: listGateImages(),
        artifacts: listPipelineArtifacts()
      });
    } else {
      broadcast({ type: 'pipeline_error', message: 'Pipeline exited with code ' + code });
    }
  });

  proc.on('error', function(err) {
    clearInterval(heartbeat);
    isPipelineRunning = false;
    broadcast({ type: 'pipeline_error', message: 'Failed to start pipeline: ' + err.message });
  });
});

server.listen(PORT, function() {
  appendGenerationLog('server', 'Server started', {
    port: PORT,
    logPath: GENERATION_LOG_PATH
  });
  console.log('\n  Building → 3D');
  console.log('  ─────────────────────────────');
  console.log('  http://localhost:' + PORT + '\n');
  var open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').exec(open + ' http://localhost:' + PORT);
});
