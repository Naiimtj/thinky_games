import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import './i18n';
import './index.css';

if (import.meta.env.DEV) {
  const { default: setupLocatorUI } = await import('@locator/runtime');
  setupLocatorUI();
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <App />
  </BrowserRouter>,
);
