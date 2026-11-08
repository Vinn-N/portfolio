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
  camera.position.set(2.0, 1.5, 2.4);
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

  // Big models load only once the viewer scrolls into view.
  const load = () => new STLLoader().load(el.dataset.src, (geo) => {
    geo.computeVertexNormals();
    geo.center();
    geo.computeBoundingSphere();
    const s = 1 / geo.boundingSphere.radius;
    const color = new THREE.Color(el.dataset.color || '#5E8157');
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 }));
    mesh.scale.setScalar(s);
    // data-rotate="x,y,z" in degrees, to stand a CAD export upright
    const r = (el.dataset.rotate || '0,0,0').split(',').map((d) => (parseFloat(d) * Math.PI) / 180);
    mesh.rotation.set(r[0], r[1], r[2]);
    scene.add(mesh);
    el.classList.add('ready');
  });
  new IntersectionObserver((entries, obs) => {
    if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); load(); }
  }, { rootMargin: '300px' }).observe(el);

  renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
});
