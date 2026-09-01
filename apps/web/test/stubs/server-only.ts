/**
 * No-op stand-in for the `server-only` package under vitest.
 *
 * `server-only` exists purely to make the Next bundler fail the build if a
 * server module is pulled into a client bundle. It has no runtime behaviour and
 * no resolvable entry outside the Next toolchain, so importing a lib module
 * that uses it (e.g. lib/stripe/config) breaks a plain vitest run. Aliasing it
 * here keeps those modules testable without weakening the real guard: the
 * production build still resolves the genuine package.
 */
export {}
