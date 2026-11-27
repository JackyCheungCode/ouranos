import './style.css';

const video = document.querySelector('.forged-hero__video');
const toggle = document.querySelector('#forged-video-toggle');
const label = document.querySelector('#forged-video-label');
const icon = document.querySelector('.forged-video-toggle__icon');

if (video instanceof HTMLVideoElement && toggle instanceof HTMLButtonElement) {
  const syncVideoControl = () => {
    const paused = video.paused;
    label.textContent = paused ? 'Play film' : 'Pause film';
    icon.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  };

  toggle.addEventListener('click', async () => {
    if (video.paused) {
      try {
        await video.play();
      } catch {
        syncVideoControl();
      }
    } else {
      video.pause();
    }
    syncVideoControl();
  });

  video.addEventListener('play', syncVideoControl);
  video.addEventListener('pause', syncVideoControl);
  syncVideoControl();
}

document.querySelectorAll('p-accordion').forEach((accordion) => {
  accordion.addEventListener('update', (event) => {
    event.target.open = event.detail.open;
  });
});

document.documentElement.dataset.forgedWheelsPage = 'ready';
