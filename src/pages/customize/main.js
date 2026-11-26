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
    $$('.design-choice').forEach((el) => el.classList.toggle('selected', el.dataset.design === state.design));
  } catch { /* Ignore malformed or unavailable local drafts. */ }
}

function setStep(step) {
  state.step = Math.max(0, Math.min(3, step));
  $$('.config-step').forEach((panel, index) => panel.classList.toggle('active', index === state.step));
  const stepper = $('#config-stepper');
  if (stepper) {
    stepper.querySelectorAll('p-stepper-horizontal-item').forEach((item, index) => {
      item.state = index === state.step ? 'current' : index < state.step ? 'complete' : undefined;
    });
  }
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

$('#config-stepper').addEventListener('update', (event) => setStep(event.detail.activeStepIndex));
$('#back-button').addEventListener('click', () => setStep(state.step - 1));
$('#next-button').addEventListener('click', () => setStep(state.step + 1));
$$('.design-choice').forEach((button) => button.addEventListener('click', () => {
  state.design = button.dataset.design;
  $$('.design-choice').forEach((el) => el.classList.toggle('selected', el === button));
  syncSummary();
  if (wheelScene) wheelScene.setDesign(state.design);
}));
$$('.finish-choice, .swatch').forEach((button) => button.addEventListener('click', () => setFinish(button.dataset.finish)));
['diameter', 'width', 'offset', 'pcd', 'bore', 'load'].forEach((id) => {
  const el = document.getElementById(id);
  el?.addEventListener('input', () => { state[id] = el.value; syncSummary(); saveDraft(); });
  el?.addEventListener('change', () => { state[id] = el.value; syncSummary(); saveDraft(); });
});

$$('#config-form input, #config-form textarea, #config-form select, #config-form p-input-number, #config-form p-input-text, #config-form p-input-email, #config-form p-select, #config-form p-textarea').forEach((field) => { field.addEventListener('input', saveDraft); field.addEventListener('change', saveDraft); });

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
  const copy = document.createElement('p-button');
  copy.type = 'button';
  copy.variant = 'primary';
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
  const download = document.createElement('p-button');
  download.type = 'button';
  download.variant = 'secondary';
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
  $('#preview-status').textContent = 'LOADING TEST MODEL';
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
    const { GLTFLoader } = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.15, 6.2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x292d31, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.1); key.position.set(4, 5, 7); scene.add(key);
    const rimLight = new THREE.DirectionalLight(0x9aa8b4, 1.5); rimLight.position.set(-5, -2, 3); scene.add(rimLight);
    const wheel = new THREE.Group(); scene.add(wheel);

    const loader = new GLTFLoader();
    const gltf = await Promise.race([
      loader.loadAsync('https://pub-1b5295aa36194df7bb80c797f53c3d1b.r2.dev/models/sport_alloy_wheel_rim.glb'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('GLB load timed out after 20 seconds')), 20000)),
    ]);
    const model = gltf.scene;
    // The source GLB is authored with its axle along X; rotate it so the wheel face points toward the camera.
    model.rotation.y = Math.PI / 2;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    model.position.sub(center);
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    model.scale.setScalar(3.25 / maxDimension);

    const applyFinish = (hex) => {
      model.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const updated = materials.map((source) => {
          const material = source.clone();
          if (material.color) material.color.setHex(hex);
          if ('metalness' in material) material.metalness = 0.88;
          if ('roughness' in material) material.roughness = 0.27;
          return material;
        });
        object.material = Array.isArray(object.material) ? updated : updated[0];
      });
    };
    applyFinish(finishColors[state.finish]);
    wheel.add(model);
    wheel.rotation.x = -0.08;
    wheel.rotation.y = -0.22;

    let dragging = false, lastX = 0, lastY = 0;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      wheel.rotation.y += (e.clientX - lastX) * 0.009;
      wheel.rotation.x += (e.clientY - lastY) * 0.006;
      lastX = e.clientX; lastY = e.clientY;
    });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); camera.position.z = Math.max(4.8, Math.min(8.5, camera.position.z + e.deltaY * 0.004)); }, { passive: false });
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    function animate() {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
    wheelScene = {
      setFinish(color) { applyFinish(color); },
      // The supplied test asset has fixed spoke geometry; design choices remain specification metadata.
      setDesign() {},
    };
    $('#preview-fallback').hidden = true;
    $('#preview-status').textContent = 'TEST MODEL · GLB';
  } catch (error) {
    console.warn('GLB preview unavailable; showing static preview.', error);
    canvas.hidden = true;
    $('#preview-fallback').hidden = false;
    $('#preview-status').textContent = 'PREVIEW UNAVAILABLE';
    const errorText = document.createElement('p');
    errorText.textContent = error instanceof Error ? error.message : 'Unknown preview error';
    errorText.setAttribute('role', 'status');
    $('#preview-fallback').append(errorText);
  }
}
try {
  restoreDraft();
  setStep(0);
  syncSummary();
  setFinish(state.finish);
  initWheel();
} catch (error) {
  console.error('Ouranos configurator initialization failed:', error);
  const status = $('#preview-status');
  if (status) status.textContent = 'CONFIGURATOR ERROR';
}
