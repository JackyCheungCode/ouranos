import { demoProducts as products } from './demo-products.js';
import './style.css';


const grid = document.querySelector('#wheels-grid');
const count = document.querySelector('#product-count');
const empty = document.querySelector('#wheels-empty');
const catalogue = document.querySelector('#catalogue');
const detail = document.querySelector('#wheel-detail');
const filters = ['construction','design','diameter','width','finish','collection'];
const desktopIds = Object.fromEntries(filters.map((key) => [key, '#filter-' + key]));
const mobileIds = Object.fromEntries(filters.map((key) => [key, '#mobile-' + key]));
const params = new URLSearchParams(location.search);
const drawer = document.querySelector('#filter-drawer');

function valueOf(selector) {
  const element = document.querySelector(selector);
  return element?.value || '';
}
function setValue(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.value = value || '';
}
function currentFilters() {
  return Object.fromEntries(filters.map((key) => [key, valueOf(desktopIds[key])]));
}
function matches(product, state) {
  return (!state.construction || product.construction === state.construction)
    && (!state.design || product.design === state.design)
    && (!state.diameter || String(product.diameter) === state.diameter)
    && (!state.width || String(product.width) === state.width)
    && (!state.finish || product.finish === state.finish)
    && (!state.collection || product.collection === state.collection);
}
function spec(label, value) {
  return value ? '<div class="wheel-card__spec"><span>' + label + '</span><strong>' + value + '</strong></div>' : '';
}
function card(product) {
  return '<article class="wheel-card" data-product="' + product.id + '">'
    + '<a class="wheel-card__image" href="/wheels/?model=' + product.id + '" aria-label="Explore ' + product.model + '">'
    + '<span class="wheel-card__tag">DEMO DATA</span><img src="' + product.image + '" alt="' + product.model + ' wheel on a white background" loading="lazy" decoding="async"></a>'
    + '<div class="wheel-card__body"><span class="wheel-card__eyebrow">' + product.line + '</span>'
    + '<h3 class="wheel-card__title">' + product.model + '</h3>'
    + '<div class="wheel-card__specs">'
    + spec('Construction', product.construction) + spec('Design', product.design)
    + spec('Diameter', product.diameter + '″') + spec('Width', product.width + 'J')
    + spec('Finish', product.finish) + spec('Fitment', product.fitment)
    + '</div><a class="wheel-card__link" href="/wheels/?model=' + product.id + '">EXPLORE MODEL <span aria-hidden="true">↗</span></a></div></article>';
}
function updateUrl(state, sort) {
  const next = new URLSearchParams();
  for (const key of filters) if (state[key]) next.set(key, state[key].toLowerCase().replaceAll(' ', '-'));
  if (sort !== 'featured') next.set('sort', sort);
  const model = params.get('model');
  if (model) next.set('model', model);
  history.replaceState({}, '', location.pathname + (next.size ? '?' + next.toString() : '') + location.hash);
}
function render() {
  const state = currentFilters();
  const sort = valueOf('#sort-products') || 'featured';
  let visible = products.filter((product) => matches(product, state));
  if (sort === 'az') visible.sort((a,b) => a.model.localeCompare(b.model));
  else if (sort === 'newest') visible.sort((a,b) => products.indexOf(b) - products.indexOf(a));
  else visible.sort((a,b) => products.indexOf(a) - products.indexOf(b));
  grid.innerHTML = visible.map(card).join('');
  grid.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => { image.src = '/images/wheel-placeholder.svg'; }, { once: true }));
  count.textContent = visible.length + (visible.length === 1 ? ' product' : ' products');
  empty.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
  const active = filters.filter((key) => state[key]);
  document.querySelector('#active-filters').hidden = active.length === 0;
  document.querySelector('#active-filter-chips').innerHTML = active.map((key) => '<button class="filter-chip" type="button" data-remove="' + key + '">' + key + ': ' + state[key] + ' ×</button>').join('');
  updateUrl(state, sort);
}
function applyMobileFilters() {
  for (const key of filters) setValue(desktopIds[key], valueOf(mobileIds[key]));
  render();
  closeDrawer();
}
function clearFilters() {
  for (const key of filters) {
    setValue(desktopIds[key], '');
    setValue(mobileIds[key], '');
  }
  render();
}
function openDrawer() {
  for (const key of filters) setValue(mobileIds[key], valueOf(desktopIds[key]));
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden','false');
  document.body.classList.add('drawer-open');
}
function closeDrawer() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden','true');
  document.body.classList.remove('drawer-open');
}
function showDetail(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return false;
  catalogue.hidden = true;
  document.querySelector('.wheels-hero').hidden = true;
  document.querySelector('.wheels-engineering').hidden = true;
  document.querySelector('.wheels-fitment').hidden = true;
  document.querySelector('.wheels-demo-note').hidden = true;
  detail.hidden = false;
  document.title = 'OURANOS | ' + product.model + ' Demo';
  document.querySelector('#detail-title').textContent = product.model;
  document.querySelector('#detail-collection').textContent = product.line + ' / TEMPORARY TEST RECORD';
  document.querySelector('#detail-description').textContent = product.description;
  const image = document.querySelector('#detail-image');
  image.src = product.image;
  image.alt = product.model + ' wheel product image';
  image.onerror = () => { image.src = '/images/wheel-placeholder.svg'; image.onerror = null; };
  const entries = [['Construction',product.construction],['Design',product.design],['Diameter',product.diameter + '″'],['Width',product.width + 'J'],['Finish',product.finish],['Fitment overview',product.fitment],['Wheel size',product.specs.size],['PCD',product.specs.pcd],['Offset',product.specs.offset],['Center bore',product.specs.bore],['Load rating',product.specs.load],['Weight',product.specs.weight],['Face profile',product.specs.profile]];
  document.querySelector('#detail-specs').innerHTML = entries.filter(([,value]) => value).map(([label,value]) => '<div class="wheel-detail__spec"><span>' + label + '</span><strong>' + value + '</strong></div>').join('');
  history.replaceState({}, '', '/wheels/?model=' + product.id);
  window.scrollTo({top:0,behavior:'instant'});
  return true;
}

