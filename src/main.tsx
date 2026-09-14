import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { App } from './App';
import './styles.css';
import './maps/expanded-map.css';
import { applyTheme, loadTheme } from './theme';
import { loadTeamAccess } from './team-access';

document.documentElement.dataset.platform = Capacitor.getPlatform();

// Restore native preferences before rendering the intro or app screens.
void Promise.all([loadTheme(),loadTeamAccess()]).then(([theme,accessCode]) => {
  applyTheme(theme);
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App initialTheme={theme} initialAccessCode={accessCode} /></React.StrictMode>);
});
