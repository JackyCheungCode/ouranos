const header = document.querySelector('.ouranos-header');

if (header) {
  const navDrilldown = header.querySelector('#nav-drilldown');
  const navButton = header.querySelector('#nav-button');
  const categoryTabs = header.querySelector('#ouranos-category-tabs');
  const languagePopover = header.querySelector('#ouranos-language-popover');
  const languageTrigger = header.querySelector('#ouranos-language-trigger');
  const themeButton = header.querySelector('#ouranos-theme-toggle');
  const getLanguageOptions = () => [...header.querySelectorAll('[data-locale]')];

  const localeNames = { en: 'English', 'zh-CN': '简体中文', de: 'Deutsch', fr: 'Français', ja: '日本語' };
  const translations = {
    en: { wheels: 'Wheels', fitment: 'Find your fit', discover: 'Discover', contact: 'Contact', menu: 'Menu', ai: 'OURANOS AI Assistant', search: 'Search', account: 'Account', language: 'Language' },
    'zh-CN': { wheels: '轮毂', fitment: '车型适配', discover: '探索', contact: '联系我们', menu: '菜单', ai: 'OURANOS AI 助手', search: '搜索', account: '账户', language: '语言' },
    de: { wheels: 'Räder', fitment: 'Fahrzeug finden', discover: 'Entdecken', contact: 'Kontakt', menu: 'Menü', ai: 'OURANOS KI-Assistent', search: 'Suche', account: 'Konto', language: 'Sprache' },
    fr: { wheels: 'Jantes', fitment: 'Trouver votre véhicule', discover: 'Découvrir', contact: 'Contact', menu: 'Menu', ai: 'Assistant OURANOS IA', search: 'Rechercher', account: 'Compte', language: 'Langue' },
    ja: { wheels: 'ホイール', fitment: '車種適合', discover: '製品を探す', contact: 'お問い合わせ', menu: 'メニュー', ai: 'OURANOS AI アシスタント', search: '検索', account: 'アカウント', language: '言語' },
  };

  function applyLocale(locale, persist = false) {
    const selected = translations[locale] ? locale : 'en';
    const copy = translations[selected];
    document.documentElement.lang = selected;
    header.dataset.locale = selected;
    header.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (copy[key]) element.textContent = copy[key];
    });
    [['#nav-button', copy.menu], ['#ouranos-ai-open', copy.ai], ['#ouranos-search', copy.search], ['#ouranos-search-mobile', copy.search], ['#ouranos-account', copy.account]].forEach(([selector, label]) => {
      const element = header.querySelector(selector);
      if (element) {
        element.textContent = label;
        element.setAttribute('aria-label', label);
        element.setAttribute('title', label);
      }
    });
    if (languageTrigger) {
      const label = copy.language + ': ' + localeNames[selected];
      languageTrigger.textContent = label;
      languageTrigger.setAttribute('aria-label', label);
      languageTrigger.setAttribute('title', label);
    }
    getLanguageOptions().forEach((option) => option.setAttribute('aria-pressed', String(option.dataset.locale === selected)));
    if (persist) {
      try { localStorage.setItem('ouranos-locale', selected); } catch { /* Locale remains active for this page. */ }
    }
    window.dispatchEvent(new CustomEvent('ouranos:locale-change', { detail: { locale: selected } }));
  }

  function setTheme(theme, persist = false) {
    const selected = theme === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;
    root.classList.remove('scheme-light', 'scheme-dark', 'scheme-light-dark', 'scheme-only-light', 'scheme-only-dark');
    root.classList.add(selected === 'dark' ? 'scheme-dark' : 'scheme-light');
    root.style.colorScheme = selected;
    if (document.body) document.body.style.colorScheme = selected;
    root.dataset.theme = selected;
    if (themeButton) {
      const nextTheme = selected === 'dark' ? 'light' : 'dark';
      const label = nextTheme === 'dark' ? 'Switch to dark mode' : 'Switch to light mode';
      themeButton.setAttribute('icon', nextTheme === 'dark' ? 'moon' : 'sun');
      themeButton.setAttribute('aria-label', label);
      themeButton.setAttribute('title', label);
      themeButton.setAttribute('aria-pressed', String(selected === 'dark'));
    }
    if (persist) {
      try { localStorage.setItem('ouranos-theme', selected); } catch { /* Theme remains active for this page. */ }
    }
  }

  if (navDrilldown && navButton) {
    navButton.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ouranos:ai-close'));
      navDrilldown.open = true;
    });
    navDrilldown.addEventListener('dismiss', (event) => { event.target.open = false; });
    navDrilldown.addEventListener('update', (event) => { event.target.activeIdentifier = event.detail.activeIdentifier; });
  }

  if (categoryTabs) {
    categoryTabs.addEventListener('update', (event) => { event.target.activeTabIndex = event.detail.activeTabIndex; });
  }

  const initializeLanguagePopover = () => {
    if (!languagePopover || !languageTrigger) return;
    const isLanguageOpen = () => languagePopover.hasAttribute('open');
    const setLanguageOpen = (open) => {
      languagePopover.open = open;
      languagePopover.toggleAttribute('open', open);
      languageTrigger.setAttribute('aria-expanded', String(open));
    };
    setLanguageOpen(false);
    header.dataset.languageControllerReady = 'true';
    languagePopover.addEventListener('click', (event) => {
      const path = event.composedPath();
      if (path.includes(languageTrigger)) {
        setLanguageOpen(!isLanguageOpen());
        return;
      }
      const option = path.find((node) => node instanceof HTMLElement && node.matches('[data-locale]'));
      if (!(option instanceof HTMLElement)) return;
      applyLocale(option.dataset.locale, true);
      setLanguageOpen(false);
    });
    languagePopover.addEventListener('dismiss', () => setLanguageOpen(false));
  };

  if (customElements.get('p-popover')) initializeLanguagePopover();
  else customElements.whenDefined('p-popover').then(initializeLanguagePopover);

  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark', true);
    });
  }

  let savedLocale = 'en';
  let savedTheme = 'light';
  try {
    savedLocale = localStorage.getItem('ouranos-locale') || document.documentElement.lang || 'en';
    savedTheme = localStorage.getItem('ouranos-theme') || 'light';
  } catch {
    savedLocale = document.documentElement.lang || 'en';
  }
  setTheme(savedTheme);
  applyLocale(savedLocale);
  header.dataset.sharedHeaderReady = 'true';
  header.dataset.themeControllerReady = 'true';
}