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
  // Chamfered cube: 6 square faces, 12 bevelled edges, 8 triangular corners. Click any piece to snap there.
  const H = 36, C = 11; // half edge and chamfer size, px
  const FACES = [ // [label, outward normal, local +x] in world space
    ['Front', [0, 0, -1], [-1, 0, 0]],
    ['Back', [0, 0, 1], [1, 0, 0]],
    ['Right', [1, 0, 0], [0, 0, -1]],
    ['Left', [-1, 0, 0], [0, 0, 1]],
    ['Top', [0, 1, 0], [1, 0, 0]],
    ['Bottom', [0, -1, 0], [1, 0, 0]],
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
  const css = (v) => new THREE.Vector3(v.x, -v.y, v.z); // world (y up) -> CSS (y down)
  const piece = (cls, w, h, n, xAxis, dist, dir, label) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pv-piece ' + cls;
    b.style.width = w + 'px'; b.style.height = h + 'px'; b.style.margin = `${-h / 2}px 0 0 ${-w / 2}px`;
    const z = css(new THREE.Vector3(...n)).normalize();
    const x = css(new THREE.Vector3(...xAxis)).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    const t = z.clone().multiplyScalar(dist);
    b.style.transform = `matrix3d(${[x.x, x.y, x.z, 0, y.x, y.y, y.z, 0, z.x, z.y, z.z, 0, t.x, t.y, t.z, 1].join(',')})`;
    if (label) b.textContent = label;
    b.setAttribute('aria-label', label ? `${label} view` : 'Isometric view');
    b.addEventListener('click', () => flyTo(dir));
    cube.appendChild(b);
  };
  const face = 2 * (H - C);
  FACES.forEach(([name, n, xd]) => piece('face', face, face, n, xd, H, n, name));
  const AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const add = (...vs) => [0, 1, 2].map((k) => vs.reduce((a, v) => a + v[k], 0));
  const mul = (v, k) => v.map((n) => n * k);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) for (const si of [1, -1]) for (const sj of [1, -1]) {
    const n1 = mul(AX[i], si), n2 = mul(AX[j], sj), nb = add(n1, n2);
    piece('edge', face, C * Math.SQRT2, nb, cross(n1, n2), (2 * H - C) / Math.SQRT2, nb);
  }
  for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) {
    const n = [sx, sy, sz], side = C * Math.SQRT2;
    // orient the triangle so its apex points toward the +/-x edge, matching the bevels around it
    const nW = new THREE.Vector3(...n).normalize();
    const e = new THREE.Vector3(sx, 0, 0);
    const a = e.clone().sub(nW.clone().multiplyScalar(e.dot(nW))).normalize();
    const yC = css(a).negate(), zC = css(nW);
    const xW = css(new THREE.Vector3().crossVectors(yC, zC)).toArray();
    piece('corner', side, side * Math.sqrt(3) / 2, n, xW, (3 * H - 2 * C) / Math.sqrt(3), n);
  }
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
    const ray = new THREE.Raycaster(), m = new THREE.Vector2(), picks = [];
    const panel = document.createElement('div');
    panel.className = 'pv-pick';
    panel.innerHTML = '<b>Label helper</b><span>Click a part on the model, then name it.</span><ol></ol><button type="button">Copy list</button>';
    el.appendChild(panel);
    const list = panel.querySelector('ol');
    panel.querySelector('button').addEventListener('click', (e) => {
      const txt = JSON.stringify(picks);
      navigator.clipboard && navigator.clipboard.writeText(txt);
      e.target.textContent = 'Copied!';
      setTimeout(() => { e.target.textContent = 'Copy list'; }, 1500);
    });
    renderer.domElement.addEventListener('click', (e) => {
      if (!mesh) return;
      const b = renderer.domElement.getBoundingClientRect();
      m.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(m, camera);
      const hit = ray.intersectObject(mesh)[0];
      if (!hit) return;
      const pt = hit.point.toArray().map((n) => +n.toFixed(3));
      el.dataset.lastPick = JSON.stringify(pt);
      const name = (window.prompt('Name this part (leave empty to skip):') || '').trim();
      if (!name) return;
      picks.push({ p: pt, t: name });
      const li = document.createElement('li');
      li.textContent = `${name}  ${JSON.stringify(pt)}`;
      list.appendChild(li);
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
