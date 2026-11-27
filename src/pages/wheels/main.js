import './style.css';

const products = [
  { id:'vs-5rs', model:'VS-5RS', line:'Forged Sprint Line', collection:'Performance', construction:'Forged', design:'Split-Spoke', diameter:18, width:10, finish:'Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/db250e645da8e281e0e358bbf3856a8414c642de-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/sprint-line/vs-5rs', description:'A lightweight forged split-spoke design from the Sprint Line.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'18.5 lb',profile:'Profile 3'} },
  { id:'sm-10rs', model:'SM-10RS', line:'Forged Sprint Line', collection:'Performance', construction:'Forged', design:'Multi-Spoke', diameter:18, width:10, finish:'Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/2c8a7da9a9c782c8b6964dc7f90807d2772b8e27-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/sprint-line/sm-10rs', description:'An I-beam multi-spoke forged wheel engineered around low weight and stiffness.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'18.6 lb',profile:'Profile 3'} },
  { id:'ec-7rs', model:'EC-7RS', line:'Forged Sprint Line', collection:'Performance', construction:'Forged', design:'Split-Spoke', diameter:18, width:10, finish:'Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/1edc7feb3aaa52e4748d9e1acfa41025799a2aed-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/sprint-line/ec-7rs', description:'An ultralight forged interpretation of a curved split-spoke performance design.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'19.1 lb',profile:'Profile 3'} },
  { id:'sm-8rs', model:'SM-8RS', line:'Forged Sprint Line', collection:'Street', construction:'Forged', design:'Eight-Spoke', diameter:17, width:8, finish:'Anthracite', fitment:'Mazda ND MX-5 focused', image:'https://cdn.sanity.io/images/c8ihu5xk/production/df650e9c3ef110976c14f903e8ba12d42dbbd46a-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/sprint-line/sm-8rs', description:'A forged eight-spoke wheel developed around the ND MX-5 Miata platform.', specs:{size:'17 × 8J ET40',pcd:'4 × 100',offset:'ET40',bore:'54.1 mm',load:'1,400 lb',weight:'15.1 lb',profile:'Profile 1'} },
  { id:'ml-7rt', model:'ML-7RT', line:'Forged Touring Line', collection:'Luxury', construction:'Forged', design:'Multi-Spoke', diameter:18, width:10, finish:'Machined Lip Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/bb79535ffebeb6acd82b7636a93eb69b48bf7931-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/touring-line/ml-7rt', description:'A timeless motorsport-inspired design with a machined outer lip.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'20.9 lb',profile:'Profile 3'} },
  { id:'sl-12rt', model:'SL-12RT', line:'Forged Touring Line', collection:'Luxury', construction:'Forged', design:'Multi-Spoke', diameter:18, width:10, finish:'Machined Lip Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/f7dd5d9bb1afa4292da7e1e7c04c518f81279e88-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/touring-line/sl-12rt', description:'A fully forged multi-spoke design with a distinctive machined lip.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'20 lb',profile:'Profile 2'} },
  { id:'ml-10rt', model:'ML-10RT', line:'Forged Touring Line', collection:'Heritage', construction:'Forged', design:'Mesh', diameter:18, width:10, finish:'Machined Lip Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/e839afb0d35b750fe6ce00362a4503273773ad9c-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/touring-line/ml-10rt', description:'A forged mesh design that reinterprets classic motorsport styling.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'21 lb',profile:'Profile 3'} },
  { id:'arc-8rt', model:'ARC-8RT', line:'Forged Touring Line', collection:'Heritage', construction:'Forged', design:'Split-Spoke', diameter:18, width:10, finish:'Anthracite', fitment:'Vehicle-specific', image:'https://cdn.sanity.io/images/c8ihu5xk/production/3d79ba5a94500a85a1bdac6ad2c70a0b4f504a4d-1800x1800.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/touring-line/arc-8rt', description:'A classic motorsport silhouette re-engineered as a fully forged wheel.', specs:{size:'18 × 10J ET25',pcd:'5 × 120',offset:'ET25',bore:'72.56 mm',load:'1,600 lb',weight:'20.1 lb',profile:'Profile 3'} },
  { id:'tc-10rt', model:'TC-10RT', line:'Forged Touring Line', collection:'Street', construction:'Forged', design:'Multi-Spoke', diameter:18, width:9, finish:'Anthracite', fitment:'Audi / Volkswagen applications', image:'https://cdn.sanity.io/images/c8ihu5xk/production/8584f6870ea075cdcc06013f008553942478a772-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/touring-line/tc-10rt', description:'A forged touring design with vehicle-specific spoke profiles.', specs:{size:'18 × 9J ET42',pcd:'5 × 112',offset:'ET42',bore:'57.1 mm',load:'1,600 lb',weight:'20.4 lb'} },
  { id:'vs-5rx', model:'VS-5RX', line:'Forged Touring Line', collection:'Off-Road', construction:'Forged', design:'Split-Spoke', diameter:20, width:10, finish:'Anthracite', fitment:'SUV / EV applications', image:'https://cdn.sanity.io/images/c8ihu5xk/production/ad94f9b238746c8503123f3e80de8e0b9f64e5db-2000x2000.png?auto=format&h=900&q=85&w=900', source:'https://apexwheels.com/wheels/forged/touring-line/vs-5rx', description:'A forged touring design developed for SUV and EV applications.', specs:{} },
];

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

const modelId = params.get('model');
if (!modelId || !showDetail(modelId)) render();

const navDrilldown = document.getElementById('nav-drilldown');
const navButton = document.getElementById('nav-button');
if (navDrilldown && navButton) {
  navButton.addEventListener('click', () => { navDrilldown.open = true; });
  navDrilldown.addEventListener('dismiss', (event) => { event.target.open = false; });
  navDrilldown.addEventListener('update', (event) => { event.target.activeIdentifier = event.detail.activeIdentifier; });
}
