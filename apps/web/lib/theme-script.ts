import { THEME_COLOR, THEME_PREF_ATTR, THEME_STORAGE_KEY, type ThemePreference } from '@/lib/theme'

/**
 * Source for the synchronous pre-paint script rendered by <ThemeInit /> in
 * <head>. It installs window.__epApplyTheme(pref, persist) and immediately
 * applies the localStorage hint (falling back to the platform default), so the
 * correct `light-mode` class is on <html> before the first paint.
 *
 * <ThemeSync /> later calls the same global with the authenticated user's
 * stored preference — one apply implementation, no drift between the two.
 */
export function themeInitScript(defaultTheme: ThemePreference): string {
  return `
(function(){
  var KEY=${JSON.stringify(THEME_STORAGE_KEY)};
  var ATTR=${JSON.stringify(THEME_PREF_ATTR)};
  var COLOR=${JSON.stringify(THEME_COLOR)};
  var VALID={light:1,dark:1,system:1};
  function prefersDark(){
    try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) }
    catch(e){ return true }
  }
  function resolve(pref){
    if(pref==='system') return prefersDark() ? 'dark' : 'light';
    return pref==='light' ? 'light' : 'dark';
  }
  function apply(pref, persist){
    if(!VALID[pref]) return;
    var resolved=resolve(pref);
    var el=document.documentElement;
    el.classList.toggle('light-mode', resolved==='light');
    el.setAttribute(ATTR, pref);
    el.style.colorScheme=resolved;
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', COLOR[resolved]);
    if(persist){ try { localStorage.setItem(KEY, pref) } catch(e){} }
  }
  window.__epApplyTheme=apply;
  var stored=null;
  try { stored=localStorage.getItem(KEY) } catch(e){}
  apply(VALID[stored] ? stored : ${JSON.stringify(defaultTheme)}, false);
})();
`
}

/**
 * Source for the correction script rendered by <ThemeSync /> for a signed-in
 * member. Runs during HTML parse — before the member shell paints — so a
 * browser with no (or a stale) localStorage hint still gets the stored
 * preference without a visible flip. Also refreshes the hint for next load.
 */
export function themeSyncScript(preference: ThemePreference): string {
  return `try{if(window.__epApplyTheme)window.__epApplyTheme(${JSON.stringify(preference)},true)}catch(e){}`
}
