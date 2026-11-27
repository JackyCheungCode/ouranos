import './style.css';

const imageInput = document.querySelector('#wheel-image');
const dropzone = document.querySelector('#image-dropzone');
const preview = document.querySelector('#image-preview');
const previewImage = document.querySelector('#preview-image');
const previewName = document.querySelector('#preview-name');
const previewSize = document.querySelector('#preview-size');
const imageStatus = document.querySelector('#image-status');
const imageSubmit = document.querySelector('#image-submit');
const urlInput = document.querySelector('#product-url');
const urlSubmit = document.querySelector('#url-submit');
const urlStatus = document.querySelector('#url-status');
const imageProgress = progressUI('image');
const urlProgress = progressUI('url');

function progressUI(prefix) {
  const root = document.querySelector('#' + prefix + '-progress');
  const bar = document.querySelector('#' + prefix + '-progress-bar');
  const label = document.querySelector('#' + prefix + '-progress-step');
  const value = document.querySelector('#' + prefix + '-progress-value');
  return {
    set(percent, text, state = 'active') {
      root.hidden = false;
      bar.value = Math.max(0, Math.min(100, percent));
      value.textContent = Math.round(bar.value) + '%';
      label.textContent = text;
      root.dataset.state = state;
    }
  };
}

function intakeError(data, fallback) {
  if (data && data.error === 'DISCOVERY_INTAKE_FAILED') {
    return 'Unable to create the analysis job: the server database is not initialized. Please try again later.';
  }
  return (data && (data.message || data.error)) || fallback;
}
const imagePanel = document.querySelector('#image-panel');
const urlPanel = document.querySelector('#url-panel');
let selectedFile = null;
let previewUrl = null;
let activeJobId = null;

function renderDiscoveryMatches(matches, target = imagePanel) {
  const old = document.querySelector('#discovery-results');
  if (old) old.remove();
  const section = document.createElement('section');
  section.id = 'discovery-results';
  section.className = 'discover-results';
  const heading = document.createElement('h2');
  heading.textContent = 'Discovery results';
  section.append(heading);
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No indexed OURANOS products matched this reference yet.';
    section.append(empty);
  }
  for (const match of matches) {
    const item = document.createElement('article');
    const title = document.createElement('h3');
    title.textContent = match.product_name || match.slug || 'OURANOS wheel';
    const detail = document.createElement('p');
    detail.textContent = `${match.match_type.replaceAll('_', ' ')}${Number.isFinite(match.similarity_score) ? ` · ${(match.similarity_score * 100).toFixed(1)}%` : ''}`;
    item.append(title, detail);
    section.append(item);
  }
  target.append(section);
}

async function pollDiscoveryJob(jobId) {
  const started = Date.now();
  while (Date.now() - started < 120000 && activeJobId === jobId) {
    const response = await fetch(`/api/discover/jobs/${encodeURIComponent(jobId)}`, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('Unable to retrieve discovery status.');
    const data = await response.json();
    if (data.job.status === 'completed') {
      imageProgress.set(100, 'Matching complete', 'success');
      setImageStatus('Analysis complete. Results are shown below.', 'success');
      renderDiscoveryMatches(data.matches || []);
      return;
    }
    if (data.job.status === 'failed') {
      throw new Error(data.job.error_message || 'Discovery processing failed.');
    }
    if (data.job.status === 'processing') {
      const elapsed = (Date.now() - started) / 1000;
      imageProgress.set(Math.min(90, 35 + elapsed * 1.4), elapsed < 8 ? 'Analyzing wheel image' : elapsed < 24 ? 'Generating visual features' : 'Searching OURANOS catalogue');
      setImageStatus('Analyzing the image and finding similar wheels.', 'info');
    } else {
      imageProgress.set(15, 'Waiting for analysis to start');
      setImageStatus('Image received. Waiting for the analysis job to start.', 'info');
    }
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  if (activeJobId === jobId) { imageProgress.set(90, 'Still analyzing'); setImageStatus('This is taking longer than expected. The task is still processing.', 'info'); }
}

function setPdsDisabled(element, disabled) {
  element.disabled = disabled;
  element.toggleAttribute('disabled', disabled);
}

function setImageStatus(message, state = '') {
  imageStatus.textContent = message;
  imageStatus.dataset.state = state;
}

function clearImage() {
  selectedFile = null;
  imageInput.value = '';
  setPdsDisabled(imageSubmit, true);
  preview.hidden = true;
  dropzone.hidden = false;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  previewImage.removeAttribute('src');
  setImageStatus('Your image stays in this browser until you choose to continue.');
}

function acceptImage(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    setImageStatus('Unsupported file. Choose a JPG, PNG or WEBP image.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setImageStatus('This image is larger than 10 MB. Choose a smaller file.', 'error');
    return;
  }
  clearImage();
  selectedFile = file;
  previewUrl = URL.createObjectURL(file);
  previewImage.src = previewUrl;
  previewName.textContent = file.name;
  previewSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
  preview.hidden = false;
  dropzone.hidden = true;
  setPdsDisabled(imageSubmit, false);
  setImageStatus('Reference image ready. Select Find matching wheels to submit it securely.');
}

imageInput.addEventListener('change', () => acceptImage(imageInput.files?.[0]));
document.querySelector('#remove-image').addEventListener('click', clearImage);
dropzone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzone.classList.add('is-dragging');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('is-dragging');
  acceptImage(event.dataTransfer?.files?.[0]);
});
document.addEventListener('paste', (event) => {
  const file = [...(event.clipboardData?.items || [])]
    .find((item) => item.type.startsWith('image/'))?.getAsFile();
  if (file && !imagePanel.hidden) acceptImage(file);
});

