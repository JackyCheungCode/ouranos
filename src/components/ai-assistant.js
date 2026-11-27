import './ai-assistant.css';

const openButton = document.getElementById('ouranos-ai-open');
const closeButton = document.getElementById('ouranos-ai-close');
const panel = document.getElementById('ouranos-ai-panel');
const form = document.getElementById('ouranos-ai-form');
const input = document.getElementById('ouranos-ai-input');
const messagesElement = document.getElementById('ouranos-ai-messages');

if (openButton && closeButton && panel && form && input && messagesElement) {
  const history = [];
  const setOpen = (open) => {
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('ouranos-ai-is-open', open);
    if (open) input.focus();
    else openButton.focus();
  };
  const addMessage = (content, role, pending = false) => {
    const node = document.createElement('div');
    node.className = `ouranos-ai-message ouranos-ai-message--${role}`;
    node.textContent = content;
    if (pending) node.setAttribute('aria-busy', 'true');
    messagesElement.append(node);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    return node;
  };
  openButton.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    addMessage(content, 'user');
    history.push({ role: 'user', content });
    input.value = '';
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
      if (!response.ok || !data.message) throw new Error(data.message || data.error || 'AI_SERVICE_UNAVAILABLE');
      history.push({ role: 'assistant', content: data.message });
      addMessage(data.message, 'assistant');
    } catch (error) {
      pending.remove();
      addMessage(error instanceof Error ? error.message : 'The AI assistant is temporarily unavailable. Please try again.', 'assistant');
      history.pop();
    } finally {
      submit.disabled = false;
      input.focus();
    }
  });
}
