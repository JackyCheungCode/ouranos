import { demoProducts } from '../wheels/demo-products.js';
import './style.css';

const $ = (selector, root = document) => root.querySelector(selector);
const formatDate = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
const isoDate = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let isSubmitting = false;

function populateProducts() {
  const select = $('#lead-product');
  for (const product of demoProducts) {
    const option = document.createElement('p-select-option');
    option.value = product.id;
    option.textContent = product.model;
    select.append(option);
  }
  $('#lead-order-date').value = isoDate(new Date());
}

function updateProductDetail() {
  const product = demoProducts.find((item) => item.id === $('#lead-product').value);
  $('#product-detail').textContent = product
    ? [product.line, product.design, product.diameter ? product.diameter + ' in' : ''].filter(Boolean).join(' · ')
    : 'Select a model to view its configuration.';
}

async function runCalculationFeedback() {
  const panel = $('#lead-loading');
  const steps = [...$('#loading-steps').children];
  const progress = $('#loading-progress');
  const percent = $('#loading-percent');
  panel.hidden = false;
  $('#production-results').hidden = true;
  steps.forEach((step) => step.classList.remove('is-active', 'is-complete'));
  progress.style.width = '0%';
  percent.textContent = '0%';
  const sequence = [
    ['Reviewing wheel configuration', 650],
    ['Applying the standard manufacturing route', 800],
    ['Calculating the estimated completion date', 650],
  ];
  let elapsed = 0;
  const total = sequence.reduce((sum, item) => sum + item[1], 0);
  for (let index = 0; index < sequence.length; index += 1) {
    steps[index].classList.add('is-active');
    await wait(sequence[index][1]);
    elapsed += sequence[index][1];
    steps[index].classList.remove('is-active');
    steps[index].classList.add('is-complete');
    const value = Math.round((elapsed / total) * 100);
    progress.style.width = value + '%';
    percent.textContent = value + '%';
  }
  await wait(120);
  panel.hidden = true;
}

function renderJourney(stages) {
  const list = $('#production-journey');
  list.replaceChildren();
  for (const stage of stages) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    const date = document.createElement('span');
    const duration = document.createElement('small');
    title.textContent = stage.name;
    date.textContent = formatDate(stage.startDate) + (stage.endDate !== stage.startDate ? ' — ' + formatDate(stage.endDate) : '');
    duration.textContent = stage.durationDays + (stage.durationDays === 1 ? ' WORKING DAY' : ' WORKING DAYS');
    item.append(title, date, duration);
    list.append(item);
  }
}

async function submitEstimate(event) {
  event.preventDefault();
  if (isSubmitting) return;
  const product = demoProducts.find((item) => item.id === $('#lead-product').value);
  const quantity = Number($('#lead-quantity').value || 4);
  const orderDate = $('#lead-order-date').value;
  if (!product || !orderDate || !Number.isInteger(quantity) || quantity < 1 || quantity > 5000) {
    $('#lead-form-status').textContent = 'Check the wheel model, quantity and order date.';
    return;
  }

  isSubmitting = true;
  $('#lead-submit').disabled = true;
  $('#lead-form-status').textContent = 'Preparing your estimate…';
  try {
    await runCalculationFeedback();
    const process = String(product.construction || '').toLowerCase().includes('cast') ? 'casting' : 'forging';
    const response = await fetch('/api/lead-time/simulate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ productId: product.id, process, quantity, orderDate }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'We could not calculate your estimate. Please try again.');

    $('#result-product').textContent = product.model;
    $('#result-finish').textContent = formatDate(data.completionDate);
    $('#result-duration').textContent = data.targetWorkingDays;
    $('#result-quantity').textContent = quantity + (quantity === 1 ? ' WHEEL' : ' WHEELS');
    $('#result-start').textContent = formatDate(data.startDate);
    renderJourney(data.stages);
    $('#production-results').hidden = false;
    $('#lead-form-status').textContent = 'Your indicative estimate is ready.';
    $('#production-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    $('#lead-form-status').textContent = error.message || 'Unable to calculate the estimate.';
  } finally {
    isSubmitting = false;
    $('#lead-submit').disabled = false;
  }
}

const navDrilldown = $('#nav-drilldown');
const navButton = $('#nav-button');
if (navDrilldown && navButton) {
  navButton.addEventListener('click', () => { navDrilldown.open = true; });
  navDrilldown.addEventListener('dismiss', (event) => { event.target.open = false; });
  navDrilldown.addEventListener('update', (event) => { event.target.activeIdentifier = event.detail.activeIdentifier; });
}

$('#lead-product').addEventListener('change', updateProductDetail);
$('#lead-form').addEventListener('submit', submitEstimate);
$('#new-estimate').addEventListener('click', () => {
  $('#production-results').hidden = true;
  $('#lead-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
const pauseButton = $('#pause-button');
const heroVideo = $('video');
pauseButton?.addEventListener('click', () => {
  if (!heroVideo) return;
  const paused = heroVideo.paused;
  heroVideo[paused ? 'play' : 'pause']();
  pauseButton.textContent = paused ? 'Pause Video' : 'Play Video';
  pauseButton.icon = paused ? 'pause' : 'play';
});

populateProducts();
