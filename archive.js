(() => {
  'use strict';
  const Site = window.Desregulacion;
  const { byId, escapeHtml, normalize, readData, kindLabels } = Site;
  if (!byId('archive-controls')) return;
  const fmt = n => n.toLocaleString('es-AR');
  const pageSize = 10;
  let archiveData, citizenData, searchTimer;
  let archivePage = 1;
  const dateLabel = date => new Intl.DateTimeFormat('es-AR', { year: 'numeric', month: 'long', ...(date.length > 7 ? { day: 'numeric' } : {}), timeZone: 'UTC' }).format(new Date(`${date.length === 7 ? date + '-01' : date}T12:00:00Z`));
  const setUrl = values => Site.setParams(values);
  function readUrl() {
    const params = Site.archiveParams();
    const values = { 'archive-search': params.get('archivo') || '', 'archive-topic': params.get('tema') || 'todos', 'archive-year': params.get('anio') || 'todos', 'archive-kind': params.get('tipo') || 'todos', 'archive-sort': params.get('orden') === 'antiguos' ? 'antiguos' : 'recientes' };
    for (const [id, value] of Object.entries(values)) {
      const field = byId(id);
      field.value = field.tagName === 'SELECT' && ![...field.options].some(o => o.value === value) ? 'todos' : value;
    }
  }
  function renderArchive() {
    if (!archiveData) return;
    const terms = normalize(byId('archive-search').value.trim()).split(/\s+/).filter(Boolean);
    const year = byId('archive-year').value;
    const kind = byId('archive-kind').value;
    const topic = byId('archive-topic').value;
    const ascending = byId('archive-sort').value === 'antiguos';
    const entries = archiveData.entries.filter((entry) => {
      const text = normalize([entry.title, entry.description, entry.norma || '', entry.source].join(' '));
      return (topic === 'todos' || Site.publicationTopics(entry, citizenData).includes(topic)) && (year === 'todos' || entry.date.startsWith(year)) && (kind === 'todos' || entry.kind === kind) && terms.every((term) => text.includes(term));
    }).sort((a, b) => (a.date.localeCompare(b.date) || a.id.localeCompare(b.id)) * (ascending ? 1 : -1));
    const pages = Math.max(1, Math.ceil(entries.length / pageSize));
    archivePage = Math.min(archivePage, pages);
    const start = (archivePage - 1) * pageSize;
    const visible = entries.slice(start, start + pageSize);
    byId('archive-count').textContent = entries.length ? `${fmt(entries.length)} documentos · Mostrando ${start + 1}–${start + visible.length}` : '0 documentos encontrados';
    byId('archive-list').innerHTML = visible.map((entry) => {
      const example = citizenData?.entries.find(c => c.archive_id === entry.id)?.id || entry.local_example;
      return `<li class="archive-entry"><div class="archive-entry-meta"><span class="archive-kind">${kindLabels[entry.kind]}</span><time datetime="${entry.date}">${dateLabel(entry.date)}</time></div><h3><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.title)} <span aria-hidden="true">↗</span><span class="visually-hidden">(fuente oficial, nueva pestaña)</span></a></h3>${entry.norma ? `<p class="archive-norma">${escapeHtml(entry.norma)}</p>` : ''}<p class="archive-description">${escapeHtml(entry.description)}</p><div class="archive-entry-footer"><span>${escapeHtml(entry.source)}</span>${example ? `<a href="${escapeHtml(Site.homeHref(`#cambio-${example}`))}">Ver explicación en simple <span aria-hidden="true">↑</span></a>` : ''}</div></li>`; }).join('');
    byId('archive-empty').hidden = entries.length > 0;
    byId('archive-pagination').hidden = entries.length <= pageSize;
    byId('archive-prev').disabled = archivePage === 1;
    byId('archive-next').disabled = archivePage === pages;
    byId('archive-page').textContent = `Página ${archivePage} de ${pages}`;
  }

  function filterArchive() {
    clearTimeout(searchTimer);
    archivePage = 1;
    setUrl({ tema: byId('archive-topic').value === 'todos' ? '' : byId('archive-topic').value, archivo: byId('archive-search').value.trim(), anio: byId('archive-year').value === 'todos' ? '' : byId('archive-year').value, tipo: byId('archive-kind').value === 'todos' ? '' : byId('archive-kind').value, orden: byId('archive-sort').value === 'antiguos' ? 'antiguos' : '' });
    renderArchive();
  }

  async function loadArchive() {
    byId('archive-count').textContent = 'Cargando documentos…';
    try {
      const [data, explanations] = await Promise.all([readData('archive'), readData('citizen').catch(() => null)]);
      citizenData = explanations;
      if (!Array.isArray(data.entries) || !data.entries.length) throw new Error('Empty archive');
      archiveData = data;
      const years = [...new Set(archiveData.entries.map((entry) => entry.date.slice(0, 4)))].sort().reverse();
      byId('archive-year').innerHTML = '<option value="todos">Todos los años</option>' + years.map((year) => `<option value="${year}">${year}</option>`).join('');
      const countKind = (kind) => archiveData.entries.filter((entry) => entry.kind === kind).length;
      byId('archive-coverage').textContent = `${archiveData.news_count} comunicados del Ministerio, ${archiveData.report_count} informes mensuales, ${countKind('norma')} normas de referencia y ${countKind('medida')} medidas destacadas desde diciembre de 2023. El inventario individual de las 770 normas está en construcción.`;
      byId('archive-controls').hidden = false;
      readUrl();
      renderArchive();
      Site.downloadData('download-archive', archiveData);
      document.dispatchEvent(new Event('archive:ready'));
    } catch (error) {
      console.error(error);
      byId('archive-count').innerHTML = 'No pudimos cargar el archivo. <button type="button" class="inline-retry" id="retry-archive">Volver a intentar</button>';
      byId('retry-archive').addEventListener('click', async () => { await loadArchive(); if (archiveData) byId('archive-search').focus(); else byId('retry-archive').focus(); });
    }
  }
  byId('archive-controls').addEventListener('submit', event => { event.preventDefault(); filterArchive(); });
  byId('archive-search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(filterArchive, 250); });
  ['archive-topic', 'archive-year', 'archive-kind', 'archive-sort'].forEach(id => byId(id).addEventListener('change', filterArchive));
  byId('archive-reset').addEventListener('click', () => {
    byId('archive-search').value = '';
    ['archive-topic', 'archive-year', 'archive-kind'].forEach(id => byId(id).value = 'todos');
    byId('archive-sort').value = 'recientes';
    filterArchive(); byId('archive-search').focus();
  });
  function paginate(direction) {
    archivePage += direction; renderArchive();
    byId('archive-results').focus({ preventScroll: true });
    byId('archive-results').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  byId('archive-prev').addEventListener('click', () => paginate(-1));
  byId('archive-next').addEventListener('click', () => paginate(1));
  window.addEventListener('popstate', () => { clearTimeout(searchTimer); archivePage = 1; readUrl(); renderArchive(); });
  readUrl();
  window.desregulacionLoads = window.desregulacionLoads || {};
  window.desregulacionLoads.archive = loadArchive();
})();