document.querySelectorAll('[data-method]').forEach((button) => {
  button.addEventListener('click', () => {
    const isImage = button.dataset.method === 'image';
    document.querySelectorAll('[data-method]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    imagePanel.hidden = !isImage;
    urlPanel.hidden = isImage;
  });
});

urlInput.addEventListener('input', () => {
  document.querySelector('#url-product-preview').hidden = true;
  const oldResults = document.querySelector('#discovery-results');
  if (oldResults) oldResults.remove();
  window.__ouranosDiscoveryJobId = null;
  setPdsDisabled(urlSubmit, !urlInput.value.trim());
  urlStatus.textContent = 'Paste a public product page URL. Page extraction runs in an isolated, hostname-restricted browser session after submission.';
  urlStatus.dataset.state = '';
});

function renderExtractedProduct(reference) {
  const section = document.querySelector('#url-product-preview');
  const image = document.querySelector('#url-product-image');
  const title = document.querySelector('#url-product-title');
  const fields = document.querySelector('#url-product-fields');
  const source = document.querySelector('#url-product-source');
  const confirm = document.querySelector('#url-confirm-search');
  section.hidden = false;
  title.textContent = reference.extracted_title || 'Product title not available';
  image.hidden = !reference.extracted_image_url;
  if (reference.extracted_image_url) image.src = reference.extracted_image_url;
  else image.removeAttribute('src');
  source.textContent = reference.source_domain ? 'Source: ' + reference.source_domain : '';
  let specs = {};
  try { specs = JSON.parse(reference.extracted_specs_json || '{}'); } catch { specs = {}; }
  const entries = [
    ['Brand', reference.extracted_brand],
    ['Model', reference.extracted_model],
    ['SKU', specs.sku],
    ['Diameter', specs.diameter ? specs.diameter + ' in' : ''],
    ['Width', specs.width ? specs.width + ' in' : ''],
    ['PCD', specs.pcdHoles && specs.pcdMm ? specs.pcdHoles + ' × ' + specs.pcdMm : ''],
    ['Offset', specs.offsetMm !== null && specs.offsetMm !== undefined ? 'ET' + specs.offsetMm : ''],
  ];
  fields.replaceChildren();
  let count = 0;
  for (const [label, value] of entries) {
    if (value === null || value === undefined || value === '') continue;
    const wrapper = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = String(value);
    wrapper.append(term, description);
    fields.append(wrapper);
    count++;
  }
  if (!count) {
    const wrapper = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = 'Specifications';
    description.textContent = 'No specifications could be extracted from this page.';
    wrapper.append(term, description);
    fields.append(wrapper);
  }
  confirm.hidden = false;
  setPdsDisabled(confirm, false);
}

async function pollUrlDiscoveryJob(jobId, waitForMatching = false) {
  const started = Date.now();
  while (Date.now() - started < 120000) {
    const response = await fetch(`/api/discover/jobs/${encodeURIComponent(jobId)}`, { headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to retrieve discovery status.');
    if (!waitForMatching && data.job.status === 'completed' && data.reference?.confirmation_status === 'pending') {
      urlProgress.set(100, 'Product details extracted', 'success');
      urlStatus.textContent = 'Product details extracted. Review the image and specifications, then confirm to search the OURANOS catalogue.';
      urlStatus.dataset.state = 'success';
      renderExtractedProduct(data.reference);
      return;
    }
    if (waitForMatching && data.job.status === 'completed' && data.reference?.confirmation_status === 'confirmed') {
      urlProgress.set(100, 'Catalogue search complete', 'success');
      urlStatus.textContent = 'OURANOS catalogue search complete.';
      urlStatus.dataset.state = 'success';
      renderDiscoveryMatches(data.matches || [], urlPanel);
      return;
    }
    if (data.job.status === 'failed') throw new Error(data.job.error_message || 'Product page analysis failed.');
    const elapsed = (Date.now() - started) / 1000;
    if (data.job.status === 'processing') {
      urlProgress.set(Math.min(90, 35 + elapsed * 1.4), waitForMatching ? 'Searching OURANOS catalogue' : 'Extracting product details');
      urlStatus.textContent = waitForMatching ? 'Searching the OURANOS catalogue using the confirmed details.' : 'Extracting the product image, model and wheel specifications.';
    } else {
      urlProgress.set(15, waitForMatching ? 'Waiting for catalogue search' : 'Waiting for page analysis');
      urlStatus.textContent = waitForMatching ? 'Confirmation submitted. Waiting for the catalogue search.' : 'URL received. Waiting for product details to be extracted.';
    }
    urlStatus.dataset.state = 'info';
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  urlProgress.set(90, 'Still processing');
  urlStatus.textContent = 'This is taking longer than expected. The task is still processing.';
  urlStatus.dataset.state = 'info';
}

function validateProductUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    const ip = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':') || host.startsWith('[');
    if (!['https:', 'http:'].includes(url.protocol) || !host.includes('.') || ip ||
      url.username || url.password || (url.port && !['80', '443'].includes(url.port)) ||
      host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host.endsWith('.internal') || host.endsWith('.test') || host.endsWith('.invalid')) return null;
    return url;
  } catch { return null; }
}

urlSubmit.addEventListener('click', async () => {
  const source = validateProductUrl(urlInput.value.trim());
  if (!source) {
    urlStatus.textContent = 'Enter a public product page URL using HTTP or HTTPS.';
    urlStatus.dataset.state = 'error';
    return;
  }
  setPdsDisabled(urlSubmit, true);
  document.querySelector('#url-product-preview').hidden = true;
  const existingResults = document.querySelector('#discovery-results');
  if (existingResults) existingResults.remove();
  urlProgress.set(8, 'Submitting product URL');
  urlStatus.textContent = 'Extracting product details. The OURANOS catalogue will not be searched yet.';
  urlStatus.dataset.state = 'info';
  try {
    const response = await fetch('/api/discover/url', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ url: source.toString() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(intakeError(data, 'Unable to submit the product URL.'));
    window.__ouranosDiscoveryJobId = data.jobId;
    await pollUrlDiscoveryJob(data.jobId, false);
  } catch (error) {
    urlProgress.set(0, 'Extraction failed', 'error');
    urlStatus.textContent = error instanceof Error ? error.message : 'Product page analysis failed.';
    urlStatus.dataset.state = 'error';
  } finally {
    setPdsDisabled(urlSubmit, !urlInput.value.trim());
  }
});

document.querySelector('#url-confirm-search').addEventListener('click', async () => {
  const button = document.querySelector('#url-confirm-search');
  const jobId = window.__ouranosDiscoveryJobId;
  if (!jobId || button.disabled) return;
  setPdsDisabled(button, true);
  urlProgress.set(10, 'Submitting confirmation');
  urlStatus.textContent = 'Product details confirmed. Starting the OURANOS catalogue search.';
  urlStatus.dataset.state = 'info';
  try {
    const response = await fetch(`/api/discover/jobs/${encodeURIComponent(jobId)}/confirm`, {
      method: 'POST',
      headers: { accept: 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Unable to start the catalogue search.');
    await pollUrlDiscoveryJob(jobId, true);
  } catch (error) {
    setPdsDisabled(button, false);
    urlProgress.set(0, 'Search could not start', 'error');
    urlStatus.textContent = error instanceof Error ? error.message : 'Catalogue search failed.';
    urlStatus.dataset.state = 'error';
  }
});

imageSubmit.addEventListener('click', async () => {
  if (!selectedFile || imageSubmit.disabled) return;
  setPdsDisabled(imageSubmit, true);
  imageProgress.set(8, 'Uploading image');
  setImageStatus('Uploading the image and creating the analysis job.', 'info');
  try {
    const form = new FormData();
    form.append('image', selectedFile, selectedFile.name);
    const response = await fetch('/api/discover/image', { method: 'POST', body: form, headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(intakeError(data, 'Image upload failed.'));
    activeJobId = data.jobId;
    imageProgress.set(20, 'Image saved · waiting for analysis');
    setImageStatus('Image received. Waiting for visual analysis.', 'info');
    await pollDiscoveryJob(data.jobId);
  } catch (error) {
    imageProgress.set(0, 'Analysis failed', 'error');
    setImageStatus(error instanceof Error ? error.message : 'Image analysis failed.', 'error');
  } finally {
    setPdsDisabled(imageSubmit, !selectedFile);
  }
});

const navDrilldown = document.getElementById('nav-drilldown');
const navButton = document.getElementById('nav-button');
if (navDrilldown && navButton) {
  navButton.addEventListener('click', () => { navDrilldown.open = true; });
  navDrilldown.addEventListener('dismiss', (event) => { event.target.open = false; });
  navDrilldown.addEventListener('update', (event) => {
    event.target.activeIdentifier = event.detail.activeIdentifier;
  });
}
