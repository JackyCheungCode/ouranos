const header = document.querySelector('.ouranos-header');

if (header) {
  const navDrilldown = header.querySelector('#nav-drilldown');
  const navButton = header.querySelector('#nav-button');
  const categoryTabs = header.querySelector('#ouranos-category-tabs');
  const aiOpenButton = header.querySelector('#ouranos-ai-open');
  const aiPanel = document.getElementById('ouranos-ai-panel');

  if (navDrilldown && navButton) {
    navButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ouranos:ai-close'));
      navDrilldown.open = true;
    });
    navDrilldown.addEventListener('dismiss', (event) => {
      event.target.open = false;
    });
    navDrilldown.addEventListener('update', (event) => {
      event.target.activeIdentifier = event.detail.activeIdentifier;
    });
  }

  if (aiOpenButton && aiPanel) {
    const setAiPanelOpen = (open) => {
      aiPanel.classList.toggle('is-open', open);
      aiPanel.setAttribute('aria-hidden', String(!open));
      aiOpenButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('ouranos-ai-is-open', open);
    };

    aiOpenButton.addEventListener('click', () => setAiPanelOpen(true));
    window.addEventListener('ouranos:ai-close', () => setAiPanelOpen(false));
    header.dataset.aiControllerReady = 'true';
  }

  if (categoryTabs) {
    categoryTabs.addEventListener('update', (event) => {
      event.target.activeTabIndex = event.detail.activeTabIndex;
    });
  }

  function enforceLightTheme() {
    const root = document.documentElement;
    root.classList.remove('scheme-dark', 'scheme-light-dark', 'scheme-only-dark');
    root.classList.add('scheme-light');
    root.style.colorScheme = 'only light';
    if (document.body) document.body.style.colorScheme = 'only light';
    root.dataset.theme = 'light';
  }

  enforceLightTheme();
  header.dataset.sharedHeaderReady = 'true';
  header.dataset.themeControllerReady = 'true';
}