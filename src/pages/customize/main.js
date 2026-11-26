import './style.css';

const state = { step: 0, design: 'Aero / 10 Spoke', diameter: '20', width: '9.0', offset: '', pcd: '', bore: '', load: '', finish: 'satin-black' };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const finishNames = { 'satin-black': 'Satin Black', 'brushed-titanium': 'Brushed Titanium', 'gloss-silver': 'Gloss Silver', bronze: 'Champagne Bronze' };
const finishColors = { 'satin-black': 0x34383b, 'brushed-titanium': 0xb9bec0, 'gloss-silver': 0xe0e1df, bronze: 0x9b704d };
let wheelScene;
const DRAFT_KEY = 'ouranos-bespoke-config-v1';
const draftFields = ['diameter', 'width', 'offset', 'pcd', 'bore', 'load', 'design-notes', 'finish-notes', 'make', 'model', 'year', 'variant', 'vehicle-mods', 'special-requests'];

function saveDraft() {
  const draft = {
    design: state.design,
    finish: state.finish,
    fields: Object.fromEntries(draftFields.map((id) => [id, document.getElementById(id)?.value ?? ''])),
  };
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* Private browsing may block storage. */ }
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!draft || typeof draft !== 'object') return;
    if (typeof draft.design === 'string') state.design = draft.design;
    if (typeof draft.finish === 'string' && finishNames[draft.finish]) state.finish = draft.finish;
    for (const [id, value] of Object.entries(draft.fields || {})) {
      const field = document.getElementById(id);
      if (field && typeof value === 'string') {
        field.value = value;
        if (Object.hasOwn(state, id)) state[id] = value;
      }
    }
    $('.design-choice').forEach((el) => el.classList.toggle('selected', el.dataset.design === state.design));
  } catch { /* Ignore malformed or unavailable local drafts. */ }
}

function setStep(step) {
  state.step = Math.max(0, Math.min(3, step));
  $$('.config-step').forEach((panel, index) => panel.classList.toggle('active', index === state.step));
  $$('.step-tab').forEach((tab, index) => {
    tab.classList.toggle('active', index === state.step);
    tab.setAttribute('aria-current', index === state.step ? 'step' : 'false');
  });
  $('#step-counter').textContent = `0${state.step + 1} / 04`;
  $('#back-button').disabled = state.step === 0;
  $('#next-button').hidden = state.step === 3;
  $('#submit-button').hidden = state.step !== 3;
}

function syncSummary() {
  $('#preview-design').textContent = state.design.toUpperCase();
  $('#summary-design').textContent = state.design;
  $('#summary-dimension').textContent = `${state.diameter} × ${state.width} in`;
  $('#summary-finish').textContent = finishNames[state.finish];
  $('#preview-status').textContent = 'CONCEPT MODEL';
  saveDraft();
}

function setFinish(finish) {
  state.finish = finish;
  $$('.finish-choice').forEach((el) => el.classList.toggle('selected', el.dataset.finish === finish));
  $$('.swatch').forEach((el) => el.classList.toggle('active', el.dataset.finish === finish));
  if (wheelScene) wheelScene.setFinish(finishColors[finish]);
  $('#fallback-wheel').style.borderColor = `#${finishColors[finish].toString(16).padStart(6, '0')}`;
  syncSummary();
}

$('.step-tab').forEach((tab) => tab.addEventListener('click', () => setStep(Number(tab.dataset.step))));
$('#back-button').addEventListener('click', () => setStep(state.step - 1));
$('#next-button').addEventListener('click', () => setStep(state.step + 1));
$$('.design-choice').forEach((button) => button.addEventListener('click', () => {
  state.design = button.dataset.design;
  $('.design-choice').forEach((el) => el.classList.toggle('selected', el === button));
  syncSummary();
  if (wheelScene) wheelScene.setDesign(state.design);
}));
$('.finish-choice, .swatch').forEach((button) => button.addEventListener('click', () => setFinish(button.dataset.finish)));
['diameter', 'width', 'offset', 'pcd', 'bore', 'load'].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => { state[id] = el.value; syncSummary(); saveDraft(); });
});

$('#config-form input, #config-form textarea, #config-form select').forEach((field) => field.addEventListener('change', saveDraft));

