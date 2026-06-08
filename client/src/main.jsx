import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { assets } from './lib/assets.js';
import './styles.css';

document.documentElement.style.setProperty('--table-felt-url', `url("${assets.tableFelt}")`);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
