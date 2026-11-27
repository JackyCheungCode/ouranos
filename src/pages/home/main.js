import './style.css';

const pauseButton = document.getElementById('pause-button');
const video = document.querySelector('video');
const selectRegion = document.querySelector('p-select[name="region"]');
const selectRegionSelectedSlot = selectRegion?.querySelector('[slot="selected"]');

if (pauseButton && video instanceof HTMLVideoElement) {
  pauseButton.addEventListener('click', () => {
    const isPaused = video.paused;
    video[isPaused ? 'play' : 'pause']();
    pauseButton.textContent = isPaused ? 'Pause Video' : 'Play Video';
    pauseButton.icon = isPaused ? 'pause' : 'play';
  });
}

const regionMap = {
  cn: 'China',
  jp: 'Japan',
  kr: 'South Korea',
  at: 'Austria',
  fr: 'France',
  de: 'Germany',
  gb: 'Great Britain',
  it: 'Italy',
  pt: 'Portugal',
  es: 'Spain',
  ca: 'Canada',
  us: 'USA',
};

const updateSelectedRegionDisplay = (regionCode) => {
  if (!selectRegionSelectedSlot || typeof regionCode !== 'string') {
    return;
  }

  const regionLabel = regionMap[regionCode];

  if (regionLabel) {
    const flag = document.createElement('p-flag');
    flag.setAttribute('name', regionCode);
    selectRegionSelectedSlot.replaceChildren(flag, document.createTextNode(regionLabel));
    return;
  }

  selectRegionSelectedSlot.replaceChildren(document.createTextNode('Unknown region'));
};

if (selectRegion && selectRegionSelectedSlot) {
  selectRegion.addEventListener('change', (e) => {
    updateSelectedRegionDisplay(e.detail?.value);
  });
}