$('#config-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = {
    design: state.design, construction: 'Forged', diameter_in: $('#diameter').value,
    width_in: $('#width').value, offset_et_mm: $('#offset').value || null,
    pcd: $('#pcd').value || null, centre_bore_mm: $('#bore').value || null,
    load_requirement_kg: $('#load').value || null, finish: finishNames[state.finish],
    design_direction: $('#design-notes').value, finish_request: $('#finish-notes').value,
    vehicle: { make: $('#make').value, model: $('#model').value, year: $('#year').value, variant: $('#variant').value, modifications: $('#vehicle-mods').value },
    bespoke_requirements: $('#special-requests').value,
    customer: { name: $('#customer-name').value, email: $('#customer-email').value },
    fitment_status: 'Pending engineering review',
  };
  const message = $('#submission-message');
  message.hidden = false;
  message.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = 'Your configuration is ready for review.';
  const note = document.createElement('p');
  note.textContent = 'Your configuration has not been transmitted. Download or copy this specification and send it to your Ouranos representative for engineering review.';
  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin:16px 0';
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'next-button';
  copy.textContent = 'COPY CONFIGURATION';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      copy.textContent = 'COPIED';
    } catch {
      copy.textContent = 'COPY UNAVAILABLE';
    }
  });
  const download = document.createElement('button');
  download.type = 'button';
  download.className = 'back-button';
  download.textContent = 'DOWNLOAD CONFIGURATION';
  download.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ouranos-bespoke-configuration.json';
    link.click();
    URL.revokeObjectURL(url);
  });
  actions.append(copy, download);
  const details = document.createElement('pre');
  details.textContent = JSON.stringify(payload, null, 2);
  details.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font-size:10px;line-height:1.55;color:#c3c5c4;background:#17191b;padding:14px;margin-top:16px;max-height:260px;overflow:auto';
  message.append(title, note, actions, details);
  message.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

async function initWheel() {
  const canvas = $('#wheel-canvas');
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.2, 7.2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x292d31, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(4, 5, 7); scene.add(key);
    const rimLight = new THREE.DirectionalLight(0x9aa8b4, 1.5); rimLight.position.set(-5, -2, 3); scene.add(rimLight);
    const wheel = new THREE.Group(); scene.add(wheel);
    const metal = new THREE.MeshStandardMaterial({ color: finishColors[state.finish], metalness: 0.88, roughness: 0.27 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x17191b, metalness: 0.55, roughness: 0.36 });
    const bright = new THREE.MeshStandardMaterial({ color: 0x9da2a4, metalness: 0.94, roughness: 0.2 });
    const tire = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.22, 24, 100), new THREE.MeshStandardMaterial({ color: 0x111315, roughness: 0.82 }));
    wheel.add(tire);
    const outerLip = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.075, 16, 100), bright); wheel.add(outerLip);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 0.62, 80, 1, true), dark);
    barrel.rotation.x = Math.PI / 2; wheel.add(barrel);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.12, 80), dark);
    disc.rotation.x = Math.PI / 2; disc.position.z = -0.05; wheel.add(disc);
    const spokes = new THREE.Group(); wheel.add(spokes);
    function buildSpokes(count) {
      while (spokes.children.length) {
        const child = spokes.children[0];
        spokes.remove(child);
        child.geometry?.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose()); else child.material?.dispose();
      }
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.08, 0.16), metal);
        spoke.position.set(Math.sin(angle) * 0.48, Math.cos(angle) * 0.48, 0.18);
        spoke.rotation.z = -angle;
        spokes.add(spoke);
        if (state.design.startsWith('Cross') || state.design.startsWith('Mesh')) {
          const secondary = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.82, 0.12), bright);
          secondary.position.set(Math.sin(angle + 0.12) * 0.43, Math.cos(angle + 0.12) * 0.43, 0.22);
          secondary.rotation.z = -(angle + 0.12);
          spokes.add(secondary);
        }
      }
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.2, 48), bright);
    hub.rotation.x = Math.PI / 2; hub.position.z = 0.25; wheel.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 48), dark);
    cap.rotation.x = Math.PI / 2; cap.position.z = 0.37; wheel.add(cap);
    const bolts = new THREE.Group(); wheel.add(bolts);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12), bright);
      bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.sin(a) * 0.27, Math.cos(a) * 0.27, 0.39); bolts.add(bolt);
    }
    buildSpokes(10);
    wheel.rotation.x = -0.12; wheel.rotation.y = -0.28;
    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      wheel.rotation.y += (e.clientX - lastX) * 0.009;
      wheel.rotation.x += (e.clientY - lastY) * 0.006;
      lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); camera.position.z = Math.max(5.4, Math.min(9, camera.position.z + e.deltaY * 0.004)); }, { passive: false });
    function resize() {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    let spokeCount = 10;
    function animate() {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    wheelScene = {
      setFinish(color) { metal.color.setHex(color); },
      setDesign(name) {
        const count = name.startsWith('Cross') ? 10 : name.startsWith('Mono') ? 6 : name.startsWith('Mesh') ? 14 : 10;
        spokeCount = count;
        buildSpokes(count);
      },
    };
    $('#preview-fallback').hidden = true;
    $$('.design-choice').forEach((button) => button.addEventListener('click', () => wheelScene.setDesign(button.dataset.design)));
  } catch (error) {
    console.warn('3D preview unavailable; showing static preview.', error);
    canvas.hidden = true;
    $('#preview-fallback').hidden = false;
  }
}
restoreDraft();
setStep(0);
syncSummary();
setFinish(state.finish);
initWheel();
