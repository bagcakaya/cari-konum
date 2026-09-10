import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Yeni deployment yapıldığında eski chunk'ları arayan eski sayfaların takılmasını önle
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[CariRadar] Yeni sürüm tespit edildi, sayfa güncelleniyor...');
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
