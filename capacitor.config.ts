import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
 appId: 'in.nightwise.demo', appName: 'NightWise', webDir: 'dist',
 plugins: {
  SplashScreen: { launchShowDuration: 0, backgroundColor: '#080808', showSpinner: false },
  StatusBar: { style: 'DARK', backgroundColor: '#080808' }
 }
};
export default config;
