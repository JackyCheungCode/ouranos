import './ai-assistant.css';

const openButton = document.getElementById('ouranos-ai-open');
const closeButton = document.getElementById('ouranos-ai-close');
const panel = document.getElementById('ouranos-ai-panel');
const form = document.getElementById('ouranos-ai-form');
const input = document.getElementById('ouranos-ai-input');
const messagesElement = document.getElementById('ouranos-ai-messages');

if (openButton && closeButton && panel && form && input && messagesElement) {
  const history = [];
  const setOpen = (open, { restoreFocus = true } = {}) => {
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('ouranos-ai-is-open', open);
    if (open) input.focus();
    else if (restoreFocus) openButton.focus();
  };

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };

  const safeInternalUrl = (value) => {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
    try {
      const url = new URL(value, window.location.origin);
      return url.origin === window.location.origin ? url.pathname + url.search + url.hash : null;
    } catch { return null; }
  };

  const safeImageUrl = (value) => {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value, window.location.origin);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };

  const renderTable = (block) => {
    const table = element('table', 'ouranos-ai-table');
    const head = element('thead');
    const header = element('tr');
    (Array.isArray(block.columns) ? block.columns : []).slice(0, 8).forEach((label) => header.append(element('th', '', label)));
    head.append(header);
    table.append(head);
    const body = element('tbody');
    (Array.isArray(block.rows) ? block.rows : []).slice(0, 30).forEach((row) => {
      const tr = element('tr');
      (Array.isArray(row) ? row : []).slice(0, 8).forEach((cell) => tr.append(element('td', '', cell)));
      body.append(tr);
    });
    table.append(body);
    return table;
  };

  const renderProduct = (product) => {
    const card = element('article', 'ouranos-ai-product');
    if (product.image) {
      const src = safeImageUrl(product.image);
      if (src) {
        const image = element('img', 'ouranos-ai-product__image');
        image.src = src;
        image.alt = String(product.title || 'OURANOS wheel');
        image.loading = 'lazy';
        card.append(image);
      }
    }
    card.append(element('h4', 'ouranos-ai-product__title', product.title || 'OURANOS product'));
    if (product.series) card.append(element('p', 'ouranos-ai-muted', product.series));
    if (product.description) card.append(element('p', '', product.description));
    if (Array.isArray(product.specs) && product.specs.length) {
      const list = element('dl', 'ouranos-ai-product__specs');
      product.specs.slice(0, 8).forEach((spec) => {
        list.append(element('dt', '', spec.label || 'Specification'));
        list.append(element('dd', '', spec.value ?? '—'));
      });
      card.append(list);
    }
    const href = safeInternalUrl(product.url);
    if (href) {
      const link = element('a', 'ouranos-ai-action', 'View product');
      link.href = href;
      card.append(link);
    }
    return card;
  };

  const renderSelection = (block) => {
    const card = element('section', 'ouranos-ai-selection');
    card.append(element('h4', 'ouranos-ai-selection__title', block.title || 'Choose an option'));
    if (block.description) card.append(element('p', 'ouranos-ai-muted', block.description));
    const options = Array.isArray(block.options) ? block.options.slice(0, 20) : [];
    const multiple = block.mode === 'multiple';
    const selected = new Set();
    const choices = element('div', 'ouranos-ai-selection__choices');
    options.forEach((option, index) => {
      const value = String(option.value ?? option.label ?? index).slice(0, 200);
      const label = element('label', 'ouranos-ai-choice');
      const control = element('input');
      control.type = multiple ? 'checkbox' : 'radio';
      control.name = 'selection-' + Math.random().toString(36).slice(2);
      control.value = value;
      control.addEventListener('change', () => {
        if (!multiple) selected.clear();
        if (control.checked) selected.add(value);
        else selected.delete(value);
        confirm.disabled = selected.size === 0;
      });
      const copy = element('span', 'ouranos-ai-choice__copy');
      copy.append(element('strong', '', option.label || value));
      if (option.description) copy.append(element('small', '', option.description));
      label.append(control, copy);
      choices.append(label);
    });
    card.append(choices);
    const confirm = element('button', 'ouranos-ai-action ouranos-ai-action--primary', block.confirm_label || 'Confirm selection');
    confirm.type = 'button';
    confirm.disabled = true;
    confirm.addEventListener('click', () => {
      const values = [...selected];
      if (!values.length) return;
      card.replaceChildren(element('strong', '', 'Selection confirmed'));
      values.forEach((value) => card.append(element('p', 'ouranos-ai-muted', value)));
      sendMessage('I confirm: ' + values.join(', '), { selection: { title: block.title || 'Selection', values } });
    });
    card.append(confirm);
    return card;
  };

  const renderBlock = (block) => {
    if (!block || typeof block !== 'object') return null;
    switch (block.type) {
      case 'text': return element('p', 'ouranos-ai-rich-text', block.value || '');
      case 'product_card': return renderProduct(block.product || block);
      case 'product_grid': {
        const grid = element('div', 'ouranos-ai-product-grid');
        (Array.isArray(block.items) ? block.items : []).slice(0, 8).forEach((item) => grid.append(renderProduct(item)));
        return grid;
      }
      case 'specification_table':
      case 'comparison_table': {
        const wrap = element('div', 'ouranos-ai-table-wrap');
        if (block.title) wrap.append(element('h4', 'ouranos-ai-block-title', block.title));
        wrap.append(renderTable(block));
        return wrap;
      }
      case 'selection': return renderSelection(block);
      case 'image_gallery': {
        const gallery = element('div', 'ouranos-ai-gallery');
        (Array.isArray(block.images) ? block.images : []).slice(0, 8).forEach((item) => {
          const src = safeImageUrl(typeof item === 'string' ? item : item.url);
          if (!src) return;
          const img = element('img');
          img.src = src;
          img.alt = typeof item === 'string' ? '' : String(item.alt || '');
          img.loading = 'lazy';
          gallery.append(img);
        });
        return gallery;
      }
      case 'action_group': {
        const actions = element('div', 'ouranos-ai-actions');
        (Array.isArray(block.actions) ? block.actions : []).slice(0, 6).forEach((action) => {
          const href = safeInternalUrl(action.url);
          if (action.action === 'navigate' && href) {
            const link = element('a', 'ouranos-ai-action', action.label || 'Open');
            link.href = href;
            actions.append(link);
          } else if (action.action === 'reply' && typeof action.value === 'string') {
            const button = element('button', 'ouranos-ai-action', action.label || 'Continue');
            button.type = 'button';
            button.addEventListener('click', () => sendMessage(action.value));
            actions.append(button);
          }
        });
        return actions;
      }
      case 'notice': return element('aside', 'ouranos-ai-notice', block.value || '');
      default: return null;
    }
  };

  const addMessage = (content, role, pending = false) => {
    const node = element('div', `ouranos-ai-message ouranos-ai-message--${role}`);
    if (role === 'assistant' && content && typeof content === 'object' && Array.isArray(content.content)) {
      content.content.slice(0, 20).forEach((block) => {
        const rendered = renderBlock(block);
        if (rendered) node.append(rendered);
      });
      if (!node.childNodes.length) node.textContent = 'I could not display this response. Please try again.';
    } else {
      node.textContent = typeof content === 'string' ? content : '';
    }
    if (pending) node.setAttribute('aria-busy', 'true');
    messagesElement.append(node);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    return node;
  };

  async function sendMessage(content, metadata = {}) {
    if (!content || typeof content !== 'string') return;
    addMessage(content, 'user');
    history.push({ role: 'user', content, ...(metadata.selection ? { selection: metadata.selection } : {}) });
    const pending = addMessage('Analysing your question…', 'assistant', true);
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await response.json();
      pending.remove();
      if (!response.ok || (!data.message && !data.ui)) throw new Error(data.message || data.error || 'AI_SERVICE_UNAVAILABLE');
      const assistantContent = data.ui || data.message;
      history.push({ role: 'assistant', content: typeof assistantContent === 'string' ? assistantContent : JSON.stringify(assistantContent) });
      addMessage(assistantContent, 'assistant');
    } catch (error) {
      pending.remove();
      addMessage(error instanceof Error ? error.message : 'The AI assistant is temporarily unavailable. Please try again.', 'assistant');
      history.pop();
    } finally {
      submit.disabled = false;
      input.focus();
    }
  }

  openButton.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));
  window.addEventListener('ouranos:ai-close', () => setOpen(false, { restoreFocus: false }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    sendMessage(content);
  });
}
