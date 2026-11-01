import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The built-site test runs a full Astro build in beforeAll.
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
