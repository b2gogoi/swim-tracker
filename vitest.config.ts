import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import path from 'path';

// config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
});