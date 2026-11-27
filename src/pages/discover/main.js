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
    return '无法创建分析任务：服务端数据库尚未完成初始化，请稍后重试。';
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
      imageProgress.set(100, '匹配完成', 'success');
      setImageStatus('分析完成，结果如下。', 'success');
      renderDiscoveryMatches(data.matches || []);
      return;
    }
    if (data.job.status === 'failed') {
      throw new Error(data.job.error_message || 'Discovery processing failed.');
    }
    if (data.job.status === 'processing') {
      const elapsed = (Date.now() - started) / 1000;
      imageProgress.set(Math.min(90, 35 + elapsed * 1.4), elapsed < 8 ? '正在识别轮毂图像' : elapsed < 24 ? '正在生成视觉特征' : '正在检索 OURANOS 商品库');
      setImageStatus('正在分析图片并查找相似轮毂。', 'info');
    } else {
      imageProgress.set(15, '等待分析任务启动');
      setImageStatus('图片已接收，等待分析任务启动。', 'info');
    }
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  if (activeJobId === jobId) { imageProgress.set(90, '分析仍在进行'); setImageStatus('分析耗时较长，任务仍在处理中。', 'info'); }
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
      urlProgress.set(100, '分析完成', 'success');
      urlStatus.textContent = '已提取商品信息，并完成商品库检索。';
      urlStatus.dataset.state = 'success';
      renderDiscoveryMatches(data.matches || [], urlPanel);
      return;
    }
    if (data.job.status === 'failed') throw new Error(data.job.error_message || 'Product page analysis failed.');
    if (data.job.status === 'processing') {
      const elapsed = (Date.now() - started) / 1000;
      urlProgress.set(Math.min(90, 35 + elapsed * 1.4), elapsed < 8 ? '正在打开商品页面' : elapsed < 20 ? '正在提取轮毂参数' : '正在比对 OURANOS 商品库');
      urlStatus.textContent = '正在读取商品信息并查找匹配结果。';
    } else {
      urlProgress.set(15, '等待分析任务启动');
      urlStatus.textContent = '链接已接收，等待分析任务启动。';
    }
    urlStatus.dataset.state = 'info';
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  urlProgress.set(90, '分析仍在进行');
  urlStatus.textContent = '分析耗时较长，任务仍在处理中。';
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
  urlProgress.set(8, '正在提交商品链接');
  urlStatus.textContent = '正在提交链接并创建分析任务。';
  urlStatus.dataset.state = 'info';
  try {
    const response = await fetch('/api/discover/url', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ url: source.toString() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(intakeError(data, '无法提交商品链接。'));
    await pollUrlDiscoveryJob(data.jobId);
  } catch (error) {
    urlProgress.set(0, '分析失败', 'error');
    urlStatus.textContent = error instanceof Error ? error.message : '链接分析失败。';
    urlStatus.dataset.state = 'error';
  } finally {
    setPdsDisabled(urlSubmit, !urlInput.value.trim());
  }
});

imageSubmit.addEventListener('click', async () => {
  if (!selectedFile || imageSubmit.disabled) return;
  setPdsDisabled(imageSubmit, true);
  imageProgress.set(8, '正在上传图片');
  setImageStatus('正在上传图片并创建分析任务。', 'info');
  try {
    const form = new FormData();
    form.append('image', selectedFile, selectedFile.name);
    const response = await fetch('/api/discover/image', { method: 'POST', body: form, headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(intakeError(data, '图片上传失败。'));
    activeJobId = data.jobId;
    imageProgress.set(20, '图片已保存，等待分析');
    setImageStatus('图片已接收，等待视觉分析。', 'info');
    await pollDiscoveryJob(data.jobId);
  } catch (error) {
    imageProgress.set(0, '分析失败', 'error');
    setImageStatus(error instanceof Error ? error.message : '图片分析失败。', 'error');
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
