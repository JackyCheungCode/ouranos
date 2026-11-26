import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import './design-system/styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Missing application root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
