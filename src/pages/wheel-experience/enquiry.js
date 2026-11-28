import '../wheel-catalogue-shared.css';
const form = document.querySelector('#wheel-enquiry-form');
const status = document.querySelector('#enquiry-status');
const params = new URLSearchParams(location.search);
if (params.has('type')) form.elements.construction.value = params.get('type') === 'cast' ? 'Cast' : 'Forged';
if (params.has('id')) form.elements.product_id.value = params.get('id');
if (params.has('model')) form.elements.product_model.value = params.get('model');
const stock = Number(params.get('stock') || 0);
const minQuantity = () => form.elements.construction.value === 'Forged' ? 4 : (params.get('type') === 'cast' && stock <= 0 ? 100 : 1);
form.elements.quantity.min = String(minQuantity());
form.elements.quantity.value = String(minQuantity());
form.elements.construction.addEventListener('change', () => { form.elements.quantity.min = String(minQuantity()); form.elements.quantity.value = form.elements.quantity.min; });
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const construction = String(data.get('construction'));
  const quantity = Number(data.get('quantity'));
  const minimum = minQuantity();
  if (quantity < minimum) { status.textContent = construction === 'Forged' ? 'Forged wheel enquiries require a minimum of four wheels.' : 'This out-of-stock cast production enquiry requires a minimum of 100 pieces.'; return; }
  const payload = {
    product: { id: String(data.get('product_id')), model: String(data.get('product_model')), construction },
    quantity, customer_name: String(data.get('customer_name')), customer_email: String(data.get('customer_email')),
    customer_phone: String(data.get('customer_phone')), customer_company: String(data.get('customer_company')), customer_type: String(data.get('customer_type')),
    vehicle_make: String(data.get('vehicle_make')), vehicle_model: String(data.get('vehicle_model')), vehicle_year: String(data.get('vehicle_year')),
    front_diameter: '', front_width: '', front_offset: '', front_pcd: String(data.get('pcd_cb')), front_cb: '',
    rear_diameter: '', rear_width: '', rear_offset: '', rear_pcd: String(data.get('pcd_cb')), rear_cb: '',
    finish: '', colour: '', finish_details: [data.get('front_spec'),data.get('rear_spec'),data.get('finish_details')].filter(Boolean).join(' | '),
    notes: String(data.get('notes')) + '\nRequested dimensions: ' + String(data.get('front_spec')) + ' / ' + String(data.get('rear_spec')),
  };
  status.textContent = 'Submitting your enquiry…';
  const submit = document.querySelector('#submit-enquiry'); submit.setAttribute('loading','true');
  try {
    const response = await fetch('/api/wheel-inquiries', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.error || 'Unable to submit this enquiry.');
    status.textContent = 'Enquiry received. Reference: ' + result.reference + '. Our team will review your requirements.';
    form.reset();
  } catch (error) { status.textContent = error.message || 'Submission failed. Please contact OURANOS directly.'; }
  finally { submit.removeAttribute('loading'); }
});
document.documentElement.dataset.wheelEnquiryReady = 'true';