/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Used only by `npm run test:coverage`; scoria reads coverage/lcov.info.
    coverage: {
      provider: 'v8',
      // lcovonly: scoria reads only lcov.info, so no HTML report is written.
      reporter: ['lcovonly', 'text-summary'],
      reportsDirectory: 'coverage',
      // Implementation files only, including ones no test imports yet.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
    },
  },
})
