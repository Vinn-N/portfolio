// 1. MOBILE MENU
const hamburger = document.querySelector(".hamburger");
const navLeft = document.querySelector(".nav-left");
const navRight = document.querySelector(".nav-right");
const navLinks = document.querySelectorAll(".nav-link");

if (hamburger) {
  function mobileMenu() {
    hamburger.classList.toggle("active");
    navLeft.classList.toggle("active");
    navRight.classList.toggle("active");
  }

  function closeMenu() {
    hamburger.classList.remove("active");
    navLeft.classList.remove("active");
    navRight.classList.remove("active");
  }

  hamburger.addEventListener("click", mobileMenu);
  navLinks.forEach(link => link.addEventListener("click", closeMenu));
}

// 2. THEME TOGGLE + PERSISTENCE
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

function switchTheme(e) {
  const theme = e.target.checked ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

toggleSwitch.addEventListener("change", switchTheme, false);

window.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("theme");
  if (stored) {
    document.documentElement.setAttribute("data-theme", stored);
    toggleSwitch.checked = (stored === "dark");
  }
});

// 3. STARFIELD EFFECT
const starWrapper = document.querySelector('.stars-wrapper');
if (starWrapper) {
  for (let i = 0; i < 700; i++) {
    const star = document.createElement('div');
    star.classList.add('star');
    Object.assign(star.style, {
      top:      `${Math.random() * 100}vh`,
      left:     `${Math.random() * 100}vw`,
      width:    `${Math.random() * 4 + 0.5}px`,
      height:   `${Math.random() * 4 + 0.5}px`,
      animationDelay: `${Math.random() * 8}s`
    });
    starWrapper.appendChild(star);
  }
}

// 4. PETAL EFFECT (small horizontal wiggle)
const petalsWrapper = document.querySelector('.petals-wrapper');
if (petalsWrapper) {
  function createPetal() {
    const petal = document.createElement('div');
    petal.classList.add('svg-petal');

    // size & duration
    const size     = 16 + Math.random() * 24;           // px
    const duration = 18000 + Math.random() * 10000;      // ms

    petal.style.setProperty('--petal-size', `${size}px`);
    petal.style.setProperty('--fall-duration', `${duration}ms`);

    // horizontal wiggle settings
    const startX = Math.random() * 100;  // starting 0–100vw
    const wiggle = 6;                    // max ±5vw

    const randOffset = () => (Math.random() * 2 * wiggle - wiggle);

    petal.style.setProperty('--x-start',  `${startX}vw`);
    petal.style.setProperty('--x-mid1',   `${startX + randOffset()}vw`);
    petal.style.setProperty('--x-mid2',   `${startX + randOffset()}vw`);
    petal.style.setProperty('--x-mid3',   `${startX + randOffset()}vw`);
    petal.style.setProperty('--x-end',    `${startX + randOffset()}vw`);

    // spin variables
    const baseSpin = Math.random() * 360;
    petal.style.setProperty('--spin-start', `${baseSpin}deg`);
    petal.style.setProperty('--spin-mid1',  `${baseSpin +  90 + Math.random() * 400}deg`);
    petal.style.setProperty('--spin-mid2',  `${baseSpin + 180 + Math.random() * 400}deg`);
    petal.style.setProperty('--spin-mid3',  `${baseSpin + 270 + Math.random() * 400}deg`);
    petal.style.setProperty('--spin-end',   `${baseSpin + 360 + Math.random() * 460}deg`);

    // SVG content
    petal.innerHTML = `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 2C26 20 10 22 10 34c0 12 12 22 22 28
                 10-6 22-16 22-28 0-12-16-14-22-32z"
              fill="${['#f9ccd3','#fbb1bd','#ffd6e0'][Math.floor(Math.random()*3)]}"/>
      </svg>`;



    petalsWrapper.appendChild(petal);
    petal.addEventListener('animationend', () => petal.remove());
  }

  let lastPetalTime = 0;
  const petalInterval = 1000; // 2 seconds
  
  function animatePetals(timestamp) {
    const isLightMode = document.documentElement.getAttribute('data-theme') !== 'dark';
  
    if (isLightMode && timestamp - lastPetalTime > petalInterval) {
      createPetal();
      lastPetalTime = timestamp;
    }
  
    requestAnimationFrame(animatePetals);
  }
  
  requestAnimationFrame(animatePetals);
  
}

// 5. AUTO-UPDATE FOOTER DATE
const dateElem = document.querySelector("#datee");
if (dateElem) {
  dateElem.textContent = new Date().getFullYear();
}

// ---------- Theme toggle (persistent, respects system preference) ----------
(function () {
  const STORAGE_KEY = 'theme';
  const root = document.documentElement;
  const btn  = document.getElementById('theme-toggle');

  // Determine initial theme: saved -> system -> default 'light'
  const saved = localStorage.getItem(STORAGE_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (systemPrefersDark ? 'dark' : 'light');

  setTheme(initial);

  // Keep aria-pressed in sync & swap icons
  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    if (btn) btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  // Toggle on click
  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }

  // Optional: live update if user changes OS theme
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      // Only follow system if user hasn't explicitly chosen
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  } catch (_) {}
})();
