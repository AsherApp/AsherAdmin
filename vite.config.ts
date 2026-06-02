import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const host = process.env.TAURI_DEV_HOST;
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: isTauri ? './' : '/',
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      host: host || '0.0.0.0',
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    envPrefix: ['VITE_', 'TAURI_ENV_'],
    build: {
      target:
        process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
      minify: process.env.TAURI_DEBUG ? false : 'esbuild',
      sourcemap: !!process.env.TAURI_DEBUG,
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY
      ),
      'process.env.GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
