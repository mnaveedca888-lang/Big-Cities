import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: [
      'src/**/*.test.{ts,tsx,js,jsx}',
      'src/**/__tests__/*.{ts,tsx,js,jsx}',
      'backend/src/**/*.test.{ts,tsx,js,jsx}',
      'backend/src/**/__tests__/*.{ts,tsx,js,jsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
