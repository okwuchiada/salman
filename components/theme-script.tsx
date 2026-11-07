/**
 * Runs before first paint: applies the saved theme (or the system preference)
 * to <html data-theme> so the page never flashes the wrong colours, and marks
 * <html class="js"> so scroll reveals only hide content when JS is running.
 */
const script = `(function(){try{var d=document.documentElement;d.classList.add('js');var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.setAttribute('data-theme',t)}catch(e){}})()`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
