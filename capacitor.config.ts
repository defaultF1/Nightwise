import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
 appId: 'in.nightwise.demo', appName: 'NightWise', webDir: 'dist',
 // The WebView identifies as this origin. Mappls rejects "localhost" in its
 // web-key whitelist, so the app uses a whitelisted subdomain we control;
 // assets still load locally and the API host stays a different hostname.
 server: { androidScheme: 'https', hostname: 'app.nightwise-f5fu.onrender.com' },
 plugins: {
  SplashScreen: { launchShowDuration: 0, backgroundColor: '#080808', showSpinner: false },
  StatusBar: { style: 'DARK', backgroundColor: '#080808' }
 }
};
export default config;
