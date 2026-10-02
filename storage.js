// On-device storage (your iPhone). Data never leaves the phone unless you export it.
window.Store = {
  KEY: 'liftlog.v1',
  mode: 'device',
  load() { try { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { return null; } },
  save(data) { try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) { console.warn(e); } },
  demo: false
};
if ('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {})); }
