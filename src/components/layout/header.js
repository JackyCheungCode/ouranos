import './header.css';

const header = document.querySelector('.ouranos-header');

if (header) {
  const navDrilldown = header.querySelector('#nav-drilldown');
  const navButton = header.querySelector('#nav-button');
  const languagePopover = header.querySelector('#ouranos-language-popover');
  const languageTrigger = header.querySelector('#ouranos-language-trigger');
  const languageOptions = [...header.querySelectorAll('[data-locale]')];

  const localeNames = {
    en: 'English',
    'zh-CN': '简体中文',
    de: 'Deutsch',
    fr: 'Français',
    ja: '日本語',
  };

  const translations = {
    en: {
      wheels: 'Wheels',
      fitment: 'Find your fit',
      discover: 'Discover',
      contact: 'Contact',
      menu: 'Menu',
      ai: 'OURANOS AI Assistant',
      search: 'Search',
      account: 'Account',
      language: 'Language',
    },
    'zh-CN': {
      wheels: '轮毂',
      fitment: '车型适配',
      discover: '探索',
      contact: '联系我们',
      menu: '菜单',
      ai: 'OURANOS AI 助手',
      search: '搜索',
      account: '账户',
      language: '语言',
    },
    de: {
      wheels: 'Räder',
      fitment: 'Fahrzeug finden',
      discover: 'Entdecken',
      contact: 'Kontakt',
      menu: 'Menü',
      ai: 'OURANOS KI-Assistent',
      search: 'Suche',
      account: 'Konto',
      language: 'Sprache',
    },
    fr: {
      wheels: 'Jantes',
      fitment: 'Trouver votre véhicule',
      discover: 'Découvrir',
      contact: 'Contact',
      menu: 'Menu',
      ai: 'Assistant OURANOS IA',
      search: 'Rechercher',
      account: 'Compte',
      language: 'Langue',
    },
    ja: {
      wheels: 'ホイール',
      fitment: '車種適合',
      discover: '製品を探す',
      contact: 'お問い合わせ',
      menu: 'メニュー',
      ai: 'OURANOS AI アシスタント',
      search: '検索',
      account: 'アカウント',
      language: '言語',
    },
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

    const labels = [
      ['#nav-button', copy.menu],
      ['#ouranos-ai-open', copy.ai],
      ['#ouranos-search', copy.search],
      ['#ouranos-account', copy.account],
    ];
    labels.forEach(([selector, label]) => {
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

    languageOptions.forEach((option) => {
      option.setAttribute('aria-pressed', String(option.dataset.locale === selected));
    });

    if (persist) {
      try {
        localStorage.setItem('ouranos-locale', selected);
      } catch {
        // Locale remains active for this page even when storage is unavailable.
      }
    }

    window.dispatchEvent(new CustomEvent('ouranos:locale-change', { detail: { locale: selected } }));
  }

  if (navDrilldown && navButton) {
    navButton.addEventListener('click', () => {
      navDrilldown.open = true;
    });

    navDrilldown.addEventListener('dismiss', (event) => {
      event.target.open = false;
    });

    navDrilldown.addEventListener('update', (event) => {
      event.target.activeIdentifier = event.detail.activeIdentifier;
    });
  }

  // Capture the composed click before PDS Popover handles dismissal/retargeting.
  document.addEventListener(
    'click',
    (event) => {
      const option = event
        .composedPath()
        .find((node) => node instanceof HTMLElement && node.matches('[data-locale]'));
      if (!(option instanceof HTMLElement)) return;

      applyLocale(option.dataset.locale, true);
      if (languagePopover) languagePopover.open = false;
    },
    true,
  );

  let savedLocale = 'en';
  try {
    savedLocale = localStorage.getItem('ouranos-locale') || document.documentElement.lang || 'en';
  } catch {
    savedLocale = document.documentElement.lang || 'en';
  }
  applyLocale(savedLocale);
}
