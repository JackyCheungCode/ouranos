import { forgedReferenceProducts } from './products.js';
import './style.css';

const grid = document.querySelector('#forged-products-grid');
const count = document.querySelector('#product-count');
const empty = document.querySelector('#forged-products-empty');
const constructionFilter = document.querySelector('#filter-construction');
const designFilter = document.querySelector('#filter-design');
const sortSelect = document.querySelector('#sort-products');

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function renderCard(product, index) {
  const configureUrl = '/customize/?reference=' + encodeURIComponent('BBS ' + product.model) + '#enquiry';
  return `
    <article class="forged-product-card" data-product="${escapeHtml(product.id)}">
      <a class="forged-product-card__visual" href="/wheel-product/?type=forged&id=${encodeURIComponent(product.id)}" aria-label="Discover OURANOS ${escapeHtml(product.model)} wheel details">
        <img src="${escapeHtml(product.image)}" alt="BBS ${escapeHtml(product.model)} forged wheel visual reference" loading="lazy" decoding="async">
        <span class="forged-product-card__index">${String(index + 1).padStart(2, '0')}</span>
      </a>
      <div class="forged-product-card__body">
        <p class="forged-product-card__eyebrow">BBS / FORGED REFERENCE</p>
        <div class="forged-product-card__identity">
          <h3>${escapeHtml(product.model)}</h3>
          <p>${escapeHtml(product.design)}</p>
        </div>
        <div class="forged-product-card__construction">
          <span>CONSTRUCTION</span>
          <strong>${escapeHtml(product.construction)}</strong>
        </div>
        <p class="forged-product-card__description">${escapeHtml(product.description)}</p>
        <div class="forged-product-card__actions">
          <p-button href="/wheel-product/?type=forged&id=${encodeURIComponent(product.id)}" variant="primary">Discover</p-button>
          <p-button href="${escapeHtml(configureUrl)}" variant="secondary">Configure</p-button>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const construction = constructionFilter.value || '';
  const design = designFilter.value || '';
  const sort = sortSelect.value || 'featured';
  const visible = forgedReferenceProducts.filter((product) =>
    (!construction || product.construction === construction)
    && (!design || product.design === design)
  );

  if (sort === 'az') visible.sort((a, b) => a.model.localeCompare(b.model));
  if (sort === 'za') visible.sort((a, b) => b.model.localeCompare(a.model));

  grid.innerHTML = visible.map(renderCard).join('');
  grid.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.src = '/images/wheel-placeholder.svg';
      image.classList.add('is-fallback');
    }, { once: true });
  });

  count.textContent = visible.length + (visible.length === 1 ? ' model' : ' models');
  empty.hidden = visible.length > 0;
  grid.hidden = visible.length === 0;
}

[constructionFilter, designFilter, sortSelect].forEach((control) => {
  control?.addEventListener('change', render);
});
document.querySelector('#clear-filters')?.addEventListener('click', () => {
  constructionFilter.value = '';
  designFilter.value = '';
  sortSelect.value = 'featured';
  render();
});

render();
document.documentElement.dataset.forgedCollection = 'ready';
