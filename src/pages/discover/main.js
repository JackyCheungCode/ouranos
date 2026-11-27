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

function renderDiscoveryMatches(matches) {
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
  imagePanel.append(section);
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
  urlStatus.textContent = 'Check the URL before continuing. No page content is fetched at this stage.';
  urlStatus.dataset.state = '';
});

urlSubmit.addEventListener('click', () => {
  let url;
  try {
    url = new URL(urlInput.value.trim());
  } catch {
    urlStatus.textContent = 'Enter a valid product page URL.';
    urlStatus.dataset.state = 'error';
    return;
  }
  const hostname = url.hostname.toLowerCase();
  if (!['https:', 'http:'].includes(url.protocol) || !hostname.includes('.') ||
      hostname === 'localhost' || hostname.endsWith('.local') ||
      /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || url.username || url.password) {
    urlStatus.textContent = 'Enter a public product page URL using HTTP or HTTPS.';
    urlStatus.dataset.state = 'error';
    return;
  }
  urlStatus.textContent = 'Link format accepted. Automatic page extraction and catalogue matching will be enabled in the next integration phase.';
  urlStatus.dataset.state = 'success';
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
