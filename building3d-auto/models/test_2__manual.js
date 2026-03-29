var plan = {"units":"meters-ish","style":"storybook townhouse","atmosphere":"warm afternoon","palette":{"wallFront":"#c8a070","wallSide":"#a97b54","roof":"#b14c2e","trim":"#efe2cf","ground":"#b99b6d","accent":"#5b412d"},"camera":{"size":12,"position":{"x":22,"y":17,"z":22},"lookAt":{"x":0,"y":4,"z":0}},"lighting":{"ambientColor":"#ffecc0","ambientIntensity":1,"sunColor":"#ffe090","sunIntensity":2,"sunPosition":{"x":16,"y":28,"z":10}},"components":[{"type":"box","label":"ground","color":"#b99b6d","position":{"x":0,"y":-0.15,"z":0},"rotation":{"x":0,"y":0,"z":0},"size":{"w":18,"h":0.3,"d":18}},{"type":"box","label":"main-mass","color":"#c8a070","position":{"x":0,"y":3.1,"z":0},"rotation":{"x":0,"y":0,"z":0},"size":{"w":7.2,"h":6.2,"d":6.2}},{"type":"prism","label":"roof","color":"#b14c2e","position":{"x":0,"y":6.7,"z":0},"rotation":{"x":0,"y":0,"z":0},"size":{"w":8.2,"h":2.2,"d":7.2}}]};
var analysis = {"style":"storybook townhouse","floors":2,"palette":{"wallFront":"#c8a070","wallSide":"#a97b54","roof":"#b14c2e","trim":"#efe2cf","ground":"#b99b6d"},"roofType":"gable","roofColor":"#b14c2e","massing":{"footprintWidth":8,"footprintDepth":7,"height":8},"features":{"hasBalcony":false,"hasAwning":false,"windowStyle":"rectangular","doorColor":"#5b412d"},"props":["plant"],"atmosphere":"warm afternoon","notes":["simple facade","front-facing roof"]};
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xb99b6d);
var asp = width / height;
var camera = new THREE.OrthographicCamera(-plan.camera.size*asp, plan.camera.size*asp, plan.camera.size, -plan.camera.size, 0.1, 300);
camera.position.set(plan.camera.position.x, plan.camera.position.y, plan.camera.position.z);
camera.lookAt(plan.camera.lookAt.x, plan.camera.lookAt.y, plan.camera.lookAt.z);
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
var controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(plan.camera.lookAt.x, plan.camera.lookAt.y, plan.camera.lookAt.z);
controls.update();
function makeGradient() {
  var c = new Uint8Array(16);
  var stops = [45, 105, 180, 255];
  for (var i = 0; i < 4; i += 1) {
    c[i*4] = stops[i]; c[i*4+1] = stops[i]; c[i*4+2] = stops[i]; c[i*4+3] = 255;
  }
  var grad = new THREE.DataTexture(c, 4, 1, THREE.RGBAFormat);
  grad.minFilter = THREE.NearestFilter;
  grad.magFilter = THREE.NearestFilter;
  grad.needsUpdate = true;
  return grad;
}
var gradientMap = makeGradient();
function makeToon(color) {
  return new THREE.MeshToonMaterial({ color: color, gradientMap: gradientMap, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
}
function makeGeometry(component) {
  if (component.type === "sphere") return new THREE.SphereGeometry(component.radius, component.lonSteps || 10, component.latSteps || 6);
  if (component.type === "cylinder") return new THREE.CylinderGeometry(component.radiusTop, component.radiusBottom, component.height, component.segments || 12);
  if (component.type === "prism") {
    var w = component.size.w / 2;
    var h = component.size.h / 2;
    var d = component.size.d / 2;
    var verts = new Float32Array([-w,-h,-d,w,-h,-d,0,h,-d,-w,-h,d,w,-h,d,0,h,d]);
    var idx = [0,1,2,3,5,4,0,3,4,0,4,1,1,4,5,1,5,2,2,5,3,2,3,0];
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  return new THREE.BoxGeometry(component.size.w, component.size.h, component.size.d);
}
function addComponent(component) {
  var geometry = makeGeometry(component);
  var mesh = new THREE.Mesh(geometry, makeToon(Number("0x" + component.color.slice(1))));
  mesh.position.set(component.position.x, component.position.y, component.position.z);
  mesh.rotation.set(component.rotation.x * Math.PI / 180, component.rotation.y * Math.PI / 180, component.rotation.z * Math.PI / 180);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  var outline = new THREE.Mesh(geometry.clone(), new THREE.MeshBasicMaterial({ color: 0x120c06, side: THREE.BackSide }));
  outline.scale.setScalar(1.065);
  mesh.add(outline);
  scene.add(mesh);
}
var sun = new THREE.DirectionalLight(Number("0x" + plan.lighting.sunColor.slice(1)), plan.lighting.sunIntensity);
sun.position.set(plan.lighting.sunPosition.x, plan.lighting.sunPosition.y, plan.lighting.sunPosition.z);
sun.castShadow = true;
scene.add(sun);
scene.add(new THREE.AmbientLight(Number("0x" + plan.lighting.ambientColor.slice(1)), plan.lighting.ambientIntensity));
plan.components.forEach(addComponent);
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();