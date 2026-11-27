import './style.css';

const processSteps = [
  { title: '6061-T6 aluminium selection', description: 'Material selection and incoming inspection, including the specified alloy verification and spectrometric material check.', facts: ['6061-T6 aluminium billet', 'Incoming material inspection', 'Material traceability review'] },
  { title: 'High-pressure forging & forming', description: 'The specified forging route uses high-tonnage forming followed by flow forming where applicable to the selected construction.', facts: ['10,000-tonne-class press specification', 'Forging and forming route', 'Process records per production batch'] },
  { title: 'Five-axis CNC machining', description: 'Five-axis machining resolves the spoke geometry, mounting interfaces and designed surface transitions.', facts: ['Five-axis CNC process', 'Drawing-led machining', 'Critical interface control'] },
  { title: 'Surface preparation & finishing', description: 'Manual surface preparation precedes the selected coating, plating or machined finish route.', facts: ['Manual surface preparation', 'Multi-stage coating or plating', 'Finish sample approval'] },
  { title: 'Coordinate measurement inspection', description: 'Dimensional inspection checks the wheel against the approved drawing and critical fitment dimensions.', facts: ['CMM dimensional inspection', 'Drawing and tolerance review', 'Inspection record'] },
  { title: 'Laboratory and durability testing', description: 'The programme specifies radial fatigue, cornering fatigue and impact tests. Test scope and reports must match the applicable wheel model and market.', facts: ['Radial fatigue testing', 'Bending fatigue testing', '13° / 90° impact testing'] }
];

const solutionCopy = {
  fitment: { kicker: 'FITMENT REVIEW', title: 'Vehicle-first specification', description: 'A fitment decision begins with the exact vehicle, brake package and intended setup.' },
  strength: { kicker: 'STRUCTURAL REVIEW', title: 'Designed around load requirements', description: 'Material, construction and FEA review are considered against the intended wheel application.' },
  leadtime: { kicker: 'PROJECT CONTROL', title: 'A visible approval path', description: 'Keep drawing review, production planning and delivery expectations aligned.' },
  custom: { kicker: 'INDIVIDUAL DETAIL', title: 'One set. Your specification.', description: 'Discuss custom dimensions, finish, engraving and centre-cap branding in one enquiry.' }
};

const stepper = document.querySelector('#manufacturing-stepper');
const stepItems = Array.from(stepper?.querySelectorAll('button[role="tab"]') || []);
const processIndex = document.querySelector('#process-index');
const processTitle = document.querySelector('#process-title');
const processDescription = document.querySelector('#process-description');
const processFacts = document.querySelector('#process-facts');
const processMark = document.querySelector('#process-mark');

function renderProcessStep(index) {
  const step = processSteps[index];
  if (!step) return;
  stepItems.forEach((item, itemIndex) => {
    item.state = itemIndex < index ? 'complete' : itemIndex === index ? 'current' : undefined;
  });
  processIndex.textContent = String(index + 1).padStart(2, '0') + ' / 06';
  processTitle.textContent = step.title;
  processDescription.textContent = step.description;
  processFacts.replaceChildren(...step.facts.map((fact) => {
    const li = document.createElement('li');
    li.textContent = fact;
    return li;
  }));
  processMark.textContent = String(index + 1).padStart(2, '0');
}
function activateProcessStep(index) {
  if (!Number.isInteger(index) || index < 0 || index >= processSteps.length) return;
  stepper.activeTabIndex = index;
  stepItems.forEach((item, itemIndex) => item.setAttribute('aria-selected', String(itemIndex === index)));
  renderProcessStep(index);
}
stepItems.forEach((item, index) => {
  item.addEventListener('click', () => activateProcessStep(index));
});
stepper?.addEventListener('update', (event) => {
  const index = Number(event.detail?.activeTabIndex);
  if (Number.isInteger(index)) activateProcessStep(index);
});
renderProcessStep(0);

