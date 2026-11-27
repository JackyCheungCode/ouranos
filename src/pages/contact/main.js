const form = document.querySelector('#contact-enquiry-form');
const status = document.querySelector('#contact-form-status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const subject = encodeURIComponent(`OURANOS Enquiry — ${data.get('interest')}`);
  const body = encodeURIComponent([
    `Name: ${data.get('name')}`,
    `Email: ${data.get('email')}`,
    `Phone: ${data.get('phone') || 'Not provided'}`,
    `Vehicle: ${data.get('vehicle') || 'Not provided'}`,
    `Interest: ${data.get('interest')}`,
    '',
    'Message:',
    data.get('message'),
  ].join('\n'));

  status.textContent = 'Opening your email application. Review the message and press Send to submit your enquiry.';
  window.location.href = `mailto:xg.y@outlook.com?subject=${subject}&body=${body}`;
});
