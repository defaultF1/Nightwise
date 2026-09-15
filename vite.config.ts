import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, strictPort: true,
    proxy: { '/api': process.env.NIGHTWISE_LOCAL_API || 'http://127.0.0.1:8787' },
    watch: { ignored: ['**/.tools/**', '**/android/**', '**/talks/**', '**/planning/**', '**/research/**', '**/output/**', '**/tmp/**', '**/dist/**'] },
  },
  // Keep the preview on the origin allowed by the browser Maps key.
  // Fail if occupied instead of silently switching to an unauthorised port.
  preview: { port: 4173, strictPort: true, proxy: { '/api': process.env.NIGHTWISE_LOCAL_API || 'http://127.0.0.1:8787' } },
  build: { target: 'es2022' },
});