document.querySelectorAll('.forged-pain__list p-accordion').forEach((accordion) => {
  accordion.addEventListener('update', (event) => {
    event.target.open = event.detail.open;
    if (!event.detail.open) return;
    document.querySelectorAll('.forged-pain__list p-accordion').forEach((item) => {
      if (item !== event.target) item.open = false;
    });
    const content = solutionCopy[event.target.dataset.solution];
    if (!content) return;
    document.querySelector('#solution-kicker').textContent = content.kicker;
    document.querySelector('#solution-heading').textContent = content.title;
    document.querySelector('#solution-description').textContent = content.description;
  });
});

const constructionTabs = document.querySelector('#construction-tabs');
const constructionPanels = Array.from(document.querySelectorAll('.forged-construction-panel'));
constructionTabs?.addEventListener('update', (event) => {
  constructionTabs.activeTabIndex = event.detail.activeTabIndex;
  constructionPanels.forEach((panel, index) => {
    const active = index === event.detail.activeTabIndex;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
});

const finishOptions = {
  brushed: ['Brushed Titanium', 'Brushed Silver', 'Brushed Dark Grey', 'Brushed Bronze', 'Brushed Black'],
  polished: ['Mirror Polish', 'Bright Silver', 'Polished Smoke', 'Polished Bronze', 'Polished Black'],
  chrome: ['Bright Chrome', 'Dark Chrome', 'Satin Chrome', 'Black Chrome', 'Shadow Chrome'],
  paint: ['Gloss Black', 'Matte Black', 'Satin Graphite', 'Custom Colour', 'Gloss White']
};
const finishSwatches = document.querySelector('#finish-swatches');
function renderFinishes(category) {
  const names = finishOptions[category] || finishOptions.brushed;
  finishSwatches.replaceChildren(...names.map((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'forged-swatch' + (index === 0 ? ' is-selected' : '');
    button.dataset.finish = name;
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    const swatch = document.createElement('span');
    swatch.className = 'swatch swatch--' + category + '-' + (index + 1);
    swatch.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = name;
    button.append(swatch, label);
    return button;
  }));
}
document.querySelector('#finish-selector')?.addEventListener('change', (event) => {
  event.target.value = event.detail.value;
  renderFinishes(event.detail.value);
});
finishSwatches?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-finish]');
  if (!button) return;
  finishSwatches.querySelectorAll('[data-finish]').forEach((item) => {
    const selected = item === button;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
});

const brandWall = document.querySelector('.forged-brand-wall');
if (brandWall) {
  const originalLogos = Array.from(brandWall.children);
  const groups = [originalLogos.slice(0, 15), originalLogos.slice(15)];
  brandWall.replaceChildren();
  groups.forEach((group, index) => {
    if (!group.length) return;
    const marquee = document.createElement('div');
    marquee.className = 'forged-brand-marquee' + (index === 1 ? ' forged-brand-marquee--reverse' : '');
    const track = document.createElement('div');
    track.className = 'forged-brand-track';
    group.forEach((logo) => track.append(logo));
    group.forEach((logo) => {
      const clone = logo.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach((image) => image.setAttribute('alt', ''));
      track.append(clone);
    });
    marquee.append(track);
    brandWall.append(marquee);
  });
}

const vehicleFilter = document.querySelector('#vehicle-filter');
vehicleFilter?.addEventListener('change', (event) => {
  vehicleFilter.value = event.detail.value;
  const selected = event.detail.value;
  document.querySelectorAll('.forged-fitment-card').forEach((card) => {
    card.hidden = selected !== 'all' && card.dataset.vehicle !== selected;
  });
});

document.querySelectorAll('.forged-text-button[data-case]').forEach((button) => {
  button.addEventListener('click', () => {
    const vehicle = button.dataset.case;
    const fitmentDetails = {
      porsche: { title: 'Porsche fitment data', description: 'Exact model year, generation, trim, brake package, front and rear wheel dimensions, PCD, centre bore, ET and tyre sizes.' },
      amg: { title: 'Mercedes-AMG fitment data', description: 'Exact model, generation, brake package, axle loads, front and rear dimensions, PCD, centre bore, ET and tyre sizes.' },
      bmw: { title: 'BMW M fitment data', description: 'Exact chassis code, model year, brake package, front and rear dimensions, PCD, centre bore, ET and tyre sizes.' },
      tesla: { title: 'Tesla fitment data', description: 'Exact model and year, wheel load rating, brake package, front and rear dimensions, PCD, centre bore, ET, tyre sizes and TPMS.' },
      offroad: { title: 'Off-road fitment data', description: 'Vehicle, axle load, suspension and brake setup, tyre envelope, PCD, centre bore, offset and intended terrain.' }
    };
    const details = fitmentDetails[vehicle];
    if (!details) return;
    document.querySelector('#fitment-flyout-title').textContent = details.title;
    document.querySelector('#fitment-flyout-description').textContent = details.description;
    document.querySelector('#fitment-flyout').open = true;
    document.querySelector('#fitment-flyout').dataset.vehicle = vehicle;
  });
});

document.querySelector('#catalogue-request')?.addEventListener('click', () => {
  document.querySelector('#notes').value = 'Please send the latest OURANOS forged wheel catalogue (PDF).';
});

const warrantyModal = document.querySelector('#warranty-modal');
document.querySelector('#warranty-details')?.addEventListener('click', () => {
  warrantyModal.open = true;
});
warrantyModal?.addEventListener('dismiss', () => {
  warrantyModal.open = false;
});
document.querySelector('#warranty-modal-close')?.addEventListener('click', () => {
  warrantyModal.open = false;
});
const fitmentFlyout = document.querySelector('#fitment-flyout');
fitmentFlyout?.addEventListener('dismiss', () => {
  fitmentFlyout.open = false;
});
document.querySelector('#fitment-flyout-enquire')?.addEventListener('click', () => {
  const vehicle = fitmentFlyout.dataset.vehicle || '';
  const notes = document.querySelector('#fitment-flyout-description').textContent || '';
  document.querySelector('#notes').value = vehicle ? vehicle.toUpperCase() + ': ' + notes : notes;
  fitmentFlyout.open = false;
  document.querySelector('#enquiry').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const form = document.querySelector('#forged-enquiry-form');
const submitButton = document.querySelector('#forged-submit');
const feedback = document.querySelector('#forged-form-feedback');
const referenceInput = document.querySelector('#reference-image');

function showFeedback(state, message) {
  feedback.setAttribute('state', state);
  feedback.textContent = message;
  feedback.hidden = false;
}

function readReferenceImage(file) {
  if (!file) return Promise.resolve('');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error('Please choose a JPG, PNG or WebP image smaller than 5 MB.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('The reference image could not be read.'));
    reader.readAsDataURL(file);
  });
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  feedback.hidden = true;
  if (!form.reportValidity()) return;
  submitButton.setAttribute('loading', 'true');
  submitButton.setAttribute('disabled', 'true');
  try {
    const data = new FormData(form);
    const image = await readReferenceImage(referenceInput.files[0]);
    const quantity = Number(data.get('quantity') || 1);
    const constructionChoice = String(data.get('construction_choice') || 'Monoblock');
    const payload = {
      product: { id: 'ouranos-forged-custom', model: 'Custom forged wheel specification', construction: 'Forged' },
      customer_name: data.get('customer_name'),
      customer_email: data.get('customer_email'),
      customer_phone: data.get('customer_phone'),
      quantity,
      finish: data.get('finish') || document.querySelector('.forged-swatch.is-selected')?.dataset.finish || '',
      finish_details: 'Requested construction: ' + constructionChoice,
      vehicle_make: data.get('vehicle_make'),
      vehicle_model: data.get('vehicle_model'),
      notes: data.get('notes'),
      reference_image: image
    };
    const response = await fetch('/api/wheel-inquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || 'Your enquiry could not be submitted. Please try again.');
    showFeedback('success', 'Your enquiry has been received. Reference: ' + result.reference + '. Our team will review your brief.');
    form.reset();
    renderFinishes('brushed');
  } catch (error) {
    showFeedback('error', error instanceof Error ? error.message : 'Your enquiry could not be submitted. Please try again.');
  } finally {
    submitButton.removeAttribute('loading');
    submitButton.removeAttribute('disabled');
  }
});

document.documentElement.dataset.forgedWheelsPage = 'ready';
