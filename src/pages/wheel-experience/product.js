import '../wheel-catalogue-shared.css';
import { forgedReferenceProducts } from '../forged-wheel-collection/products.js';
import { castProducts } from '../cast-wheel-collection/demo-products.js';
const params = new URLSearchParams(location.search);
const type = params.get('type') === 'cast' ? 'cast' : 'forged';
const id = params.get('id') || '';
const product = type === 'cast' ? castProducts.find((item) => item.id === id) : forgedReferenceProducts.find((item) => item.id === id);
const $ = (selector) => document.querySelector(selector);
const safe = (value) => String(value ?? '');
if (!product) {
  $('#product-kicker').textContent = 'OURANOS / PRODUCT REFERENCE';
  $('#product-title').textContent = 'Product reference unavailable';
  $('#product-description').textContent = 'The selected product reference could not be found. Return to the collection to choose another wheel.';
  $('#product-image').hidden = true;
  $('#product-specs').innerHTML = '<p>Choose a product from the forged or cast collection.</p>';
} else {
  const model = type === 'cast' ? product.part : product.model;
  const title = model;
  $('#product-kicker').textContent = 'OURANOS / ' + (type === 'cast' ? 'CAST' : 'FORGED') + ' WHEEL';
  $('#product-title').textContent = title;
  $('#product-description').textContent = type === 'cast' ? product.family + ' · ' + product.finish : product.description;
  $('#product-image').src = product.image;
  $('#product-image').alt = 'Wheel reference ' + title;
  $('#product-image').addEventListener('error', () => { $('#product-image').src = '/images/wheel-placeholder.svg'; }, { once: true });
  $('#product-construction-copy').textContent = type === 'cast' ? 'Single-piece cast reference. Confirm the released specification and stock position before placing an order.' : 'Forged reference design. The spoke architecture remains model-specific; dimensions and finishing are configured against the vehicle application.';
  const specs = type === 'cast' ? [['Construction','Cast'],['Model',product.model],['Diameter',product.diameter + ' inch'],['Finish',product.finish],...product.preview, ['Indicative stock',String(product.stock) + ' pcs']] : [['Construction','Forged'],['Model',product.model],['Architecture',product.construction],['Design',product.design],['Configuration','Bespoke specification'],['MOQ','4 wheels']];
  $('#product-specs').innerHTML = specs.map(([label,value]) => '<div class="spec-cell"><span>'+label+'</span><strong>'+safe(value)+'</strong></div>').join('');
  const enquiry = '/wheel-enquiry/?type='+type+'&id='+encodeURIComponent(product.id)+'&model='+encodeURIComponent(model)+'&stock='+encodeURIComponent(product.stock || 0);
  $('#product-enquire').href = enquiry;
  $('#product-enquire-bottom').href = enquiry;
  $('#product-fitment').href = '/fitment-guide/?product='+encodeURIComponent(product.id);
}
document.documentElement.dataset.wheelProductReady = 'true';