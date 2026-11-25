import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify('9.9.9'),
    __APP_COMMIT__: JSON.stringify('abc1234'),
    __APP_BUILT_AT__: JSON.stringify('2026-11-25T05:00:00.000Z'),
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/domain/fixtures.ts'],
      // The money maths must stay fully tested (split-engine handoff).
      thresholds: { 'src/domain/**': { lines: 95 } },
    },
  },
});
