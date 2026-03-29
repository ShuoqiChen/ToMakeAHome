var scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0ebe3);

var asp = width / height;
var cs = 13;
var camera = new THREE.OrthographicCamera(-cs*asp, cs*asp, cs, -cs, 0.1, 300);
camera.position.set(22, 17, 22);
camera.lookAt(0, 4, 0);

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;

var controls = new OrbitControls(camera, renderer.domElement);

function makeToon(color) {
    var c = new Uint8Array(16);
    var stops = [40, 100, 180, 255];
    for (var i = 0; i < 4; i++) {
        c[i*4]=stops[i]; c[i*4+1]=stops[i]; c[i*4+2]=stops[i]; c[i*4+3]=255;
    }
    var grad = new THREE.DataTexture(c, 4, 1, THREE.RGBAFormat);
    grad.minFilter = THREE.NearestFilter;
    grad.magFilter = THREE.NearestFilter;
    grad.needsUpdate = true;
    return new THREE.MeshToonMaterial({ color: color, gradientMap: grad, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
}

function addMesh(geo, color, x, y, z) {
    var mat = makeToon(color);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    var outGeo = geo.clone();
    var outMat = new THREE.MeshBasicMaterial({ color: 0x120c06, side: THREE.BackSide });
    var outline = new THREE.Mesh(outGeo, outMat);
    outline.scale.setScalar(1.065);
    mesh.add(outline);
    scene.add(mesh);
    return mesh;
}

function box(w, h, d, color, x, y, z) {
    return addMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
}

// Ground / courtyard
box(22, 0.3, 18, 0xC8B898, 0, -0.15, 0);
box(20, 0.05, 16, 0xD4C4A0, 0, 0.02, 0);

// --- MAIN BUILDING ---
// Ground floor stone base
box(7, 3.8, 6, 0xA89880, 0, 1.9, 0);
// Upper floor pink plaster
box(7, 4, 6, 0xD4826A, 0, 5.8, 0);

// Stone quoins (corner details)
box(0.5, 3.8, 6.1, 0x9A8B78, 3.75, 1.9, 0);
box(0.5, 3.8, 6.1, 0x9A8B78, -3.75, 1.9, 0);
box(0.5, 4, 6.1, 0xC07858, 3.75, 5.8, 0);
box(0.5, 4, 6.1, 0xC07858, -3.75, 5.8, 0);

// Stone arch entrance
box(3.2, 2.8, 0.4, 0x9A8B78, 0, 1.4, 3.2);
// Arched door
box(2.4, 2.5, 0.2, 0x7A5530, 0, 1.25, 3.35);
// Door planks
box(0.1, 2.4, 0.05, 0x6A4520, -0.5, 1.2, 3.42);
box(0.1, 2.4, 0.05, 0x6A4520, 0.5, 1.2, 3.42);
box(0.1, 2.4, 0.05, 0x6A4520, 0.0, 1.2, 3.42);

// Upper floor windows (green shutters)
box(1.6, 1.6, 0.15, 0x5A9060, -1.5, 6.0, 3.15);
box(1.6, 1.6, 0.15, 0x5A9060, 1.5, 6.0, 3.15);
box(0.6, 1.6, 0.1, 0x4A7A50, -2.7, 6.0, 3.22);
box(0.6, 1.6, 0.1, 0x4A7A50, -0.3, 6.0, 3.22);
box(0.6, 1.6, 0.1, 0x4A7A50, 0.3, 6.0, 3.22);
box(0.6, 1.6, 0.1, 0x4A7A50, 2.7, 6.0, 3.22);

// Side window
box(1.4, 1.6, 0.15, 0x5A9060, -3.58, 5.8, 0);

// Main roof - terracotta tiles
box(7.8, 0.5, 6.8, 0xC4663A, 0, 8.05, 0);
// Roof ridge
box(7.4, 0.5, 1.2, 0xB05830, 0, 8.45, 0);
// Roof overhang detail
box(8.2, 0.3, 0.5, 0xA04E28, 0, 7.72, 3.5);
box(8.2, 0.3, 0.5, 0xA04E28, 0, 7.72, -3.5);

// --- CHIMNEYS ---
// Left tall chimney
box(1.1, 6, 1.1, 0xA89880, -2, 11.2, -1.0);
box(1.4, 0.45, 1.4, 0x8A7B68, -2, 14.4, -1.0);
// Smoke puffs
box(0.7, 0.7, 0.7, 0xDDD8D0, -2, 15.4, -0.9);
box(0.9, 0.9, 0.9, 0xE8E3DC, -1.7, 16.4, -0.6);
box(0.6, 0.6, 0.6, 0xF0EDE8, -1.4, 17.1, -0.3);

// Right smaller chimney
box(0.9, 3.5, 0.9, 0xA89880, 2.2, 9.95, -1.5);
box(1.2, 0.4, 1.2, 0x8A7B68, 2.2, 11.9, -1.5);

// --- FORGE / WORKSHOP (left lean-to) ---
box(5.5, 3.2, 5.5, 0x9A8070, -5.75, 1.6, -0.25);
// Lean-to roof
box(6.0, 0.3, 6.0, 0x6B5A48, -5.75, 3.35, -0.25);
box(6.2, 0.2, 0.3, 0x5A4838, -5.75, 3.3, 2.85);

// Forge furnace/oven
box(2.0, 2.0, 1.8, 0x7A6858, -4.6, 1.0, 0.6);
box(1.2, 1.0, 0.2, 0xFF6010, -4.6, 0.75, 1.5);
box(0.8, 0.7, 0.15, 0xFF9030, -4.6, 0.7, 1.56);

// Anvil
box(0.7, 0.25, 0.5, 0x3A3A3A, -7, 0.45, 1.6);
box(0.3, 0.55, 0.4, 0x303030, -7, 0.17, 1.6);

// Barrel
box(0.75, 1.1, 0.75, 0x7A5530, -3.8, 0.55, 2.0);
box(0.78, 0.1, 0.78, 0x5A3A18, -3.8, 0.15, 2.0);
box(0.78, 0.1, 0.78, 0x5A3A18, -3.8, 0.55, 2.0);
box(0.78, 0.1, 0.78, 0x5A3A18, -3.8, 0.95, 2.0);

// Workbench shelves
box(2.2, 0.15, 0.6, 0x8A6040, -7, 1.8, 0.2);
box(2.2, 0.15, 0.6, 0x8A6040, -7, 1.2, 0.2);
box(0.12, 1.8, 0.12, 0x7A5030, -5.9, 0.9, -0.1);
box(0.12, 1.8, 0.12, 0x7A5030, -8.1, 0.9, -0.1);

// Hanging horseshoes
box(0.35, 0.1, 0.35, 0x444444, -6.5, 2.8, 0.3);
box(0.35, 0.1, 0.35, 0x444444, -7.2, 2.8, 0.3);

// --- EXTERIOR STAIRCASE (right side) ---
for (var s = 0; s < 6; s++) {
    box(2.8, 0.28, 0.65, 0x9A8B78, 4.6, 0.28 + s * 0.52, 2.6 - s * 0.52);
}
box(2.8, 3.2, 0.3, 0x8A7B68, 4.6, 1.6, -0.5);
box(0.1, 2.5, 0.1, 0x7A6858, 3.3, 2.2, 2.6);
box(0.1, 2.5, 0.1, 0x7A6858, 5.9, 2.2, 2.6);

// --- BALCONY / UPPER PORCH (right) ---
box(3.0, 0.25, 2.4, 0x9A8B78, 5.0, 3.85, 1.2);
for (var p = 0; p < 4; p++) {
    box(0.12, 0.9, 0.12, 0x8A7B68, 3.7 + p * 0.75, 4.35, 2.35);
}
box(2.4, 0.12, 0.12, 0x8A7B68, 5.05, 4.82, 2.35);
box(3.2, 0.3, 2.6, 0xC4663A, 5.0, 8.1, 1.2);
box(0.4, 3.8, 0.4, 0x9A8B78, 6.3, 2.0, 0.2);

// Lantern bracket
box(0.08, 0.08, 1.2, 0x2A2020, 3.65, 5.8, 2.9);
box(0.28, 0.5, 0.28, 0xD4A030, 3.65, 5.45, 3.55);

// --- VEGETATION ---
// Cypress tree (left)
box(0.35, 1.8, 0.35, 0x7A5A30, -3.8, 0.9, -4.0);
box(1.4, 2.0, 1.4, 0x2D6B28, -3.8, 2.9, -4.0);
box(1.1, 2.0, 1.1, 0x286428, -3.8, 4.5, -4.0);
box(0.85, 1.8, 0.85, 0x225C22, -3.8, 5.9, -4.0);
box(0.65, 1.6, 0.65, 0x1E5420, -3.8, 7.1, -4.0);
box(0.45, 1.4, 0.45, 0x1A4C1C, -3.8, 8.1, -4.0);
box(0.3, 1.0, 0.3, 0x164418, -3.8, 8.9, -4.0);

// Green shrubs (left)
box(2.2, 2.0, 1.0, 0x4A8A3A, -7.5, 1.0, -2.5);
box(1.5, 1.4, 0.8, 0x3D7A30, -7.8, 2.0, -1.8);
box(1.8, 1.2, 0.9, 0x4A8A3A, -7.2, 0.6, -1.0);

// Flowering bush right - pink
box(2.2, 2.2, 2.0, 0xD4788A, 6.2, 1.1, 0.0);
box(1.6, 1.6, 1.6, 0xCC6078, 7.0, 1.9, 0.5);
box(1.4, 1.2, 1.4, 0xE08898, 6.0, 2.7, -0.4);
box(0.5, 0.5, 0.5, 0xFF9AAA, 5.5, 2.5, 1.2);
box(0.4, 0.4, 0.4, 0xFF8898, 7.2, 2.2, -0.3);

// Flowering bush right - purple/lavender
box(1.9, 1.9, 1.8, 0x9B6BB5, 6.0, 0.95, 3.0);
box(1.4, 1.4, 1.4, 0x8B5BA8, 6.8, 1.6, 3.3);
box(0.6, 0.6, 0.6, 0xBB8BE0, 5.6, 2.1, 3.5);
box(0.5, 0.5, 0.5, 0xAA7BD0, 7.0, 2.0, 2.8);

// Small potted plants near door
box(0.5, 0.5, 0.5, 0x8A6848, 1.8, 0.25, 3.3);
box(0.4, 0.6, 0.4, 0x4A8A3A, 1.8, 0.7, 3.3);

// --- LIGHTING ---
var ambient = new THREE.AmbientLight(0xFFF8E8, 0.7);
scene.add(ambient);

var sun = new THREE.DirectionalLight(0xFFEED0, 1.3);
sun.position.set(18, 25, 15);
sun.castShadow = true;
scene.add(sun);

var fill = new THREE.DirectionalLight(0xD0E8FF, 0.25);
fill.position.set(-12, 8, -8);
scene.add(fill);

var fireGlow = new THREE.PointLight(0xFF6010, 1.5, 8);
fireGlow.position.set(-4.6, 1.2, 1.8);
scene.add(fireGlow);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
