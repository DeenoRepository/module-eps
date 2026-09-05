import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    globals: true,
    include: ['src/domain/**/*.test.ts', 'src/*.test.ts'],
    coverage: {
      provider: 'v8',
      all: false,
      include: ['src/domain/**/*.ts', 'src/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/ui/**', 'dist/**'],
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
