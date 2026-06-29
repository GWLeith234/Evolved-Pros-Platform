import { defineConfig } from 'vitest/config'

// Unit-test harness. Seeded with the pure utility modules (lib/format,
// lib/brand, lib/pillars) — deterministic, no DOM or network. Component/route
// tests can be added later with a jsdom environment + @testing-library/react.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    // Keep the run hermetic — no implicit globals; import { describe, it } from 'vitest'.
    globals: false,
  },
})
