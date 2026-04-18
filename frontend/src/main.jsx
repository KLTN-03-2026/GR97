import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

// Using React 17 render API because this project uses React 17 in package.json
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('app')
);