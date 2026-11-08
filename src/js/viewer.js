// Drag-to-rotate STL viewer for project pages:
// <div class="pp-viewer" data-src="model.stl" data-color="#5E8157" data-rotate="x,y,z" data-labels='[...]'>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const VIEWS = {
  front: [0, 0, 1],
  side: [1, 0, 0],
  top: [0, 1, 0.001],
  iso: [0.64, 0.48, 0.77],
};

document.querySelectorAll('.pp-viewer').forEach((el) => {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  const DIST = 3.6;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(...VIEWS.iso.map((v) => v * DIST));
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
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; syncPlay(); });

  // ---- toolbar: view buttons, play/pause, fullscreen
  const bar = document.createElement('div');
  bar.className = 'pv-bar';
  const mk = (txt, label, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', label); b.addEventListener('click', fn);
    bar.appendChild(b); return b;
  };
  let fly = null;
  const flyTo = (dir) => {
    controls.autoRotate = false; syncPlay();
    const to = new THREE.Vector3(...dir).normalize().multiplyScalar(DIST);
    const from = camera.position.clone();
    const t0 = performance.now();
    fly = (now) => {
      const k = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - k, 3);
      camera.position.copy(from.clone().lerp(to, e)).setLength(DIST);
      if (k >= 1) fly = null;
    };
  };
  Object.keys(VIEWS).forEach((name) => mk(name[0].toUpperCase() + name.slice(1), `${name} view`, () => flyTo(VIEWS[name])));
  const play = mk('Pause', 'Pause or resume spin', () => { controls.autoRotate = !controls.autoRotate; syncPlay(); });
  function syncPlay() { play.textContent = controls.autoRotate ? 'Pause' : 'Spin'; }
  const canFs = el.requestFullscreen || el.webkitRequestFullscreen;
  if (canFs) {
    const fs = mk('Fullscreen', 'Toggle fullscreen', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    });
    const upd = () => { fs.textContent = (document.fullscreenElement || document.webkitFullscreenElement) === el ? 'Exit' : 'Fullscreen'; };
    document.addEventListener('fullscreenchange', upd);
    document.addEventListener('webkitfullscreenchange', upd);
  }
  el.appendChild(bar);

  // ---- part labels
  let labels = [];
  try { labels = JSON.parse(el.dataset.labels || '[]'); } catch (e) { /* ignore bad JSON */ }
  const tags = labels.map((l) => {
    const t = document.createElement('div');
    t.className = 'pv-tag';
    t.innerHTML = `<button type="button" class="pv-dot" aria-label="${l.t}"></button><span class="pv-name">${l.t}</span>${l.d ? `<span class="pv-desc">${l.d}</span>` : ''}`;
    t.querySelector('.pv-dot').addEventListener('click', () => {
      const open = t.classList.toggle('open');
      tags.forEach((o) => { if (o !== t) o.classList.remove('open'); });
      if (open) { controls.autoRotate = false; syncPlay(); }
    });
    el.appendChild(t);
    return t;
  });
  const v3 = new THREE.Vector3();
  const placeTags = () => {
    const w = el.clientWidth, h = el.clientHeight;
    labels.forEach((l, i) => {
      v3.set(...l.p);
      const facing = v3.clone().normalize().dot(camera.position.clone().normalize()) > -0.15;
      v3.project(camera);
      tags[i].style.transform = `translate(${(v3.x * 0.5 + 0.5) * w}px, ${(-v3.y * 0.5 + 0.5) * h}px)`;
      tags[i].classList.toggle('hidden', !facing);
    });
  };

  const resize = () => {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();

  // ---- model (big files load only once the viewer scrolls into view)
  let mesh = null;
  const load = () => new STLLoader().load(el.dataset.src, (geo) => {
    geo.computeVertexNormals();
    geo.center();
    geo.computeBoundingSphere();
    const s = 1 / geo.boundingSphere.radius;
    const color = new THREE.Color(el.dataset.color || '#5E8157');
    mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15 }));
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

  // ---- ?pick: click the model to read its coordinates (for placing labels)
  if (location.search.includes('pick')) {
    const ray = new THREE.Raycaster(), m = new THREE.Vector2();
    renderer.domElement.addEventListener('click', (e) => {
      if (!mesh) return;
      const b = renderer.domElement.getBoundingClientRect();
      m.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(m, camera);
      const hit = ray.intersectObject(mesh)[0];
      if (hit) {
        const p = hit.point.toArray().map((n) => +n.toFixed(3));
        el.dataset.lastPick = JSON.stringify(p);
        console.log('pick', JSON.stringify(p));
      }
    });
  }
  window.__viewers = window.__viewers || [];
  window.__viewers.push({ el, camera, flyTo, VIEWS });

  renderer.setAnimationLoop((now) => {
    if (fly) fly(now);
    controls.update();
    renderer.render(scene, camera);
    placeTags();
  });
});
