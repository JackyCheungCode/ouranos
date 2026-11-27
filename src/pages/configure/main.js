import './style.css';
const params = new URLSearchParams(location.search);
const $ = (s) => document.querySelector(s);
const safeImage = (value) => { try { const url = new URL(value, location.origin); return ['https:','http:'].includes(url.protocol) ? url.href : '/images/wheel-placeholder.svg'; } catch { return '/images/wheel-placeholder.svg'; } };
const product = {
  id: params.get('wheel') || '',
  model: params.get('model') || params.get('wheelName') || '',
  construction: params.get('construction') || '',
  design: params.get('design') || '',
  image: safeImage(params.get('image') || ''),
};
if (!product.id || !product.model) {
  $('#configure-status').hidden = false;
  $('#configure-status').textContent = 'A wheel model was not selected. Return to the wheel catalogue and choose Configure.';
  $('#submit-wheel-enquiry').disabled = true;
}
$('#wheel-image').src = product.image;
$('#wheel-image').alt = product.model + ' wheel';
$('#wheel-model').textContent = product.model;
$('#wheel-construction').textContent = product.construction.toUpperCase();
$('#wheel-design').textContent = product.design;
$('#wheel-customization').textContent = 'Customization: Size, Fitment & Finish';
const prefill = {front_diameter:params.get('diameter'),front_width:params.get('width'),front_pcd:params.get('pcd'),front_offset:(params.get('offset')||'').replace(/^ET/i,''),front_cb:(params.get('bore')||'').replace(/\s*mm$/i,'')};
for (const [key,value] of Object.entries(prefill)) if (value) { const field = document.querySelector('[name="'+key+'"]'); if(field) field.value = value; }
const form = $('#wheel-config-form');
const submitButton = $('#submit-wheel-enquiry');
submitButton.addEventListener('click', (event) => {
  event.preventDefault();
  form.requestSubmit();
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('#submit-wheel-enquiry');
  const status = $('#configure-status');
  const data = Object.fromEntries(new FormData(form).entries());
  data.quantity = Number(data.quantity);
  data.product = product;
  button.disabled = true;
  button.textContent = 'Submitting…';
  status.hidden = false;
  status.textContent = 'Submitting your enquiry securely…';
  try {
    const response = await fetch('/api/wheel-inquiries', {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to submit enquiry.');
    status.textContent = 'Enquiry received. Reference: ' + result.reference + '. Our team will review your specifications.';
    form.reset();
    button.textContent = 'Enquiry submitted';
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Submission failed. Please try again.';
    button.disabled = false;
    button.textContent = 'Submit enquiry';
  }
});