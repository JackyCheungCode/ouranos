import { demoProducts as products } from './demo-products.js';
import './style.css';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const grid = $('#wheels-grid');
const count = $('#product-count');
const empty = $('#wheels-empty');
const catalogue = $('#catalogue');
const detail = $('#wheel-detail');
const drawer = $('#filter-drawer');
const filterControls = $('#filter-controls');
const desktopHost = $('#desktop-filter-host') || $('.wheels-toolbar');
const mobileHost = $('#filter-controls-mobile');
const params = new URLSearchParams(location.search);
const filterKeys = ['construction', 'design', 'diameter', 'width', 'pcd', 'offset', 'bore', 'finish', 'collection'];
const filterIds = Object.fromEntries(filterKeys.map((key) => [key, '#filter-' + key]));
const vehicleState = { region: 'usdm', makes: [], models: [], years: [], modifications: [], fitments: [], selectedFitment: null };
let filterMode = 'vehicle';

const list = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.results) ? value.results : [];
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') ?? '';
const nameOf = (value) => typeof value === 'string' ? value : first(value?.name, value?.title, value?.label, value?.slug, value?.code, '');
const slugOf = (value) => typeof value === 'string' ? value.toLowerCase().replace(/\s+/g, '-') : first(value?.slug, value?.id, value?.code, nameOf(value).toLowerCase().replace(/\s+/g, '-'));
const numberOf = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return '';
};
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function valueOf(selector) {
  const element = $(selector);
  return element?.value || '';
}
function setValue(selector, value) {
  const element = $(selector);
  if (!element) return;
  const next = value == null ? '' : String(value);
  if (next && element.localName === 'p-select' && !$$('p-select-option', element).some((option) => option.value === next)) {
    const option = document.createElement('p-select-option');
    option.value = next;
    option.textContent = next;
    element.append(option);
  }
  element.value = next;
  element.setAttribute('value', next);
}
async function setOptions(selector, items, placeholder, getValue = slugOf, getLabel = nameOf) {
  const element = $(selector);
  if (!element) return;
  await customElements.whenDefined('p-select');
  await customElements.whenDefined('p-select-option');
  const fragment = document.createDocumentFragment();
  const emptyOption = document.createElement('p-select-option');
  emptyOption.value = '';
  emptyOption.textContent = placeholder;
  fragment.append(emptyOption);
  for (const item of items) {
    const option = document.createElement('p-select-option');
    option.value = String(getValue(item) ?? '');
    option.textContent = String(getLabel(item) ?? '');
    fragment.append(option);
  }
  element.replaceChildren(fragment);
  element.value = '';
  element.setAttribute('value', '');
}
function setDisabled(selector, disabled) {
  const element = $(selector);
  if (!element) return;
  element.disabled = disabled;
  element.toggleAttribute('disabled', disabled);
}
function setStatus(message, state = '') {
  const status = $('#vehicle-filter-status');
  if (status) {
    status.textContent = message;
    status.dataset.state = state;
  }
}
async function wheelSize(path, query = {}) {
  const search = new URLSearchParams({ ...query, ...(vehicleState.region ? { region: vehicleState.region } : {}) });
  const response = await fetch('/api/wheel-size/' + path + '?' + search.toString(), { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.details?.detail || data?.details?.message || data?.message || data?.error || 'Wheel Size API error ' + response.status);
  return data;
}
function setMode(mode) {
  filterMode = mode === 'specification' ? 'specification' : 'vehicle';
  const control = $('#filter-mode');
  if (control) {
    control.value = filterMode;
    control.setAttribute('value', filterMode);
  }
  $('#vehicle-filter-panel').hidden = filterMode !== 'vehicle';
  $('#specification-filter-panel').hidden = filterMode !== 'specification';
}
function relocateFilterControls() {
  if (!filterControls || !mobileHost || !desktopHost) return;
  const mobile = window.matchMedia('(max-width: 760px)').matches;
  const target = mobile ? mobileHost : desktopHost;
  if (filterControls.parentElement !== target) target.append(filterControls);
}
function currentFilters() {
  return Object.fromEntries(filterKeys.map((key) => [key, valueOf(filterIds[key])]));
}
function normalize(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}
function matches(product, state) {
  return (!state.construction || product.construction === state.construction)
    && (!state.design || product.design === state.design)
    && (!state.diameter || String(product.diameter) === state.diameter)
    && (!state.width || String(product.width) === state.width)
    && (!state.pcd || normalize(product.specs?.pcd) === normalize(state.pcd))
    && (!state.offset || normalize(product.specs?.offset) === normalize(state.offset))
    && (!state.bore || normalize(product.specs?.bore) === normalize(state.bore))
    && (!state.finish || product.finish === state.finish)
    && (!state.collection || product.collection === state.collection);
}
const icons = {
  Construction: 'tire',
  Design: 'configurate',
  Diameter: 'tire',
  Width: 'adjust',
  PCD: 'grip',
  Offset: 'adjust',
  'Centre bore': 'tire',
  Finish: 'color-picker',
  Fitment: 'car',
  Collection: 'grid',
  'Fitment overview': 'car',
  'Load rating': 'weight',
  Weight: 'weight',
  'Face profile': 'configurate',
};
function spec(label, value) {
  if (!value) return '';
  return '<div class="wheel-card__spec"><span><p-icon name="' + (icons[label] || 'configurate') + '" size="xs"></p-icon>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>';
}
function inquiryUrl(product) {
  const subject = 'OURANOS wheel enquiry — ' + product.model;
  const body = [
    'Hello OURANOS,',
    '',
    'I would like to enquire about this wheel:',
    'Model: ' + product.model,
    'Collection: ' + product.collection,
    'Construction: ' + product.construction,
    'Design: ' + product.design,
    'Diameter: ' + product.diameter + ' in',
    'Width: ' + product.width + 'J',
    'PCD: ' + (product.specs?.pcd || 'Not specified'),
    'Offset: ' + (product.specs?.offset || 'Not specified'),
    'Centre bore: ' + (product.specs?.bore || 'Not specified'),
    '',
    'Please contact me with further information.',
  ].join('\n');
  return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
}
function customizeUrl(product) {
  const query = new URLSearchParams({
    source: 'wheels-catalogue',
    wheel: product.id,
    wheelName: product.model,
    diameter: String(product.diameter || ''),
    width: String(product.width || ''),
    pcd: String(product.specs?.pcd || ''),
    offset: String(product.specs?.offset || ''),
    bore: String(product.specs?.bore || ''),
  });
  return '/customize/?' + query.toString();
}
function card(product) {
  const detailUrl = '/wheels/?model=' + encodeURIComponent(product.id);
  return '<article class="wheel-card" data-product="' + escapeHtml(product.id) + '">'
    + '<a class="wheel-card__image" href="' + detailUrl + '" aria-label="Explore ' + escapeHtml(product.model) + '">'
    + '<span class="wheel-card__tag">DEMO DATA</span><img src="' + escapeHtml(product.image) + '" alt="' + escapeHtml(product.model) + ' wheel on a white background" loading="lazy" decoding="async"></a>'
    + '<div class="wheel-card__body"><span class="wheel-card__eyebrow">' + escapeHtml(product.line) + '</span>'
    + '<h3 class="wheel-card__title">' + escapeHtml(product.model) + '</h3>'
    + '<div class="wheel-card__specs">'
    + spec('Construction', product.construction) + spec('Design', product.design)
    + spec('Diameter', product.diameter + '″') + spec('Width', product.width + 'J')
    + spec('Finish', product.finish) + spec('Fitment', product.fitment)
    + '</div><div class="wheel-card__actions">'
    + '<a class="wheel-card__link" href="' + detailUrl + '">EXPLORE MODEL <span aria-hidden="true">↗</span></a>'
    + '<p-button class="wheel-card__action" variant="secondary" compact="true" href="' + inquiryUrl(product) + '">INQUIRE</p-button>'
    + '<p-button class="wheel-card__action" variant="primary" compact="true" href="' + customizeUrl(product) + '">CUSTOMIZE THIS WHEEL</p-button>'
    + '</div></div></article>';
}
function updateUrl(state, sort) {
  const next = new URLSearchParams();
  for (const key of filterKeys) if (state[key]) next.set(key, state[key].toLowerCase().replaceAll(' ', '-'));
  if (sort !== 'featured') next.set('sort', sort);
  const model = params.get('model');
  if (model) next.set('model', model);
  history.replaceState({}, '', location.pathname + (next.size ? '?' + next.toString() : '') + location.hash);
}
function render() {
  const state = currentFilters();
  const sort = valueOf('#sort-products') || 'featured';
  let visible = products.filter((product) => matches(product, state));
  if (sort === 'az') visible.sort((a, b) => a.model.localeCompare(b.model));
  else if (sort === 'newest') visible.sort((a, b) => products.indexOf(b) - products.indexOf(a));
  else visible.sort((a, b) => products.indexOf(a) - products.indexOf(b));
  grid.innerHTML = visible.map(card).join('');
  grid.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => { image.src = '/images/wheel-placeholder.svg'; }, { once: true }));
  count.textContent = visible.length + (visible.length === 1 ? ' product' : ' products');
  empty.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  const active = filterKeys.filter((key) => state[key]);
  $('#active-filters').hidden = active.length === 0;
  $('#active-filter-chips').innerHTML = active.map((key) => '<button class="filter-chip" type="button" data-remove="' + key + '">' + key + ': ' + escapeHtml(state[key]) + ' ×</button>').join('');
  updateUrl(state, sort);
}
function clearFilters() {
  for (const key of filterKeys) setValue(filterIds[key], '');
  vehicleState.selectedFitment = null;
  setValue('#filter-fitment', '');
  render();
}
function openDrawer() {
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('drawer-open');
}
function closeDrawer() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('drawer-open');
}
function showDetail(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return false;
  catalogue.hidden = true;
  $('.wheels-hero').hidden = true;
  $('.wheels-engineering').hidden = true;
  $('.wheels-fitment').hidden = true;
  $('.wheels-demo-note').hidden = true;
  detail.hidden = false;
  document.title = 'OURANOS | ' + product.model + ' Demo';
  $('#detail-title').textContent = product.model;
  $('#detail-collection').textContent = product.line + ' / TEMPORARY TEST RECORD';
  $('#detail-description').textContent = product.description;
  const image = $('#detail-image');
  image.src = product.image;
  image.alt = product.model + ' wheel product image';
  image.onerror = () => { image.src = '/images/wheel-placeholder.svg'; image.onerror = null; };
  const entries = [
    ['Construction', product.construction], ['Design', product.design], ['Diameter', product.diameter + '″'],
    ['Width', product.width + 'J'], ['Finish', product.finish], ['Fitment overview', product.fitment],
    ['PCD', product.specs.pcd], ['Offset', product.specs.offset], ['Centre bore', product.specs.bore],
    ['Load rating', product.specs.load], ['Weight', product.specs.weight], ['Face profile', product.specs.profile],
  ];
  $('#detail-specs').innerHTML = entries.filter(([, value]) => value).map(([label, value]) =>
    '<div class="wheel-detail__spec"><span><p-icon name="' + (icons[label] || 'configurate') + '" size="xs"></p-icon>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong></div>'
  ).join('');
  $('#detail-actions').innerHTML =
    '<p-button variant="secondary" href="' + inquiryUrl(product) + '">INQUIRE</p-button>' +
    '<p-button variant="primary" href="' + customizeUrl(product) + '">CUSTOMIZE THIS WHEEL</p-button>';
  history.replaceState({}, '', '/wheels/?model=' + encodeURIComponent(product.id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  return true;
}

function parseRim(value) {
  const match = String(value || '').match(/([\d.]+)\s*J?\s*[x×]\s*([\d.]+)(?:\s*ET\s*(-?[\d.]+))?/i);
  return match ? { width: match[1], diameter: match[2], offset: match[3] || '' } : {};
}
function parseSide(record, axle, fallbackRecord) {
  const side = record?.[axle] || record?.[axle + '_wheel'] || record?.[axle + 'Wheel'] || {};
  const rim = side.rim || side.wheel || side;
  const parsed = parseRim(typeof rim === 'string' ? rim : first(rim.size, rim.title, side.oem_rim));
  const technical = record?.technical || record?.specifications || fallbackRecord?.technical || fallbackRecord?.specifications || {};
  return {
    diameter: numberOf(rim.diameter, rim.rim_diameter, side.rim_diameter, side.oem_rim_diameter, parsed.diameter),
    width: numberOf(rim.width, rim.rim_width, side.rim_width, side.oem_rim_width, parsed.width),
    offset: numberOf(rim.offset, rim.rim_offset, rim.et, side.rim_offset, side.oem_rim_offset, parsed.offset),
    pcd: first(rim.bolt_pattern, rim.pcd, side.bolt_pattern, side.pcd, technical.bolt_pattern, technical.pcd, fallbackRecord?.bolt_pattern, fallbackRecord?.pcd),
    bore: numberOf(rim.centre_bore, rim.center_bore, rim.cb, side.centre_bore, side.center_bore, side.cb, technical.centre_bore, technical.center_bore, technical.cb),
    load: numberOf(rim.load, rim.load_capacity, side.load, side.load_kg, fallbackRecord?.load_kg),
  };
}
function hasAxleSpec(record) {
  const wheel = record?.rim || record?.wheel || record;
  if (typeof wheel === 'string') return !!wheel.trim();
  return ['diameter', 'rim_diameter', 'width', 'rim_width', 'offset', 'rim_offset', 'et', 'size', 'title', 'oem_rim'].some((key) => wheel?.[key] !== undefined && wheel?.[key] !== null && wheel?.[key] !== '');
}
function fitmentCategory(record) {
  const type = String(first(record?.fitment_type, record?.type, record?.category, record?.source, record?.kind, '')).toLowerCase();
  if (record?.is_oe || record?.is_stock || /oe|oem|original|factory|stock/.test(type)) return 'OE';
  if (/aftermarket|upgrade|option|alternative|upstep/.test(type)) return 'UPGRADE';
  return 'OTHER';
}
function fitmentPackages(record) {
  let wheels = record?.wheels || record?.fitments || record?.rims || record?.wheel_pairs || record?.wheel || [];
  let packages = [];
  if (Array.isArray(wheels)) packages = wheels;
  else if (wheels && typeof wheels === 'object') {
    const front = Array.isArray(wheels.front) ? wheels.front : [wheels.front].filter(Boolean);
    const rear = Array.isArray(wheels.rear) ? wheels.rear : [wheels.rear].filter(Boolean);
    packages = front.length || rear.length
      ? Array.from({ length: Math.max(front.length, rear.length) }, (_, index) => ({ front: front[index] || front[0], rear: rear[index] || rear[0] }))
      : [wheels];
  }
  if (!packages.length) packages = [record];
  return packages.map((item) => {
    const front = parseSide(item, 'front', record);
    const rearRecord = item.rear || item.rear_wheel || item.rearWheel || record.rear || record.rear_wheel || record.rearWheel;
    const rear = hasAxleSpec(rearRecord) ? parseSide(item, 'rear', record) : { ...front };
    const technical = record.technical || item.technical || record.specifications || {};
    const pcd = first(technical.bolt_pattern, technical.pcd, record.bolt_pattern, record.pcd);
    const bore = numberOf(technical.centre_bore, technical.center_bore, technical.cb, record.centre_bore, record.center_bore, record.cb);
    for (const axle of [front, rear]) {
      if (!axle.pcd) axle.pcd = pcd;
      if (axle.bore === '') axle.bore = bore;
    }
    return { type: (item.is_oe !== undefined || item.type || item.fitment_type || item.category) ? fitmentCategory(item) : fitmentCategory(record), front, rear };
  }).filter((item) => Object.values(item.front).some((value) => value !== '') || Object.values(item.rear).some((value) => value !== ''));
}
function axleLabel(axle) {
  return [axle.width ? axle.width + 'J' : '', axle.diameter ? '×' + axle.diameter : '', axle.offset !== '' ? 'ET' + axle.offset : ''].filter(Boolean).join(' ') || '—';
}
function makeFitmentOptions(records) {
  return records.flatMap(fitmentPackages).map((item, index) => ({
    ...item,
    id: String(index),
    label: item.type + ' · F ' + axleLabel(item.front) + ' · R ' + axleLabel(item.rear) + ' · PCD ' + (item.front.pcd || item.rear.pcd || '—'),
  }));
}
function applyFitment(item) {
  if (!item) return;
  vehicleState.selectedFitment = item;
  const values = {
    diameter: item.front.diameter || item.rear.diameter,
    width: item.front.width || item.rear.width,
    pcd: item.front.pcd || item.rear.pcd,
    offset: item.front.offset !== '' ? 'ET' + item.front.offset : item.rear.offset !== '' ? 'ET' + item.rear.offset : '',
    bore: item.front.bore || item.rear.bore,
  };
  for (const [key, value] of Object.entries(values)) if (value !== '' && value !== undefined && value !== null) setValue(filterIds[key], value);
  setMode('specification');
  render();
}
async function loadRegions() {
  setDisabled('#filter-region', true);
  setStatus('Loading vehicle markets…');
  try {
    const regions = list(await wheelSize('regions', {}));
    const labels = { usdm: 'United States', cdm: 'Canada', eudm: 'Europe', jdm: 'Japan' };
    await setOptions('#filter-region', regions, 'Select market', slugOf, (item) => {
      const code = String(slugOf(item)).toLowerCase();
      return (labels[code] || nameOf(item)) + ' (' + code.toUpperCase() + ')';
    });
    setValue('#filter-region', vehicleState.region);
    setDisabled('#filter-region', false);
    setStatus('Select a manufacturer to continue.');
    await loadMakes();
  } catch (error) {
    setDisabled('#filter-region', false);
    setStatus('Vehicle lookup unavailable: ' + error.message, 'error');
  }
}
async function loadMakes() {
  for (const [selector, placeholder] of [['#filter-make', 'Select manufacturer'], ['#filter-model', 'Select model'], ['#filter-year', 'Select year'], ['#filter-modification', 'All modifications'], ['#filter-fitment', 'Select wheel specification']]) {
    await setOptions(selector, [], placeholder);
    setDisabled(selector, true);
  }
  vehicleState.makes = []; vehicleState.models = []; vehicleState.years = []; vehicleState.modifications = []; vehicleState.fitments = [];
  if (!vehicleState.region) return;
  setStatus('Loading manufacturers…');
  try {
    vehicleState.makes = list(await wheelSize('makes'));
    await setOptions('#filter-make', vehicleState.makes, 'Select manufacturer');
    setDisabled('#filter-make', false);
    setStatus('Select a manufacturer.');
  } catch (error) { setStatus('Manufacturer lookup failed: ' + error.message, 'error'); }
}
async function loadModels() {
  const make = valueOf('#filter-make');
  for (const [selector, placeholder] of [['#filter-model', 'Select model'], ['#filter-year', 'Select year'], ['#filter-modification', 'All modifications'], ['#filter-fitment', 'Select wheel specification']]) {
    await setOptions(selector, [], placeholder); setDisabled(selector, true);
  }
  if (!make) return;
  setStatus('Loading vehicle models…');
  try {
    vehicleState.models = list(await wheelSize('models', { make }));
    await setOptions('#filter-model', vehicleState.models, 'Select model');
    setDisabled('#filter-model', false);
    setStatus('Select a model.');
  } catch (error) { setStatus('Model lookup failed: ' + error.message, 'error'); }
}
async function loadYears() {
  const make = valueOf('#filter-make'), model = valueOf('#filter-model');
  for (const [selector, placeholder] of [['#filter-year', 'Select year'], ['#filter-modification', 'All modifications'], ['#filter-fitment', 'Select wheel specification']]) {
    await setOptions(selector, [], placeholder); setDisabled(selector, true);
  }
  if (!make || !model) return;
  setStatus('Loading model years…');
  try {
    vehicleState.years = list(await wheelSize('years', { make, model }));
    await setOptions('#filter-year', vehicleState.years, 'Select year');
    setDisabled('#filter-year', false);
    setStatus('Select a model year.');
  } catch (error) { setStatus('Year lookup failed: ' + error.message, 'error'); }
}
async function loadModificationsAndFitments() {
  const make = valueOf('#filter-make'), model = valueOf('#filter-model'), year = valueOf('#filter-year');
  await setOptions('#filter-modification', [], 'All modifications');
  await setOptions('#filter-fitment', [], 'Select wheel specification');
  setDisabled('#filter-modification', true); setDisabled('#filter-fitment', true);
  if (!make || !model || !year) return;
  setStatus('Loading modifications and wheel specifications…');
  try {
    vehicleState.modifications = list(await wheelSize('modifications', { make, model, year }));
    await setOptions('#filter-modification', vehicleState.modifications, 'All modifications');
    setDisabled('#filter-modification', false);
    await loadFitments();
  } catch (error) { setStatus('Modification lookup failed: ' + error.message, 'error'); }
}
async function loadFitments() {
  const make = valueOf('#filter-make'), model = valueOf('#filter-model'), year = valueOf('#filter-year'), modification = valueOf('#filter-modification');
  if (!make || !model || !year) return;
  setStatus('Retrieving vehicle wheel specifications…');
  setDisabled('#filter-fitment', true);
  try {
    const data = await wheelSize('search/by_model', { make, model, year, ...(modification ? { modification } : {}) });
    vehicleState.fitments = makeFitmentOptions(list(data));
    await setOptions('#filter-fitment', vehicleState.fitments, 'Select wheel specification', (item) => item.id, (item) => item.label);
    setDisabled('#filter-fitment', false);
    setStatus(vehicleState.fitments.length ? 'Select a wheel specification to apply its dimensions.' : 'No wheel specifications were returned for this vehicle.', vehicleState.fitments.length ? 'success' : 'error');
  } catch (error) { setStatus('Fitment lookup failed: ' + error.message, 'error'); }
}
async function initSpecOptions() {
  const unique = (values) => [...new Set(values.filter(Boolean).map(String))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const fields = [
    ['#filter-pcd', products.map((item) => item.specs?.pcd), 'All PCD'],
    ['#filter-offset', products.map((item) => item.specs?.offset), 'All offsets'],
    ['#filter-bore', products.map((item) => item.specs?.bore), 'All centre bores'],
  ];
  for (const [selector, values, placeholder] of fields) {
    const element = $(selector);
    if (!element) continue;
    const options = unique(values).map((value) => ({ value, label: value }));
    await setOptions(selector, options, placeholder, (item) => item.value, (item) => item.label);
  }
}
function restoreUrlFilters() {
  for (const key of filterKeys) {
    const fromUrl = params.get(key);
    if (!fromUrl) continue;
    const normalized = fromUrl.replaceAll('-', ' ');
    const option = $$('p-select-option', $(filterIds[key])).find((node) => node.value.toLowerCase() === normalized.toLowerCase() || node.value.toLowerCase() === fromUrl.toLowerCase());
    if (option) setValue(filterIds[key], option.value);
  }
}
function bindEvents() {
  $('#filter-mode').addEventListener('change', (event) => setMode(event.detail?.value || event.target.value));
  $('#filter-region').addEventListener('change', async (event) => {
    vehicleState.region = event.detail?.value || event.target.value || '';
    await loadMakes();
  });
  $('#filter-make').addEventListener('change', loadModels);
  $('#filter-model').addEventListener('change', loadYears);
  $('#filter-year').addEventListener('change', loadModificationsAndFitments);
  $('#filter-modification').addEventListener('change', loadFitments);
  $('#filter-fitment').addEventListener('change', (event) => {
    const id = event.detail?.value ?? event.target.value;
    const item = vehicleState.fitments.find((fitment) => fitment.id === String(id));
    if (item) applyFitment(item);
  });
  for (const key of filterKeys) $(filterIds[key]).addEventListener('change', render);
  $('#sort-products').addEventListener('change', render);
  $('#clear-filters').addEventListener('click', clearFilters);
  $('#empty-clear').addEventListener('click', clearFilters);
  $('#active-filter-chips').addEventListener('click', (event) => {
    const key = event.target.closest('[data-remove]')?.dataset.remove;
    if (!key) return;
    setValue(filterIds[key], '');
    render();
  });
  $('#mobile-filter-open').addEventListener('click', openDrawer);
  $$('[data-close-drawer]').forEach((node) => node.addEventListener('click', closeDrawer));
  $('#mobile-filter-apply').addEventListener('click', closeDrawer);
  $('#mobile-filter-clear').addEventListener('click', clearFilters);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });
  window.addEventListener('resize', relocateFilterControls);
}

async function init() {
  relocateFilterControls();
  setMode('vehicle');
  bindEvents();
  await initSpecOptions();
  restoreUrlFilters();
  const requestedSort = params.get('sort');
  if (['featured', 'newest', 'az'].includes(requestedSort || '')) setValue('#sort-products', requestedSort);
  if (params.get('model') && showDetail(params.get('model'))) {
    // Detail state is rendered above.
  } else render();
  await loadRegions();
}
init();

const navDrilldown = $('#nav-drilldown');
const navButton = $('#nav-button');
if (navDrilldown && navButton) {
  navButton.addEventListener('click', () => { navDrilldown.open = true; });
  navDrilldown.addEventListener('dismiss', (event) => { event.target.open = false; });
  navDrilldown.addEventListener('update', (event) => { event.target.activeIdentifier = event.detail.activeIdentifier; });
}
