// Renders a synchronous inline <script> that applies the theme class before
// first paint — eliminates any flash of the wrong theme on reload.
// Supports 'light' | 'dark' | 'system' (system follows prefers-color-scheme).
export function ThemeInit({ defaultTheme }: { defaultTheme: string }) {
  const script = `
(function(){
  try {
    var stored = localStorage.getItem('ep_theme');
    var theme = stored || ${JSON.stringify(defaultTheme)};
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var useDark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (!useDark) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  } catch(e) {}
})();
`
  // eslint-disable-next-line @next/next/no-before-interactive-script-component
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
