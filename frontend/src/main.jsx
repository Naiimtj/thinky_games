import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import setupLocatorUI from '@locator/runtime';

import App from './App';
import './index.css';

if (import.meta.env.MODE === 'development') {
  setupLocatorUI();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </StrictMode>,
);
