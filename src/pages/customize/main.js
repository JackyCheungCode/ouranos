import './style.css';

const state = { step: 0, model: 'sport_alloy_wheel_rim', diameter: '20', width: '9.0', offset: '', pcd: '', bore: '', load: '', color: 'black', surface: 'satin' };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const colorNames = { black: 'Black', silver: 'Silver', bronze: 'Bronze' };
const colorValues = { black: 0x34383b, silver: 0xd5d7d6, bronze: 0x9b704d };
const surfaceNames = { satin: 'Satin', gloss: 'Gloss', brushed: 'Brushed' };
const surfaceRoughness = { satin: 0.34, gloss: 0.16, brushed: 0.48 };
let wheelScene;
const DRAFT_KEY = 'ouranos-bespoke-config-v1';
const draftFields = ['diameter', 'width', 'offset', 'pcd', 'bore', 'load', 'wheel-color', 'wheel-surface', 'finish-notes', 'make', 'model', 'year', 'variant', 'vehicle-mods', 'special-requests'];

function saveDraft() {
  const draft = {
    model: state.model,
    color: state.color,
    surface: state.surface,
    fields: Object.fromEntries(draftFields.map((id) => [id, document.getElementById(id)?.value ?? ''])),
  };
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* Private browsing may block storage. */ }
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (!draft || typeof draft !== 'object') return;
    if (typeof draft.color === 'string' && colorNames[draft.color]) state.color = draft.color;
    if (typeof draft.surface === 'string' && surfaceNames[draft.surface]) state.surface = draft.surface;
    for (const [id, value] of Object.entries(draft.fields || {})) {
      const field = document.getElementById(id);
      if (field && typeof value === 'string') {
        field.value = value;
        if (Object.hasOwn(state, id)) state[id] = value;
      }
    }
  } catch { /* Ignore malformed or unavailable local drafts. */ }
}

function setStep(step) {
  state.step = Math.max(0, Math.min(2, step));
  $$('.config-step').forEach((panel, index) => panel.classList.toggle('active', index === state.step));
  const stepper = $('#config-stepper');
  if (stepper) {
    stepper.querySelectorAll('p-stepper-horizontal-item').forEach((item, index) => {
      item.state = index === state.step ? 'current' : index < state.step ? 'complete' : undefined;
    });
  }
  $('#step-counter').textContent = `0${state.step + 1} / 03`;
  $('#back-button').disabled = state.step === 0;
  $('#next-button').hidden = state.step === 2;
  $('#submit-button').hidden = state.step !== 2;
}

function syncSummary() {
  $('#preview-design').textContent = 'SPORT ALLOY WHEEL RIM';
  $('#summary-design').textContent = 'Sport Alloy Wheel Rim';
  $('#summary-dimension').textContent = `${state.diameter} × ${state.width} in`;
  $('#summary-finish').textContent = `${colorNames[state.color]} · ${surfaceNames[state.surface]}`;
  saveDraft();
}

function setMaterial(color, surface) {
  if (colorNames[color]) state.color = color;
  if (surfaceNames[surface]) state.surface = surface;
  $('#wheel-color').value = state.color;
  $('#wheel-surface').value = state.surface;
  if (wheelScene) wheelScene.setMaterial(colorValues[state.color], surfaceRoughness[state.surface]);
  syncSummary();
}

$('#config-stepper').addEventListener('update', (event) => setStep(event.detail.activeStepIndex));
$('#back-button').addEventListener('click', () => setStep(state.step - 1));
$('#next-button').addEventListener('click', () => setStep(state.step + 1));
$('#wheel-color').addEventListener('change', (event) => setMaterial(event.target.value, state.surface));
$('#wheel-surface').addEventListener('change', (event) => setMaterial(state.color, event.target.value));
['diameter', 'width', 'offset', 'pcd', 'bore', 'load'].forEach((id) => {
  const el = document.getElementById(id);
  el?.addEventListener('input', () => { state[id] = el.value; syncSummary(); saveDraft(); });
  el?.addEventListener('change', () => { state[id] = el.value; syncSummary(); saveDraft(); });
});

