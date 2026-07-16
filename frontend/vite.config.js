import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  publicDir: 'static',
  plugins: [
    react({
      babel:
        mode === 'development'
          ? {
              plugins: [['@locator/babel-jsx/dist', { env: 'development' }]],
            }
          : undefined,
    }),
  ],
  server: {
    port: 5173,
  },
}));
