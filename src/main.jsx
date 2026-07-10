import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { registerServiceWorker } from '@/utils/serviceWorker';

// Register the service worker when the application starts
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);