$$('#config-form input, #config-form textarea, #config-form select, #config-form p-input-number, #config-form p-input-text, #config-form p-input-email, #config-form p-select, #config-form p-textarea').forEach((field) => { field.addEventListener('input', saveDraft); field.addEventListener('change', saveDraft); });

$('#config-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = {
    model: 'sport_alloy_wheel_rim.glb', asset_type: 'GLB test asset', diameter_in: $('#diameter').value,
    width_in: $('#width').value, offset_et_mm: $('#offset').value || null,
    pcd: $('#pcd').value || null, centre_bore_mm: $('#bore').value || null,
    load_requirement_kg: $('#load').value || null, color: colorNames[state.color], surface_treatment: surfaceNames[state.surface],
    finish_request: $('#finish-notes').value,
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
  $('#preview-status').textContent = 'LOADING GLB';
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

    const modelUrl = 'https://pub-1b5295aa36194df7bb80c797f53c3d1b.r2.dev/models/sport_alloy_wheel_rim.glb';
    $('#preview-status').textContent = 'FETCHING GLB';
    const response = await Promise.race([
      fetch(modelUrl, { mode: 'cors', credentials: 'omit', cache: 'no-cache' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout while requesting GLB')), 20000)),
    ]);
    if (!response.ok) throw new Error('GLB request failed: HTTP ' + response.status);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('model/gltf-binary') && !contentType.includes('octet-stream')) console.warn('Unexpected GLB content type:', contentType);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 20) throw new Error('GLB response is too small (' + buffer.byteLength + ' bytes)');
    if (new DataView(buffer).getUint32(0, true) !== 0x46546c67) throw new Error('Response is not a valid GLB binary (missing glTF header)');
    $('#preview-status').textContent = 'PARSING GLB';
    const loader = new GLTFLoader();
    const gltf = await loader.parseAsync(buffer, new URL('.', modelUrl).href);
    const model = gltf.scene;
    if (!model) throw new Error('GLB contains no default scene');
    model.rotation.y = Math.PI / 2;
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    if (bounds.isEmpty()) throw new Error('GLB scene contains no renderable geometry');
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(maxDimension) || maxDimension <= 0) throw new Error('GLB geometry has invalid dimensions');
    const normalized = new THREE.Group();
    normalized.add(model);
    const scale = 3.25 / maxDimension;
    normalized.scale.setScalar(scale);
    normalized.position.copy(center).multiplyScalar(-scale);
    const materialRecords = [];
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      const originals = Array.isArray(object.material) ? object.material : [object.material];
      const materials = originals.map((source) => {
        const material = source.clone();
        materialRecords.push(material);
        if (material.color) material.color.setHex(colorValues[state.color]);
        if ('metalness' in material) material.metalness = 0.88;
        if ('roughness' in material) material.roughness = surfaceRoughness[state.surface];
        return material;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
    });
    if (!materialRecords.length) throw new Error('GLB scene has no mesh materials to render');
    wheel.add(normalized);
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
      setMaterial(color, roughness) {
        materialRecords.forEach((material) => {
          if (material.color) material.color.setHex(color);
          if ('roughness' in material) material.roughness = roughness;
        });
      },
    };
      $('#preview-status').textContent = 'GLB LOADED · ' + Math.round(buffer.byteLength / 1024) + ' KB';
  } catch (error) {
    console.error('Ouranos GLB preview failed:', error);
    canvas.hidden = false;
    $('#preview-status').textContent = 'MODEL LOAD FAILED · ' + (error instanceof Error ? error.message : 'UNKNOWN ERROR');
  }
}
try {
  restoreDraft();
  setStep(0);
  syncSummary();
  setMaterial(state.color, state.surface);
  initWheel();
} catch (error) {
  console.error('Ouranos configurator initialization failed:', error);
  const status = $('#preview-status');
  if (status) status.textContent = 'CONFIGURATOR ERROR';
}