for (const key of filters) {
  const fromUrl = params.get(key);
  if (fromUrl) {
    const normalized = fromUrl.replaceAll('-',' ');
    const option = [...document.querySelectorAll(desktopIds[key] + ' p-select-option')].find((node) => node.value.toLowerCase() === normalized || node.value.toLowerCase() === fromUrl);
    if (option) {
      setValue(desktopIds[key], option.value);
      setValue(mobileIds[key], option.value);
    }
  }
  document.querySelector(desktopIds[key]).addEventListener('change', render);
  document.querySelector(mobileIds[key]).addEventListener('change', () => {});
}
document.querySelector('#sort-products').addEventListener('change', render);
document.querySelector('#clear-filters').addEventListener('click', clearFilters);
document.querySelector('#empty-clear').addEventListener('click', clearFilters);
document.querySelector('#active-filter-chips').addEventListener('click', (event) => {
  const key = event.target.closest('[data-remove]')?.dataset.remove;
  if (!key) return;
  setValue(desktopIds[key], '');
  setValue(mobileIds[key], '');
  render();
});
document.querySelector('#mobile-filter-open').addEventListener('click', openDrawer);
document.querySelectorAll('[data-close-drawer]').forEach((node) => node.addEventListener('click', closeDrawer));
document.querySelector('#mobile-filter-apply').addEventListener('click', applyMobileFilters);
document.querySelector('#mobile-filter-clear').addEventListener('click', () => {
  for (const key of filters) setValue(mobileIds[key], '');
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

const requestedSort = params.get('sort');
if (['featured', 'newest', 'az'].includes(requestedSort || '')) setValue('#sort-products', requestedSort);
const modelId = params.get('model');
if (!modelId || !showDetail(modelId)) render();

const navDrilldown = document.getElementById('nav-drilldown');
const navButton = document.getElementById('nav-button');
if (navDrilldown && navButton) {
  navButton.addEventListener('click', () => { navDrilldown.open = true; });
  navDrilldown.addEventListener('dismiss', (event) => { event.target.open = false; });
  navDrilldown.addEventListener('update', (event) => { event.target.activeIdentifier = event.detail.activeIdentifier; });
}
