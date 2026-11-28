import './style.css';

const $ = (selector) => document.querySelector(selector);
const state = { market: 'usdm', makes: [], models: [], years: [], modifications: [], records: [] };
const list = (value) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : Array.isArray(value?.results) ? value.results : [];
const label = (item) => typeof item === 'string' ? item : item?.name || item?.title || item?.label || item?.slug || item?.code || '';
const slug = (item) => typeof item === 'string' ? item.toLowerCase().replace(/\\s+/g, '-') : item?.slug || item?.id || item?.code || label(item).toLowerCase().replace(/\\s+/g, '-');
const first = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') ?? '';
const number = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return '';
};
const setStatus = (message, stateName = '') => {
  const status = $('#api-status');
  status.textContent = message;
  status.dataset.state = stateName;
};
async function api(path, params = {}) {
  const query = new URLSearchParams({ region: state.market, ...params });
  const response = await fetch('/api/wheel-size/' + path + '?' + query.toString(), { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.details?.detail || data?.details?.message || data?.message || data?.error;
    const readable = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : '';
    throw new Error((readable || 'Vehicle data request failed') + ' (HTTP ' + response.status + ').');
  }
  return data;
}
async function setOptions(element, items, placeholder) {
  await Promise.all(['p-select', 'p-select-option'].map((tag) => customElements.whenDefined(tag)));
  const fragment = document.createDocumentFragment();
  const empty = document.createElement('p-select-option');
  empty.value = '';
  empty.textContent = placeholder;
  fragment.append(empty);
  items.forEach((item) => {
    const option = document.createElement('p-select-option');
    option.value = String(slug(item));
    const logo = typeof item === 'object' ? first(item.logo, item.logo_url, item.image, item.image_url, item.icon) : '';
    if (logo && /^https:\/\//i.test(String(logo))) {
      const image = document.createElement('img');
      image.src = String(logo);
      image.alt = '';
      image.loading = 'lazy';
      image.className = 'fitment-make-logo';
      image.referrerPolicy = 'no-referrer';
      option.append(image);
    }
    const name = document.createElement('span');
    name.textContent = label(item);
    option.append(name);
    fragment.append(option);
  });
  element.replaceChildren(fragment);
  element.value = '';
  element.setAttribute('value', '');
}
function enable(element, enabled) {
  element.disabled = !enabled;
  if (enabled) element.removeAttribute('disabled');
  else element.setAttribute('disabled', '');
}
async function resetSelect(id, placeholder) {
  const element = $('#' + id);
  await setOptions(element, [], placeholder);
  enable(element, false);
}
function formatRim(rim) {
  const source = rim?.rim || rim?.wheel || rim || {};
  const size = first(source.size, source.title, source.oem_rim, '');
  const match = String(size).match(/([\\d.]+)\\s*J?\\s*[x×]\\s*([\\d.]+)(?:\\s*ET\\s*(-?[\\d.]+))?/i);
  const width = number(source.width, source.rim_width, match?.[1]);
  const diameter = number(source.diameter, source.rim_diameter, match?.[2]);
  const offset = number(source.offset, source.rim_offset, source.et, match?.[3]);
  return { width, diameter, offset };
}
function axle(record, name) {
  const wheel = record?.[name] || record?.[name + '_wheel'] || record?.[name + 'Wheel'] || {};
  const rim = formatRim(wheel);
  const technical = record?.technical || record?.specifications || {};
  return {
    ...rim,
    pcd: first(wheel.bolt_pattern, wheel.pcd, technical.bolt_pattern, technical.pcd, record?.bolt_pattern, record?.pcd),
    bore: number(wheel.centre_bore, wheel.center_bore, wheel.cb, technical.centre_bore, technical.center_bore, technical.cb, record?.centre_bore, record?.center_bore, record?.cb),
  };
}
function parseRecord(record) {
  const wheels = record?.wheels || record?.fitments || record?.rims || [];
  const packages = Array.isArray(wheels) && wheels.length ? wheels : [record];
  return packages.map((item) => {
    const front = axle(item, 'front');
    const rearRaw = item?.rear || item?.rear_wheel || item?.rearWheel || record?.rear || record?.rear_wheel;
    const rear = rearRaw ? axle(item, 'rear') : { ...front };
    const technical = record?.technical || item?.technical || {};
    const pcd = first(technical.bolt_pattern, technical.pcd, record?.bolt_pattern, record?.pcd);
    const bore = number(technical.centre_bore, technical.center_bore, technical.cb, record?.centre_bore, record?.center_bore, record?.cb);
    for (const spec of [front, rear]) {
      if (!spec.pcd) spec.pcd = pcd;
      if (spec.bore === '') spec.bore = bore;
    }
    return { type: record?.is_oe || /oe|oem|original|factory/i.test(String(first(item?.type, record?.type, ''))) ? 'ORIGINAL' : 'ALTERNATIVE', front, rear };
  }).filter((item) => item.front.diameter || item.front.width || item.rear.diameter || item.rear.width);
}
const rimText = (spec) => [spec.width ? spec.width + 'J' : '', spec.diameter ? '×' + spec.diameter : '', spec.offset !== '' ? 'ET' + spec.offset : ''].filter(Boolean).join(' ') || '—';
function render(records) {
  state.records = records.flatMap(parseRecord);
  const body = $('#fitment-rows');
  body.replaceChildren();
  $('#fitment-count').textContent = state.records.length + ' CONFIGURATIONS';
  $('#fitment-table-wrap').hidden = !state.records.length;
  $('#fitment-empty').hidden = !!state.records.length;
  if (!state.records.length) {
    $('#fitment-empty').hidden = false;
    $('#fitment-empty').textContent = 'No factory wheel specifications were returned for this vehicle selection.';
    return;
  }
  state.records.forEach((record) => {
    const row = document.createElement('tr');
    [record.type, rimText(record.front), rimText(record.rear), first(record.front.pcd, record.rear.pcd, '—'), first(record.front.bore, record.rear.bore, '—')].forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = String(value);
      row.append(cell);
    });
    body.append(row);
  });
}
async function loadMarkets() {
  setStatus('LOADING VEHICLE MARKETS');
  const market = $('#market');
  enable(market, false);
  try {
    const markets = list(await api('regions', {}));
    const known = new Set(markets.map((item) => String(slug(item)).toLowerCase()));
    const preferred = ['usdm', 'eudm', 'jdm'];
    const ordered = [...preferred.filter((key) => known.has(key)), ...markets.filter((item) => !preferred.includes(String(slug(item)).toLowerCase()))];
    await setOptions(market, ordered.map((item) => ({ ...item, name: label(item) + ' (' + String(slug(item)).toUpperCase() + ')' })), 'Select vehicle market');
    state.market = known.has('usdm') ? 'usdm' : String(slug(ordered[0] || ''));
    market.value = state.market;
    market.setAttribute('value', state.market);
    enable(market, true);
    setStatus('MARKET SELECTED · ' + state.market.toUpperCase(), 'success');
    await loadMakes();
  } catch (error) {
    setStatus('VEHICLE MARKETS UNAVAILABLE', 'error');
    $('#fitment-empty').textContent = error.message + ' Please retry later.';
  }
}
async function loadMakes() {
  setStatus('LOADING MANUFACTURERS');
  enable($('#make'), false);
  try {
    state.makes = list(await api('makes'));
    await setOptions($('#make'), state.makes, 'Select manufacturer');
    enable($('#make'), true);
    setStatus('SELECT A MANUFACTURER', 'success');
  } catch (error) {
    setStatus('MANUFACTURER LOOKUP UNAVAILABLE', 'error');
    $('#fitment-empty').hidden = false;
    $('#fitment-empty').textContent = 'The vehicle catalogue could not return manufacturers. ' + error.message + ' Check the Worker upstream response and API subscription status.';
  }
}
async function loadModels() {
  const make = $('#make').value;
  await Promise.all([resetSelect('model', 'Select model'), resetSelect('year', 'Select year'), resetSelect('variant', 'Select modification')]);
  $('#fitment-table-wrap').hidden = true;
  $('#fitment-empty').hidden = false;
  if (!make) return;
  setStatus('LOADING MODELS');
  try {
    state.models = list(await api('models', { make }));
    await setOptions($('#model'), state.models, 'Select model');
    enable($('#model'), true);
    setStatus('SELECT A MODEL', 'success');
  } catch (error) { setStatus('MODEL LOOKUP UNAVAILABLE', 'error'); $('#fitment-empty').textContent = error.message; }
}
async function loadYears() {
  const make = $('#make').value, model = $('#model').value;
  await Promise.all([resetSelect('year', 'Select model year'), resetSelect('variant', 'Select modification')]);
  $('#fitment-table-wrap').hidden = true;
  if (!make || !model) return;
  setStatus('LOADING MODEL YEARS');
  try {
    state.years = list(await api('years', { make, model }));
    await setOptions($('#year'), state.years, 'Select model year');
    enable($('#year'), true);
    setStatus('SELECT A MODEL YEAR', 'success');
  } catch (error) { setStatus('YEAR LOOKUP UNAVAILABLE', 'error'); $('#fitment-empty').textContent = error.message; }
}
async function loadModifications() {
  const make = $('#make').value, model = $('#model').value, year = $('#year').value;
  await resetSelect('variant', 'Select modification');
  $('#fitment-table-wrap').hidden = true;
  if (!make || !model || !year) return;
  setStatus('LOADING GENERATIONS & MODIFICATIONS');
  try {
    state.modifications = list(await api('modifications', { make, model, year }));
    await setOptions($('#variant'), state.modifications, 'Select a specific modification');
    enable($('#variant'), true);
    setStatus('SELECT EXACT VEHICLE MODIFICATION', 'success');
  } catch (error) { setStatus('MODIFICATION LOOKUP UNAVAILABLE', 'error'); $('#fitment-empty').textContent = error.message; }
}
async function loadSpecifications() {
  const make = $('#make').value, model = $('#model').value, year = $('#year').value, modification = $('#variant').value;
  if (!make || !model || !year || !modification) return;
  setStatus('RETRIEVING FACTORY SPECIFICATIONS');
  $('#fitment-table-wrap').hidden = true;
  $('#fitment-empty').hidden = false;
  $('#fitment-empty').textContent = 'Retrieving factory wheel specifications for the selected vehicle…';
  try {
    const data = await api('search/by_model', { make, model, year, modification });
    const records = list(data);
    render(records);
    const makeName = label(state.makes.find((item) => String(slug(item)) === make) || make);
    const modelName = label(state.models.find((item) => String(slug(item)) === model) || model);
    const yearName = label(state.years.find((item) => String(slug(item)) === year) || year);
    const modName = label(state.modifications.find((item) => String(slug(item)) === modification) || modification);
    $('#vehicle-title').textContent = [yearName, makeName, modelName, modName].filter(Boolean).join(' ');
    setStatus(records.length ? 'FACTORY DATA RETRIEVED' : 'NO FACTORY DATA FOUND', records.length ? 'success' : 'error');
  } catch (error) {
    setStatus('FACTORY DATA UNAVAILABLE', 'error');
    $('#fitment-empty').hidden = false;
    $('#fitment-empty').textContent = error.message + ' No compatibility conclusion has been made.';
  }
}
$('#market').addEventListener('change', async (event) => {
  state.market = event.target.value;
  await resetSelect('make', 'Select manufacturer');
  await Promise.all([resetSelect('model', 'Select model'), resetSelect('year', 'Select model year'), resetSelect('variant', 'Select modification')]);
  $('#fitment-table-wrap').hidden = true;
  if (state.market) await loadMakes();
});
$('#make').addEventListener('change', loadModels);
$('#model').addEventListener('change', loadYears);
$('#year').addEventListener('change', loadModifications);
$('#variant').addEventListener('change', loadSpecifications);
async function decodeVin() {
  const input = $('#vin');
  const vin = input.value.trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    $('#vin-status').textContent = 'Enter a valid 17-character VIN. Letters I, O and Q are not used.';
    return;
  }
  const button = $('#vin-decode');
  button.disabled = true;
  $('#vin-status').textContent = 'DECODING VIN…';
  try {
    const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/' + encodeURIComponent(vin) + '?format=json', {
      headers: { accept: 'application/json' }
    });
    if (!response.ok) throw new Error('VIN service returned HTTP ' + response.status + '.');
    const payload = await response.json();
    const decoded = payload?.Results?.[0] || {};
    const makeName = String(decoded.Make || '').trim();
    const modelName = String(decoded.Model || '').trim();
    const yearName = String(decoded.ModelYear || '').trim();
    const trimName = String(decoded.Trim || decoded.Series || '').trim();
    if (!makeName || !modelName || !yearName) throw new Error('The VIN service could not identify a complete make, model and model year.');
    const match = (items, name) => items.find((item) => label(item).toLowerCase() === name.toLowerCase()) ||
      items.find((item) => label(item).toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(label(item).toLowerCase()));
    let make = match(state.makes, makeName);
    if (!make) {
      $('#vin-status').textContent = 'VIN decoded: ' + [yearName, makeName, modelName, trimName].filter(Boolean).join(' ') + '. This make is not listed in the selected Wheel-Size market. Change market or select manually.';
      return;
    }
    $('#make').value = String(slug(make));
    await loadModels();
    const model = match(state.models, modelName);
    if (!model) {
      $('#vin-status').textContent = 'VIN decoded: ' + [yearName, makeName, modelName, trimName].filter(Boolean).join(' ') + '. Confirm the matching model manually.';
      return;
    }
    $('#model').value = String(slug(model));
    await loadYears();
    const year = match(state.years, yearName);
    if (!year) {
      $('#vin-status').textContent = 'VIN decoded: ' + [yearName, makeName, modelName, trimName].filter(Boolean).join(' ') + '. Confirm model year manually.';
      return;
    }
    $('#year').value = String(slug(year));
    await loadModifications();
    const modification = trimName ? match(state.modifications, trimName) : null;
    if (modification) {
      $('#variant').value = String(slug(modification));
      await loadSpecifications();
      $('#vin-status').textContent = 'VIN decoded. A matching modification was found; review the selected vehicle and factory data below.';
    } else {
      $('#vin-status').textContent = 'VIN decoded: ' + [yearName, makeName, modelName, trimName].filter(Boolean).join(' ') + '. Select the exact generation / modification manually to continue.';
    }
  } catch (error) {
    $('#vin-status').textContent = error instanceof Error ? error.message : 'VIN decoding is temporarily unavailable.';
  } finally {
    button.disabled = false;
  }
}
$('#vin-decode').addEventListener('click', decodeVin);
loadMarkets();
