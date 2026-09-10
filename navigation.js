(() => {
  'use strict';
  const Site = window.Desregulacion;
  if (Site.redirectLegacy()) return;
  if (Site.portable && Site.params().get('vista') === 'publicaciones') {
    const mapped = Object.fromEntries(Site.archiveParams());
    Site.setParams({ vista: '', q: '', periodo: '', ordenar: '', archivo: '', anio: '', tipo: '', orden: '', ...mapped }, { hash: 'archivo' });
  }
  const home = document.getElementById('contenido');
  const archive = document.getElementById('archive-view');

  function showView() {
    if (!Site.portable) return;
    const isArchive = location.hash === '#archivo';
    home.hidden = isArchive;
    archive.hidden = !isArchive;
    document.querySelector('.skip-link').href = isArchive ? '#archivo' : '#contenido';
    document.querySelectorAll('[data-archive-link]').forEach(link => {
      if (isArchive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function revealTarget({ scroll = true } = {}) {
    if (Site.redirectLegacy()) return;
    showView();
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    if (target.matches('details')) target.open = true;
    if (id === 'fuente') document.getElementById('source-details').open = true;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent.matches('details')) parent.open = true;
    }
    if (scroll && !id.startsWith('cambio-')) requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }

  // Local archive links leave the legacy publication mode when returning home.
  if (Site.portable) document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash !== '#archivo' && Site.params().has('vista')) Site.setParams({ vista: '' });
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link?.hash && link.hash === location.hash) revealTarget();
  });
  window.addEventListener('hashchange', () => revealTarget());
  window.addEventListener('popstate', () => revealTarget());
  document.addEventListener('archive:ready', () => { if (location.hash === '#archivo') revealTarget(); });
  showView();
  const initialHash = location.hash;
  let interacted = false;
  const markInteraction = () => { interacted = true; };
  const events = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  events.forEach(name => window.addEventListener(name, markInteraction, { once: true, passive: true }));
  const ready = document.readyState === 'complete' ? Promise.resolve() : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  Promise.allSettled([...Object.values(window.desregulacionLoads || {}), ready, document.fonts.ready]).then(() => {
    events.forEach(name => window.removeEventListener(name, markInteraction));
    if (!interacted && location.hash === initialHash) revealTarget();
  });
})();
