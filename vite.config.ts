import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative base, so the static bundle works from whatever path it is served at.
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  /*
   * Both local servers bind loopback only, explicitly rather than by relying on
   * the default. This is a static game with no backend: nothing it serves needs
   * to be reachable from another machine, and `npm run dev` on a shared host
   * should not put an unfinished build on the network. Share a port over an SSH
   * local forward if somebody else needs to see it.
   */
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
