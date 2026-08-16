import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit-test harness. Seeded with the pure utility modules (lib/format,
// lib/brand, lib/pillars) — deterministic, no DOM or network. Component/route
// tests can be added later with a jsdom environment + @testing-library/react.
export default defineConfig({
  // Mirror the tsconfig "@/*" path alias so lib modules that import app-wide
  // helpers (e.g. '@/lib/supabase/admin') are testable — vitest does not read
  // tsconfig paths on its own.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, ''),
      // `server-only` is a build-time marker with no runtime entry point; stub
      // it so server-side lib modules can be unit-tested.
      'server-only': fileURLToPath(new URL('./test/stubs/server-only.ts', import.meta.url)),
    },
  },
  // tsconfig sets jsx:"preserve" for Next's compiler, which leaves esbuild
  // emitting classic-runtime JSX here and failing on an undefined React.
  // Automatic runtime lets .test.tsx files render components without importing
  // React themselves.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx'],
    // Keep the run hermetic — no implicit globals; import { describe, it } from 'vitest'.
    globals: false,
  },
})
