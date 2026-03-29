var plan = {"units":"meters-ish","style":"Urban Residential","atmosphere":"warm afternoon","palette":{"wallFront":"#e8c880","wallSide":"#c8a060","roof":"#d05030","trim":"#efe2cf","ground":"#e8d8b8","accent":"#607080"},"camera":{"size":12,"position":{"x":22,"y":17,"z":22},"lookAt":{"x":0,"y":4,"z":0}},"lighting":{"ambientColor":"#ffecc0","ambientIntensity":1,"sunColor":"#ffe090","sunIntensity":2,"sunPosition":{"x":16,"y":28,"z":10}},"components":[{"type":"box","label":"ground","color":"#e8d8b8","position":{"x":0,"y":-0.05,"z":0},"rotation":{"x":0,"y":0,"z":0},"size":{"w":30,"h":0.1,"d":30}},{"type":"box","label":"main-mass","color":"#e8c880","position":{"x":0,"y":3.5,"z":0},"rotation":{"x":0,"y":0,"z":0},"size":{"w":8,"h":7,"d":7}},{"type":"prism","label":"gable-roof","color":"#d05030","position":{"x":0,"y":8,"z":0},"rotation":{"x":0,"y":0,"z":0},"size":{"w":8.5,"h":2,"d":7.5}},{"type":"box","label":"front-door","color":"#405040","position":{"x":0,"y":1.25,"z":3.55},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1.5,"h":2.5,"d":0.1}},{"type":"box","label":"window-gf-left","color":"#a0c0e0","position":{"x":-2.5,"y":2,"z":3.55},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1.2,"h":1.8,"d":0.1}},{"type":"box","label":"window-gf-right","color":"#a0c0e0","position":{"x":2.5,"y":2,"z":3.55},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1.2,"h":1.8,"d":0.1}},{"type":"box","label":"window-ff-left","color":"#a0c0e0","position":{"x":-2.5,"y":5.5,"z":3.55},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1.2,"h":1.8,"d":0.1}},{"type":"box","label":"window-ff-right","color":"#a0c0e0","position":{"x":2.5,"y":5.5,"z":3.55},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1.2,"h":1.8,"d":0.1}},{"type":"box","label":"window-side-gf","color":"#a0c0e0","position":{"x":4.05,"y":2,"z":-1.5},"rotation":{"x":0,"y":90,"z":0},"size":{"w":1.2,"h":1.8,"d":0.1}},{"type":"box","label":"window-side-ff","color":"#a0c0e0","position":{"x":4.05,"y":5.5,"z":-1.5},"rotation":{"x":0,"y":90,"z":0},"size":{"w":1.2,"h":1.8,"d":0.1}},{"type":"box","label":"balcony-floor","color":"#efe2cf","position":{"x":0,"y":4.5,"z":4.25},"rotation":{"x":0,"y":0,"z":0},"size":{"w":4,"h":0.2,"d":1.5}},{"type":"box","label":"balcony-railing-front","color":"#efe2cf","position":{"x":0,"y":5.1,"z":4.95},"rotation":{"x":0,"y":0,"z":0},"size":{"w":4.2,"h":1,"d":0.1}},{"type":"box","label":"balcony-railing-left","color":"#efe2cf","position":{"x":-2.1,"y":5.1,"z":4.25},"rotation":{"x":0,"y":0,"z":0},"size":{"w":0.1,"h":1,"d":1.5}},{"type":"box","label":"balcony-railing-right","color":"#efe2cf","position":{"x":2.1,"y":5.1,"z":4.25},"rotation":{"x":0,"y":0,"z":0},"size":{"w":0.1,"h":1,"d":1.5}},{"type":"box","label":"awning","color":"#607080","position":{"x":0,"y":3.5,"z":4.05},"rotation":{"x":-15,"y":0,"z":0},"size":{"w":2,"h":0.1,"d":1}},{"type":"box","label":"chimney-base","color":"#c8a060","position":{"x":3,"y":8,"z":2},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1,"h":2,"d":1}},{"type":"box","label":"chimney-top","color":"#efe2cf","position":{"x":3,"y":9.1,"z":2},"rotation":{"x":0,"y":0,"z":0},"size":{"w":1.1,"h":0.2,"d":1.1}},{"type":"cylinder","label":"plant-trunk","color":"#806040","position":{"x":-5,"y":0.75,"z":5},"rotation":{"x":0,"y":0,"z":0},"radiusTop":0.5,"radiusBottom":0.5,"height":1.2,"segments":12},{"type":"sphere","label":"plant-foliage","color":"#609040","position":{"x":-5,"y":2.5,"z":5},"rotation":{"x":0,"y":0,"z":0},"radius":0.8,"latSteps":6,"lonSteps":10},{"type":"cylinder","label":"water-tank","color":"#607080","position":{"x":-2,"y":10,"z":-2},"rotation":{"x":0,"y":0,"z":0},"radiusTop":0.5,"radiusBottom":0.5,"height":1.2,"segments":12},{"type":"sphere","label":"satellite-dish","color":"#607080","position":{"x":2,"y":9.4,"z":-2},"rotation":{"x":-45,"y":0,"z":0},"radius":0.8,"latSteps":6,"lonSteps":10}]};
var analysis = {"style":"Urban Residential","floors":2,"palette":{"wallFront":"#e8c880","wallSide":"#c8a060","roof":"#d05030","trim":"#efe2cf","ground":"#e8d8b8"},"roofType":"gable","roofColor":"#d05030","massing":{"footprintWidth":8,"footprintDepth":7,"height":8},"features":{"hasBalcony":true,"hasAwning":true,"windowStyle":"rectangular","doorColor":"#405040"},"props":["plant","clothesline","bicycle","water tank","satellite dish","fan","person","cat","flag"],"atmosphere":"warm afternoon","notes":["multi-level structure","active outdoor spaces","dense urban living","mixed materials and textures"]};
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8d8b8);
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