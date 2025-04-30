import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Suppress benign ResizeObserver loop errors that occur in Chrome when using flex layouts with charts
const ignoreResizeObserverError = (err) => {
  if (err?.message?.includes('ResizeObserver loop completed') || err?.message?.includes('ResizeObserver loop limit exceeded')) {
    // Prevent the error from appearing in the console
    err.stopImmediatePropagation && err.stopImmediatePropagation();
    return true;
  }
  return false;
};

window.addEventListener('error', (e) => {
  if (ignoreResizeObserverError(e)) {
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (ignoreResizeObserverError(e.reason)) {
    e.preventDefault();
  }
});
