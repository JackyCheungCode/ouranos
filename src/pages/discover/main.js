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
      setImageStatus('Discovery processing finished.', 'success');
      renderDiscoveryMatches(data.matches || []);
      return;
    }
    if (data.job.status === 'failed') {
      throw new Error(data.job.error_message || 'Discovery processing failed.');
    }
    setImageStatus(data.job.status === 'processing' ? 'Analysing your reference…' : 'Your reference is queued…', 'info');
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  if (activeJobId === jobId) setImageStatus('Processing is taking longer than expected. You can retry checking this job later.', 'info');
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
  setPdsDisabled(urlSubmit, !urlInput.value.trim());
  urlStatus.textContent = 'Paste a public product page URL. Page extraction runs in an isolated, hostname-restricted browser session after submission.';
  urlStatus.dataset.state = '';
});

async function pollUrlDiscoveryJob(jobId) {
  const started = Date.now();
  while (Date.now() - started < 120000) {
    const response = await fetch(`/api/discover/jobs/${encodeURIComponent(jobId)}`, { headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Unable to retrieve discovery status.');
    if (data.job.status === 'completed') {
      urlStatus.textContent = 'Product page analysed.';
      urlStatus.dataset.state = 'success';
      renderDiscoveryMatches(data.matches || [], urlPanel);
      return;
    }
    if (data.job.status === 'failed') throw new Error(data.job.error_message || 'Product page analysis failed.');
    urlStatus.textContent = data.job.status === 'processing' ? 'Analysing product page…' : 'Product page queued…';
    urlStatus.dataset.state = 'info';
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  urlStatus.textContent = 'Analysis is taking longer than expected. Please check again later.';
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
  urlStatus.textContent = 'Submitting product page securely…';
  urlStatus.dataset.state = 'info';
  try {
    const response = await fetch('/api/discover/url', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ url: source.toString() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Unable to submit this product page.');
    await pollUrlDiscoveryJob(data.jobId);
  } catch (error) {
    urlStatus.textContent = error instanceof Error ? error.message : 'Unable to analyse this product page.';
    urlStatus.dataset.state = 'error';
  } finally {
    setPdsDisabled(urlSubmit, !urlInput.value.trim());
  }
});

imageSubmit.addEventListener('click', async () => {
  if (!selectedFile || imageSubmit.disabled) return;
  setPdsDisabled(imageSubmit, true);
  setImageStatus('Uploading your reference image securely…', 'info');
  try {
    const form = new FormData();
    form.append('image', selectedFile, selectedFile.name);
    const response = await fetch('/api/discover/image', { method: 'POST', body: form, headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || data.error || 'Image upload failed.');
    activeJobId = data.jobId;
    setImageStatus('Image received. Checking processing status…', 'info');
    await pollDiscoveryJob(data.jobId);
  } catch (error) {
    setImageStatus(error instanceof Error ? error.message : 'Unable to process this reference image.', 'error');
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
