(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const fmt = (n) => n.toLocaleString('es-AR');
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let downloadUrl;

  function renderKpis(totals) {
    const items = [
      { metric: 'articulos', label: 'Artículos alcanzados', ...totals.articulos_modificados_o_eliminados },
      { metric: 'normativas', label: 'Normas alcanzadas', ...totals.normas_modificadas_o_eliminadas },
      { metric: 'normas', label: 'Normas de desregulación', ...totals.normas_desregulacion }
    ];
    byId('kpis').innerHTML = items.map(item => `
      <article class="kpi"><a class="kpi-link" href="#historial" data-history-metric="${item.metric}" aria-label="Ver evolución de ${item.label.toLowerCase()}"><p class="value">${fmt(item.value)}</p><h3>${item.label}</h3><span class="delta" aria-label="${fmt(item.delta_month)} más en el mes">+${fmt(item.delta_month)}</span></a></article>
    `).join('');
  }

  function renderSectors(sectors) {
    const sorted = [...sectors].sort((a, b) => b.normas - a.normas);
    const max = Math.max(...sorted.map((sector) => sector.normas));
    byId('sectors').innerHTML = sorted.map((sector, index) => `<li class="sector" data-sector="${escapeHtml(sector.name)}" ${index >= 5 && byId('show-sectors').getAttribute('aria-expanded') !== 'true' ? 'hidden' : ''}><span class="sector-rank" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><span class="sector-name">${escapeHtml(sector.name)}</span><div class="sector-track" aria-hidden="true"><div class="sector-fill" style="width:${sector.normas / max * 100}%"></div></div></div><span class="sector-n">${fmt(sector.normas)}<span class="visually-hidden"> normas</span></span></li>`).join('');
  }

  byId('show-sectors').addEventListener('click', () => {
    const expanded = byId('show-sectors').getAttribute('aria-expanded') !== 'true';
    byId('show-sectors').setAttribute('aria-expanded', String(expanded));
    byId('show-sectors').innerHTML = `${expanded ? 'Ver solo los primeros 5' : 'Ver los 11 sectores'} <span aria-hidden="true">${expanded ? '−' : '+'}</span>`;
    [...byId('sectors').children].forEach((row, i) => row.hidden = i >= 5 && !expanded);
  });

  function setBusy(busy) {
    ['kpis', 'sectors'].forEach((id) => byId(id).setAttribute('aria-busy', String(busy)));
  }

  async function load({ retry = false } = {}) {
    const status = byId('load-status');
    status.hidden = false;
    status.innerHTML = '<p>Cargando los datos del informe…</p>';
    setBusy(true);
    try {
      const embedded = byId('report-data');
      let data;
      if (embedded) data = JSON.parse(embedded.textContent);
      else {
        const response = await fetch('data/august-2026.json', { signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error(`Report request failed: ${response.status}`);
        data = await response.json();
      }
      renderKpis(data.totals);
      renderSectors(data.sectores);
      byId('show-sectors').hidden = false;
      byId('pdf-link').href = data.source.official_pdf;
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
      byId('download-data').href = downloadUrl;
      status.hidden = true;
      if (retry) byId('kpis').querySelector('a').focus();
    } catch (error) {
      console.error('No se pudo cargar el informe:', error);
      status.innerHTML = '<p>No pudimos cargar los datos. Revisá tu conexión e intentá de nuevo, o <a href="https://www.argentina.gob.ar/desregulacion/desregulacion-en-numeros">consultá el informe oficial</a>.</p><button type="button" class="button button-navy" id="retry-load">Volver a intentar</button>';
      byId('retry-load').addEventListener('click', () => load({ retry: true }));
      if (retry) byId('retry-load').focus();
    } finally {
      setBusy(false);
    }
  }

  window.desregulacionLoads = window.desregulacionLoads || {};
  window.desregulacionLoads.report = load();
})();
