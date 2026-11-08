// Drag-to-rotate STL viewer for project pages:
// <div class="pp-viewer" data-src="model.stl" data-color="#5E8157" data-rotate="x,y,z" data-labels='[...]'>
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

const VIEWS = {
  iso: [0.64, 0.48, -0.77], // front-right-top
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

  // ---- view cube (click a face to snap to that view) + home / spin / fullscreen
  const ctl = document.createElement('div');
  ctl.className = 'pv-ctl';
  const cubeWrap = document.createElement('div');
  cubeWrap.className = 'pv-cubewrap';
  const cube = document.createElement('div');
  cube.className = 'pv-cube';
  const H = 31; // half the cube edge, px
  // [label, CSS transform, face normal, local +x, local +y] -- vectors in world space
  const FACES = [
    ['Front', `rotateY(180deg) translateZ(${H}px)`, [0, 0, -1], [-1, 0, 0], [0, -1, 0]],
    ['Back', `translateZ(${H}px)`, [0, 0, 1], [1, 0, 0], [0, -1, 0]],
    ['Right', `rotateY(90deg) translateZ(${H}px)`, [1, 0, 0], [0, 0, -1], [0, -1, 0]],
    ['Left', `rotateY(-90deg) translateZ(${H}px)`, [-1, 0, 0], [0, 0, 1], [0, -1, 0]],
    ['Top', `rotateX(90deg) translateZ(${H}px)`, [0, 1, 0], [1, 0, 0], [0, 0, 1]],
    ['Bottom', `rotateX(-90deg) translateZ(${H}px)`, [0, -1, 0], [1, 0, 0], [0, 0, -1]],
  ];
  let fly = null;
  const flyTo = (dir) => {
    controls.autoRotate = false; syncPlay();
    const d = dir.slice();
    if (!d[0] && !d[2]) d[2] = 0.001; // avoid the pole singularity looking straight down or up
    const to = new THREE.Vector3(...d).normalize().multiplyScalar(DIST);
    const from = camera.position.clone();
    const t0 = performance.now();
    fly = (now) => {
      const k = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - k, 3);
      camera.position.copy(from.clone().lerp(to, e)).setLength(DIST);
      if (k >= 1) fly = null;
    };
  };
  // each face is a 3x3 grid: centre = that face, edges and corners = angled (iso) views
  FACES.forEach(([name, tf, n, xd, yd]) => {
    const f = document.createElement('div');
    f.className = 'pv-face';
    f.style.transform = tf;
    for (let j = -1; j <= 1; j++) {
      for (let i = -1; i <= 1; i++) {
        const dir = [0, 1, 2].map((k) => n[k] + i * xd[k] + j * yd[k]);
        const c = document.createElement('button');
        c.type = 'button';
        c.className = 'pv-cell' + (i === 0 && j === 0 ? ' mid' : i && j ? ' corner' : ' edge');
        if (i === 0 && j === 0) { c.textContent = name; c.setAttribute('aria-label', `${name} view`); }
        else c.setAttribute('aria-label', 'Isometric view');
        c.addEventListener('click', () => flyTo(dir));
        f.appendChild(c);
      }
    }
    cube.appendChild(f);
  });
  // dragging the cube rotates the model with it
  let drag = null, moved = false;
  cubeWrap.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY }; moved = false;
    controls.autoRotate = false; fly = null; syncPlay();
    cubeWrap.setPointerCapture(e.pointerId);
  });
  cubeWrap.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 4) return;
    moved = true;
    drag.x = e.clientX; drag.y = e.clientY;
    const sp = new THREE.Spherical().setFromVector3(camera.position);
    sp.theta -= dx * 0.012;
    sp.phi = Math.min(Math.PI - 0.05, Math.max(0.05, sp.phi - dy * 0.012));
    camera.position.setFromSpherical(sp);
  });
  const endDrag = (e) => { if (drag) { try { cubeWrap.releasePointerCapture(e.pointerId); } catch (_) {} } drag = null; };
  cubeWrap.addEventListener('pointerup', endDrag);
  cubeWrap.addEventListener('pointercancel', endDrag);
  cubeWrap.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
  cubeWrap.appendChild(cube);
  ctl.appendChild(cubeWrap);

  const ICON = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
    spin: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    exit: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  };
  const mk = (icon, label, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pv-btn'; b.innerHTML = ICON[icon]; b.title = label; b.setAttribute('aria-label', label);
    b.addEventListener('click', fn);
    ctl.appendChild(b); return b;
  };
  mk('home', 'Isometric view', () => flyTo(VIEWS.iso));
  const play = mk('pause', 'Pause or resume spin', () => { controls.autoRotate = !controls.autoRotate; syncPlay(); });
  function syncPlay() { play.innerHTML = controls.autoRotate ? ICON.pause : ICON.spin; }
  const canFs = el.requestFullscreen || el.webkitRequestFullscreen;
  if (canFs) {
    const fs = mk('full', 'Fullscreen', () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    });
    const upd = () => { fs.innerHTML = (document.fullscreenElement || document.webkitFullscreenElement) === el ? ICON.exit : ICON.full; };
    document.addEventListener('fullscreenchange', upd);
    document.addEventListener('webkitfullscreenchange', upd);
  }
  el.appendChild(ctl);

  // keep the cube's orientation in sync with the camera (world -> CSS, y flipped)
  const syncCube = () => {
    camera.updateMatrixWorld();
    const e = camera.matrixWorldInverse.elements; // column-major 4x4, rotation part in [0..2],[4..6],[8..10]
    const S = [1, -1, 1];
    const m = [];
    for (let col = 0; col < 3; col++) {
      for (let row = 0; row < 3; row++) m.push(S[row] * S[col] * e[col * 4 + row]);
      m.push(0);
    }
    m.push(0, 0, 0, 1);
    cube.style.transform = `matrix3d(${m.join(',')})`;
  };

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
    syncCube();
  });
});
