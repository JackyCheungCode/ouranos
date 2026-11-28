import './style.css';

const audienceSwitch = document.querySelector('#cast-audience-switch');
const takeawayTitle = document.querySelector('#cast-takeaway-title');
const takeawayCopy = document.querySelector('#cast-takeaway-copy');
const audienceCopy = {
  wholesale: {
    title: 'Commercial Advantage for Distributors',
    copy: 'Low-pressure cast wheels can support inventory turnover, broad vehicle coverage, and lower capital lock-up—subject to a verified model range and applicable safety approvals.',
  },
  driver: {
    title: 'Engineering Verdict for Street & Daily Builds',
    copy: 'Unless you are chasing tenths on a race circuit, an appropriately validated low-pressure cast wheel can deliver considered styling and application-specific impact performance while leaving more budget for tyres and suspension.',
  },
};

function readSegmentValue(element, fallback) {
  return element?.value || fallback;
}

function updateAudience(value) {
  const copy = audienceCopy[value] || audienceCopy.wholesale;
  takeawayTitle.textContent = copy.title;
  takeawayCopy.textContent = copy.copy;
  audienceSwitch.value = value;
}

audienceSwitch?.addEventListener('update', (event) => {
  updateAudience(event.detail?.value || readSegmentValue(audienceSwitch, 'wholesale'));
});
audienceSwitch?.addEventListener('change', (event) => {
  updateAudience(event.detail?.value || readSegmentValue(audienceSwitch, 'wholesale'));
});

const inquiryMode = document.querySelector('#cast-inquiry-mode');
const specsInput = document.querySelector('#cast-specs');
const specsLabel = document.querySelector('#cast-spec-label');
const modeCopy = {
  fitment: {
    label: 'Vehicle Specs',
    placeholder: 'e.g. 2023 BMW M340i — Front 374mm Brembo',
  },
  wholesale: {
    label: 'Target Market / PCDs',
    placeholder: 'e.g. European Market 5x112, 18"-19", 20GP Trial Order',
  },
};

function updateInquiryMode(value) {
  const copy = modeCopy[value] || modeCopy.fitment;
  specsLabel.textContent = copy.label;
  specsInput.setAttribute('placeholder', copy.placeholder);
  inquiryMode.value = value;
}

inquiryMode?.addEventListener('update', (event) => {
  updateInquiryMode(event.detail?.value || readSegmentValue(inquiryMode, 'fitment'));
});
inquiryMode?.addEventListener('change', (event) => {
  updateInquiryMode(event.detail?.value || readSegmentValue(inquiryMode, 'fitment'));
});

document.querySelectorAll('.cast-hero__actions a').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

const form = document.querySelector('#cast-inquiry-form');
const submit = document.querySelector('#cast-submit');
const email = document.querySelector('#cast-email');
const whatsapp = document.querySelector('#cast-whatsapp');
const name = document.querySelector('#cast-name');
const specs = document.querySelector('#cast-specs');
const details = document.querySelector('#cast-details');
const contactError = document.querySelector('#cast-contact-error');
const feedback = document.querySelector('#cast-form-feedback');

function valueOf(element) {
  return String(element?.value || '').trim();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validPhone(value) {
  return /^\+?[0-9][0-9\s().-]{6,24}$/.test(value);
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedback.hidden = true;
  contactError.hidden = true;
  const customerName = valueOf(name);
  const customerEmail = valueOf(email);
  const customerPhone = valueOf(whatsapp);
  const contactValid = validEmail(customerEmail) || (!customerEmail && validPhone(customerPhone));
  if (!customerName || !contactValid) {
    contactError.hidden = false;
    if (!customerName) name.focus();
    else if (customerEmail && !validEmail(customerEmail)) email.focus();
    else whatsapp.focus();
    return;
  }

  submit.setAttribute('loading', 'true');
  submit.setAttribute('disabled', 'true');
  const mode = readSegmentValue(inquiryMode, 'fitment');
  const specsLabelText = mode === 'wholesale' ? 'Target market / PCDs' : 'Vehicle specs';
  const payload = {
    product: {
      id: 'ouranos-cast-wheel-consultation',
      model: 'Cast wheel engineering consultation',
      construction: 'Cast',
    },
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    quantity: 1,
    notes: [
      'Enquiry type: ' + (mode === 'wholesale' ? 'Wholesale, OEM/ODM & Catalog' : 'Fitment & Brake Clearance Check'),
      specsLabelText + ': ' + valueOf(specs),
      'Project details: ' + valueOf(details),
    ].filter(Boolean).join('\n'),
  };

  try {
    const response = await fetch('/api/wheel-inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Your enquiry could not be submitted. Please try again.');
    }
    feedback.hidden = false;
    feedback.setAttribute('state', 'success');
    const message = feedback.querySelector('p');
    if (message) message.textContent = 'Thank you. Your technical specifications have been routed to our wheel engineering desk. Reference: ' + result.reference + '. Expect a response within 12 business hours.';
    form.reset();
    updateInquiryMode('fitment');
    updateAudience('wholesale');
  } catch (error) {
    feedback.hidden = false;
    feedback.setAttribute('state', 'error');
    const message = feedback.querySelector('p');
    if (message) message.textContent = error instanceof Error ? error.message : 'Your enquiry could not be submitted. Please try again.';
  } finally {
    submit.removeAttribute('loading');
    submit.removeAttribute('disabled');
  }
});

document.documentElement.dataset.castWheelsPage = 'ready';
