import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './app';
import { getRuntime } from './lib/runtime';
import './styles/index.css';

const root = document.getElementById('app');
if (!root) throw new Error('No #app element');

const basename = `/${getRuntime().route_prefix}`;

createRoot(root).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/collections/:collectionId/requests/:requestId"
          element={<App />}
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
