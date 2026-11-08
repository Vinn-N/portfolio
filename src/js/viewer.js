// Drag-to-rotate STL viewer for project pages: <div class="pp-viewer" data-src="model.stl">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

document.querySelectorAll('.pp-viewer').forEach((el) => {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(2.4, 1.8, 2.8);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6;
  renderer.domElement.style.touchAction = 'pan-y'; // let the page scroll on touch screens
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; });

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();

  new STLLoader().load(el.dataset.src, (geo) => {
    geo.computeVertexNormals();
    geo.center();
    geo.computeBoundingSphere();
    const s = 1 / geo.boundingSphere.radius;
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x4fd1c5, roughness: 0.45, metalness: 0.1 }));
    mesh.scale.setScalar(s);
    scene.add(mesh);
    el.classList.add('ready');
  });

  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
});
