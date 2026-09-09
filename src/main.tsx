import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { applyTheme, loadTheme } from './theme';

// Restore native preferences before rendering the intro or app screens.
void loadTheme().then(theme => {
  applyTheme(theme);
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App initialTheme={theme} /></React.StrictMode>);
});
