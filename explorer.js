(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const interests = window.Desregulacion.interests;
  const state = { citizen: null, filter: 'todos', query: '', year: 'todos', sort: 'destacados', limit: 3 };
  const dateFormat = new Intl.DateTimeFormat('es-AR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  let searchTimer;
  const dateLabel = (date) => dateFormat.format(new Date(date.length === 7 ? `${date}-01T12:00:00Z` : `${date}T12:00:00Z`));
  // One small, consistent set of decorative outline icons; labels carry meaning.
  const icons = {
    package: '<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10 9-5M12 13 3 8m9 5v8M7 6l10 5"/>',
    book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
    basket: '<path d="M3 9h18l-2 11H5L3 9Zm4 0 5-7 5 7M9 13v3m6-3v3"/>',
    truck: '<path d="M2 5h12v12H2V5Zm12 5h5l3 4v3h-8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    ship: '<path d="M5 13V7h14v6M9 7V3h6v4M3 13l9-3 9 3-3 6H6l-3-6Zm0 8c2 1 4 1 6 0 2 1 4 1 6 0 2 1 4 1 6 0M12 10v9"/>',
    chart: '<path d="M3 3v18h18M7 16v-5m5 5V7m5 9v-4M7 7l5-4 5 4 4-4"/>',
    factory: '<path d="M3 21V9l6 4V8l6 5V5h5l1 16H3Zm4-4h1m4 0h1m4 0h1"/>',
    car: '<path d="m4 10 2-6h12l2 6M3 10h18v9H3v-9Zm2 9v2m14-2v2M6 14h2m8 0h2"/>'
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.package}</svg>`;
  }

  icons.home = '<path d="m3 10 9-7 9 7v11H3V10Zm6 11v-8h6v8"/>';

  const Site = window.Desregulacion;
  const readData = Site.readData;

  function readQuery() {
    const params = Site.params();
    state.filter = interests.includes(params.get('tema')) ? params.get('tema') : 'todos';
    state.query = params.get('q') || '';
    state.year = ['2023', '2024', '2025', '2026'].includes(params.get('periodo')) ? params.get('periodo') : 'todos';
    state.sort = ['recientes', 'antiguos'].includes(params.get('ordenar')) ? params.get('ordenar') : 'destacados';
    state.limit = 3;
    syncControls();
  }

  function syncControls() {
    byId('search').value = state.query;
    byId('change-year').value = state.year;
    byId('change-sort').value = state.sort;
    document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === state.filter)));
    if (state.year !== 'todos' || state.sort !== 'destacados') byId('more-filters').open = true;
  }

  function syncQuery({ hash, push = false } = {}) {
    Site.setParams({ tema: state.filter === 'todos' ? '' : state.filter, q: state.query.trim(), periodo: state.year === 'todos' ? '' : state.year, ordenar: state.sort === 'destacados' ? '' : state.sort }, { hash: hash || (location.hash.startsWith('#cambio-') ? 'ejemplos' : undefined), push });
  }
  function matches() {
    const terms = normalize(state.query.trim()).split(/\s+/).filter(Boolean);
    const results = (state.citizen?.entries || []).filter(entry => {
      const text = normalize([entry.titulo, entry.source_title || '', entry.norma, entry.resumen, entry.beneficio, entry.antes, entry.ahora, entry.personas, entry.categoria].join(' '));
      return (state.filter === 'todos' || entry.intereses.includes(state.filter)) && (state.year === 'todos' || entry.date.startsWith(state.year)) && terms.every(term => text.includes(term));
    });
    if (state.sort !== 'destacados') results.sort((a,b) => (a.date.localeCompare(b.date) || a.id.localeCompare(b.id)) * (state.sort === 'antiguos' ? 1 : -1));
    return results;
  }

  function renderExplanation(c) {
    const id = `cambio-${c.id}`;
    return `<article class="change-card" id="${escapeHtml(id)}" aria-labelledby="${escapeHtml(id)}-title">
      <div class="card-top"><span class="category">${icon(c.icono)}${escapeHtml(c.categoria)}</span><time class="card-number" datetime="${escapeHtml(c.date)}">${dateLabel(c.date)}</time></div>
      <h3 id="${escapeHtml(id)}-title">${escapeHtml(c.titulo)}</h3>
      <div class="benefit"><p>${escapeHtml(c.beneficio)}</p></div>
      <details><summary aria-label="Ver antes y después: ${escapeHtml(c.titulo)}">Ver antes y después <span aria-hidden="true">+</span></summary>
        <div class="card-details"><p class="detail-intro">${escapeHtml(c.resumen)}</p><dl class="comparison"><div class="comparison-highlight comparison-before"><dt>Antes</dt><dd>${escapeHtml(c.antes)}</dd></div><div class="comparison-highlight comparison-after"><dt>Con el cambio</dt><dd>${escapeHtml(c.ahora)}</dd></div><div><dt>A quién alcanza</dt><dd>${escapeHtml(c.personas)}</dd></div></dl>
        <p class="norma">${escapeHtml(c.norma)}</p><a class="report-link" href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener">${escapeHtml(c.source_label)} <span aria-hidden="true">↗</span><span class="visually-hidden">(nueva pestaña)</span></a><a class="report-link" href="#${escapeHtml(id)}" data-show-example="${escapeHtml(c.id)}">Enlace a este cambio <span aria-hidden="true">↗</span></a></div>
      </details></article>`;
  }

  function render() {
    syncControls();
    const results = matches();
    const opened = new Set([...byId('examples').querySelectorAll('.change-card:has(details[open])')].map(card => card.id));
    byId('examples').innerHTML = results.slice(0, state.limit).map(renderExplanation).join('');
    opened.forEach(id => { const card = byId(id); if (card) card.querySelector('details').open = true; });
    byId('examples').setAttribute('aria-busy', 'false');
    byId('result-count').textContent = state.citizen ? `${results.length} ${results.length === 1 ? 'cambio explicado' : 'cambios explicados'} · Mostrando ${Math.min(state.limit, results.length)}` : '';
    byId('empty-state').hidden = !state.citizen || results.length > 0;
    byId('show-more').hidden = results.length <= state.limit;
  }

  function reveal(id, { focus = false, updateUrl = false } = {}) {
    if (!state.citizen?.entries.some((c) => c.id === id)) return false;
    clearTimeout(searchTimer);
    state.filter = 'todos'; state.query = ''; state.year = 'todos'; state.limit = state.citizen.entries.length;
    render();
    const card = byId(`cambio-${id}`);
    card.querySelector('details').open = true;
    if (updateUrl) syncQuery({ hash: card.id, push: true });
    if (focus) card.querySelector('summary').focus({ preventScroll: true });
    requestAnimationFrame(() => card.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return true;
  }

  function revealHash() {
    const match = location.hash.match(/^#cambio-([a-z0-9-]+)$/);
    return match ? reveal(match[1]) : false;
  }

  function refresh() {
    clearTimeout(searchTimer);
    state.query = byId('search').value;
    state.year = byId('change-year').value;
    state.sort = byId('change-sort').value;
    state.limit = 3;
    syncQuery(); render();
  }

  async function loadExplorer({ retry = false } = {}) {
    const status = byId('explorer-status');
    status.hidden = false; status.textContent = 'Cargando los cambios…';
    try {
      state.citizen = await readData('citizen');
      Site.downloadData('download-citizen', state.citizen);
      byId('download-citizen').hidden = false;
      byId('explorer-controls').hidden = false;
      status.hidden = true;
      if (!revealHash()) render();
      if (retry) byId('search').focus();
    } catch {
      byId('examples').setAttribute('aria-busy','false');
      byId('download-citizen').hidden = true;
      status.innerHTML = '<p>No pudimos cargar las explicaciones.</p><button class="button button-outline" type="button" id="retry-explorer">Volver a intentar</button>';
      byId('retry-explorer').addEventListener('click', () => loadExplorer({ retry: true }));
      if (retry) byId('retry-explorer').focus();
    }
  }

  function proposalDetails(entry, { consultation = false } = {}) {
    return `<details class="proposal-details"><summary>${consultation ? 'Requisitos de la consulta' : 'Cómo participar'} <span aria-hidden="true">+</span></summary>
      <p class="proposal-reference">${escapeHtml(entry.reference)}</p>
      <p class="proposal-context">${escapeHtml(entry.description)}</p>
      <div class="proposal-next"><h4>${consultation ? 'Cómo se evalúa' : 'El próximo paso'}</h4><p>${escapeHtml(entry.next_step)}</p></div>
      <div class="proposal-support"><h4>${consultation ? 'Prepará tu aporte' : 'Cómo podés acompañar'}</h4><p>${escapeHtml(entry.support)}</p></div>
      <div class="proposal-actions">${consultation ? '' : `<a class="button button-navy" href="${escapeHtml(entry.action_url)}" target="_blank" rel="noopener">${escapeHtml(entry.action_label)} <span aria-hidden="true">↗</span><span class="visually-hidden">(nueva pestaña)</span></a>`}
      <a class="report-link" href="${escapeHtml(entry.source_url)}" target="_blank" rel="noopener">${escapeHtml(entry.source_label)} <span aria-hidden="true">↗</span><span class="visually-hidden">(nueva pestaña)</span></a></div>
    </details>`;
  }

  function proposalCard(entry) {
    const consultation = entry.status_kind === 'consulta';
    const id = consultation ? `${entry.id}-channel` : `proposal-${entry.id}`;
    const deadline = entry.deadline ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${entry.deadline}T12:00:00Z`)) : '';
    return `<article class="upcoming-card" id="${escapeHtml(id)}" aria-labelledby="${escapeHtml(id)}-title">
      <div class="upcoming-top"><span class="category">${escapeHtml(entry.category)}</span><span class="proposal-status proposal-${escapeHtml(entry.status_kind)}">${escapeHtml(entry.status)}</span></div>
      ${deadline ? `<p class="proposal-deadline"><span>Plazo para presentar tu propuesta</span><strong>Hasta el <time datetime="${escapeHtml(entry.deadline)}">${escapeHtml(deadline)}</time></strong></p>` : ''}
      <h3 id="${escapeHtml(id)}-title">${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.description.split(/(?<=\.)\s+/)[0])}</p>
      ${consultation ? `<div class="participation-action"><a class="button button-navy" href="${escapeHtml(entry.action_url)}" target="_blank" rel="noopener">${escapeHtml(entry.action_label)} <span aria-hidden="true">↗</span><span class="visually-hidden">(nueva pestaña)</span></a></div>` : ''}
      ${consultation ? `<div data-ai-channel="${escapeHtml(entry.id)}"></div>` : ''}
      ${proposalDetails(entry, { consultation })}
    </article>`;
  }

  async function loadUpcoming({ retry = false } = {}) {
    const status = byId('upcoming-status');
    status.hidden = false;
    status.textContent = 'Cargando las propuestas…';
    try {
      const data = await readData('upcoming');
      const reviewed = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${data.reviewed_at}T12:00:00Z`));
      byId('upcoming-reviewed').textContent = `Estado consultado el ${reviewed} · Fuentes oficiales`;
      byId('upcoming-cards').innerHTML = data.entries.map(proposalCard).join('');
      window.DesregulacionAI?.mount(byId('upcoming-cards'));
      status.hidden = true;
      if (retry) byId('upcoming-cards').querySelector('summary').focus();
    } catch {
      status.innerHTML = '<p>No pudimos cargar las propuestas.</p><button class="button button-outline" type="button" id="retry-upcoming">Volver a intentar</button>';
      byId('retry-upcoming').addEventListener('click', () => loadUpcoming({ retry: true }));
      if (retry) byId('retry-upcoming').focus();
    }
  }

  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter; refresh(); }));
  ['change-year', 'change-sort'].forEach((id) => byId(id).addEventListener('change', refresh));
  byId('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(refresh, 250); });
  byId('reset-search').addEventListener('click', () => {
    state.query = ''; state.filter = 'todos'; state.year = 'todos'; state.sort = 'destacados'; state.limit = 3;
    syncQuery(); render(); byId('search').focus();
  });
  byId('show-more').addEventListener('click', () => {
    const previous = state.limit;
    state.limit += 6; render();
    const card = byId('examples').children[previous];
    if (card) { card.querySelector('summary, a').focus({ preventScroll: true }); card.scrollIntoView({ block: 'start', behavior: 'instant' }); }
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-show-example]');
    if (!link || !state.citizen?.entries.some((entry) => entry.id === link.dataset.showExample)) return;
    event.preventDefault();
    reveal(link.dataset.showExample, { focus: true, updateUrl: true });
  });
  window.addEventListener('popstate', () => { clearTimeout(searchTimer); readQuery(); if (!revealHash()) render(); });
  window.addEventListener('hashchange', revealHash);
  readQuery();
  window.desregulacionLoads = window.desregulacionLoads || {};
  window.desregulacionLoads.explorer = loadExplorer();
  window.desregulacionLoads.upcoming = loadUpcoming();
})();
